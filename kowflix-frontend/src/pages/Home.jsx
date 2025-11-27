import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryCards from '../components/CategoryCards';
import MovieSlider from '../components/MovieSlider';
import Footer from '../components/Footer';
import { movieAPI } from '../services/api';
import axios from 'axios';
import './Home.css';

const Home = () => {
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [movies, setMovies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch movies
                const moviesResponse = await movieAPI.getAll();
                const movieList = moviesResponse.data.data || moviesResponse.data || [];
                setMovies(movieList);

                if (movieList.length > 0) {
                    setFeaturedMovie(movieList[0]);
                }

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
            <Hero movie={featuredMovie} movies={movies} />
            <CategoryCards categories={categories} />
            <MovieSlider title="Trending Now" movies={movies} />
            <MovieSlider title="Top Rated" movies={[...movies].reverse()} />
            <MovieSlider title="Action Movies" movies={movies} />
            <Footer />
        </div>
    );
};

export default Home;