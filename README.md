# Lecture Lens 🔍📚

**Lecture Lens** is an advanced AI-powered educational platform designed to transform lectures, videos, and research papers into comprehensive, interactive study materials instantly. By leveraging bleeding-edge AI models (Gemini, Whisper) and custom autonomous agents, Lecture Lens gives students and researchers superpowers.

## ✨ Features

- 🎥 **Video & Link Analysis:** Upload raw video files or simply paste a URL (YouTube, Vimeo, Twitch). We use `yt-dlp` and `Whisper` to extract and transcribe the audio, then `Gemini` synthesizes the content.
- 📄 **PDF Summarization:** Upload academic papers or dense lecture slides. The platform extracts the text and provides a structured, easy-to-digest summary.
- 🧠 **Active Recall Engine:** Automatically generates practice quizzes and interactive flashcards from your uploaded materials to test your knowledge.
- 🗺️ **Concept Flowcharts:** Dynamically renders beautiful, interactive mind maps and concept flowcharts using Mermaid.js.
- 🤖 **Autonomous Research Agent:** Deep dive into any topic. Our agent autonomously searches the ArXiv database for real academic papers and synthesizes the current research landscape for you.
- 💎 **Premium Glassmorphism UI:** A sleek, modern, and highly responsive dark-mode interface built with React.

---

## 🏗️ Architecture Stack

### **Frontend (Client)**
- **Framework:** React + Vite
- **Styling:** Vanilla CSS with custom Glassmorphism and modern UI design principles.
- **Rendering:** React Markdown for rich text and Mermaid.js for flowcharts.

### **Backend (Server)**
- **Framework:** FastAPI (Python)
- **AI Models:** Google Gemini 2.5 SDK (`google-genai`), OpenAI Whisper
- **Tooling:** `yt-dlp`, `arxiv` library, `pypdf`
- **Architecture:** Async non-blocking operations and background task queueing for heavy processing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- FFmpeg (Required for audio extraction via yt-dlp and Whisper)
- A Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/lecture_lens.git
cd lecture_lens
```

### 2. Backend Setup
```bash
cd backend
# Create a virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
# (If requirements.txt is missing, install fastapi uvicorn pypdf yt-dlp openai-whisper google-genai arxiv python-multipart python-dotenv)

# Set up environment variables
# Create a .env file in the backend directory
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Run the server
python -m uvicorn main:app --reload
# Runs on http://127.0.0.1:8000
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev
# Runs on http://localhost:5173
```

---

## 📖 Usage
1. Open the frontend URL (`http://localhost:5173`) in your browser.
2. Select an option: **Upload Video**, **Paste Link**, or **Upload PDF**.
3. Wait for the AI to process and synthesize your materials.
4. Review your **Executive Summary**, **Key Takeaways**, generated **Flowchart**, and **Active Recall Flashcards**.
5. Use the **Chat / Research** interface to ask questions about the document or explore topics deeply with real ArXiv citations.

---

## 🔒 Security & Privacy
Lecture Lens processes documents locally and communicates directly with the Gemini API. Sensitive credentials like `GEMINI_API_KEY` are safely stored in `.env` and are never exposed to the frontend or committed to source control.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

---
*Built with ❤️ and AI.*
