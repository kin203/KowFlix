// src/services/api/jobAPI.js
import api from './index.js';

/**
 * Job Management API endpoints (Admin only)
 */
export const jobAPI = {
    /**
     * Get all jobs
     * @param {Object} params - Query parameters (status, type, etc.)
     * @returns {Promise} List of jobs
     */
    getAll: (params) => api.get('/jobs', { params }),

    /**
     * Get single job by ID
     * @param {string} id - Job ID
     * @returns {Promise} Job details
     */
    getOne: (id) => api.get(`/jobs/${id}`),

    /**
     * Create new job
     * @param {Object} data - Job data
     * @returns {Promise} Created job
     */
    create: (data) => api.post('/jobs', data),

    /**
     * Update job progress
     * @param {string} id - Job ID
     * @param {Object} data - Progress data
     * @returns {Promise} Updated job
     */
    updateProgress: (id, data) => api.put(`/jobs/${id}/progress`, data),

    /**
     * Delete job
     * @param {string} id - Job ID
     * @returns {Promise} Deletion confirmation
     */
    delete: (id) => api.delete(`/jobs/${id}`),

    /**
     * Cleanup completed jobs
     * @returns {Promise} Cleanup results
     */
    cleanup: () => api.post('/jobs/cleanup'),

    /**
     * Cancel a single job
     * @param {string} id - Job ID
     * @returns {Promise} Cancel confirmation
     */
    cancel: (id) => api.post(`/jobs/${id}/cancel`),

    /**
     * Cancel all encoding and pending jobs
     * @returns {Promise} Bulk cancel results
     */
    cancelAll: () => api.post('/jobs/cancel-all'),
};
