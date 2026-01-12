import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { movieAPI } from '../services/api';
import { Play } from 'lucide-react';
import './SearchResults.css';

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const searchMovies = async () => {
            if (!query.trim()) {
                setResults([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Use backend search by passing 'q' parameter
                const response = await movieAPI.getAll({ q: query, limit: 100 });
                const searchResults = response.data.data || [];

                setResults(searchResults);
            } catch (err) {
                console.error('Search error:', err);
                setError('Không thể tìm kiếm. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        searchMovies();
    }, [query]);

    const handleMovieClick = (movieId) => {
        navigate(`/watch/${movieId}`);
    };

    return (
        <div className="search-page">
            <Navbar />

            <div className="search-content">
                <div className="search-header">
                    <h1>Kết quả tìm kiếm</h1>
                    {query && (
                        <p className="search-query">
                            Kết quả cho "<span className="highlight">{query}</span>":
                            <span className="count"> {results.length} phim</span>
                        </p>
                    )}
                </div>

                {loading ? (
                    <div className="loading">
                        <div className="spinner"></div>
                        <p>Đang tìm kiếm...</p>
                    </div>
                ) : error ? (
                    <div className="error">
                        <p>{error}</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="movies-grid">
                        {results.map((movie) => (
                            <div
                                key={movie._id}
                                className="movie-card"
                                onClick={() => handleMovieClick(movie._id)}
                            >
                                <div className="movie-poster">
                                    <img
                                        src={movie.poster || '/placeholder.jpg'}
                                        alt={movie.title}
                                    />
                                    <div className="movie-overlay">
                                        <Play size={48} className="play-btn" />
                                    </div>
                                    {movie.quality && (
                                        <span className="quality">{movie.quality}</span>
                                    )}
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-title">{movie.title}</h3>
                                    <p className="movie-subtitle">
                                        {movie.originalTitle || movie.title}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <h2>Không tìm thấy kết quả</h2>
                        <p>Không có phim nào phù hợp với "{query}"</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default SearchResults;