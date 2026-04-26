from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pypdf import PdfReader
import io
import re
import shutil
import os
import glob
import json
import uuid
import time
import asyncio
import arxiv
import yt_dlp
import logging
from dotenv import load_dotenv
from transcriber import transcribe_video
from google import genai
from google.genai import types

# ── Gemini model — use 2.5-flash with thinking disabled for fast responses
GEMINI_MODEL = 'gemini-2.5-flash'
_NO_THINK = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_budget=0)
)

# Configure robust logging to app.log
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load environment variables from the .env file securely
load_dotenv()

app = FastAPI(title="Lecture Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

# Securely configure Gemini API (new SDK)
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    logger.warning("GEMINI_API_KEY not found in .env file!")

def get_client() -> genai.Client:
    """Create a fresh Gemini client for each request."""
    return genai.Client(api_key=API_KEY)


# ── ANSI / yt-dlp error cleaner ───────────────────────────────────────────
_ANSI_ESC = re.compile(r'\x1b\[[0-9;]*m')

def _clean_error(exc: Exception) -> str:
    """Strip ANSI escape codes and return a concise, user-friendly error string."""
    raw = _ANSI_ESC.sub('', str(exc)).strip()
    # yt-dlp errors look like: "ERROR: [youtube] <id>: Video unavailable"
    # Extract just the part after "ERROR: " for a cleaner message.
    match = re.search(r'ERROR:\s*(.+)', raw, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return raw


# ── 503 / capacity helper ──────────────────────────────────────────────────
_CAPACITY_MSG = (
    "Google's AI servers are currently at max capacity. "
    "Please try again in a few minutes."
)


def _is_503(exc: Exception) -> bool:
    """Return True if the exception represents a Google 503 Service Unavailable."""
    msg = str(exc).lower()
    return (
        "503" in msg
        or "service unavailable" in msg
        or "overloaded" in msg
        or "resource_exhausted" in msg
    )


def _capacity_response() -> JSONResponse:
    """Return a clean 503 JSON response for the frontend."""
    return JSONResponse(
        status_code=503,
        content={"error": "capacity", "detail": _CAPACITY_MSG},
    )


# ── 1. Video Transcription endpoint ───────────────────
@app.post("/api/transcribe")
async def transcribe_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Only .mp4 files are supported")

    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Run blocking Whisper transcription in a thread executor
        loop = asyncio.get_event_loop()
        segments = await loop.run_in_executor(None, transcribe_video, file_path)
        return {"filename": file.filename, "segments": segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 1b. Link Analysis endpoint (yt-dlp + Whisper + Gemini) ──

# Resolve uploads dir relative to this file so the path is always absolute
_UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(_UPLOADS_DIR, exist_ok=True)


def _safe_remove(path: str, retries: int = 4, delay: float = 1.0) -> None:
    """Delete a file, retrying on Windows WinError 32 (file-in-use)."""
    for attempt in range(retries):
        try:
            if os.path.exists(path):
                os.remove(path)
            return
        except PermissionError:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                logger.warning(f"Could not delete temp file after {retries} attempts: {path}")


class LinkAnalysisRequest(BaseModel):
    url: str


def _download_audio(url: str, stem: str) -> tuple[str, str]:
    """
    Synchronous yt-dlp download. Returns (audio_path, video_title).
    Raises on failure.
    """
    audio_path = os.path.join(_UPLOADS_DIR, f"{stem}.wav")
    ydl_opts = {
        'format'         : 'bestaudio/best',
        'outtmpl'        : os.path.join(_UPLOADS_DIR, f"{stem}.%(ext)s"),
        'postprocessors' : [{
            'key'             : 'FFmpegExtractAudio',
            'preferredcodec'  : 'wav',
            'preferredquality': '192',
        }],
        'keepvideo'   : False,
        'quiet'       : True,
        'no_warnings' : True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_title = info.get('title', 'Link Analysis') or 'Link Analysis'

    # Give the OS a moment to release FFmpeg's file handle on Windows
    time.sleep(1.5)
    return audio_path, video_title


def _generate_summary(transcript: str) -> str:
    """Synchronous Gemini summary call using the new SDK."""
    if not API_KEY or not transcript.strip():
        return ""
    client = get_client()
    prompt = (
        "You are an expert AI tutor. I will provide a transcript from a video "
        "lecture. I need you to analyze it and return a comprehensive study guide "
        "formatted in Markdown. Your response MUST include:\n\n"
        "## 1. Executive Summary\n"
        "(A 2-paragraph summary of the core concepts)\n\n"
        "## 2. Key Takeaways\n"
        "(Bullet points of the most important facts)\n\n"
        "## 3. Study Material & Flashcards\n"
        "(Generate 3-5 specific practice questions and answers based on the "
        "transcript to help the student test their knowledge.)\n\n"
        "## 4. Concept Flowchart\n"
        "Generate a concept map of the core topics using Mermaid.js syntax. "
        "You MUST follow these strict syntax rules to prevent rendering errors:\n"
        "1. Always start the block with exactly: `graph TD`\n"
        "2. You MUST wrap ALL node text in double quotes to prevent syntax crashes. "
        "Example: `A[\"Main Concept\"] --> B[\"Sub-Concept (Detail)\"]`\n"
        "3. Do not use any markdown formatting (like bold) inside the node text.\n"
        "4. Keep the labels concise.\n"
        "Wrap the final code in a standard markdown block: ```mermaid [code] ```\n\n"
        f"Here is the transcript: {transcript}"
    )
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=_NO_THINK,
        )
        return response.text
    except Exception as exc:
        if _is_503(exc):
            raise RuntimeError(_CAPACITY_MSG) from exc
        raise


@app.post("/api/analyze-link")
async def analyze_link(request: LinkAnalysisRequest):
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    audio_id  = str(uuid.uuid4())
    stem      = f"link_{audio_id}"
    audio_path = os.path.join(_UPLOADS_DIR, f"{stem}.wav")

    loop = asyncio.get_event_loop()

    # ── Step 1: Download & extract audio (non-blocking) ──────────────────────
    try:
        audio_path, video_title = await loop.run_in_executor(
            None, _download_audio, url, stem
        )
    except Exception as e:
        for leftover in glob.glob(os.path.join(_UPLOADS_DIR, f"{stem}.*")):
            _safe_remove(leftover)
        clean_msg = _clean_error(e)
        raise HTTPException(
            status_code=400,
            detail=f"Could not download the video: {clean_msg}"
        )

    # Confirm the WAV was produced; fall back to any audio file with our stem
    if not os.path.exists(audio_path):
        candidates = glob.glob(os.path.join(_UPLOADS_DIR, f"{stem}.*"))
        if candidates:
            audio_path = candidates[0]
        else:
            raise HTTPException(
                status_code=500,
                detail="Audio extraction failed. No output file found. The URL may not be supported."
            )

    segments      = []
    full_transcript = ""
    summary        = ""

    try:
        # ── Step 2: Transcribe with Whisper (non-blocking) ────────────────────
        segments = await loop.run_in_executor(None, transcribe_video, audio_path)
        full_transcript = " ".join([s["text"] for s in segments])

        # ── Step 3: Summarize with Gemini (non-blocking) ──────────────────────
        if API_KEY and full_transcript.strip():
            try:
                summary = await loop.run_in_executor(
                    None, _generate_summary, full_transcript
                )
            except RuntimeError as e:
                if _CAPACITY_MSG in str(e):
                    # Propagate the friendly 503 message in the summary field
                    summary = str(e)
                else:
                    logger.error(f"Summary generation failed: {e}")
                    summary = f"Summary generation failed: {str(e)}"
            except Exception as e:
                logger.error(f"Summary generation failed: {e}")
                summary = f"Summary generation failed: {str(e)}"

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        time.sleep(0.5)
        _safe_remove(audio_path)
        for leftover in glob.glob(os.path.join(_UPLOADS_DIR, f"{stem}.*")):
            _safe_remove(leftover)

    logger.info(f"Link analysis complete for '{video_title}'. Summary length: {len(summary)}")

    return {
        "title"     : video_title,
        "segments"  : segments,
        "transcript": full_transcript,
        "summary"   : summary,
    }


# ── 2. Study Materials endpoint (Powered by Gemini) ───
class StudyMaterialRequest(BaseModel):
    transcript_text: str


def _generate_study_materials(transcript_text: str) -> dict:
    if not API_KEY:
        raise ValueError("API key missing. Please check your .env file.")

    client = get_client()
    prompt = f"""
    You are an expert curriculum designer. Analyze the following lecture transcript and generate study materials.
    Return ONLY a valid JSON object with exactly this structure:
    {{
        "quizzes": [
            {{
                "question": "A clear multiple choice question based on the text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_answer": "The exact string of the correct option"
            }}
        ],
        "flashcards": [
            {{
                "term": "Key concept or vocabulary word",
                "definition": "Clear, concise definition from the lecture"
            }}
        ]
    }}
    Generate 3 distinct quiz questions and 4 distinct flashcards.

    Transcript:
    {transcript_text}
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0),
                response_mime_type="application/json",
            ),
        )
        return json.loads(response.text)
    except Exception as exc:
        err_msg = str(exc).lower()
        if "503" in err_msg or "429" in err_msg or "quota" in err_msg or "exhausted" in err_msg:
            return {"error": "AI is currently busy, please try again in a few seconds."}
        return {"error": f"Failed to generate study materials: {str(exc)}"}


@app.post("/api/study-materials")
async def create_study_materials(request: StudyMaterialRequest):
    if not request.transcript_text.strip():
        raise HTTPException(status_code=400, detail="transcript_text cannot be empty")

    loop = asyncio.get_event_loop()
    try:
        materials = await loop.run_in_executor(
            None, _generate_study_materials, request.transcript_text
        )
        if "error" in materials:
            return JSONResponse(status_code=503, content={"error": materials["error"], "detail": materials["error"]})
        return materials
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "detail": str(e)})


# ── 3. Universal Research Assistant (Gemini + ArXiv Function Calling) ──

class ChatRequest(BaseModel):
    transcript: str
    question: str


def _search_academic_papers(query: str) -> list[dict]:
    """Search ArXiv for real academic papers matching a query."""
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=3,
        sort_by=arxiv.SortCriterion.Relevance,
    )
    papers = []
    for result in client.results(search):
        papers.append({
            "title": result.title,
            "authors": ", ".join([author.name for author in result.authors[:4]]),
            "summary": result.summary[:400] + "..." if len(result.summary) > 400 else result.summary,
            "url": result.entry_id,
        })
    return papers


def _generate_chat_response(transcript: str, question: str) -> str:
    if not API_KEY:
        raise ValueError("API key missing. Please check your .env file.")

    client = get_client()

    arxiv_tool = types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="search_academic_papers",
                description=(
                    "Search ArXiv for real academic papers matching a query. "
                    "Use this tool when the user explicitly asks for research papers, "
                    "academic publications, or recent studies on a specific topic."
                ),
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "query": types.Schema(
                            type=types.Type.STRING,
                            description="The academic search query string, e.g. 'transformer architecture attention mechanism'.",
                        )
                    },
                    required=["query"],
                ),
            )
        ]
    )

    system_instruction = f"""You are a world-class academic tutor and research assistant called "Lecture Lens AI".
You have three modes of operation and must pick the right one for each question:

1. **DOCUMENT MODE** — The user has uploaded a document. Its full text content is provided below
   inside the DOCUMENT CONTEXT block. If the user asks something that is clearly about this
   document's content, answer SOLELY from the context. Cite specific sections when possible.

2. **GENERAL KNOWLEDGE MODE** — If the user asks a broad academic or conceptual question that
   goes beyond the document, answer using your extensive training knowledge. Be thorough and educational.

3. **RESEARCH PAPER MODE** — If the user explicitly asks for research papers, recent studies,
   publications, or academic sources on a topic, use the `search_academic_papers` tool to fetch
   real results from ArXiv. Present the results in a clean, formatted list.

Formatting rules:
- Always format your response using beautiful Markdown.
- Be concise but thorough.

---DOCUMENT CONTEXT START---
{transcript}
---DOCUMENT CONTEXT END---"""

    contents = [types.Content(role="user", parts=[types.Part(text=question)])]

    # Agentic loop: keep calling until model stops requesting tool use
    while True:
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                    system_instruction=system_instruction,
                    tools=[arxiv_tool],
                ),
            )
        except Exception as exc:
            err_msg = str(exc).lower()
            if "503" in err_msg or "429" in err_msg or "quota" in err_msg or "exhausted" in err_msg:
                return "error_capacity"
            return "error_generic"

        candidate = response.candidates[0]
        # Collect all parts of this turn
        assistant_parts = list(candidate.content.parts)
        contents.append(types.Content(role="model", parts=assistant_parts))

        # Check if any part is a function call
        tool_calls = [p for p in assistant_parts if p.function_call]
        if not tool_calls:
            # No more tool calls — return final text
            return response.text

        # Execute each tool call and append results
        tool_results = []
        for part in tool_calls:
            fc = part.function_call
            if fc.name == "search_academic_papers":
                query = fc.args.get("query", "")
                papers = _search_academic_papers(query)
                tool_results.append(types.Part(
                    function_response=types.FunctionResponse(
                        name=fc.name,
                        response={"result": papers},
                    )
                ))

        contents.append(types.Content(role="user", parts=tool_results))


@app.post("/api/chat")
async def chat_with_lecture(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="transcript cannot be empty")

    loop = asyncio.get_event_loop()
    try:
        answer = await loop.run_in_executor(
            None, _generate_chat_response, request.transcript, request.question
        )
        if answer == "error_capacity":
            return JSONResponse(status_code=503, content={"error": "AI is currently busy, please try again in a few seconds.", "detail": "AI is currently busy, please try again in a few seconds."})
        if answer == "error_generic":
            return JSONResponse(status_code=500, content={"error": "Chat failed due to an internal error.", "detail": "Chat failed due to an internal error."})
        return {"answer": answer}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e), "detail": str(e)})


# ── 4. PDF Summary endpoint ──────────────────────────────
@app.post("/api/pdf-summary")
async def summarize_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        contents = await file.read()
        pdf_reader = PdfReader(io.BytesIO(contents))

        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text()

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text. The PDF might be an image/scanned document."
            )

        def _pdf_summary():
            client = get_client()
            prompt = f"""
            You are an expert academic tutor. Analyze the following text extracted from a PDF.
            Provide a beautifully structured, comprehensive summary of its core concepts.
            Use clear headings, bullet points, and bold text for key terms.

            Here is the text:
            {extracted_text}
            """
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=_NO_THINK,
                )
                return response.text
            except Exception as exc:
                if _is_503(exc):
                    raise RuntimeError(_CAPACITY_MSG) from exc
                raise

        loop = asyncio.get_event_loop()
        try:
            summary_text = await loop.run_in_executor(None, _pdf_summary)
        except RuntimeError as e:
            if _CAPACITY_MSG in str(e):
                return _capacity_response()
            raise HTTPException(status_code=500, detail=str(e))
        return {"summary": summary_text}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF CRASH REASON: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ── 5. Active Recall Engine (Flashcards and Quiz) ──────

class GenerateQuizRequest(BaseModel):
    document_text: str


@app.post("/api/generate-quiz")
async def generate_quiz_endpoint(request: GenerateQuizRequest):
    if not request.document_text.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty")

    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key missing. Please check your .env file.")

    def _gen_quiz():
        client = get_client()
        prompt = f"""
        You are an expert educational content creator. Analyze the following document text and generate an Active Recall Deck.
        Return ONLY a valid JSON object. No markdown wrappers. Exactly this structure:
        {{
            "flashcards": [
                {{
                    "front": "A key concept, entity, or term",
                    "back": "A precise, concise definition or explanation"
                }}
            ],
            "quiz": [
                {{
                    "question": "A clear, challenging multiple choice question testing derived knowledge",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "The exact string of the correct option"
                }}
            ]
        }}

        Generate at least 5 flashcards and exactly 5 quiz questions.

        Text content:
        {request.document_text}
        """
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=0),
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as exc:
            if _is_503(exc):
                raise RuntimeError(_CAPACITY_MSG) from exc
            raise

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, _gen_quiz)
        return result
    except RuntimeError as e:
        if _CAPACITY_MSG in str(e):
            return _capacity_response()
        logger.error(f"QUIZ GENERATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate active recall content")
    except Exception as e:
        logger.error(f"QUIZ GENERATION ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate active recall content")


# ── 6. Autonomous Research Agent (Gemini + ArXiv Tool) ──

def _search_arxiv_papers_formatted(query: str) -> str:
    """Search the live ArXiv academic database for scientific papers."""
    client = arxiv.Client()
    search = arxiv.Search(
        query=query,
        max_results=3,
        sort_by=arxiv.SortCriterion.Relevance,
    )

    papers = []
    for result in client.results(search):
        authors = ", ".join([a.name for a in result.authors[:4]])
        if len(result.authors) > 4:
            authors += f" et al. ({len(result.authors)} total)"
        published = result.published.strftime("%B %d, %Y")
        summary = result.summary[:500].replace("\n", " ").strip()
        if len(result.summary) > 500:
            summary += "..."

        papers.append(
            f"📄 Title: {result.title}\n"
            f"   Authors: {authors}\n"
            f"   Published: {published}\n"
            f"   URL: {result.entry_id}\n"
            f"   Summary: {summary}\n"
        )

    if not papers:
        return "No papers found on ArXiv matching this query."

    return f"Found {len(papers)} papers from ArXiv:\n\n" + "\n---\n".join(papers)


class ResearchRequest(BaseModel):
    prompt: str


@app.post("/api/research")
async def research_agent(request: ResearchRequest):
    """Autonomous Research Agent endpoint."""
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt cannot be empty")

    if not API_KEY:
        raise HTTPException(status_code=500, detail="API key missing. Please check your .env file.")

    def _run_research():
        client = get_client()

        arxiv_tool = types.Tool(
            function_declarations=[
                types.FunctionDeclaration(
                    name="search_arxiv_papers",
                    description=(
                        "Search the live ArXiv academic database for scientific papers matching a query. "
                        "Use this whenever the user asks for research papers, recent studies, or academic sources."
                    ),
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "query": types.Schema(
                                type=types.Type.STRING,
                                description="The search query string, e.g. 'quantum machine learning'.",
                            )
                        },
                        required=["query"],
                    ),
                )
            ]
        )

        system_instruction = """You are "Lecture Lens Research Agent", an autonomous AI research assistant.

Your ONLY job is to help users find and understand real scientific papers from ArXiv.

When the user asks about a research topic:
1. Use the `search_arxiv_papers` tool to fetch real papers from ArXiv.
2. Present the results in a beautifully formatted Markdown response.
3. For each paper, include the title (as a clickable link), authors, publication date, and a 1-2 sentence plain-English summary.
4. After listing the papers, provide a brief synthesis paragraph explaining the overall research landscape.

IMPORTANT RULES:
- ALWAYS use the tool. Never fabricate paper titles, authors, or URLs.
- Format your response with clear numbered lists, **bold** for key terms, and proper Markdown links.
- Be concise but insightful in your summaries."""

        contents = [types.Content(role="user", parts=[types.Part(text=request.prompt)])]

        # Agentic loop
        while True:
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        thinking_config=types.ThinkingConfig(thinking_budget=0),
                        system_instruction=system_instruction,
                        tools=[arxiv_tool],
                    ),
                )
            except Exception as exc:
                if _is_503(exc):
                    raise RuntimeError(_CAPACITY_MSG) from exc
                raise

            candidate = response.candidates[0]
            assistant_parts = list(candidate.content.parts)
            contents.append(types.Content(role="model", parts=assistant_parts))

            tool_calls = [p for p in assistant_parts if p.function_call]
            if not tool_calls:
                return response.text

            tool_results = []
            for part in tool_calls:
                fc = part.function_call
                if fc.name == "search_arxiv_papers":
                    query = fc.args.get("query", "")
                    result_text = _search_arxiv_papers_formatted(query)
                    tool_results.append(types.Part(
                        function_response=types.FunctionResponse(
                            name=fc.name,
                            response={"result": result_text},
                        )
                    ))

            contents.append(types.Content(role="user", parts=tool_results))

    loop = asyncio.get_event_loop()
    try:
        answer = await loop.run_in_executor(None, _run_research)
        return {"answer": answer}
    except RuntimeError as e:
        if _CAPACITY_MSG in str(e):
            return _capacity_response()
        logger.error(f"RESEARCH AGENT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"RESEARCH AGENT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))