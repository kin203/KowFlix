import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import MovieSlider from '../components/MovieSlider';
import Footer from '../components/Footer';
import { movieAPI } from '../services/api';
import useDocumentTitle from '../components/useDocumentTitle';
import './NewAndPopular.css';

const NewAndPopular = () => {
    useDocumentTitle('KowFlix - Mới & Phổ biến');
    const { t } = useTranslation();
    const [newMovies, setNewMovies] = useState([]);
    const [popularMovies, setPopularMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch New Movies (limit 20, sorted by createdAt desc by default)
                const newResponse = await movieAPI.getAll({ limit: 20 });
                const newList = newResponse.data.data || newResponse.data || [];
                setNewMovies(newList);

                // Fetch Popular (Trending) Movies
                const popularResponse = await movieAPI.getTrendingMovies(20);
                const popularList = popularResponse.data.data || [];
                setPopularMovies(popularList);

            } catch (err) {
                console.error("Failed to fetch new & popular data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="new-popular-page">
            <Navbar />

            <div className="content-wrapper">
                {/* Page Title */}
                <div className="page-header">
                    <h1>{t('navbar.new_and_popular', 'Mới & Phổ biến')}</h1>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="movies-container">
                        {/* New Releases Section */}
                        {newMovies.length > 0 ? (
                            <MovieSlider
                                title={t('home.new_releases', 'Mới phát hành')}
                                movies={newMovies}
                            />
                        ) : (
                            <div className="empty-state">
                                <h2>{t('home.new_releases', 'Mới phát hành')}</h2>
                                <p>Chưa có phim mới cập nhật.</p>
                            </div>
                        )}

                        {/* Trending Section */}
                        {popularMovies.length > 0 && (
                            <MovieSlider
                                title={t('home.trending', 'Top Thịnh Hành')}
                                movies={popularMovies}
                            />
                        )}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default NewAndPopular;
