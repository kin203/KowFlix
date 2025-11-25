import React, { useState, useEffect } from 'react';
import { Play, Info, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieInfoModal from './MovieInfoModal';
import './Hero.css';

const Hero = ({ movie, movies = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeMovie, setActiveMovie] = useState(movie);

    useEffect(() => {
        if (movie) setActiveMovie(movie);
    }, [movie]);

    if (!activeMovie) return null;

    const year = activeMovie.releaseYear || (activeMovie.releaseDate ? new Date(activeMovie.releaseDate).getFullYear() : '2024');

    const formatRuntime = (minutes) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const carouselMovies = movies.slice(0, 6);

    // YouTube embed URL for trailer
    const getTrailerUrl = (trailerKey) => {
        if (!trailerKey) return null;
        return `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
    };

    const trailerUrl = (activeMovie.useTrailer !== false) ? getTrailerUrl(activeMovie.trailerKey) : null;

    return (
        <>
            <div className="hero">
                {/* Video Trailer or Backdrop Image */}
                {trailerUrl ? (
                    <iframe
                        className="hero-video"
                        src={trailerUrl}
                        title="Movie Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div
                        className="hero-background"
                        style={{
                            backgroundImage: `url(${activeMovie.backdrop || activeMovie.background || activeMovie.poster || ''})`
                        }}
                    />
                )}

                {/* Preload trailers for carousel movies */}
                {carouselMovies.map((m) => {
                    if (m._id === activeMovie._id || !m.trailerKey || m.useTrailer === false) return null;
                    return (
                        <iframe
                            key={m._id}
                            src={getTrailerUrl(m.trailerKey)}
                            title={`Preload ${m.title}`}
                            style={{ display: 'none' }}
                            frameBorder="0"
                        />
                    );
                })}

                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1 className="hero-title">{activeMovie.title}</h1>

                    <div className="hero-meta">
                        {activeMovie.imdbRating && (
                            <span className="badge badge-rating">
                                IMDb {activeMovie.imdbRating.toFixed(1)}
                            </span>
                        )}
                        <span className="badge badge-year">{year}</span>
                        {activeMovie.runtime && (
                            <span className="badge badge-duration">
                                {formatRuntime(activeMovie.runtime)}
                            </span>
                        )}
                        <span className="badge badge-quality">HD</span>
                    </div>

                    {activeMovie.genres && activeMovie.genres.length > 0 && (
                        <div className="hero-genres">
                            {activeMovie.genres.slice(0, 4).map((genre, index) => (
                                <span key={index} className="genre-tag">{genre}</span>
                            ))}
                        </div>
                    )}

                    <p className="hero-description">{activeMovie.description}</p>

                    <div className="hero-buttons">
                        <Link to={`/watch/${activeMovie._id}`} className="btn-play">
                            <Play fill="black" size={24} />
                            <span>Xem ngay</span>
                        </Link>
                        <button className="btn-favorite">
                            <Heart size={24} />
                        </button>
                        <button className="btn-info" onClick={() => setShowModal(true)}>
                            <Info size={24} />
                        </button>
                    </div>
                </div>

                <div className="hero-carousel">
                    {carouselMovies.map((item) => (
                        <div
                            key={item._id}
                            className={`carousel-item ${activeMovie._id === item._id ? 'active' : ''}`}
                            onClick={() => setActiveMovie(item)}
                        >
                            <img src={item.backdrop || item.poster} alt={item.title} />
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <MovieInfoModal
                    movie={activeMovie}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default Hero;