import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryCards from '../components/CategoryCards';
import MovieSlider from '../components/MovieSlider';
import Footer from '../components/Footer';
import { movieAPI, heroAPI } from '../services/api';
import useDocumentTitle from '../components/useDocumentTitle';
import axios from 'axios';
import './Home.css';

const Home = () => {
    // Set Document Title
    useDocumentTitle('KowFlix - Trang chủ');
    const { t } = useTranslation();
    const [heroBanners, setHeroBanners] = useState([]);
    const [movies, setMovies] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [topRatedMovies, setTopRatedMovies] = useState([]);
    const [categoryMovies, setCategoryMovies] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const POPULAR_GENRES = ['Phim Hành Động', 'Phim Lãng Mạn', 'Phim Hài', 'Phim Hoạt Hình', 'Phim Khoa Học Viễn Tưởng'];

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch hero banners (active only)
                const heroResponse = await heroAPI.getAll(true);
                console.log('🎯 Hero Banners Response:', heroResponse.data);
                const heroBannerList = heroResponse.data.data || [];
                setHeroBanners(heroBannerList);

                // Fetch movies
                const moviesResponse = await movieAPI.getAll();
                const movieList = moviesResponse.data.data || moviesResponse.data || [];
                setMovies(movieList);

                // Fetch trending movies
                const trendingResponse = await movieAPI.getTrendingMovies(20);
                const trendingList = trendingResponse.data.data || [];
                setTrendingMovies(trendingList);

                // Fetch top rated movies
                const topRatedResponse = await movieAPI.getTopRatedMovies(20);
                const topRatedList = topRatedResponse.data.data || [];
                setTopRatedMovies(topRatedList);

                // Fetch Category Rows in Parallel
                const categoryPromises = POPULAR_GENRES.map(genre =>
                    movieAPI.getAll({ genre, limit: 12 })
                        .then(res => ({ genre, data: res.data.data || [] }))
                        .catch(err => ({ genre, data: [] }))
                );

                const categoryResults = await Promise.all(categoryPromises);
                const newCategoryMovies = {};
                categoryResults.forEach(({ genre, data }) => {
                    if (data.length > 0) {
                        newCategoryMovies[genre] = data;
                    }
                });
                setCategoryMovies(newCategoryMovies);

                // Fetch both Dynamic Genres and Manual Categories
                const [filtersResponse, categoriesResponse] = await Promise.all([
                    movieAPI.getFilters(),
                    axios.get('http://localhost:5000/api/categories/active')
                ]);

                let finalCards = [];

                // 1. Process Attributes from Manual Categories
                const manualCategories = categoriesResponse.data.data || [];
                // Create a map for quick lookup by name (lowercase)
                const categoryMap = manualCategories.reduce((acc, cat) => {
                    acc[cat.name.toLowerCase()] = cat;
                    if (cat.name_en) acc[cat.name_en.toLowerCase()] = cat;
                    return acc;
                }, {});

                // 2. Map Dynamic Genres to Cards
                if (filtersResponse.data && filtersResponse.data.success) {
                    const { genres } = filtersResponse.data.data;

                    finalCards = genres.map(genre => {
                        // Check if admin has defined custom style for this genre
                        const customStyle = categoryMap[genre.toLowerCase()]; // e.g. "Hành Động" matches "Hành động"

                        return {
                            _id: customStyle ? customStyle._id : `genre-${genre}`,
                            name: genre,
                            name_en: customStyle?.name_en || genre,
                            // If it matches a category, keep using category link? 
                            // Actually, keeping /genre link ensures auto-filter works. 
                            // UNLESS the user explicitly wants the custom collection logic. 
                            // Let's stick to /genre for consistent filtering unless it is PURELY a custom category.
                            link: `/genre/${encodeURIComponent(genre)}`,

                            // Visuals: Prefer custom, fallback to random
                            color: customStyle?.color || getRandomColor(),
                            icon: customStyle?.icon || '🎬',
                            backgroundImage: customStyle?.backgroundImage || null
                        };
                    });
                }

                // 3. Append "Pure" Custom Categories (those that aren't Genres, e.g. "Marvel Collection")
                const genreNames = new Set(finalCards.map(c => c.name.toLowerCase()));
                const pureCategories = manualCategories.filter(cat => !genreNames.has(cat.name.toLowerCase()));

                // Map pure categories to card format
                const pureCategoryCards = pureCategories.map(cat => ({
                    _id: cat._id,
                    name: cat.name,
                    name_en: cat.name_en,
                    link: `/category/${cat.slug}`, // Use standard category route
                    color: cat.color,
                    icon: cat.icon,
                    backgroundImage: cat.backgroundImage
                }));

                // Combine: Genres first, then Custom Collections
                setCategories([...finalCards, ...pureCategoryCards]);

            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper to generate consistent colors or random
    const getRandomColor = () => {
        const colors = [
            '#FF5733', '#C70039', '#900C3F', '#581845',
            '#1abc9c', '#2ecc71', '#3498db', '#9b59b6',
            '#e67e22', '#e74c3c', '#f1c40f', '#34495e'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    return (
        <div className="home-page">
            <Navbar />
            <Hero heroBanners={heroBanners} />
            <CategoryCards categories={categories} />
            <MovieSlider title={t('home.trending')} movies={trendingMovies} />
            <MovieSlider title={t('home.top_rated')} movies={topRatedMovies.length > 0 ? topRatedMovies : [...movies].reverse()} />

            {/* Render Category Rows */}
            {Object.entries(categoryMovies).map(([genre, movieList]) => (
                <MovieSlider
                    key={genre}
                    title={genre} // You might want to map this to localized strings if needed
                    movies={movieList}
                />
            ))}

            <Footer />
        </div>
    );
};

export default Home;