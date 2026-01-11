import api from './index';

export const movieAPI = {
    // Get all movies
    getAll: (params) => api.get('/movies', { params }),

    // Get movie by ID
    getById: (id) => api.get(`/movies/${id}`),

    // Play movie (get streaming URL)
    play: (id) => api.get(`/movies/${id}/play`),

    // Search movies
    search: (query) => api.get('/movies/search', { params: { q: query } }),

    // Get Recommendations (Simulated for now using category/genre)
    getRecommendations: (movieId) => api.get('/movies', { params: { limit: 10, sort: 'newest' } }),

    // Get Trending Movies
    getTrendingMovies: (limit = 10) => api.get('/movies/trending', { params: { limit } }),

    // Get Top Rated Movies
    getTopRatedMovies: (limit = 10) => api.get('/movies/top-rated', { params: { limit } }),

    // Add to history
    addToHistory: (movieId) => api.post(`/users/history/${movieId}`),
};
