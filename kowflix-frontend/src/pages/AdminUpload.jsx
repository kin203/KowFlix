import React, { useState, useEffect } from 'react';
import { movieAPI } from '../services/api';
import TMDbSearch from '../components/TMDbSearch';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import './AdminUpload.css';

const AdminUpload = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        releaseYear: '',
        genres: '',
        // TMDb metadata
        tmdbId: '',
        imdbId: '',
        runtime: '',
        cast: '',
        director: '',
        imdbRating: '',
        posterUrl: '', // TMDb poster URL
        backdropUrl: '', // TMDb backdrop URL
        useTrailer: true, // Toggle trailer
    });
    const [posterFile, setPosterFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [subtitleEN, setSubtitleEN] = useState(null); // English subtitle
    const [subtitleVI, setSubtitleVI] = useState(null); // Vietnamese subtitle
    const [movies, setMovies] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [encoding, setEncoding] = useState({});
    const [editingMovie, setEditingMovie] = useState(null); // Track which movie is being edited
    const [migrating, setMigrating] = useState(false);

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

    const handleTMDbSelect = (movieData) => {
        // Auto-fill form with TMDb data including poster and backdrop URLs
        setFormData({
            ...formData,
            title: movieData.title || '',
            description: movieData.overview || '',
            releaseYear: movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear().toString() : '',
            genres: movieData.genres?.join(', ') || '',
            tmdbId: movieData.tmdbId || '',
            imdbId: movieData.imdbId || '',
            runtime: movieData.runtime || '',
            cast: movieData.cast?.join(', ') || '',
            director: movieData.director || '',
            imdbRating: movieData.voteAverage || '',
            posterUrl: movieData.posterPath || '',
            backdropUrl: movieData.backdropPath || '',
            useTrailer: true,
        });

        setMessage({
            type: 'success',
            text: `Auto-filled from TMDb: ${movieData.title}. Poster and backdrop loaded automatically. Now upload the video file.`
        });
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

            // TMDb metadata
            if (formData.tmdbId) data.append('tmdbId', formData.tmdbId);
            if (formData.imdbId) data.append('imdbId', formData.imdbId);
            if (formData.runtime) data.append('runtime', formData.runtime);
            if (formData.cast) data.append('cast', formData.cast);
            if (formData.director) data.append('director', formData.director);
            if (formData.imdbRating) data.append('imdbRating', formData.imdbRating);
            if (formData.posterUrl) data.append('posterUrl', formData.posterUrl);
            if (formData.backdropUrl) data.append('backdropUrl', formData.backdropUrl);
            data.append('useTrailer', formData.useTrailer);

            if (posterFile) data.append('poster', posterFile);
            if (videoFile) data.append('video', videoFile);

            // Add subtitle files
            if (subtitleEN) data.append('subtitle_en', subtitleEN);
            if (subtitleVI) data.append('subtitle_vi', subtitleVI);

            // Upload with progress tracking
            await movieAPI.create(data, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            setMessage({ type: 'success', text: 'Movie uploaded successfully!' });

            // Reset form
            setFormData({
                title: '',
                description: '',
                releaseYear: '',
                genres: '',
                tmdbId: '',
                imdbId: '',
                runtime: '',
                cast: '',
                director: '',
                imdbRating: '',
                posterUrl: '',
                backdropUrl: '',
                useTrailer: true,
            });
            setPosterFile(null);
            setVideoFile(null);
            setSubtitleEN(null);
            setSubtitleVI(null);

            // Refresh movie list
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Upload failed'
            });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleEdit = (movie) => {
        // Load movie data into form for editing
        setEditingMovie(movie);
        setFormData({
            title: movie.title || '',
            description: movie.description || '',
            releaseYear: movie.releaseYear?.toString() || '',
            genres: movie.genres?.join(', ') || '',
            tmdbId: movie.tmdbId?.toString() || '',
            imdbId: movie.imdbId || '',
            runtime: movie.runtime?.toString() || '',
            cast: movie.cast?.join(', ') || '',
            director: movie.director || '',
            imdbRating: movie.imdbRating?.toString() || '',
            posterUrl: movie.poster || '',
            backdropUrl: movie.backdrop || '',
            useTrailer: movie.useTrailer !== undefined ? movie.useTrailer : true,
        });
        setMessage({ type: 'info', text: `Editing: ${movie.title}` });
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingMovie) return;

        setMessage({ type: '', text: '' });
        setUploading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('releaseYear', formData.releaseYear);
            data.append('genres', formData.genres);

            // TMDb metadata
            if (formData.tmdbId) data.append('tmdbId', formData.tmdbId);
            if (formData.imdbId) data.append('imdbId', formData.imdbId);
            if (formData.runtime) data.append('runtime', formData.runtime);
            if (formData.cast) data.append('cast', formData.cast);
            if (formData.director) data.append('director', formData.director);
            if (formData.imdbRating) data.append('imdbRating', formData.imdbRating);
            if (formData.posterUrl) data.append('posterUrl', formData.posterUrl);
            if (formData.backdropUrl) data.append('backdropUrl', formData.backdropUrl);
            data.append('useTrailer', formData.useTrailer);

            if (posterFile) data.append('poster', posterFile);
            if (videoFile) data.append('video', videoFile);

            await movieAPI.update(editingMovie._id, data);
            setMessage({ type: 'success', text: 'Movie updated successfully!' });

            // Reset form
            handleCancelEdit();

            // Refresh movie list
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Update failed'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingMovie(null);
        setFormData({
            title: '',
            description: '',
            releaseYear: '',
            genres: '',
            tmdbId: '',
            imdbId: '',
            runtime: '',
            cast: '',
            director: '',
            imdbRating: '',
            posterUrl: '',
            backdropUrl: '',
        });
        setPosterFile(null);
        setVideoFile(null);
        setMessage({ type: '', text: '' });
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

    const handleUpdateTrailer = async (movieId) => {
        try {
            setMessage({ type: 'info', text: 'Fetching trailer...' });
            await movieAPI.update(movieId, {});
            setMessage({ type: 'success', text: 'Trailer updated successfully!' });
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Failed to update trailer'
            });
        }
    };

    const handleMigration = async () => {
        if (!window.confirm('Migrate all HLS paths from slug-based to movieId-based structure?')) return;

        setMigrating(true);
        setMessage({ type: 'info', text: 'Migration in progress...' });

        try {
            const response = await movieAPI.migrateHlsPaths();
            const { results } = response.data;

            setMessage({
                type: 'success',
                text: `Migration completed! Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`
            });

            // Refresh movie list
            fetchMovies();
        } catch (err) {
            setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Migration failed'
            });
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="admin-dashboard-container">
            <DashboardSidebar />
            <div className="admin-dashboard-content">
                <div className="admin-header">
                    <div>
                        <h1>Movie Management</h1>
                        <p>Upload and manage movies</p>
                    </div>
                    <button
                        className="btn-migrate"
                        onClick={handleMigration}
                        disabled={migrating}
                    >
                        {migrating ? 'Migrating...' : '🔄 Migrate HLS Paths'}
                    </button>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <div className="upload-section">
                    <h2>{editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Upload New Movie'}</h2>
                    <form className="upload-form" onSubmit={editingMovie ? handleUpdate : handleSubmit}>
                        {/* TMDb Search */}
                        <TMDbSearch onSelectMovie={handleTMDbSelect} />

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

                        <div className="form-field checkbox-field" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="useTrailer"
                                    checked={formData.useTrailer}
                                    onChange={(e) => setFormData({ ...formData, useTrailer: e.target.checked })}
                                />
                                <span style={{ color: '#FFD700', fontWeight: 'bold' }}>Enable Trailer</span> (Auto-play on Hero Banner)
                            </label>
                        </div>

                        <div className="form-field">
                            <label>Poster Image {formData.posterUrl && <span className="auto-filled">✓ Auto-filled from TMDb</span>}</label>
                            {formData.posterUrl ? (
                                <div className="poster-preview">
                                    <img src={formData.posterUrl} alt="Poster preview" />
                                    <button
                                        type="button"
                                        className="btn-remove-poster"
                                        onClick={() => setFormData({ ...formData, posterUrl: '' })}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
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
                            )}
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

                        {/* Subtitle Files */}
                        <div className="form-row">
                            <div className="form-field">
                                <label>English Subtitle (.vtt or .srt)</label>
                                <div className="file-input-wrapper">
                                    <label className="file-input-label">
                                        Choose File
                                        <input
                                            type="file"
                                            accept=".vtt,.srt"
                                            onChange={(e) => setSubtitleEN(e.target.files[0])}
                                        />
                                    </label>
                                    {subtitleEN && <div className="file-name">{subtitleEN.name}</div>}
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Vietnamese Subtitle (.vtt or .srt)</label>
                                <div className="file-input-wrapper">
                                    <label className="file-input-label">
                                        Choose File
                                        <input
                                            type="file"
                                            accept=".vtt,.srt"
                                            onChange={(e) => setSubtitleVI(e.target.files[0])}
                                        />
                                    </label>
                                    {subtitleVI && <div className="file-name">{subtitleVI.name}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Upload Progress Bar */}
                        {uploading && uploadProgress > 0 && (
                            <div className="upload-progress-container">
                                <div className="progress-info">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-message">
                                    {uploadProgress < 100
                                        ? 'Uploading files to server...'
                                        : 'Processing... This may take a few minutes for large files.'}
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="submit-btn" disabled={uploading}>
                                {uploading ? (editingMovie ? 'Updating...' : 'Uploading...') : (editingMovie ? 'Update Movie' : 'Upload Movie')}
                            </button>
                            {editingMovie && (
                                <button type="button" className="cancel-btn" onClick={handleCancelEdit}>
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div >

                <div className="movies-section">
                    <h2>Uploaded Movies ({movies.length})</h2>
                    <table className="movies-table">
                        <thead>
                            <tr>
                                <th>Poster</th>
                                <th>Title</th>
                                <th>Year</th>
                                <th>Genres</th>
                                <th>Trailer</th>
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
                                    <td>
                                        {movie.trailerKey ? (
                                            <span className="trailer-status has-trailer">
                                                {movie.useTrailer ? '✓ Enabled' : '✗ Disabled'}
                                            </span>
                                        ) : (
                                            <span className="trailer-status no-trailer">No Trailer</span>
                                        )}
                                    </td>
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
                                        {movie.tmdbId && !movie.trailerKey && (
                                            <button
                                                className="btn-trailer"
                                                onClick={() => handleUpdateTrailer(movie._id)}
                                                style={{ marginRight: '0.5rem' }}
                                                title="Fetch trailer from TMDb"
                                            >
                                                🎬 Get Trailer
                                            </button>
                                        )}
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleEdit(movie)}
                                            style={{ marginRight: '0.5rem' }}
                                        >
                                            Edit
                                        </button>
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
            </div >
        </div >
    );
};

export default AdminUpload;
