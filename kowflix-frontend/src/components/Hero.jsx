import React, { useState } from 'react';
import { Play, Info, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieInfoModal from './MovieInfoModal';
import './Hero.css';

const Hero = ({ movie, movies = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeMovie, setActiveMovie] = useState(movie);

    // Update activeMovie when prop changes
    React.useEffect(() => {
        if (movie) setActiveMovie(movie);
    }, [movie]);

    // Fallback if no movie provided
    if (!activeMovie) return null;

    // Extract year from releaseDate
    const year = activeMovie.releaseYear || (activeMovie.releaseDate ? new Date(activeMovie.releaseDate).getFullYear() : '2024');

    // Format runtime
    const formatRuntime = (minutes) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // Get top 6 movies for carousel (excluding current if needed, or just first 6)
    const carouselMovies = movies.slice(0, 6);

    return (
        <>
            <div
                className="hero"
                style={{
                    backgroundImage: `url(${activeMovie.background || activeMovie.poster || ''})`
                }}
            >
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1 className="hero-title">{activeMovie.title}</h1>

                    {/* Movie metadata badges */}
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

                    {/* Genre tags */}
                    {activeMovie.genres && activeMovie.genres.length > 0 && (
                        <div className="hero-genres">
                            {activeMovie.genres.slice(0, 4).map((genre, index) => (
                                <span key={index} className="genre-tag">{genre}</span>
                            ))}
                        </div>
                    )}

                    {/* Description */}
                    <p className="hero-description">{activeMovie.description}</p>

                    {/* Action buttons */}
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

                {/* Thumbnail Carousel */}
                <div className="hero-carousel">
                    {carouselMovies.map((item) => (
                        <div
                            key={item._id}
                            className={`carousel-item ${activeMovie._id === item._id ? 'active' : ''}`}
                            onClick={() => setActiveMovie(item)}
                        >
                            <img src={item.poster} alt={item.title} />
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
