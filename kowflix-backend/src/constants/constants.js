// src/constants/constants.js

/**
 * User Roles
 */
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin'
};

/**
 * Job Status
 */
export const JOB_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

/**
 * Job Types
 */
export const JOB_TYPES = {
    ENCODE: 'encode',
    UPLOAD: 'upload',
    MIGRATION: 'migration'
};

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    SYSTEM: 'system'
};

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
    // Authentication
    INVALID_CREDENTIALS: 'Invalid email or password',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    TOKEN_REQUIRED: 'Authentication token required',
    INVALID_TOKEN: 'Invalid or expired token',

    // User
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists',
    EMAIL_REQUIRED: 'Email is required',
    PASSWORD_REQUIRED: 'Password is required',

    // Movie
    MOVIE_NOT_FOUND: 'Movie not found',
    MOVIE_TITLE_REQUIRED: 'Movie title is required',
    INVALID_MOVIE_DATA: 'Invalid movie data',

    // Category
    CATEGORY_NOT_FOUND: 'Category not found',
    CATEGORY_NAME_REQUIRED: 'Category name is required',
    CATEGORY_SLUG_EXISTS: 'Category slug already exists',

    // File Upload
    FILE_UPLOAD_ERROR: 'Error uploading file',
    INVALID_FILE_TYPE: 'Invalid file type',
    FILE_TOO_LARGE: 'File size exceeds limit',

    // General
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Bad request'
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
    // Authentication
    LOGIN_SUCCESS: 'Login successful',
    REGISTER_SUCCESS: 'Registration successful',
    LOGOUT_SUCCESS: 'Logout successful',

    // Movie
    MOVIE_CREATED: 'Movie created successfully',
    MOVIE_UPDATED: 'Movie updated successfully',
    MOVIE_DELETED: 'Movie deleted successfully',

    // Category
    CATEGORY_CREATED: 'Category created successfully',
    CATEGORY_UPDATED: 'Category updated successfully',
    CATEGORY_DELETED: 'Category deleted successfully',

    // User
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',

    // General
    OPERATION_SUCCESS: 'Operation completed successfully'
};

/**
 * Validation Rules
 */
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MAX_LENGTH: 2000,
    MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 5GB for videos
    MAX_POSTER_SIZE: 10 * 1024 * 1024, // 10MB for posters
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * Pagination Defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

/**
 * Cache Duration (in seconds)
 */
export const CACHE_DURATION = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 3600,       // 1 hour
    VERY_LONG: 86400  // 24 hours
};
