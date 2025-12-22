import api from './index';

export const reviewAPI = {
    // Get reviews for a movie
    getMovieReviews: (movieId) => api.get(`/reviews/movie/${movieId}`),

    // Create a review
    create: (data) => api.post('/reviews', data),

    // Update a review
    update: (id, data) => api.put(`/reviews/${id}`, data),

    // Delete a review
    delete: (id) => api.delete(`/reviews/${id}`),
};
