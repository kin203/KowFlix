import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { movieAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Filter, PlayCircle, ArrowLeft } from 'lucide-react';
import './CategoryPage.css'; // Reuse CategoryPage CSS

const GenrePage = () => {
    const { t } = useTranslation();
    const { genre } = useParams();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                setLoading(true);
                setError(null);
                const decodedGenre = decodeURIComponent(genre);

                // Use the genre filter in getAll
                const response = await movieAPI.getAll({ genre: decodedGenre, limit: 100 });
                if (response.data.success) {
                    setMovies(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch movies by genre:', err);
                setError(t('common.error_fetch'));
            } finally {
                setLoading(false);
            }
        };

        if (genre) {
            fetchMovies();
        }
    }, [genre, t]);

    if (loading) {
        return (
            <div className="category-page">
                <Navbar />
                <div className="category-loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="category-page">
                <Navbar />
                <div className="category-error">
                    <h2>{error}</h2>
                    <Link to="/" className="back-home-btn">{t('common.back_home')}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="category-page">
            <Navbar />

            <Link to="/" className="back-button">
                <ArrowLeft size={24} />
                {t('navbar.home')}
            </Link>

            <div className="category-content">
                <div className="category-header">
                    <h1 className="category-title">{t('common.genres')}: {decodeURIComponent(genre)}</h1>
                    <button className="filter-btn">
                        <Filter size={18} />
                        {t('common.filter')}
                    </button>
                </div>

                {movies.length === 0 ? (
                    <div className="empty-category">
                        <p>{t('common.no_movies')}</p>
                    </div>
                ) : (
                    <div className="movies-grid">
                        {movies.map((movie) => (
                            <Link to={`/watch/${movie._id}`} key={movie._id} className="movie-card">
                                <div className="movie-poster-wrapper">
                                    <img
                                        src={movie.poster}
                                        alt={movie.title}
                                        className="movie-poster"
                                        loading="lazy"
                                    />
                                    <div className="movie-overlay">
                                        <PlayCircle size={48} className="play-icon" />
                                    </div>
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-title">{movie.title}</h3>
                                    <div className="movie-meta">
                                        <span className="movie-year">{movie.releaseYear}</span>
                                        {movie.imdbRating && (
                                            <span className="movie-rating">⭐ {movie.imdbRating}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GenrePage;
