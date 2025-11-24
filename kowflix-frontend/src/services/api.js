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
    create: (formData) => {
        return axios.post(`${API_URL}/movies`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
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

export default api;
