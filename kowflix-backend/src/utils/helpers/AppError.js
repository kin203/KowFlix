// src/utils/helpers/AppError.js

/**
 * Custom error class for application errors
 * Extends the built-in Error class with additional properties
 */
class AppError extends Error {
    /**
     * Create an application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {boolean} isOperational - Whether this is an operational error
     */
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
