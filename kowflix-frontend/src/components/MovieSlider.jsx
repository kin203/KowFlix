import React, { useState, useEffect, useRef } from 'react';
import MovieInfoModal from './MovieInfoModal';
import { progressAPI } from '../services/api';
import './MovieSlider.css';

const MovieSlider = ({ title, movies }) => {
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieProgress, setMovieProgress] = useState({});
    const sliderRef = useRef(null);

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

    const scroll = (direction) => {
        if (sliderRef.current) {
            const container = sliderRef.current;
            const scrollAmount = direction === 'left' ? -container.offsetWidth * 0.75 : container.offsetWidth * 0.75;

            // Custom smooth scroll with easing
            const start = container.scrollLeft;
            const target = start + scrollAmount;
            const startTime = performance.now();
            const duration = 800; // Slower, more premium feel

            // Ease Out Quart (starts fast, slows down very smoothly)
            const easeOutQuart = (t) => 1 - (--t) * t * t * t;

            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                if (elapsed < duration) {
                    const progress = easeOutQuart(elapsed / duration);
                    container.scrollLeft = start + (scrollAmount * progress);
                    requestAnimationFrame(animateScroll);
                } else {
                    container.scrollLeft = target;
                }
            };

            requestAnimationFrame(animateScroll);
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <>
            <div className="movie-slider">
                <div className="slider-header">
                    <h2 className="slider-title">{title}</h2>
                </div>

                <div className="slider-wrapper">
                    <button
                        className="slider-arrow left"
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                    >
                        &#10094;
                    </button>

                    <div className="slider-container" ref={sliderRef}>
                        {movies.map((movie) => {
                            const progress = movieProgress[movie._id] || 0;
                            const hasProgress = progress > 0 && progress < 95;

                            return (
                                <div
                                    key={movie._id}
                                    className="movie-card-container"
                                    onClick={() => setSelectedMovie(movie)}
                                >
                                    <div className="movie-card">
                                        <img
                                            src={movie.poster || "https://via.placeholder.com/200x300?text=No+Poster"}
                                            alt={movie.title}
                                            className="movie-poster"
                                            onError={(e) => {
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
                                    <h3 className="movie-title">{movie.title}</h3>
                                </div>
                            );
                        })}
                    </div>

                    <button
                        className="slider-arrow right"
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                    >
                        &#10095;
                    </button>
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
