import React from 'react';
import { Link } from 'react-router-dom';
import './MovieSlider.css';

const MovieSlider = ({ title, movies }) => {
    if (!movies || movies.length === 0) return null;

    return (
        <div className="movie-slider">
            <h2 className="slider-title">{title}</h2>
            <div className="slider-container">
                {movies.map((movie) => (
                    <Link to={`/watch/${movie._id}`} key={movie._id} className="movie-card">
                        <img
                            src={movie.poster || "https://via.placeholder.com/200x300?text=No+Poster"}
                            alt={movie.title}
                            className="movie-poster"
                        />
                        <div className="movie-info">
                            <p className="movie-title">{movie.title}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default MovieSlider;
