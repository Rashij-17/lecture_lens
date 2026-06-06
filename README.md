<div align="center">

<!-- Animated Typing Header -->
<a href="https://rashij-17.github.io/lecture_lens/">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&duration=3000&pause=1000&color=A855F7&center=true&vCenter=true&multiline=true&repeat=true&width=800&height=100&lines=%F0%9F%94%8D+LECTURE+LENS;AI-Powered+Study+Platform" alt="Lecture Lens" />
</a>

<br/>

<!-- Animated Subtitle -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=400&size=18&duration=4000&pause=2000&color=22D3EE&center=true&vCenter=true&repeat=true&width=700&height=30&lines=Transform+lectures+into+interactive+study+materials+instantly;Upload+videos%2C+PDFs%2C+or+paste+any+URL+%E2%80%94+AI+does+the+rest;Powered+by+Gemini+2.5+%7C+Whisper+%7C+ArXiv+%7C+React" alt="Subtitle" />

<br/><br/>

<!-- Badges Row 1 -->
[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Now-blueviolet?style=for-the-badge&logoColor=white)](https://rashij-17.github.io/lecture_lens/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](https://github.com/Rashij-17/lecture_lens/pulls)

<!-- Badges Row 2 — Tech -->
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth+Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_2.5-Flash-8E75B2?style=flat-square&logo=google&logoColor=white)

<br/>

<!-- Divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

</div>

## 🎬 What is Lecture Lens?

**Lecture Lens** is a full-stack AI-powered study platform that transforms raw lectures, videos, PDFs, and web links into **interactive study guides, flashcards, quizzes, and concept maps** — all in seconds.

> 💡 _Think of it as your personal AI tutor that watches the lecture for you, takes perfect notes, and then quizzes you on everything._

<br/>

## ✨ Features at a Glance

<table>
<tr>
<td width="50%" valign="top">

### 🎥 Video & Link Analysis
Upload `.mp4` files or paste any **YouTube / Vimeo / Twitch** URL. Lecture Lens uses `yt-dlp` + `Whisper` to transcribe, then `Gemini 2.5` to synthesize a complete study guide.

### 📄 PDF Summarization
Drop any academic paper or lecture slides. The AI extracts text and generates a beautifully structured summary with key concepts highlighted.

### 🧠 Active Recall Engine
Automatically generates **MCQ quizzes** and **interactive flashcards** from your materials. Flip cards, test yourself, track your score.

</td>
<td width="50%" valign="top">

### 🗺️ Concept Flowcharts
Dynamically renders **interactive mind maps** using Mermaid.js — visualize how concepts connect at a glance.

### 🤖 Autonomous Research Agent
Deep dive into any topic. The agent autonomously searches **ArXiv** for real academic papers and synthesizes the current research landscape.

### 💬 Contextual AI Chat
Ask questions about your uploaded document. The AI answers from the document context, general knowledge, or fetches live research papers — choosing the right mode automatically.

</td>
</tr>
</table>

<br/>

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Frontend ["⚛️ Frontend — React + Vite"]
        UI["🖥️ Glassmorphism UI"]
        Auth["🔐 Firebase Auth"]
        MD["📝 React Markdown"]
        Mermaid["🗺️ Mermaid.js Charts"]
        Export["📥 PDF Export"]
    end

    subgraph Backend ["🐍 Backend — FastAPI"]
        API["⚡ Async REST API"]
        Whisper["🎤 OpenAI Whisper"]
        Gemini["🧠 Gemini 2.5 Flash"]
        YTdlp["📥 yt-dlp"]
        ArXiv["📚 ArXiv Search"]
        PyPDF["📄 PyPDF Reader"]
    end

    subgraph Cloud ["☁️ Cloud Services"]
        FB["🔥 Firebase Firestore"]
        GCP["🌐 Google Gemini API"]
    end

    UI --> API
    Auth --> FB
    API --> Whisper
    API --> Gemini
    API --> YTdlp
    API --> ArXiv
    API --> PyPDF
    Gemini --> GCP
    UI --> MD
    UI --> Mermaid
    UI --> Export
