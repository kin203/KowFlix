import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Hls from 'hls.js';
import { movieAPI } from '../services/api';
import './Watch.css';

const Watch = () => {
    const { id } = useParams();
    const videoRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const { data } = await movieAPI.play(id);
                // Backend returns: { success: true, data: { id, title, qualities: [{quality, url}] } }
                if (data.success && data.data && data.data.qualities && data.data.qualities.length > 0) {
                    // Get the first quality (or you can let user choose)
                    const hlsUrl = data.data.qualities[0].url;
                    playVideo(hlsUrl);
                } else {
                    setError("Video chưa được encode. Vui lòng encode phim trước!");
                }
            } catch (err) {
                console.error("Play error", err);
                setError(err.response?.data?.message || "Failed to load video");
            }
        };

        const playVideo = (hlsUrl) => {
            const video = videoRef.current;
            if (!video) return;

            if (Hls.isSupported()) {
                const hls = new Hls();
                hls.loadSource(hlsUrl);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    video.play().catch(e => console.log("Autoplay blocked", e));
                });

                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        setError("Playback error: " + data.type);
                    }
                });

                return () => {
                    hls.destroy();
                };
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = hlsUrl;
                video.addEventListener('loadedmetadata', () => {
                    video.play().catch(e => console.log("Autoplay blocked", e));
                });
            } else {
                setError("HLS not supported in this browser");
            }
        };

        fetchVideo();
    }, [id]);

    return (
        <div className="watch-page">
            <Link to="/" className="back-button">
                <ArrowLeft size={32} /> Back to Browse
            </Link>

            {error ? (
                <div className="error-message">{error}</div>
            ) : (
                <video
                    ref={videoRef}
                    className="video-player"
                    controls
                    autoPlay
                />
            )}
        </div>
    );
};

export default Watch;
