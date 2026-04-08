import { useRef, useEffect } from 'react';

const VideoPlayer = ({ videoUrl, seekTime }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && seekTime !== null) {
            videoRef.current.currentTime = seekTime;
            videoRef.current.play();
        }
    }, [seekTime]);

    if (!videoUrl) return null;

    return (
        <div className="player-container">
            <video
                ref={videoRef}
                controls
                src={videoUrl}
                style={{ width: '100%', display: 'block', outline: 'none' }}
            >
                Your browser does not support the video tag.
            </video>
        </div>
    );
};

export default VideoPlayer;