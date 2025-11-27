import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import './JobManagement.css';

const JobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, uploading, encoding, completed, failed

    // Fetch jobs from backend
    const fetchJobs = async () => {
        try {
            const response = await jobAPI.getAll();
            setJobs(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Auto-refresh every 3 seconds
        const interval = setInterval(() => {
            fetchJobs();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const filteredJobs = jobs.filter(job => {
        if (filter === 'all') return true;
        return job.status === filter;
    });

    const getStatusBadge = (status) => {
        const badges = {
            uploading: { class: 'status-uploading', text: 'Uploading' },
            encoding: { class: 'status-encoding', text: 'Encoding' },
            completed: { class: 'status-completed', text: 'Completed' },
            failed: { class: 'status-failed', text: 'Failed' }
        };
        return badges[status] || badges.uploading;
    };

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';

        const now = new Date();
        const diff = Math.floor((now - date) / 1000 / 60); // minutes
        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        const hours = Math.floor(diff / 60);
        return `${hours}h ${diff % 60}m ago`;
    };

    return (
        <div className="admin-dashboard-container">
            <DashboardSidebar />
            <div className="admin-dashboard-content">
                <div className="admin-header">
                    <div>
                        <h1>Job Management</h1>
                        <p>Track upload and encoding jobs</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="job-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Jobs ({jobs.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'uploading' ? 'active' : ''}`}
                        onClick={() => setFilter('uploading')}
                    >
                        Uploading ({jobs.filter(j => j.status === 'uploading').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'encoding' ? 'active' : ''}`}
                        onClick={() => setFilter('encoding')}
                    >
                        Encoding ({jobs.filter(j => j.status === 'encoding').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        Completed ({jobs.filter(j => j.status === 'completed').length})
                    </button>
                </div>

                {/* Jobs List */}
                <div className="jobs-section">
                    {filteredJobs.length === 0 ? (
                        <div className="no-jobs">
                            <p>No jobs found</p>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {filteredJobs.map(job => {
                                const badge = getStatusBadge(job.status);
                                return (
                                    <div key={job._id} className="job-card">
                                        <div className="job-header">
                                            <div className="job-title">
                                                <span className="job-icon">
                                                    {job.type === 'upload' ? '📤' : '⚙️'}
                                                </span>
                                                <span>{job.movieTitle}</span>
                                            </div>
                                            <span className={`status-badge ${badge.class}`}>
                                                {badge.text}
                                            </span>
                                        </div>

                                        <div className="job-info">
                                            <div className="info-row">
                                                <span className="info-label">Type:</span>
                                                <span className="info-value">{job.type === 'upload' ? 'Upload' : 'Encoding'}</span>
                                            </div>
                                            {job.fileSize && (
                                                <div className="info-row">
                                                    <span className="info-label">Size:</span>
                                                    <span className="info-value">{job.fileSize}</span>
                                                </div>
                                            )}
                                            <div className="info-row">
                                                <span className="info-label">Started:</span>
                                                <span className="info-value">{formatTime(job.startTime)}</span>
                                            </div>
                                        </div>

                                        {job.status !== 'completed' && job.status !== 'failed' && (
                                            <div className="job-progress">
                                                <div className="progress-header">
                                                    <span>Progress</span>
                                                    <span>{job.progress}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${job.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {job.status === 'completed' && (
                                            <div className="job-completed">
                                                ✅ Completed {formatTime(job.completedTime)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JobManagement;
