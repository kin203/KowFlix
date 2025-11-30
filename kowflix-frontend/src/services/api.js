import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    register: (email, password) => api.post('/auth/register', { email, password }),
    getProfile: () => api.get('/profile'),
    updateProfile: (data) => api.put('/profile', data),
    uploadAvatar: (formData) => {
        return axios.post(`${API_URL}/profile/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
    },
    deleteAvatar: () => api.delete('/profile/avatar'),
};

export const movieAPI = {
    getAll: (params) => api.get('/movies', { params }),
    getOne: (id) => api.get(`/movies/${id}`),
    play: (id) => api.get(`/movies/${id}/play`),
    create: (formData, config = {}) => {
        return axios.post(`${API_URL}/movies`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            ...config
        });
    },
    update: (id, formData) => {
        return axios.put(`${API_URL}/movies/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        });
    },
    delete: (id) => api.delete(`/movies/${id}`),
    startEncode: (id) => api.post(`/encode/${id}/start`),
    migrateHlsPaths: () => api.post('/movies/migrate-hls-paths'),
    // TMDb integration
    searchTMDb: (query) => api.get('/movies/search-tmdb', { params: { query } }),
    getTMDbDetails: (tmdbId) => api.get(`/movies/tmdb/${tmdbId}`),
};

export const progressAPI = {
    save: (movieId, data) => api.post(`/progress/${movieId}`, data),
    get: (movieId) => api.get(`/progress/${movieId}`),
    getAll: () => api.get('/progress'),
    delete: (movieId) => api.delete(`/progress/${movieId}`),
};

export const analyticsAPI = {
    getStats: () => api.get('/analytics/stats'),
    getWeeklyViews: () => api.get('/analytics/weekly-views'),
    getTopMovies: (limit = 5) => api.get('/analytics/top-movies', { params: { limit } }),
    getTopRated: (limit = 5) => api.get('/analytics/top-rated', { params: { limit } }),
    getActiveUsers: (limit = 10) => api.get('/analytics/active-users', { params: { limit } }),
    getUserGrowth: () => api.get('/analytics/user-growth'),
};

export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getActive: () => api.get('/categories/active'),
    getOne: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
    reorder: (categories) => api.post('/categories/reorder', { categories }),
};

export const userAPI = {
    getAll: (params) => api.get('/users', { params }),
    getOne: (id) => api.get(`/users/${id}`),
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    delete: (id) => api.delete(`/users/${id}`),
};

export const heroAPI = {
    getAll: (activeOnly = false) => api.get('/hero', { params: { active: activeOnly } }),
    create: (data) => api.post('/hero', data),
    update: (id, data) => api.put(`/hero/${id}`, data),
    delete: (id) => api.delete(`/hero/${id}`),
    reorder: (banners) => api.post('/hero/reorder', { banners }),
};

export const reviewAPI = {
    getAll: (params) => api.get('/reviews', { params }),
    getMovieReviews: (movieId) => api.get(`/reviews/movie/${movieId}`),
    create: (data) => api.post('/reviews', data),
    delete: (id) => api.delete(`/reviews/${id}`),
};

export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    getAllAdmin: () => api.get('/notifications/admin/all'),
    markAsRead: (id) => api.put(`/notifications/${id}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    delete: (id) => api.delete(`/notifications/${id}`),
    deleteAdmin: (id) => api.delete(`/notifications/admin/${id}`),
    create: (data) => api.post('/notifications', data),
};

export const jobAPI = {
    getAll: (params) => api.get('/jobs', { params }),
    getOne: (id) => api.get(`/jobs/${id}`),
    create: (data) => api.post('/jobs', data),
    updateProgress: (id, data) => api.put(`/jobs/${id}/progress`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
    cleanup: () => api.post('/jobs/cleanup'),
};

export const navMenuAPI = {
    getAll: () => api.get('/nav-menu'),
    getAllAdmin: () => api.get('/nav-menu/admin/all'),
    create: (data) => api.post('/nav-menu', data),
    update: (id, data) => api.put(`/nav-menu/${id}`, data),
    delete: (id) => api.delete(`/nav-menu/${id}`),
    reorder: (items) => api.post('/nav-menu/reorder', { items })
};


export default api;