```

<br/>

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|:---:|:---:|:---|
| **Frontend** | ![React](https://img.shields.io/badge/-React_19-61DAFB?logo=react&logoColor=white&style=flat-square) ![Vite](https://img.shields.io/badge/-Vite_8-646CFF?logo=vite&logoColor=white&style=flat-square) | SPA with glassmorphism UI |
| **Styling** | ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white&style=flat-square) | Custom dark-mode glassmorphism design |
| **Backend** | ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/-Python_3.10+-3776AB?logo=python&logoColor=white&style=flat-square) | Async API with background processing |
| **AI / ML** | ![Google](https://img.shields.io/badge/-Gemini_2.5-8E75B2?logo=google&logoColor=white&style=flat-square) ![OpenAI](https://img.shields.io/badge/-Whisper-412991?logo=openai&logoColor=white&style=flat-square) | Summarization, quiz gen, research |
| **Auth & DB** | ![Firebase](https://img.shields.io/badge/-Firebase-FFCA28?logo=firebase&logoColor=black&style=flat-square) | Google Auth + Firestore database |
| **Tooling** | ![yt-dlp](https://img.shields.io/badge/-yt--dlp-FF0000?style=flat-square) ![ArXiv](https://img.shields.io/badge/-ArXiv-B31B1B?style=flat-square) | Video download + paper search |
| **Rendering** | ![Markdown](https://img.shields.io/badge/-React_Markdown-000000?logo=markdown&logoColor=white&style=flat-square) ![Mermaid](https://img.shields.io/badge/-Mermaid.js-FF3670?style=flat-square) | Rich text + live flowcharts |

</div>

<br/>

## 🚀 Getting Started

### Prerequisites

```
✅ Node.js  v18+
✅ Python   3.10+
✅ FFmpeg   (required for Whisper + yt-dlp)
✅ Gemini API Key (from Google AI Studio)
```

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Rashij-17/lecture_lens.git
cd lecture_lens
```

### 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure API key
echo GEMINI_API_KEY=your_key_here > .env

# Launch the server
python -m uvicorn main:app --reload
# ➜ Running on http://127.0.0.1:8000
```

### 3️⃣ Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# ➜ Running on http://localhost:5173
```

<br/>

## 📖 How It Works

```mermaid
sequenceDiagram
    actor User
    participant Frontend as ⚛️ React Frontend
    participant Backend as 🐍 FastAPI Backend
    participant Whisper as 🎤 Whisper
    participant Gemini as 🧠 Gemini 2.5

    User->>Frontend: Upload video / Paste URL / Upload PDF
    Frontend->>Backend: POST /api/transcribe or /api/analyze-link or /api/pdf-summary
    
    alt Video/Link
        Backend->>Whisper: Transcribe audio
        Whisper-->>Backend: Transcript segments
    end
    
    Backend->>Gemini: Generate study guide + flowchart
    Gemini-->>Backend: Structured markdown response
    Backend-->>Frontend: JSON (summary, segments, flowchart)
    Frontend-->>User: Interactive study guide with quizzes & charts
    
    User->>Frontend: Ask a question
    Frontend->>Backend: POST /api/chat
    Backend->>Gemini: RAG with document context
    Gemini-->>Backend: Contextual answer
    Backend-->>Frontend: Markdown response
    Frontend-->>User: AI answer with citations
```

<br/>

## 🎯 API Endpoints

| Method | Endpoint | Description |
|:---:|:---|:---|
| `POST` | `/api/transcribe` | Upload `.mp4` → Whisper transcription |
| `POST` | `/api/analyze-link` | Paste URL → download + transcribe + summarize |
| `POST` | `/api/pdf-summary` | Upload PDF → AI-powered summary |
| `POST` | `/api/study-materials` | Generate quizzes & flashcards from transcript |
| `POST` | `/api/generate-quiz` | Active recall deck (5 flashcards + 5 MCQs) |
| `POST` | `/api/chat` | Contextual Q&A with document RAG |
| `POST` | `/api/research` | Autonomous ArXiv research agent |

<br/>

## 📂 Project Structure

```
lecture_lens/
├── 🎨 frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx               # Main application shell
│   │   ├── App.css               # Glassmorphism design system
│   │   ├── components/
│   │   │   ├── Login.jsx          # Firebase Google Auth
│   │   │   ├── LandingSplash.jsx  # Animated landing video
│   │   │   └── ExploreLibrary.jsx # Community library browser
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Auth state management
│   │   ├── hooks/
│   │   │   └── usePdfExport.js   # PDF export utility
│   │   ├── VideoUploader.jsx      # Drag & drop video upload
│   │   ├── LinkAnalyzer.jsx       # URL paste & analysis
│   │   ├── PdfUploader.jsx        # PDF upload & summary
│   │   ├── MermaidRenderer.jsx    # Live Mermaid.js charts
│   │   └── firebase.js           # Firebase config
│   └── vite.config.js
│
├── 🐍 backend/                   # FastAPI Python server
│   ├── main.py                   # All API endpoints + Gemini agents
│   ├── transcriber.py            # Whisper transcription wrapper
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile                # Container support
│   └── .env                      # API keys (not committed)
│
└── 📄 README.md                  # You are here!
```

<br/>

## 🔒 Security & Privacy

- 🔐 **Authentication** — Firebase Google Auth with protected routes
- 🗝️ **API Keys** — Stored in `.env`, never exposed to frontend or committed
- 🏠 **Local Processing** — Whisper runs locally; only text is sent to Gemini
- 🛡️ **CORS** — Strictly configured for localhost origins only

<br/>

## 🤝 Contributing

Contributions are welcome! Here's how:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

<br/>

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

<br/>

<div align="center">

<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" width="100%">

### ⭐ Star this repo if you found it useful!

<br/>

Made with ❤️ by [Rashij-17](https://github.com/Rashij-17)

<br/>

![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2FRashij-17%2Flecture_lens&label=VISITORS&countColor=%23A855F7&style=flat-square)

</div>
