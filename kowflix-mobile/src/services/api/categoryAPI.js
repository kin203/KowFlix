import api from './index';

export const categoryAPI = {
    // Get all categories
    getAll: () => api.get('/categories'),

    // Get active categories only
    getActive: () => api.get('/categories/active'),

    // Get movies by category slug
    getMoviesBySlug: (slug) => api.get(`/categories/${slug}/movies`),
};
