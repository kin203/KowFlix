import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { movieAPI, progressAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import './Watch.css';

const Watch = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [hlsUrl, setHlsUrl] = useState(null);
    const [initialTime, setInitialTime] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                setLoading(true);

                // Fetch movie data
                const { data } = await movieAPI.play(id);

                if (data.success && data.data && data.data.master) {
                    setMovie(data.data);
                    setHlsUrl(data.data.master);

                    // Fetch watch progress
                    try {
                        const progressRes = await progressAPI.get(id);
                        if (progressRes.data.success && progressRes.data.data) {
                            setInitialTime(progressRes.data.data.currentTime || 0);
                        }
                    } catch (err) {
                        console.log('No previous progress found');
                    }
                } else {
                    setError(data.message || "Video chưa được encode. Vui lòng encode phim trước!");
                }
            } catch (err) {
                console.error("Play error", err);
                setError(err.response?.data?.message || "Failed to load video");
            } finally {
                setLoading(false);
            }
        };

        fetchVideo();
    }, [id]);

    const handleProgress = async ({ currentTime, duration }) => {
        try {
            await progressAPI.save(id, { currentTime, duration });
        } catch (err) {
            console.error('Failed to save progress:', err);
        }
    };

    if (loading) {
        return (
            <div className="watch-page">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="watch-page">
                <Link to="/" className="back-button">
                    <ArrowLeft size={24} /> Back to Browse
                </Link>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    return (
        <div className="watch-page">
            <Link to="/" className="back-button">
                <ArrowLeft size={24} /> Back to Browse
            </Link>

            {movie && hlsUrl && (
                <div className="player-wrapper">
                    <VideoPlayer
                        src={hlsUrl}
                        poster={movie.backdrop || movie.poster}
                        onProgress={handleProgress}
                        initialTime={initialTime}
                        movieId={id}
                        subtitles={movie.subtitles || []}
                    />
                    <div className="movie-info">
                        <h1>{movie.title}</h1>
                        {movie.description && <p>{movie.description}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Watch;
