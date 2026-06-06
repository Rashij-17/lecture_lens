import { useState, useRef, useEffect } from 'react';

export default function LandingSplash({ onFinished }) {
  const videoRef = useRef(null);
  const [fading, setFading] = useState(false);

  // When the video ends naturally, trigger the fade-out
  const handleVideoEnd = () => {
    triggerExit();
  };

  // Shared exit logic — fade out, then notify parent
  const triggerExit = () => {
    if (fading) return; // prevent double-fire
    setFading(true);
    setTimeout(() => {
      onFinished();
    }, 800); // matches the CSS fade-out duration
  };

  // Autoplay the video on mount
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay blocked — skip straight to login
        onFinished();
      });
    }
  }, [onFinished]);

  return (
    <>
      {/* Scoped keyframes & styles */}
      <style>{`
        @keyframes splashFadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes splashSkipIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashPulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .splash-skip-btn:hover {
          background: rgba(255,255,255,0.18) !important;
          backdrop-filter: blur(20px) !important;
          border-color: rgba(255,255,255,0.35) !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.4) !important;
        }
        .splash-skip-btn:active {
          transform: scale(0.96) !important;
        }
      `}</style>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: fading ? 'splashFadeOut 0.8s ease forwards' : undefined,
        }}
      >
        {/* The video — fills the viewport */}
        <video
          ref={videoRef}
          src="/landingVideo.mp4"
          onEnded={handleVideoEnd}
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Skip button — bottom-right corner */}
        <button
          className="splash-skip-btn"
          onClick={triggerExit}
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            padding: '10px 24px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '30px',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 600,
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.25s ease',
            animation: 'splashSkipIn 0.6s ease 0.5s both',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Skip
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>

        {/* Subtle progress dots at the bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '46px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '6px',
            animation: 'splashSkipIn 0.6s ease 0.8s both',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.4)',
                animation: `splashPulse 1.5s ease ${i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
