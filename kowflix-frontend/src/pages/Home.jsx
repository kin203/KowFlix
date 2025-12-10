import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryCards from '../components/CategoryCards';
import MovieSlider from '../components/MovieSlider';
import Footer from '../components/Footer';
import { movieAPI, heroAPI } from '../services/api';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [heroBanners, setHeroBanners] = useState([]);
    const [movies, setMovies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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
                console.log('🔍 API Response:', moviesResponse.data);
                const movieList = moviesResponse.data.data || moviesResponse.data || [];
                console.log('🎬 Movie List:', movieList);
                console.log('📸 First poster:', movieList[0]?.poster);
                setMovies(movieList);

                // Fetch active categories
                const categoriesResponse = await axios.get('http://localhost:5000/api/categories/active');
                setCategories(categoriesResponse.data.data || []);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="home-page">
            <Navbar />
            <Hero heroBanners={heroBanners} />
            <CategoryCards categories={categories} />
            <MovieSlider title="Trending Now" movies={movies} />
            <MovieSlider title="Top Rated" movies={[...movies].reverse()} />
            <MovieSlider title="Action Movies" movies={movies} />
            <Footer />
        </div>
    );
};

export default Home;