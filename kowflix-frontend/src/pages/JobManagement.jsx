import React, { useState, useEffect } from 'react';
import { jobAPI } from '../services/api';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import './JobManagement.css';

const JobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch jobs from backend
    const fetchJobs = async () => {
        try {
            const response = await jobAPI.getAll();
            const allJobs = response.data.data || [];

            // Group jobs by movieId to combine upload + encode
            const movieJobs = {};
            allJobs.forEach(job => {
                const movieId = job.movieId;
                if (!movieJobs[movieId]) {
                    movieJobs[movieId] = {
                        movieId: movieId,
                        movieTitle: job.movieTitle,
                        uploadJob: null,
                        encodeJob: null,
                        createdAt: job.createdAt
                    };
                }

                if (job.type === 'upload') {
                    movieJobs[movieId].uploadJob = job;
                } else if (job.type === 'encode') {
                    movieJobs[movieId].encodeJob = job;
                }
            });

            // Convert to array and sort by creation time
            const combinedJobs = Object.values(movieJobs).sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );

            setJobs(combinedJobs);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Auto-refresh every 2 seconds
        const interval = setInterval(() => {
            fetchJobs();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleCancelAll = async () => {
        if (!window.confirm('Bạn có chắc muốn hủy TẤT CẢ công việc đang chờ và đang encode?')) {
            return;
        }

        try {
            const response = await jobAPI.cancelAll();
            alert(response.data.message);
            fetchJobs();
        } catch (error) {
            console.error('Failed to cancel all jobs:', error);
            alert('Không thể hủy công việc');
        }
    };

    const handleCancelJob = async (jobId, jobTitle) => {
        if (!window.confirm(`Hủy công việc: ${jobTitle}?`)) {
            return;
        }

        try {
            const response = await jobAPI.cancel(jobId);
            alert(response.data.message);
            fetchJobs();
        } catch (error) {
            console.error('Failed to cancel job:', error);
            alert('Không thể hủy công việc');
        }
    };

    const getJobStatus = (job) => {
        const upload = job.uploadJob;
        const encode = job.encodeJob;

        // Upload phase
        if (upload && upload.status === 'uploading') {
            return {
                text: `Đang upload ${upload.progress || 0}%`,
                class: 'status-uploading',
                progress: upload.progress || 0,
                canCancel: false
            };
        }

        // Encode phase
        if (encode) {
            if (encode.status === 'pending') {
                // Calculate queue position
                const pendingJobs = jobs.filter(j =>
                    j.encodeJob && j.encodeJob.status === 'pending' &&
                    new Date(j.encodeJob.createdAt) <= new Date(encode.createdAt)
                );
                const position = pendingJobs.length;

                return {
                    text: `Chờ encode (vị trí #${position})`,
                    class: 'status-pending',
                    progress: 0,
                    canCancel: true,
                    jobId: encode._id
                };
            }

            if (encode.status === 'encoding') {
                return {
                    text: `Đang encode ${encode.progress || 0}%`,
                    class: 'status-encoding',
                    progress: encode.progress || 0,
                    canCancel: true,
                    jobId: encode._id
                };
            }

            if (encode.status === 'completed') {
                return {
                    text: 'Hoàn thành',
                    class: 'status-completed',
                    progress: 100,
                    canCancel: false
                };
            }

            if (encode.status === 'failed') {
                return {
                    text: `Lỗi: ${encode.error || 'Unknown'}`,
                    class: 'status-failed',
                    progress: 0,
                    canCancel: false
                };
            }
        }

        // Upload completed, waiting for encode
        if (upload && upload.status === 'completed' && !encode) {
            return {
                text: 'Upload xong, chờ encode',
                class: 'status-pending',
                progress: 100,
                canCancel: false
            };
        }

        return {
            text: 'Đang xử lý',
            class: 'status-uploading',
            progress: 0,
            canCancel: false
        };
    };

    const activeJobsCount = jobs.filter(job => {
        const status = getJobStatus(job);
        return status.canCancel;
    }).length;

    return (
        <div className="admin-dashboard-container">
            <DashboardSidebar />
            <div className="admin-dashboard-content">
                <div className="admin-header">
                    <div>
                        <h1>Quản Lý Công Việc</h1>
                        <p>Theo dõi tiến độ upload và encode phim</p>
                    </div>
                    {activeJobsCount > 0 && (
                        <button
                            className="btn-cancel-all"
                            onClick={handleCancelAll}
                        >
                            Hủy Tất Cả ({activeJobsCount})
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="loading-state">Đang tải...</div>
                ) : jobs.length === 0 ? (
                    <div className="empty-state">
                        <p>Không có công việc nào</p>
                    </div>
                ) : (
                    <div className="jobs-table-container">
                        <table className="jobs-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>STT</th>
                                    <th>Tên Phim</th>
                                    <th style={{ width: '200px' }}>Trạng Thái</th>
                                    <th style={{ width: '150px' }}>Tiến Độ</th>
                                    <th style={{ width: '100px' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job, index) => {
                                    const status = getJobStatus(job);
                                    return (
                                        <tr key={job.movieId} className={status.class}>
                                            <td className="text-center">{index + 1}</td>
                                            <td className="movie-title">
                                                <strong>{job.movieTitle}</strong>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${status.class}`}>
                                                    {status.text}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="progress-container">
                                                    <div className="progress-bar-mini">
                                                        <div
                                                            className="progress-fill-mini"
                                                            style={{ width: `${status.progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">{status.progress}%</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                {status.canCancel ? (
                                                    <button
                                                        className="btn-cancel-small"
                                                        onClick={() => handleCancelJob(status.jobId, job.movieTitle)}
                                                    >
                                                        Hủy
                                                    </button>
                                                ) : (
                                                    <span className="text-muted">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobManagement;
