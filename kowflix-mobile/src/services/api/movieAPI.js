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

    // Add to history
    addToHistory: (movieId) => api.post(`/users/history/${movieId}`),
};
