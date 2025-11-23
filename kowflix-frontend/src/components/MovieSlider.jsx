import React, { useState } from 'react';
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
                        <div
                            key={movie._id}
                            className="movie-card"
                            onClick={() => setSelectedMovie(movie)}
                        >
                            <img
                                src={movie.poster || "https://via.placeholder.com/200x300?text=No+Poster"}
                                alt={movie.title}
                                className="movie-poster"
                            />
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
