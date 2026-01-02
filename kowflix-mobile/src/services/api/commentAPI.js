import api from './index';

export const commentAPI = {
    getMovieComments: (movieId) => api.get(`/comments/movie/${movieId}`),
    create: (data) => api.post('/comments', data),
    delete: (id) => api.delete(`/comments/${id}`)
};
