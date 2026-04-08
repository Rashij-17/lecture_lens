from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader
import io
import google.generativeai as genai
import shutil
import os
import json
import arxiv
from dotenv import load_dotenv
from transcriber import transcribe_video

# Load environment variables from the .env file securely
load_dotenv()

app = FastAPI(title="Lecture Lens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)

# Securely configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in .env file!")

# ── 1. Video Transcription endpoint ───────────────────
@app.post("/api/transcribe")
async def transcribe_file(file: UploadFile = File(...)):
    if not file.filename.endswith('.mp4'):
        raise HTTPException(status_code=400, detail="Only .mp4 files are supported")

    file_path = f"uploads/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        segments = transcribe_video(file_path)
        return {"filename": file.filename, "segments": segments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 2. Study Materials endpoint (Powered by Gemini) ───
class StudyMaterialRequest(BaseModel):
    transcript_text: str

def generate_study_materials(transcript_text: str) -> dict:
    if not API_KEY:
        raise ValueError("API key missing. Please check your .env file.")

    # We force Gemini to output perfect JSON format so React can map it easily
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        generation_config={"response_mime_type": "application/json"}
    )
    
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
    
    response = model.generate_content(prompt)
    return json.loads(response.text)

@app.post("/api/study-materials")
async def create_study_materials(request: StudyMaterialRequest):
    if not request.transcript_text.strip():
        raise HTTPException(status_code=400, detail="transcript_text cannot be empty")

    try:
        materials = generate_study_materials(request.transcript_text)
        return materials
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── 3. Universal Research Assistant (Gemini + ArXiv Function Calling) ──

class ChatRequest(BaseModel):
    transcript: str
    question: str


# ── ArXiv Tool Function ──
def search_academic_papers(query: str) -> list[dict]:
    """Search ArXiv for real academic papers matching a query.
    Use this tool when the user explicitly asks for research papers,
    academic publications, or recent studies on a specific topic.
    Returns the top 3 papers with their title, authors, summary, and URL.

    Args:
        query: The academic search query string, e.g. 'transformer architecture attention mechanism'.

    Returns:
        A list of dictionaries, each containing a paper's title, authors, summary, and url.
    """
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


def generate_chat_response(transcript: str, question: str) -> str:
    if not API_KEY:
        raise ValueError("API key missing. Please check your .env file.")

    # Build the model with the ArXiv tool bound via function calling
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        tools=[search_academic_papers],
        system_instruction=f"""You are a world-class academic tutor and research assistant called "Lecture Lens AI".
You have three modes of operation and must pick the right one for each question:

1. **DOCUMENT MODE** — The user has uploaded a document. Its full text content is provided below
   inside the DOCUMENT CONTEXT block. If the user asks something that is clearly about this
   document's content, answer SOLELY from the context. Cite specific sections when possible.

2. **GENERAL KNOWLEDGE MODE** — If the user asks a broad academic or conceptual question that
   goes beyond the document (e.g. "explain quantum entanglement", "what are the key schools of
   thought in macroeconomics"), answer using your extensive training knowledge of textbooks,
   courses, and research. Be thorough and educational.

3. **RESEARCH PAPER MODE** — If the user explicitly asks for research papers, recent studies,
   publications, or academic sources on a topic, use the `search_academic_papers` tool to fetch
   real results from ArXiv. Present the results in a clean, formatted list with titles, authors,
   a brief summary, and a link. Do NOT fabricate paper titles — always use the tool.

Formatting rules:
- Always format your response using beautiful Markdown: headings, bullet points, **bold** for key terms.
- Be concise but thorough. Aim for clarity over verbosity.
- If you use the research tool, present the papers in a numbered list with clear formatting.

---DOCUMENT CONTEXT START---
{transcript}
---DOCUMENT CONTEXT END---"""
    )

    # Use ChatSession with automatic function calling for seamless tool use
    chat = model.start_chat(enable_automatic_function_calling=True)
    response = chat.send_message(question)
    return response.text


@app.post("/api/chat")
async def chat_with_lecture(request: ChatRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="question cannot be empty")
    if not request.transcript.strip():
        raise HTTPException(status_code=400, detail="transcript cannot be empty")

    try:
        answer = generate_chat_response(request.transcript, request.question)
        return {"answer": answer}
    except Exception as e:
        print(f"\n CHAT ERROR: {str(e)}\n")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pdf-summary")
async def summarize_pdf(file: UploadFile = File(...)):
    # 1. Reject anything that isn't a PDF
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        # 2. Read the PDF file directly from memory
        contents = await file.read()
        pdf_reader = PdfReader(io.BytesIO(contents))
        
        extracted_text = ""
        for page in pdf_reader.pages:
            extracted_text += page.extract_text()
            
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text. The PDF might be an image/scanned document.")

        # 3. The AI Prompt
        prompt = f"""
        You are an expert academic tutor. Analyze the following text extracted from a PDF. 
        Provide a beautifully structured, comprehensive summary of its core concepts. 
        Use clear headings, bullet points, and bold text for key terms.
        
        Here is the text:
        {extracted_text}
        """
        
     # 4. Call the working Gemini model (Classic SDK format)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        return {"summary": response.text}
        
    except Exception as e:
        print(f"\n PDF CRASH REASON: {str(e)}\n")
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

    # Using response_mime_type to guarantee strict JSON (no Markdown blocks)
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        generation_config={"response_mime_type": "application/json"}
    )
    
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
        response = model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        print(f"\n QUIZ GENERATION ERROR: {str(e)}\n")
        raise HTTPException(status_code=500, detail="Failed to generate active recall content")