import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import MovieInfoModal from './MovieInfoModal';
import './MovieSlider.css';

const MovieSlider = ({ title, movies }) => {
    const [selectedMovie, setSelectedMovie] = useState(null);

    if (!movies || movies.length === 0) return null;

    return (
        <>
            <div className="movie-slider">
                <h2 className="slider-title">{title}</h2>
                <div className="slider-container">
                    {movies.map((movie) => (
                        <div key={movie._id} className="movie-card">
                            <Link to={`/watch/${movie._id}`} className="movie-card-link">
                                <img
                                    src={movie.poster || "https://via.placeholder.com/200x300?text=No+Poster"}
                                    alt={movie.title}
                                    className="movie-poster"
                                />
                            </Link>
                            <div className="movie-overlay">
                                <div className="movie-info">
                                    <p className="movie-title">{movie.title}</p>
                                    <div className="movie-actions">
                                        <Link to={`/watch/${movie._id}`} className="movie-play-btn">
                                            Play
                                        </Link>
                                        <button
                                            className="movie-info-btn"
                                            onClick={() => setSelectedMovie(movie)}
                                            title="More Info"
                                        >
                                            <Info size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedMovie && (
                <MovieInfoModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </>
    );
};

export default MovieSlider;
