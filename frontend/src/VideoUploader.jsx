import { useState } from 'react';

const VideoUploader = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStatus('Uploading and transcribing (this may take a minute)...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            setStatus('Transcription complete!');
            onUploadSuccess(data, file);
        } catch (error) {
            setStatus('Error: Make sure your Python backend is running!');
            console.error(error);
        }
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            width: '100%',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            position: 'relative',
            overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.06)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.boxShadow = 'none';
        }}
        >
            {/* Icon */}
            <div style={{ marginBottom: '1.25rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
            </div>

            <h2 style={{
                color: '#f4f4f5',
                margin: '0 0 0.25rem 0',
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '-0.3px',
            }}>Upload Lecture Video</h2>

            <p style={{
                color: '#52525b',
                fontSize: '0.78rem',
                marginBottom: '1.5rem',
            }}>Drag a .mp4 file or browse</p>

            <input
                type="file"
                accept="video/mp4"
                onChange={handleFileChange}
                id="video-upload-input"
                style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                <label
                    htmlFor="video-upload-input"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.6rem 1.4rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#a1a1aa',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.06)';
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

                <button
                    onClick={handleUpload}
                    disabled={!file || status.includes('Uploading')}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: file ? 'linear-gradient(135deg, #10b981, #34d399)' : 'rgba(255, 255, 255, 0.04)',
                        color: file ? '#ffffff' : '#52525b',
                        padding: '0.6rem 1.4rem',
                        border: file ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        cursor: file ? 'pointer' : 'not-allowed',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        transition: 'transform 0.15s, box-shadow 0.2s, filter 0.2s',
                        boxShadow: file ? '0 4px 20px rgba(16, 185, 129, 0.25)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (file) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.35)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        if (file) e.currentTarget.style.boxShadow = '0 4px 20px rgba(16, 185, 129, 0.25)';
                    }}
                    onMouseDown={(e) => { if (file) e.currentTarget.style.transform = 'scale(0.95)'; }}
                    onMouseUp={(e) => { if (file) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                >
                    Transcribe
                </button>
            </div>

            {file && (
                <p style={{
                    color: '#34d399',
                    marginTop: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    opacity: 0.8,
                }}>
                    📎 {file.name}
                </p>
            )}

            {status && (
                <p style={{
                    color: status.includes('Error') ? '#ef4444' : status.includes('complete') ? '#22c55e' : '#a1a1aa',
                    marginTop: '0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                }}>
                    {status}
                </p>
            )}
        </div>
    );
};

export default VideoUploader;