import React, { useEffect } from 'react';
import { X, Play, Plus, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './MovieInfoModal.css';

const MovieInfoModal = ({ movie, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handlePlayClick = () => {
        navigate(`/watch/${movie._id}`);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!movie) return null;

    return (
        <div className="movie-info-modal-backdrop" onClick={handleBackdropClick}>
            <div className="movie-info-modal">
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={28} />
                </button>

                <div className="modal-hero" style={{ backgroundImage: `url(${movie.background || movie.poster})` }}>
                    <div className="modal-hero-overlay">
                        <div className="modal-hero-content">
                            <h1 className="modal-title">{movie.title}</h1>
                            <div className="modal-actions">
                                <button className="modal-play-btn" onClick={handlePlayClick}>
                                    <Play size={24} fill="black" />
                                    Play
                                </button>
                                <button className="modal-icon-btn">
                                    <Plus size={24} />
                                </button>
                                <button className="modal-icon-btn">
                                    <ThumbsUp size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-details">
                    <div className="modal-main-info">
                        <div className="modal-meta">
                            <span className="modal-year">{movie.releaseYear || new Date(movie.releaseDate).getFullYear() || '2024'}</span>
                            {movie.imdbRating && (
                                <span className="modal-rating">⭐ {movie.imdbRating.toFixed(1)}</span>
                            )}
                            {movie.runtime && (
                                <span className="modal-duration">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                            )}
                            <span className="modal-quality">HD</span>
                        </div>

                        <p className="modal-description">
                            {movie.description || 'No description available.'}
                        </p>
                    </div>

                    <div className="modal-secondary-info">
                        <div className="modal-info-row">
                            <span className="modal-label">Cast:</span>
                            <span className="modal-value">{movie.cast?.join(', ') || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">Genres:</span>
                            <span className="modal-value">{movie.genres?.join(', ') || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">Director:</span>
                            <span className="modal-value">{movie.director || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieInfoModal;
