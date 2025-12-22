import api from './index';

export const commentAPI = {
    // Get comments for a movie
    getMovieComments: (movieId) => api.get(`/comments/movie/${movieId}`),

    // Create a comment
    create: (data) => api.post('/comments', data),

    // Update a comment
    update: (id, data) => api.put(`/comments/${id}`, data),

    // Delete a comment
    delete: (id) => api.delete(`/comments/${id}`),

    // Like a comment
    like: (id) => api.post(`/comments/${id}/like`),

    // Reply to a comment
    reply: (id, data) => api.post(`/comments/${id}/reply`, data),
};
