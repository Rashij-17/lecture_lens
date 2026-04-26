import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import VideoUploader from './VideoUploader';
import LinkAnalyzer from './LinkAnalyzer';
import VideoPlayer from './VideoPlayer';
import PdfUploader from './PdfUploader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidRenderer from './MermaidRenderer';
import ExploreLibrary from './components/ExploreLibrary';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { usePdfExport } from './hooks/usePdfExport';

// Shared ReactMarkdown component map — renders mermaid fences as live SVG charts
const mdComponents = {
  code({ node, inline, className, children, ...props }) {
    const language = (className || '').replace('language-', '');
    if (!inline && language === 'mermaid') {
      const chartString = Array.isArray(children) ? children.join('') : String(children);
      return <MermaidRenderer chart={chartString.trim()} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

function AppContent() {
  const { currentUser } = useAuth();

  // ─── If not authenticated, show Login only ───
  if (!currentUser) {
    return <Login />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const { currentUser, logout } = useAuth();
  const { exportToPdf, isExporting } = usePdfExport();
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
  const [linkSummary, setLinkSummary] = useState(null);
  const [linkTitle, setLinkTitle] = useState('');
  const chatEndRef = useRef(null);

  // ─── Research Agent state ───
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState(null);
  const [isResearchLoading, setIsResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState('');

  // ─── Study History & Recommendations state ───
  const [studyHistory, setStudyHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);



  // ─── Load study history from Firestore on mount ───
  const loadStudyHistory = useCallback(async () => {
    if (!currentUser) return;
    try {
      const histRef = collection(db, 'users', currentUser.uid, 'history');
      const q = query(histRef, orderBy('createdAt', 'desc'), limit(20));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudyHistory(items);

      // Generate simple recommendations from history
      const topics = items.map(item => item.topic).filter(Boolean);
      const unique = [...new Set(topics)];
      if (unique.length > 0) {
        const recs = unique.slice(0, 3).map(topic => {
          const relatedPrefixes = {
            'video': 'Advanced concepts in',
            'pdf': 'Deep dive into',
          };
          const matchingItem = items.find(i => i.topic === topic);
          const prefix = relatedPrefixes[matchingItem?.type] || 'Explore more about';
          return `${prefix} ${topic}`;
        });
        setRecommendations(recs);
      }
    } catch (err) {
      console.error('Failed to load study history:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadStudyHistory();
  }, [loadStudyHistory]);

  // ─── Save a study topic to Firestore ───
  const saveStudyTopic = async (topic, type) => {
    if (!currentUser || !topic) return;
    try {
      const histRef = collection(db, 'users', currentUser.uid, 'history');
      await addDoc(histRef, {
        topic,
        type, // 'video' or 'pdf'
        createdAt: serverTimestamp(),
      });
      loadStudyHistory(); // refresh the list
    } catch (err) {
      console.error('Failed to save study topic:', err);
    }
  };

  // ─── Save a summary to the global public library ───
  const saveToPublicLibrary = async ({ title, topic, summary, type }) => {
    if (!title && !topic) return;
    try {
      await addDoc(collection(db, 'public_library'), {
        title: title || topic || 'Untitled',
        topic: topic || title || 'General',
        summary: summary ? summary.slice(0, 800) : '',
        type,           // 'video' | 'link' | 'pdf'
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // Non-fatal — don't surface this error to the user
      console.warn('Could not save to public library:', err);
    }
  };

  // ─── Research Agent handler ───
  const handleResearchSearch = async () => {
    if (!researchQuery.trim()) return;
    setIsResearchLoading(true);
    setResearchResult(null);
    setResearchError('');

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: researchQuery }),
      });
      if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        setResearchError(errData.detail || "Google's AI servers are currently at max capacity. Please try again in a few minutes.");
        return;
      }
      if (!res.ok) throw new Error('Research request failed');
      const data = await res.json();
      setResearchResult(data.answer);
    } catch (err) {
      console.error(err);
      setResearchError('Failed to fetch research results. Please try again.');
    } finally {
      setIsResearchLoading(false);
    }
  };

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
    setLinkSummary(null);
    setLinkTitle('');
    // Save the filename as a study topic
    const topicName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
    saveStudyTopic(topicName, 'video');
    // Publish to global library (no summary available for raw video uploads)
    saveToPublicLibrary({ title: topicName, topic: topicName, summary: '', type: 'video' });
  };

  // ─── Link Analysis complete handler ───
  const handleLinkAnalysisComplete = (data, sourceUrl) => {
    // Map the response into the same shape as handleSuccess
    // Ensure segments is always an array (handles empty/missing gracefully)
    const segments = Array.isArray(data.segments) ? data.segments : [];
    setTranscriptionData({ filename: data.title, segments });
    setVideoUrl(null); // No local video file for link-based analysis
    setLinkSummary(data.summary || null);
    setLinkTitle(data.title || 'Link Analysis');
    setPdfSummary(null);
    setQuizData(null);
    setFlashcardData(null);
    setChatHistory([]);

    // Scroll to top so the summary banner is immediately visible
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save to Firestore history
    const topicName = data.title || sourceUrl;
    saveStudyTopic(topicName, 'link');
    // Publish to global community library
    saveToPublicLibrary({
      title: data.title || sourceUrl,
      topic: data.title || 'Link Analysis',
      summary: data.summary || '',
      type: 'link',
    });
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
      const res = await fetch('/api/study-materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript_text: fullText }),
      });
      if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        alert(`⚠️ ${errData.detail || "Google's AI servers are currently at max capacity. Please try again in a few minutes."}`);
        return;
      }
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
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: fullTranscript, question: userMessage }),
      });
      if (res.status === 503) {
        const errData = await res.json().catch(() => ({}));
        const capacityMsg = errData.detail || "Google's AI servers are currently at max capacity. Please try again in a few minutes.";
        setChatHistory(prev => [...prev, { role: 'ai', text: `⚠️ **Server Busy** — ${capacityMsg}` }]);
        return;
      }
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
        <button
          className="logout-btn"
          onClick={logout}
          title="Sign out"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
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
          {/* 0. Link Analyzer — full-width row spanning both columns */}
          <div className="upload-screen-full">
            <LinkAnalyzer onAnalysisComplete={handleLinkAnalysisComplete} />
          </div>

          {/* 1. Video Uploader Card */}
          <div>
            <h2 className="upload-section-title">Video Lecture</h2>
            <VideoUploader onUploadSuccess={handleSuccess} />
          </div>

          {/* 2. PDF Uploader Card */}
          <div>
            <h2 className="upload-section-title">PDF Document</h2>
            <PdfUploader onSummaryReady={(summaryData) => {
              setPdfSummary(summaryData);
              saveStudyTopic('PDF Analysis', 'pdf');
              // Publish to global community library
              saveToPublicLibrary({
                title: 'PDF Analysis',
                topic: 'PDF Analysis',
                summary: summaryData || '',
                type: 'pdf',
              });
            }} />
          </div>

          {/* 3. Summary Box (spans full width) */}
          {pdfSummary && (
            <div className="pdf-summary-box" id="pdf-summary-export">
              <div className="pdf-summary-header">
                <h3 className="pdf-summary-title">
                  <svg className="pdf-summary-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  AI Summary
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="export-pdf-btn"
                    onClick={() => exportToPdf('pdf-summary-export', 'pdf-ai-summary')}
                    disabled={isExporting}
                    title="Export as PDF"
                  >
                    {isExporting ? (
                      <span className="btn-spinner" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    Export PDF
                  </button>
                  <button
                    onClick={() => setPdfSummary(null)}
                    className="pdf-summary-clear-btn"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="markdown-summary">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {pdfSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* ─── 4. AI Research Assistant ─── */}
          <div className="research-section">
            <div className="research-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h2 className="research-title">AI Research Assistant</h2>
              <span className="research-badge">ArXiv</span>
            </div>
            <p className="research-subtitle">Search for scientific papers on any topic — powered by AI</p>

            <div className="research-input-wrapper">
              <svg className="research-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="research-input"
                placeholder="e.g. quantum machine learning, attention mechanisms..."
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearchSearch()}
                disabled={isResearchLoading}
              />
              <button
                className="research-go-btn"
                onClick={handleResearchSearch}
                disabled={isResearchLoading || !researchQuery.trim()}
              >
                {isResearchLoading ? (
                  <span className="btn-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </div>

            {/* Loading state */}
            {isResearchLoading && (
              <div className="research-loading">
                <div className="research-loading-icon">
                  <span className="btn-spinner" />
                </div>
                <p>Agent is searching ArXiv for papers...</p>
              </div>
            )}

            {/* Error state */}
            {researchError && (
              <p className="research-error">{researchError}</p>
            )}

            {/* Results */}
            {researchResult && (
              <div className="research-results" id="research-results-export">
                <div className="research-results-header">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Research Results
                  <button
                    className="export-pdf-btn"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => exportToPdf('research-results-export', 'research-results')}
                    disabled={isExporting}
                    title="Export as PDF"
                  >
                    {isExporting ? (
                      <span className="btn-spinner" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    Export PDF
                  </button>
                </div>
                <div className="research-results-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {researchResult}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* ─── 5. Recommended For You ─── */}
          {recommendations.length > 0 && (
            <div className="recommendations-section">
              <div className="recommendations-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <h3 className="recommendations-title">Recommended For You</h3>
              </div>
              <div className="recommendations-list">
                {recommendations.map((rec, i) => (
                  <button
                    key={i}
                    className="recommendation-chip"
                    onClick={() => {
                      setResearchQuery(rec);
                      // Auto-scroll to research section
                      document.querySelector('.research-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                    {rec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── 6. Recent Study History ─── */}
          {studyHistory.length > 0 && (
            <div className="history-section">
              <div className="history-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <h3 className="history-title">Recent Study History</h3>
              </div>
              <div className="history-list">
                {studyHistory.slice(0, 5).map((item) => (
                  <div key={item.id} className="history-item">
                    <span className={`history-type-badge ${item.type}`}>
                      {item.type === 'video' ? '🎥' : item.type === 'link' ? '🔗' : '📄'}
                    </span>
                    <span className="history-topic">{item.topic}</span>
                    <span className="history-time">
                      {item.createdAt?.toDate?.() ? item.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Workspace: Video Player + Transcript + Chat ─── */
        <>
          {/* ─── Link AI Summary Banner ─── */}
          {linkSummary && (
            <div className="link-summary-banner" id="link-summary-export">
              <div className="link-summary-banner-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                <span className="link-summary-banner-title">✨ {linkTitle || 'AI Summary'}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
                  <button
                    className="export-pdf-btn"
                    onClick={() => exportToPdf('link-summary-export', linkTitle ? `${linkTitle}-summary` : 'link-summary')}
                    disabled={isExporting}
                    title="Export as PDF"
                  >
                    {isExporting ? (
                      <span className="btn-spinner" />
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                    Export PDF
                  </button>
                  <button className="link-summary-close-btn" onClick={() => setLinkSummary(null)}>Dismiss</button>
                </div>
              </div>
              <div className="markdown-summary">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{linkSummary}</ReactMarkdown>
              </div>
            </div>
          )}
          {/* ─── No summary fallback ─── */}
          {!linkSummary && linkTitle && (
            <div className="link-no-summary-banner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>Transcription complete for <strong>{linkTitle}</strong>. Summary unavailable — check your API key or try a different video.</span>
            </div>
          )}

          <div className="workspace">
            {/* ─── Left Column: Player + Transcript ─── */}
            <div className="left-column">

              {/* 1. The Video Player (hidden for link-based analysis) */}
              {videoUrl && <VideoPlayer videoUrl={videoUrl} seekTime={seekTime} />}

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
                <div className="study-section" id="study-section-export">
                  {/* Export Study Guide as PDF */}
                  <div className="study-export-bar">
                    <button
                      className="export-pdf-btn"
                      onClick={() => exportToPdf('study-section-export', 'study-guide')}
                      disabled={isExporting}
                      title="Export full study guide as PDF"
                    >
                      {isExporting ? (
                        <span className="btn-spinner" />
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      )}
                      Export Study Guide as PDF
                    </button>
                  </div>

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
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
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
              setLinkSummary(null);
              setLinkTitle('');
              setQuizData(null);
              setFlashcardData(null);
              setSelectedAnswers({});
              setFlippedCards({});
              setChatHistory([]);
              setChatInput('');
            }}
          >
            ← Back to Upload
          </button>
        </>
      )}
    </div>
  );
}

// ─── Root App: wraps everything in AuthProvider ───
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;