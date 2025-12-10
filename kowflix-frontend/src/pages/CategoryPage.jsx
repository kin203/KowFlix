import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Filter, PlayCircle } from 'lucide-react';
import './CategoryPage.css';

const CategoryPage = () => {
    const { slug } = useParams();
    const [category, setCategory] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await categoryAPI.getMoviesBySlug(slug);
                if (response.data.success) {
                    setCategory(response.data.data.category);
                    setMovies(response.data.data.movies);
                }
            } catch (err) {
                console.error('Failed to fetch category movies:', err);
                setError('Không tìm thấy danh mục hoặc danh mục không tồn tại.');
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchCategoryData();
        }
    }, [slug]);

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

    if (error || !category) {
        return (
            <div className="category-page">
                <Navbar />
                <div className="category-error">
                    <h2>{error || 'Category not found'}</h2>
                    <Link to="/" className="back-home-btn">Quay về trang chủ</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="category-page">
            <Navbar />

            <div className="category-content">
                <div className="category-header">
                    <h1 className="category-title">{category.name}</h1>
                    <button className="filter-btn">
                        <Filter size={18} />
                        Bộ lọc
                    </button>
                </div>

                {movies.length === 0 ? (
                    <div className="empty-category">
                        <p>Chưa có phim nào trong danh mục này.</p>
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
                                    {/* Optional: Add episode count or quality badge here if available */}
                                    {/* <span className="episode-badge">Tập 12</span> */}
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

export default CategoryPage;
