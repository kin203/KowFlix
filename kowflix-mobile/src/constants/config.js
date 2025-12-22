// API Base URL Configuration
// Use process.env.NODE_ENV instead of __DEV__ for better compatibility
const isDevelopment = process.env.NODE_ENV !== 'production';
export const API_BASE_URL = isDevelopment
    ? 'http://192.168.100.31:5000/api'  // Development (Use LAN IP)
    : 'https://your-production-api.com/api';  // Production

export const MEDIA_BASE_URL = isDevelopment
    ? 'http://192.168.100.31:5000'
    : 'https://your-production-api.com';

// App Configuration
export const APP_NAME = 'KowFlix';
export const APP_SLOGAN = 'Phim hay cả rồ';

// Splash Screen Duration
export const SPLASH_DURATION = 2500; // milliseconds

// Video Player Configuration
export const VIDEO_PROGRESS_SAVE_INTERVAL = 10000; // Save progress every 10 seconds

// Pagination
export const MOVIES_PER_PAGE = 20;

// Image Placeholder
export const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/300x450?text=Loading...';
