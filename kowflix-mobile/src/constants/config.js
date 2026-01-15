// API Base URL Configuration
// Use process.env.NODE_ENV instead of __DEV__ for better compatibility
const isDevelopment = process.env.NODE_ENV !== 'production';
//export const API_BASE_URL = 'http://192.168.100.32:5000/api';  // Localhost (User IP)
export const API_BASE_URL = 'https://kowflix.onrender.com/api';  // Production

// export const MEDIA_BASE_URL = 'http://192.168.100.32:5000';
// export const MEDIA_BASE_URL = 'https://kowflix.onrender.com';
export const MEDIA_BASE_URL = '172.19.31.69:5000';

// App Configuration
export const APP_NAME = 'KowFlix';
export const APP_SLOGAN = 'Thế giới điện ảnh trong tầm tay';

// Splash Screen Duration
export const SPLASH_DURATION = 3000; // milliseconds

// Video Player Configuration
export const VIDEO_PROGRESS_SAVE_INTERVAL = 10000; // Save progress every 10 seconds

// Pagination
export const MOVIES_PER_PAGE = 20;

// Image Placeholder
export const IMAGE_PLACEHOLDER = 'https://via.placeholder.com/300x450?text=Loading...';
