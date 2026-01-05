import React, { useState, useEffect } from 'react';
import { movieAPI, jobAPI, categoryAPI, storageAPI } from '../services/api';
import TMDbSearch from '../components/TMDbSearch';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import useDocumentTitle from '../components/useDocumentTitle';
import './AdminUpload.css';
import './CategoryChips.css';

const AdminUpload = () => {
    useDocumentTitle('Upload Phim - Quản trị KowFlix');
    const [formData, setFormData] = useState({
        title: '',
        title_en: '', // English Title
        description: '',
        description_en: '', // English Description
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

    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Search and UI states
    const [searchQuery, setSearchQuery] = useState('');
    const [formCollapsed, setFormCollapsed] = useState(false);
    const [useDirectUpload, setUseDirectUpload] = useState(false); // Toggle for Direct Upload

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const moviesPerPage = 10;

    useEffect(() => {
        fetchMovies();
        fetchCategories();
    }, []);

    const fetchMovies = async () => {
        try {
            const { data } = await movieAPI.getAll({ limit: 100 }); // Fetch all movies for admin
            setMovies(data.data || []);
            setCurrentPage(1); // Reset to first page when movies refresh
        } catch (err) {
            console.error('Failed to fetch movies', err);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await categoryAPI.getAll();
            if (data.success) {
                setCategories(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const handleCategoryToggle = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
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
            title_en: movieData.title_en || '', // Assuming TMDb might provide original title or English title? For now leave empty or same
            description: movieData.overview || '',
            description_en: movieData.overview || '', // TMDb usually maps overview to requested language, we might need separate logic if we want both from TMDb
            releaseYear: movieData.releaseDate ? new Date(movieData.releaseDate).getFullYear().toString() : '',
            genres: movieData.genres?.join(', ') || '',
            tmdbId: movieData.tmdbId || '',
            imdbId: movieData.imdbId || '',
            runtime: movieData.runtime || '',
            cast: movieData.cast ? JSON.stringify(movieData.cast) : '',
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
        setUploadProgress(0);

        try {
            // Prepare form data with all fields
            const data = new FormData();
            data.append('title', formData.title);
            data.append('title_en', formData.title_en);
            data.append('description', formData.description);
            data.append('description_en', formData.description_en);
            data.append('releaseYear', formData.releaseYear);
            data.append('genres', formData.genres);

            // TMDb metadata
            if (formData.tmdbId) data.append('tmdbId', formData.tmdbId);
            if (formData.imdbId) data.append('imdbId', formData.imdbId);
            if (formData.runtime) data.append('runtime', formData.runtime);
            if (formData.cast) {
                // Send cast as JSON string to preserve {name, profile_path} structure
                data.append('cast', formData.cast);
            }
            if (formData.director) data.append('director', formData.director);
            if (formData.imdbRating) data.append('imdbRating', formData.imdbRating);
            if (formData.posterUrl) data.append('posterUrl', formData.posterUrl);
            if (formData.backdropUrl) data.append('backdropUrl', formData.backdropUrl);
            data.append('useTrailer', formData.useTrailer);
            data.append('categories', JSON.stringify(selectedCategories));

            // Add files directly
            if (posterFile) data.append('poster', posterFile);

            // HANDLE VIDEO UPLOAD
            if (videoFile) {
                if (useDirectUpload) {
                    // 1. Direct Upload to Storage Server
                    setMessage({ type: 'info', text: 'Uploading directly to Storage Server... (0%)' });

                    try {
                        const videoPath = await storageAPI.uploadVideo(videoFile, (progress) => {
                            setUploadProgress(progress);
                            setMessage({ type: 'info', text: `Uploading directly to Storage Server... (${progress}%)` });
                        });

                        console.log('✅ Direct upload successful, path:', videoPath);
                        data.append('videoPath', videoPath); // Send path instead of file
                        setMessage({ type: 'info', text: 'Video uploaded! Creating movie record...' });
                    } catch (uploadErr) {
                        console.error('Direct upload error:', uploadErr);
                        throw new Error(`Direct Upload Failed: ${uploadErr.message}`);
                    }
                } else {
                    // 2. Legacy Upload (Proxy through Backend)
                    data.append('video', videoFile);
                }
            }

            // Add subtitle files
            if (subtitleEN) data.append('subtitle_en', subtitleEN);
            if (subtitleVI) data.append('subtitle_vi', subtitleVI);

            // Upload everything through backend API
            // Pass setUploadProgress only if NOT using direct upload (or for the remaining part)
            const config = !useDirectUpload ? {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            } : {};

            await movieAPI.create(data, config);

            // Success - show redirect message
            setMessage({
                type: 'success',
                text: 'Phim đã được tạo thành công! Hãy vào trang Công việc để theo dõi tiến độ upload và encoding.'
            });
            setUploading(false);
            setUploadProgress(0);

            // Refresh movie list and reset form
            fetchMovies();
            resetForm();

        } catch (err) {
            setUploading(false);
            setMessage({
                type: 'error',
                text: err.response?.data?.message || err.message || 'Upload failed'
            });
            console.error('Upload error:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            title_en: '',
            description: '',
            description_en: '',
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
        setSelectedCategories([]);
        setSubtitleEN(null);
        setSubtitleVI(null);
        setSelectedCategories([]);
    };

    const handleEdit = (movie) => {
        // Load movie data into form for editing
        setEditingMovie(movie);
        setFormData({
            title: movie.title || '',
            title_en: movie.title_en || '',
            description: movie.description || '',
            description_en: movie.description_en || '',
            releaseYear: movie.releaseYear?.toString() || '',
            genres: movie.genres?.join(', ') || '',
            tmdbId: movie.tmdbId?.toString() || '',
            imdbId: movie.imdbId || '',
            runtime: movie.runtime?.toString() || '',
            cast: movie.cast ? JSON.stringify(movie.cast) : '',
            director: movie.director || '',
            imdbRating: movie.imdbRating?.toString() || '',
            posterUrl: movie.poster || '',
            backdropUrl: movie.backdrop || '',
            useTrailer: movie.useTrailer !== undefined ? movie.useTrailer : true,
        });
        setSelectedCategories(movie.categories || []);
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
            data.append('title_en', formData.title_en);
            data.append('description', formData.description);
            data.append('description_en', formData.description_en);
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
            data.append('categories', JSON.stringify(selectedCategories));

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
            title_en: '',
            description: '',
            description_en: '',
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

    const handleUpdateTrailer = async (movie) => {
        try {
            setMessage({ type: 'info', text: 'Fetching trailer...' });

            const data = new FormData();
            data.append('tmdbId', movie.tmdbId);

            await movieAPI.update(movie._id, data);
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
                    <div className="section-header-with-toggle">
                        <h2>{editingMovie ? `Edit Movie: ${editingMovie.title}` : 'Upload New Movie'}</h2>
                        <button
                            type="button"
                            className="btn-toggle-form"
                            onClick={() => setFormCollapsed(!formCollapsed)}
                        >
                            {formCollapsed ? '▼ Mở rộng' : '▲ Thu gọn'}
                        </button>
                    </div>
                    {!formCollapsed && (
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
                                <label>Title (English)</label>
                                <input
                                    type="text"
                                    name="title_en"
                                    value={formData.title_en}
                                    onChange={handleInputChange}
                                    placeholder="Enter English title"
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

                            <div className="form-field full-width">
                                <label>Description (English)</label>
                                <textarea
                                    name="description_en"
                                    value={formData.description_en}
                                    onChange={handleInputChange}
                                    placeholder="Enter English description"
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

                            <div className="form-field full-width">
                                <label>Danh mục (Categories)</label>
                                <p className="field-hint">Chọn các danh mục phân loại cho phim này</p>
                                <div className="category-chips-container">
                                    {categories.length === 0 ? (
                                        <p className="no-categories-message">
                                            Chưa có danh mục nào. Vui lòng tạo danh mục trong <a href="/admin/categories">Category Management</a>
                                        </p>
                                    ) : (
                                        categories.map(cat => (
                                            <button
                                                key={cat._id}
                                                type="button"
                                                className={`category-chip ${selectedCategories.includes(cat._id) ? 'selected' : ''}`}
                                                onClick={() => handleCategoryToggle(cat._id)}
                                            >
                                                <span className="chip-icon">{selectedCategories.includes(cat._id) ? '✓' : '+'}</span>
                                                <span className="chip-name">{cat.name}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                                {selectedCategories.length > 0 && (
                                    <div className="selected-categories-summary">
                                        <span className="summary-label">Đã chọn:</span>
                                        <span className="summary-count">{selectedCategories.length} danh mục</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-row" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                <div className="form-field checkbox-field">
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
                                {/* Direct Upload Toggle */}
                                <div className="form-field checkbox-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={useDirectUpload}
                                            onChange={(e) => setUseDirectUpload(e.target.checked)}
                                        />
                                        <span style={{ color: '#00fa9a', fontWeight: 'bold' }}>Direct Upload</span> (Upload to Storage Server directly - Save bandwidth)
                                    </label>
                                </div>
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
                                        <span>{useDirectUpload ? 'Direct Uploading...' : 'Uploading...'}</span>
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
                                            ? (useDirectUpload ? 'Sending video to Storage Server...' : 'Uploading files to server...')
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
                    )}
                </div >

                <div className="movies-section">
                    <div className="movies-header">
                        <h2>Uploaded Movies ({movies.filter(m =>
                            m.title.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length})</h2>
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="🔍 Tìm kiếm phim..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1); // Reset to first page on search
                                }}
                            />
                        </div>
                    </div>
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
                            {(() => {
                                // Filter all movies by search query
                                const filteredMovies = movies.filter(movie =>
                                    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
                                );

                                // Calculate pagination
                                const indexOfLastMovie = currentPage * moviesPerPage;
                                const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
                                const currentMovies = filteredMovies.slice(indexOfFirstMovie, indexOfLastMovie);

                                return currentMovies.map((movie) => (
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
                                            {movie.tmdbId && !movie.trailerKey && (
                                                <button
                                                    className="btn-trailer"
                                                    onClick={() => handleUpdateTrailer(movie)}
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
                                ));
                            })()}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {(() => {
                        const filteredMovies = movies.filter(movie =>
                            movie.title.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        const totalPages = Math.ceil(filteredMovies.length / moviesPerPage);

                        if (totalPages <= 1) return null;

                        return (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    ← Trước
                                </button>

                                <span className="page-info">
                                    Trang {currentPage} / {totalPages}
                                </span>

                                <button
                                    className="page-btn"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Sau →
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div >
        </div >
    );
};

export default AdminUpload;
