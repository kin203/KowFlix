import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import CategoryCards from '../components/CategoryCards';
import MovieSlider from '../components/MovieSlider';
import Footer from '../components/Footer';
import { movieAPI } from '../services/api';
import './Home.css';

const Home = () => {
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await movieAPI.getAll();
                const movieList = response.data.data || response.data || [];
                setMovies(movieList);

                if (movieList.length > 0) {
                    setFeaturedMovie(movieList[0]);
                }
            } catch (err) {
                console.error("Failed to fetch movies", err);
            }
        };

        fetchMovies();
    }, []);

    return (
        <div className="home-page">
            <Navbar />
            <Hero movie={featuredMovie} movies={movies} />
            <CategoryCards />
            <MovieSlider title="Trending Now" movies={movies} />
            <MovieSlider title="Top Rated" movies={[...movies].reverse()} />
            <MovieSlider title="Action Movies" movies={movies} />
            <Footer />
        </div>
    );
};

export default Home;
