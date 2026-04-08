import { useState, useEffect, useRef } from 'react';
import './App.css';
import VideoUploader from './VideoUploader';
import VideoPlayer from './VideoPlayer';
import PdfUploader from './PdfUploader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ExploreLibrary from './components/ExploreLibrary';

function App() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [transcriptionData, setTranscriptionData] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [seekTime, setSeekTime] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quizData, setQuizData] = useState(null);
  const [flashcardData, setFlashcardData] = useState(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [flippedCards, setFlippedCards] = useState({});

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pdfSummary, setPdfSummary] = useState(null);
  const chatEndRef = useRef(null);



  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Splits text on the matched query and wraps each match in a <mark> tag
  const highlightMatch = (text, query) => {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const handleSuccess = (data, file) => {
    setTranscriptionData(data);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handleJumpToTime = (startTime) => {
    setSeekTime(startTime);
  };

  // Concatenate all segments and POST to /api/study-materials
  const handleGenerateStudy = async () => {
    if (!transcriptionData) return;
    setStudyLoading(true);
    const fullText = transcriptionData.segments.map(s => s.text).join(' ');

    try {
      const res = await fetch('http://localhost:8000/api/study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_text: fullText }),
      });
      if (!res.ok) throw new Error('Failed to generate study materials');
      const data = await res.json();
      setQuizData(data.quizzes);
      setFlashcardData(data.flashcards);
      setSelectedAnswers({});
      setFlippedCards({});
    } catch (err) {
      console.error(err);
      alert('Error generating study materials. Check console for details.');
    } finally {
      setStudyLoading(false);
    }
  };

  const handleSelectAnswer = (quizIndex, option) => {
    setSelectedAnswers(prev => ({ ...prev, [quizIndex]: option }));
  };

  const toggleFlipCard = (index) => {
    setFlippedCards(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Send a question to the /api/chat RAG endpoint
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !transcriptionData) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsChatLoading(true);

    const fullTranscript = transcriptionData.segments.map(s => s.text).join(' ');

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript, question: userMessage }),
      });
      if (!res.ok) throw new Error('Chat request failed');
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* ─── Header ─── */}
      <div className="app-header">
        <h1 className="title">Lecture Lens</h1>
        <p className="subtitle">AI-Powered Video Transcription & Study Tools</p>
      </div>

      {/* ─── Navigation Toggle ─── */}
      <div className="nav-toggle-wrapper">
        <div className="nav-toggle">
          <button
            className={`nav-toggle-btn ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            My Workspace
          </button>
          <button
            className={`nav-toggle-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
            Explore Library
          </button>
        </div>
      </div>

      {activeTab === 'explore' ? (
        <ExploreLibrary />
      ) : !transcriptionData ? (
        /* ─── Upload Screen: Bento Grid ─── */
        <div className="upload-screen">
          {/* 1. Video Uploader Card */}
          <div>
            <h2 className="upload-section-title">Video Lecture</h2>
            <VideoUploader onUploadSuccess={handleSuccess} />
          </div>

          {/* 2. PDF Uploader Card */}
          <div>
            <h2 className="upload-section-title">PDF Document</h2>
            <PdfUploader onSummaryReady={(summaryData) => setPdfSummary(summaryData)} />
          </div>

          {/* 3. Summary Box (spans full width) */}
          {pdfSummary && (
            <div className="pdf-summary-box">
              <div className="pdf-summary-header">
                <h3 className="pdf-summary-title">
                  <svg className="pdf-summary-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  AI Summary
                </h3>
                <button
                  onClick={() => setPdfSummary(null)}
                  className="pdf-summary-clear-btn"
                >
                  Clear
                </button>
              </div>

              <div className="markdown-summary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pdfSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Workspace: Video Player + Transcript + Chat ─── */
        <>
          <div className="workspace">
            {/* ─── Left Column: Player + Transcript ─── */}
            <div className="left-column">

              {/* 1. The Video Player */}
              <VideoPlayer videoUrl={videoUrl} seekTime={seekTime} />

              {/* 2. The Interactive Transcript */}
              <div className="transcript-panel">
                <h2 className="transcript-title">Interactive Transcript</h2>

                {/* Search Bar */}
                <div className="search-bar-wrapper">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search transcript..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filtered & highlighted segments */}
                {transcriptionData.segments
                  .filter((seg) =>
                    !searchQuery.trim() || seg.text.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((seg) => (
                    <div
                      key={seg.id}
                      className="segment"
                      onClick={() => handleJumpToTime(seg.start)}
                    >
                      <span className="segment-time">
                        [{Math.floor(seg.start / 60)}:{String(Math.floor(seg.start % 60)).padStart(2, '0')}]
                      </span>
                      <span className="segment-text">
                        {highlightMatch(seg.text, searchQuery)}
                      </span>
                    </div>
                  ))}

                {/* No results message */}
                {searchQuery.trim() &&
                  transcriptionData.segments.filter((seg) =>
                    seg.text.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <p className="no-results">No matching segments found.</p>
                  )}
              </div>

              {/* 3. Generate Study Guide button */}
              <button
                className="generate-btn"
                onClick={handleGenerateStudy}
                disabled={studyLoading}
              >
                {studyLoading ? (
                  <>
                    <span className="btn-spinner" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                    Generate Study Guide
                  </>
                )}
              </button>

              {/* 4. Study Materials Section */}
              {(quizData || flashcardData) && (
                <div className="study-section">

                  {/* Quizzes */}
                  {quizData && quizData.length > 0 && (
                    <div className="study-block">
                      <h2 className="study-heading">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Quiz Questions
                      </h2>
                      {quizData.map((quiz, qi) => {
                        const selected = selectedAnswers[qi];
                        const isCorrect = selected === quiz.correct_answer;
                        return (
                          <div key={qi} className="quiz-card">
                            <p className="quiz-question">
                              <span className="quiz-number">Q{qi + 1}.</span> {quiz.question}
                            </p>
                            <div className="quiz-options">
                              {quiz.options.map((opt, oi) => {
                                let optClass = 'quiz-option';
                                if (selected) {
                                  if (opt === quiz.correct_answer) optClass += ' correct';
                                  else if (opt === selected) optClass += ' incorrect';
                                }
                                return (
                                  <button
                                    key={oi}
                                    className={optClass}
                                    onClick={() => handleSelectAnswer(qi, opt)}
                                    disabled={!!selected}
                                  >
                                    <span className="option-letter">{String.fromCharCode(65 + oi)}</span>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {selected && (
                              <p className={`quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                                {isCorrect ? '✓ Correct!' : `✗ Incorrect — the answer is "${quiz.correct_answer}"`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Flashcards */}
                  {flashcardData && flashcardData.length > 0 && (
                    <div className="study-block">
                      <h2 className="study-heading">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        Flashcards
                        <span className="flashcard-hint">Click to flip</span>
                      </h2>
                      <div className="flashcard-grid">
                        {flashcardData.map((card, ci) => (
                          <div
                            key={ci}
                            className={`flashcard ${flippedCards[ci] ? 'flipped' : ''}`}
                            onClick={() => toggleFlipCard(ci)}
                          >
                            <div className="flashcard-inner">
                              <div className="flashcard-front">
                                <span className="flashcard-label">Term</span>
                                <p className="flashcard-text">{card.term}</p>
                              </div>
                              <div className="flashcard-back">
                                <span className="flashcard-label">Definition</span>
                                <p className="flashcard-text">{card.definition}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── Right Column: AI Chat ─── */}
            <div className="chat-panel">
              <div className="chat-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                Ask AI
              </div>

              <div className="chat-messages">
                {chatHistory.length === 0 && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                    </div>
                    <p>Your AI Research Assistant</p>
                    <span>Ask about the lecture, explore concepts, or search for research papers.</span>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`chat-msg-row ${msg.role}`}>
                    {/* Avatar */}
                    <div className={`chat-avatar ${msg.role}`}>
                      {msg.role === 'ai' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
                          <path d="M16 14H8a4 4 0 00-4 4v2h16v-2a4 4 0 00-4-4z" />
                          <circle cx="12" cy="6" r="1" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`chat-bubble ${msg.role}`}>
                      {msg.role === 'ai' ? (
                        <div className="chat-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="chat-msg-row ai">
                    <div className="chat-avatar ai">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 014 4v2a4 4 0 01-8 0V6a4 4 0 014-4z" />
                        <path d="M16 14H8a4 4 0 00-4 4v2h16v-2a4 4 0 00-4-4z" />
                        <circle cx="12" cy="6" r="1" fill="currentColor" />
                      </svg>
                    </div>
                    <div className="chat-bubble ai loading">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-area">
                <input
                  className="chat-input"
                  type="text"
                  placeholder="Type your question..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isChatLoading}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 5. A button to start over */}
          <button
            className="reset-btn"
            onClick={() => {
              setTranscriptionData(null);
              setVideoUrl(null);
              setQuizData(null);
              setFlashcardData(null);
              setSelectedAnswers({});
              setFlippedCards({});
              setChatHistory([]);
              setChatInput('');
            }}
          >
            ← Upload Another Video
          </button>
        </>
      )}
    </div>
  );
}

export default App;