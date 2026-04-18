import { useState } from 'react';

const LinkAnalyzer = ({ onAnalysisComplete }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState(''); // 'downloading' | 'transcribing' | 'summarizing'

  const isValidUrl = (val) => {
    try { new URL(val); return true; } catch { return false; }
  };

  const handleAnalyze = async () => {
    const trimmed = url.trim();
    if (!trimmed || !isValidUrl(trimmed)) {
      setError('Please paste a valid URL (YouTube, Vimeo, or any video link).');
      return;
    }
    setError('');
    setIsLoading(true);
    setStage('downloading');

    // Simulate stage transitions for UX (actual stages happen server-side)
    const stageTimer1 = setTimeout(() => setStage('transcribing'), 4000);
    const stageTimer2 = setTimeout(() => setStage('summarizing'), 12000);

    try {
      const res = await fetch('http://localhost:8000/api/analyze-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      onAnalysisComplete(data, trimmed);
      setUrl('');
    } catch (err) {
      setError(err.message || 'Analysis failed. Check that the URL is valid and your backend is running.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsLoading(false);
      setStage('');
    }
  };

  const stageLabels = {
    downloading: { icon: '⬇️', text: 'Downloading audio from URL...' },
    transcribing: { icon: '🎙️', text: 'Transcribing with Whisper AI...' },
    summarizing:  { icon: '✨', text: 'Generating AI summary...' },
  };
  const currentStage = stageLabels[stage];

  return (
    <div className="link-analyzer-card">
      {/* Header */}
      <div className="link-analyzer-header">
        <div className="link-analyzer-icon-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div>
          <h2 className="link-analyzer-title">Analyze from Link</h2>
          <p className="link-analyzer-subtitle">YouTube, Vimeo, Loom, or any public video URL</p>
        </div>
        <span className="link-analyzer-badge">NEW</span>
      </div>

      {/* Input Row */}
      <div className="link-analyzer-input-row">
        <div className="link-analyzer-input-wrap">
          {/* YouTube icon inside the input */}
          <svg className="link-input-prefix-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <input
            id="link-analyzer-input"
            type="url"
            className="link-analyzer-input"
            placeholder="Paste a YouTube or video link here..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleAnalyze()}
            disabled={isLoading}
            aria-label="Video URL input"
          />
          {url && !isLoading && (
            <button
              className="link-input-clear-btn"
              onClick={() => { setUrl(''); setError(''); }}
              aria-label="Clear URL"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        <button
          id="analyze-link-btn"
          className={`link-analyze-btn ${isLoading ? 'loading' : ''}`}
          onClick={handleAnalyze}
          disabled={isLoading || !url.trim()}
          aria-label="Analyze link"
        >
          {isLoading ? (
            <span className="btn-spinner" />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Analyze
            </>
          )}
        </button>
      </div>

      {/* Stage progress */}
      {isLoading && currentStage && (
        <div className="link-analyzer-stage">
          <span className="link-stage-icon">{currentStage.icon}</span>
          <span className="link-stage-text">{currentStage.text}</span>
          <div className="link-stage-bar">
            <div className="link-stage-bar-fill" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="link-analyzer-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Supported sources hint */}
      {!isLoading && !error && (
        <p className="link-analyzer-hint">
          Supports YouTube, Vimeo, Loom, Twitch VODs, Twitter/X videos &amp; more
        </p>
      )}
    </div>
  );
};

export default LinkAnalyzer;
