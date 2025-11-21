import React, { useState, useEffect } from 'react';
import { movieAPI } from '../services/api';
import './AdminUpload.css';

const AdminUpload = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        releaseYear: '',
        genres: '',
    });
    const [posterFile, setPosterFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [movies, setMovies] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);
    const [encoding, setEncoding] = useState({});

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            const { data } = await movieAPI.getAll();
            setMovies(data.data || []);
        } catch (err) {
            console.error('Failed to fetch movies', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (type === 'poster') {
            setPosterFile(file);
        } else {
            setVideoFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setUploading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('releaseYear', formData.releaseYear);
            data.append('genres', formData.genres);
            if (posterFile) data.append('poster', posterFile);
            if (videoFile) data.append('video', videoFile);

            await movieAPI.create(data);
            setMessage({ type: 'success', text: 'Movie uploaded successfully!' });

            // Reset form
            setFormData({ title: '', description: '', releaseYear: '', genres: '' });
            setPosterFile(null);
            setVideoFile(null);

            // Refresh movie list
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Upload failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this movie?')) return;

        try {
            await movieAPI.delete(id);
            setMessage({ type: 'success', text: 'Movie deleted successfully!' });
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Delete failed'
            });
        }
    };

    const handleEncode = async (id) => {
        setEncoding({ ...encoding, [id]: true });
        try {
            await movieAPI.startEncode(id);
            setMessage({ type: 'success', text: 'Encoding started! This may take a while...' });
            // Refresh after a delay to show updated status
            setTimeout(fetchMovies, 2000);
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Encode failed'
            });
        } finally {
            setEncoding({ ...encoding, [id]: false });
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>Admin Panel</h1>
                <p>Upload and manage movies</p>
            </div>

            {message.text && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="upload-section">
                <h2>Upload New Movie</h2>
                <form className="upload-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label>Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Release Year</label>
                        <input
                            type="number"
                            name="releaseYear"
                            value={formData.releaseYear}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-field full-width">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="form-field">
                        <label>Genres (comma separated)</label>
                        <input
                            type="text"
                            name="genres"
                            value={formData.genres}
                            onChange={handleInputChange}
                            placeholder="Action, Drama, Sci-Fi"
                        />
                    </div>

                    <div className="form-field">
                        <label>Poster Image</label>
                        <div className="file-input-wrapper">
                            <label className="file-input-label">
                                Choose File
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'poster')}
                                />
                            </label>
                            {posterFile && <div className="file-name">{posterFile.name}</div>}
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Video File</label>
                        <div className="file-input-wrapper">
                            <label className="file-input-label">
                                Choose File
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleFileChange(e, 'video')}
                                />
                            </label>
                            {videoFile && <div className="file-name">{videoFile.name}</div>}
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Upload Movie'}
                    </button>
                </form>
            </div>

            <div className="movies-section">
                <h2>Uploaded Movies ({movies.length})</h2>
                <table className="movies-table">
                    <thead>
                        <tr>
                            <th>Poster</th>
                            <th>Title</th>
                            <th>Year</th>
                            <th>Genres</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movies.map((movie) => (
                            <tr key={movie._id}>
                                <td>
                                    {movie.poster && (
                                        <img
                                            src={movie.poster}
                                            alt={movie.title}
                                            className="movie-poster-thumb"
                                        />
                                    )}
                                </td>
                                <td>{movie.title}</td>
                                <td>{movie.releaseYear || 'N/A'}</td>
                                <td>{movie.genres?.join(', ') || 'N/A'}</td>
                                <td>{movie.status || 'pending'}</td>
                                <td>
                                    {movie.status !== 'ready' && (
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleEncode(movie._id)}
                                            disabled={encoding[movie._id]}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            {encoding[movie._id] ? 'Encoding...' : 'Encode'}
                                        </button>
                                    )}
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(movie._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUpload;
