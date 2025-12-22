// src/utils/helpers/asyncHandler.js

/**
 * Wrapper function to catch async errors in Express route handlers
 * Eliminates the need for try-catch blocks in controllers
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 * 
 * @example
 * export const getMovies = asyncHandler(async (req, res) => {
 *   const movies = await Movie.find();
 *   res.json(movies);
 * });
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default asyncHandler;
