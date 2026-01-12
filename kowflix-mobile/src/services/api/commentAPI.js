import api from './index';

export const commentAPI = {
    getMovieComments: (movieId) => api.get(`/comments/movie/${movieId}`),
    create: (data) => api.post('/comments', data),
    delete: (id) => api.delete(`/comments/${id}`),
    like: (id) => api.post(`/comments/${id}/like`),
    dislike: (id) => api.post(`/comments/${id}/dislike`),
    update: (id, content) => api.put(`/comments/${id}`, { content })
};
