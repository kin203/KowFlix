// src/middleware/errorHandler.js
import config from '../config/config.js';
import { HTTP_STATUS } from '../constants/constants.js';

/**
 * Centralized error handling middleware
 * Handles all errors thrown in the application
 * 
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Default error values
    let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    let message = err.message || 'Internal Server Error';
    let status = err.status || 'error';

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = Object.values(err.errors).map(e => e.message).join(', ');
        status = 'fail';
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        statusCode = HTTP_STATUS.CONFLICT;
        const field = Object.keys(err.keyPattern)[0];
        message = `Duplicate value for field: ${field}`;
        status = 'fail';
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = `Invalid ${err.path}: ${err.value}`;
        status = 'fail';
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Invalid token';
        status = 'fail';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        message = 'Token expired';
        status = 'fail';
    }

    // Log error in development
    if (config.server.isDevelopment) {
        console.error('Error:', {
            message: err.message,
            stack: err.stack,
            statusCode,
            path: req.path,
            method: req.method
        });
    }

    // Send error response
    res.status(statusCode).json({
        status,
        message,
        ...(config.server.isDevelopment && {
            stack: err.stack,
            error: err
        })
    });
};

/**
 * Handle 404 - Not Found errors
 * This middleware should be placed after all routes
 */
export const notFoundHandler = (req, res, next) => {
    res.status(HTTP_STATUS.NOT_FOUND).json({
        status: 'fail',
        message: `Cannot ${req.method} ${req.path}`
    });
};

export default errorHandler;
