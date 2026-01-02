import api from './index';

export const wishlistAPI = {
    // Get user's wishlist
    getWishlist: () => api.get('/wishlist'),

    // Check if movie is in wishlist
    checkStatus: (movieId) => api.get(`/wishlist/check/${movieId}`),

    // Add movie to wishlist
    add: (movieId) => api.post(`/wishlist/${movieId}`),

    // Remove movie from wishlist
    remove: (movieId) => api.delete(`/wishlist/${movieId}`),
};
