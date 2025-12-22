// src/services/api.js
/**
 * Main API module - Re-exports all API modules for backward compatibility
 * 
 * This file maintains backward compatibility with existing imports while
 * the actual API logic is now organized in separate modules under ./api/
 * 
 * Usage:
 *   import { authAPI, movieAPI } from '../services/api';
 *   // or
 *   import api from '../services/api';
 */

// Import base axios instance
import api from './api/index.js';

// Import all API modules
export { authAPI } from './api/authAPI.js';
export { movieAPI } from './api/movieAPI.js';
export { categoryAPI } from './api/categoryAPI.js';
export { progressAPI } from './api/progressAPI.js';
export { analyticsAPI } from './api/analyticsAPI.js';
export { userAPI } from './api/userAPI.js';
export { heroAPI } from './api/heroAPI.js';
export { notificationAPI } from './api/notificationAPI.js';
export { reviewAPI } from './api/reviewAPI.js';
export { commentAPI } from './api/commentAPI.js';
export { jobAPI } from './api/jobAPI.js';
export { navMenuAPI } from './api/navMenuAPI.js';

// Export base axios instance as default
export default api;

