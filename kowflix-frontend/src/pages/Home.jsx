import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MovieSlider from '../components/MovieSlider';
import { movieAPI } from '../services/api';
import './Home.css';

const Home = () => {
    const [featuredMovie, setFeaturedMovie] = useState(null);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const { data } = await movieAPI.getAll();
                // Backend returns: { success: true, data: [...movies] }
                const movieList = data.data || [];
                setMovies(movieList);

                if (movieList.length > 0) {
                    // Pick a random movie for hero or just the first one
                    setFeaturedMovie(movieList[0]);
                }
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch movies", err);
                setLoading(false);
            }
        };

        fetchMovies();
    }, []);

    if (loading) {
        return <div className="loading-screen">KowFlix...</div>;
    }

    return (
        <div className="home-page">
            <Navbar />
            <Hero movie={featuredMovie} />
            <MovieSlider title="Trending Now" movies={movies} />
            <MovieSlider title="Top Rated" movies={[...movies].reverse()} />
            <MovieSlider title="Action Movies" movies={movies} />
        </div>
    );
};

export default Home;
