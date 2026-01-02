import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X } from 'lucide-react';
import { movieAPI } from '../services/api';
import './TMDbSearch.css';

const TMDbSearch = ({ onSelectMovie }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim().length >= 2) {
                handleSearch();
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    const handleSearch = async () => {
        try {
            setSearching(true);
            const { data } = await movieAPI.searchTMDb(searchQuery);
            setSearchResults(data.data || []);
            setShowResults(true);
        } catch (error) {
            console.error('TMDb search error:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSelectMovie = async (movie) => {
        try {
            // Get full details
            const { data } = await movieAPI.getTMDbDetails(movie.tmdbId);
            onSelectMovie(data.data);
            setSearchQuery('');
            setShowResults(false);
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to get movie details:', error);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    return (
        <div className="tmdb-search-container">
            <label className="tmdb-search-label">
                {t('admin.tmdb_search_label')}
                <span className="tmdb-search-hint">{t('admin.tmdb_search_hint')}</span>
            </label>

            <div className="tmdb-search-input-wrapper">
                <Search size={20} className="search-icon" />
                <input
                    type="text"
                    className="tmdb-search-input"
                    placeholder={t('admin.tmdb_search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        className="clear-search-btn"
                        onClick={handleClear}
                        type="button"
                    >
                        <X size={18} />
                    </button>
                )}
                {searching && <div className="search-spinner"></div>}
            </div>

            {showResults && searchResults.length > 0 && (
                <div className="tmdb-search-results">
                    {searchResults.map((movie) => (
                        <div
                            key={movie.tmdbId}
                            className="tmdb-result-item"
                            onClick={() => handleSelectMovie(movie)}
                        >
                            {movie.posterPath && (
                                <img
                                    src={movie.posterPath}
                                    alt={movie.title}
                                    className="result-poster"
                                />
                            )}
                            <div className="result-info">
                                <h4>{movie.title}</h4>
                                <p className="result-year">
                                    {movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}
                                </p>
                                <p className="result-overview">
                                    {movie.overview?.substring(0, 100)}
                                    {movie.overview?.length > 100 ? '...' : ''}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showResults && searchResults.length === 0 && !searching && (
                <div className="tmdb-no-results">
                    {t('admin.no_movies_found', { query: searchQuery })}
                </div>
            )}
        </div>
    );
};

export default TMDbSearch;
