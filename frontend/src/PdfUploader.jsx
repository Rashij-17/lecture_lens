import React, { useState } from 'react';

const PdfUploader = ({ onSummaryReady }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setError('Please upload a valid PDF file.');
            return;
        }

        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/pdf-summary', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // Handle 503 capacity errors with a friendly message
                if (response.status === 503) {
                    const errData = await response.json().catch(() => ({}));
                    setError(errData.detail || "Google's AI servers are currently at max capacity. Please try again in a few minutes.");
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Unknown Server Error');
            }

            const data = await response.json();
            onSummaryReady(data.summary);

        } catch (error) {
            console.error('Error summarizing PDF:', error);
            setError(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const containerStyle = {
        background: isDragging ? 'rgba(16, 185, 129, 0.06)' : 'rgba(255, 255, 255, 0.03)',
        border: isDragging
            ? '2px dashed rgba(16, 185, 129, 0.6)'
            : '1px dashed rgba(255, 255, 255, 0.12)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        textAlign: 'center',
        width: '100%',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isDragging
            ? '0 0 60px rgba(16, 185, 129, 0.12), inset 0 0 60px rgba(16, 185, 129, 0.03)'
            : 'none',
    };

    return (
        <div
            style={containerStyle}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFile(e.dataTransfer.files[0]);
            }}
            onMouseEnter={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                    e.currentTarget.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.06)';
                }
            }}
            onMouseLeave={(e) => {
                if (!isDragging) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.boxShadow = 'none';
                }
            }}
        >
            {/* Icon */}
            <div style={{ marginBottom: '1.25rem' }}>
                {isLoading ? (
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '2.5px solid rgba(16, 185, 129, 0.15)',
                        borderTopColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite',
                        margin: '0 auto',
                    }} />
                ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDragging ? '#10b981' : '#10b981'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: isDragging ? 1 : 0.7, transition: 'opacity 0.3s' }}>
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                )}
            </div>

            <p style={{
                color: isDragging ? '#34d399' : '#f4f4f5',
                fontSize: '0.95rem',
                fontWeight: 600,
                margin: '0 0 0.25rem 0',
                transition: 'color 0.3s',
            }}>
                {isLoading
                    ? 'Analyzing your PDF...'
                    : isDragging
                        ? 'Drop it here!'
                        : 'Upload a PDF Document'}
            </p>

            <p style={{
                color: '#52525b',
                fontSize: '0.78rem',
                marginBottom: '1.5rem',
            }}>
                {isLoading ? 'Extracting text & generating summary' : 'Drag & drop or click to browse'}
            </p>

            <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFile(e.target.files[0])}
                style={{ display: 'none' }}
                id="pdf-upload"
            />
            <label
                htmlFor="pdf-upload"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    padding: '0.6rem 1.4rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#a1a1aa',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.5 : 1,
                    pointerEvents: isLoading ? 'none' : 'auto',
                }}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = '#a1a1aa';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Browse Files
            </label>
            {/* Error display */}
            {error && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.65rem 1rem',
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    textAlign: 'left',
                }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span style={{ color: '#fca5a5', fontSize: '0.78rem', lineHeight: '1.5' }}>{error}</span>
                </div>
            )}
        </div>
    );
};

export default PdfUploader;