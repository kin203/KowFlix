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
};
