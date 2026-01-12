import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { movieAPI } from '../services/api';
import Navbar from '../components/Navbar';
import { Filter, PlayCircle, ArrowLeft, SlidersHorizontal, X } from 'lucide-react';
import './Watch.css'; // Reusing some basic styles
import './MoviesPage.css';

const MoviesPage = () => {
    const { t } = useTranslation();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);

    // Filters state
    const [filters, setFilters] = useState({
        country: '',
        genre: '',
        year: ''
    });

    const [filterOptions, setFilterOptions] = useState({
        countries: [],
        genres: []
    });

    // Fetch filter options on mount
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await movieAPI.getFilters();
                if (res.data && res.data.success) {
                    setFilterOptions({
                        countries: res.data.data.countries || [],
                        genres: res.data.data.genres || []
                    });
                }
            } catch (error) {
                console.error("Error fetching filters", error);
            }
        };
        fetchFilters();
    }, []);

    // Fetch movies when page or filters change
    useEffect(() => {
        const fetchMovies = async () => {
            setLoading(true);
            try {
                const params = {
                    page,
                    limit: 18,
                    country: filters.country,
                    genre: filters.genre
                };

                // Clean empty params
                Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

                const response = await movieAPI.getAll(params);
                if (response.data.success) {
                    setMovies(response.data.data);
                    // Assuming API returns totalPages/pagination meta, but sticking to simple success check for now
                    // If your API wraps movies in a 'data' array and provides pagination info separately:
                    // setTotalPages(response.data.pagination.totalPages);
                } else if (Array.isArray(response.data)) {
                    // Fallback if API returns array directly
                    setMovies(response.data);
                }
            } catch (err) {
                console.error('Failed to fetch movies:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMovies();
    }, [page, filters]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1); // Reset to page 1
    };

    const clearFilters = () => {
        setFilters({ country: '', genre: '', year: '' });
        setPage(1);
    };

    return (
        <div className="category-page movies-page">
            <Navbar />

            <div className="category-content">
                <div className="movies-header">
                    <div className="header-left">
                        <Link to="/" className="back-link">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="page-title">{t('common.all_movies', 'Tất cả phim')}</h1>
                    </div>

                    <button
                        className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal size={18} />
                        <span>{t('common.filter', 'Bộ lọc')}</span>
                    </button>
                </div>

                {/* Filter Section */}
                {showFilters && (
                    <div className="filters-panel">
                        <div className="filter-group">
                            <label>Quốc gia</label>
                            <select
                                value={filters.country}
                                onChange={(e) => handleFilterChange('country', e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                {filterOptions.countries.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Thể loại</label>
                            <select
                                value={filters.genre}
                                onChange={(e) => handleFilterChange('genre', e.target.value)}
                            >
                                <option value="">Tất cả</option>
                                {filterOptions.genres.map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>

                        <button className="clear-filters-btn" onClick={clearFilters}>
                            <X size={16} /> Xóa bộ lọc
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="category-loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : movies.length === 0 ? (
                    <div className="empty-category">
                        <p>{t('common.no_movies', 'Không tìm thấy phim nào')}</p>
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
                                    <div className="movie-badges">
                                        {movie.quality && <span className="quality-badge">{movie.quality}</span>}
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

                {/* Simple Pagination - Add if API supports it fully */}
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem', gap: '1rem' }}>
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="pagination-btn"
                        style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: 'white', borderRadius: '4px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                    >
                        Trước
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center' }}>Trang {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="pagination-btn"
                        style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoviesPage;
