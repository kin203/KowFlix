// src/utils/tmdb.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

/**
 * Search movies by title
 * @param {string} query - Movie title to search
 * @returns {Promise<Array>} - Array of movie results
 */
export async function searchMovies(query) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: query,
                language: 'vi-VN',
                page: 1
            }
        });

        return response.data.results.map(movie => ({
            tmdbId: movie.id,
            title: movie.title,
            originalTitle: movie.original_title,
            overview: movie.overview,
            releaseDate: movie.release_date,
            posterPath: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
            backdropPath: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${movie.backdrop_path}` : null,
            voteAverage: movie.vote_average,
            popularity: movie.popularity
        }));
    } catch (error) {
        console.error('TMDb search error:', error.message);
        throw new Error('Failed to search movies from TMDb');
    }
}

/**
 * Get detailed movie information
 * @param {number} tmdbId - TMDb movie ID
 * @returns {Promise<Object>} - Detailed movie data
 */
export async function getMovieDetails(tmdbId) {
    try {
        const [detailsRes, creditsRes] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: { api_key: TMDB_API_KEY, language: 'vi-VN' }
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
                params: { api_key: TMDB_API_KEY }
            })
        ]);

        const details = detailsRes.data;
        const credits = creditsRes.data;

        // Get top 5 cast members
        const cast = credits.cast
            .slice(0, 5)
            .map(actor => actor.name);

        // Get director
        const director = credits.crew
            .find(person => person.job === 'Director')?.name || 'Unknown';

        // Get genres
        const genres = details.genres.map(g => g.name);

        return {
            tmdbId: details.id,
            imdbId: details.imdb_id,
            title: details.title,
            originalTitle: details.original_title,
            overview: details.overview,
            releaseDate: details.release_date,
            runtime: details.runtime,
            genres: genres,
            cast: cast,
            director: director,
            voteAverage: details.vote_average,
            voteCount: details.vote_count,
            popularity: details.popularity,
            posterPath: details.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${details.poster_path}` : null,
            backdropPath: details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/original${details.backdrop_path}` : null,
            tagline: details.tagline,
            status: details.status
        };
    } catch (error) {
        console.error('TMDb getDetails error:', error.message);
        throw new Error('Failed to get movie details from TMDb');
    }
}

/**
 * Download image from TMDb
 * @param {string} imageUrl - Full image URL
 * @returns {Promise<Buffer>} - Image buffer
 */
export async function downloadImage(imageUrl) {
    try {
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Image download error:', error.message);
        throw new Error('Failed to download image');
    }
}

/**
 * Get movie trailer from TMDb
 * @param {number} tmdbId - TMDb movie ID
 * @returns {Promise<string|null>} - YouTube video key or null
 */
export async function getMovieTrailer(tmdbId) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'vi-VN'
            }
        });

        const videos = response.data.results;

        // Find official trailer from YouTube
        const trailer = videos.find(video =>
            video.site === 'YouTube' &&
            video.type === 'Trailer' &&
            video.official === true
        );

        // If no official trailer, try to find any trailer
        const anyTrailer = videos.find(video =>
            video.site === 'YouTube' &&
            video.type === 'Trailer'
        );

        return trailer?.key || anyTrailer?.key || null;
    } catch (error) {
        console.error('TMDb trailer fetch error:', error.message);
        return null; // Return null instead of throwing to allow graceful fallback
    }
}

