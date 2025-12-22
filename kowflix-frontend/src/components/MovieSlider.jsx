import React, { useState, useEffect } from 'react';
import MovieInfoModal from './MovieInfoModal';
import { progressAPI } from '../services/api';
import './MovieSlider.css';

const MovieSlider = ({ title, movies }) => {
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieProgress, setMovieProgress] = useState({});

    // Fetch watch progress for all movies
    useEffect(() => {
        const fetchProgress = async () => {
            const token = localStorage.getItem('token');
            if (!token || !movies) return;

            const progressData = {};
            for (const movie of movies) {
                try {
                    const response = await progressAPI.get(movie._id);
                    if (response.data.success && response.data.data) {
                        const { currentTime, duration } = response.data.data;
                        if (duration > 0) {
                            progressData[movie._id] = (currentTime / duration) * 100;
                        }
                    }
                } catch (error) {
                    // Ignore errors for individual movies
                }
            }
            setMovieProgress(progressData);
        };

        fetchProgress();
    }, [movies]);

    if (!movies || movies.length === 0) return null;

    return (
        <>
            <div className="movie-slider">
                <h2 className="slider-title">{title}</h2>
                <div className="slider-container">
                    {movies.map((movie) => {
                        const progress = movieProgress[movie._id] || 0;
                        const hasProgress = progress > 0 && progress < 95; // Show progress if between 0-95%

                        return (
                            <div
                                key={movie._id}
                                className="movie-card"
                                onClick={() => setSelectedMovie(movie)}
                            >
                                <img
                                    src={movie.poster || "https://via.placeholder.com/200x300?text=No+Poster"}
                                    alt={movie.title}
                                    className="movie-poster"
                                    onLoad={() => console.log('✅ Image loaded:', movie.title)}
                                    onError={(e) => {
                                        console.error('❌ Image failed:', movie.title, e.target.src);
                                        e.target.src = "https://via.placeholder.com/200x300?text=Error";
                                    }}
                                />
                                {hasProgress && (
                                    <div className="movie-progress-bar">
                                        <div
                                            className="movie-progress-fill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
