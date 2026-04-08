import { useState } from 'react';
import trendingTopics from '../data/trendingTopics';

/* ── SVG Icon Map ──────────────────────────────────── */
const iconMap = {
  brain: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2a3.5 3.5 0 00-3 5.13A3.5 3.5 0 004 10.5a3.5 3.5 0 001.67 2.98A3.5 3.5 0 007 17.5a3.5 3.5 0 003.5 3.5h1V2h-2z" />
      <path d="M14.5 2a3.5 3.5 0 013 5.13A3.5 3.5 0 0120 10.5a3.5 3.5 0 01-1.67 2.98A3.5 3.5 0 0117 17.5a3.5 3.5 0 01-3.5 3.5h-1V2h2z" />
    </svg>
  ),
  sparkles: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.91 5.79L20 10.5l-6.09 1.71L12 18l-1.91-5.79L4 10.5l6.09-1.71z" />
      <path d="M18 2l.67 2.33L21 5l-2.33.67L18 8l-.67-2.33L15 5l2.33-.67z" />
    </svg>
  ),
  code: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  cloud: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  ),
  shield: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

/* ── External Link Icon ────────────────────────────── */
const ExternalLink = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, flexShrink: 0 }}>
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ExploreLibrary = () => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleClose = () => setSelectedTopic(null);

  return (
    <div className="explore-container">
      {/* ── Topic Cards Grid ── */}
      <div className="explore-grid">
        {trendingTopics.map((topic) => (
          <button
            key={topic.id}
            className="explore-card"
            onClick={() => setSelectedTopic(topic)}
          >
            <div className="explore-card-icon">
              {iconMap[topic.icon] || iconMap.brain}
            </div>
            <h3 className="explore-card-title">{topic.title}</h3>
            <p className="explore-card-desc">{topic.shortDescription}</p>
            <span className="explore-card-cta">
              Explore
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {/* ── Topic Detail Modal ── */}
      {selectedTopic && (
        <div className="explore-modal-overlay" onClick={handleClose}>
          <div className="explore-modal" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="explore-modal-header">
              <div className="explore-modal-icon">
                {iconMap[selectedTopic.icon] || iconMap.brain}
              </div>
              <div>
                <h2 className="explore-modal-title">{selectedTopic.title}</h2>
                <p className="explore-modal-subtitle">{selectedTopic.shortDescription}</p>
              </div>
              <button className="explore-modal-close" onClick={handleClose} aria-label="Close modal">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="explore-modal-body">

              {/* Introduction */}
              <section className="explore-section">
                <h4 className="explore-section-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></svg>
                  Introduction
                </h4>
                {selectedTopic.introduction.split('\n\n').map((para, i) => (
                  <p key={i} className="explore-para">{para}</p>
                ))}
              </section>

              {/* Key Concepts */}
              <section className="explore-section">
                <h4 className="explore-section-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                  Key Concepts to Study
                </h4>
                <div className="explore-chips">
                  {selectedTopic.studyMaterials.map((item, i) => (
                    <span key={i} className="explore-chip">{item}</span>
                  ))}
                </div>
              </section>

              {/* Video Lectures */}
              <section className="explore-section">
                <h4 className="explore-section-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                  Video Lectures
                </h4>
                <div className="explore-links-list">
                  {selectedTopic.videoLectures.map((vid, i) => (
                    <a key={i} href={vid.url} target="_blank" rel="noopener noreferrer" className="explore-link-item">
                      <span className="explore-link-number">{String(i + 1).padStart(2, '0')}</span>
                      <span className="explore-link-text">{vid.title}</span>
                      <ExternalLink />
                    </a>
                  ))}
                </div>
              </section>

              {/* Books */}
              <section className="explore-section">
                <h4 className="explore-section-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>
                  Recommended Books
                </h4>
                <div className="explore-books-list">
                  {selectedTopic.books.map((book, i) => (
                    <div key={i} className="explore-book-card">
                      <div className="explore-book-header">
                        <span className="explore-book-title">{book.title}</span>
                        <span className="explore-book-author">by {book.author}</span>
                      </div>
                      <p className="explore-book-why">{book.whyRead}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Research Papers */}
              <section className="explore-section">
                <h4 className="explore-section-title">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  Research Papers
                </h4>
                <div className="explore-links-list">
                  {selectedTopic.researchPapers.map((paper, i) => (
                    <a key={i} href={paper.url} target="_blank" rel="noopener noreferrer" className="explore-link-item">
                      <span className="explore-link-number">{String(i + 1).padStart(2, '0')}</span>
                      <div className="explore-link-details">
                        <span className="explore-link-text">{paper.title}</span>
                        <span className="explore-link-meta">{paper.authors}</span>
                      </div>
                      <ExternalLink />
                    </a>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreLibrary;
