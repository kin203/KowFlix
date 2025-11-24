import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { heroAPI, movieAPI } from '../services/api';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import './HeroManagement.css';

const HeroManagement = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        movieId: '',
        title: '',
        description: '',
        imageUrl: '',
        order: 0,
        isActive: true
    });

    // Movie selection state
    const [movies, setMovies] = useState([]);
    const [movieSearch, setMovieSearch] = useState('');
    const [searchingMovies, setSearchingMovies] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    useEffect(() => {
        if (isModalOpen) {
            searchMovies();
        }
    }, [isModalOpen, movieSearch]);

    const fetchBanners = async () => {
        try {
            const response = await heroAPI.getAll();
            if (response.data.success) {
                setBanners(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchMovies = async () => {
        try {
            setSearchingMovies(true);
            const response = await movieAPI.getAll({ search: movieSearch, limit: 10 });
            if (response.data.success) {
                setMovies(response.data.data);
            }
        } catch (error) {
            console.error('Failed to search movies:', error);
        } finally {
            setSearchingMovies(false);
        }
    };

    const handleOpenModal = (banner = null) => {
        if (banner) {
            setEditingBanner(banner);
            setFormData({
                movieId: banner.movieId._id,
                title: banner.title,
                description: banner.description,
                imageUrl: banner.imageUrl,
                order: banner.order,
                isActive: banner.isActive
            });
        } else {
            setEditingBanner(null);
            setFormData({
                movieId: '',
                title: '',
                description: '',
                imageUrl: '',
                order: banners.length,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBanner(null);
        setMovieSearch('');
    };

    const handleSelectMovie = (movie) => {
        setFormData({
            ...formData,
            movieId: movie._id,
            title: formData.title || movie.title,
            description: formData.description || movie.description,
            imageUrl: formData.imageUrl || movie.poster
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBanner) {
                await heroAPI.update(editingBanner._id, formData);
            } else {
                await heroAPI.create(formData);
            }
            fetchBanners();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save banner:', error);
            alert(error.response?.data?.message || 'Failed to save banner');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this banner?')) {
            try {
                await heroAPI.delete(id);
                fetchBanners();
            } catch (error) {
                console.error('Failed to delete banner:', error);
                alert('Failed to delete banner');
            }
        }
    };

    return (
        <div className="hero-management-container">
            <DashboardSidebar />
            <div className="hero-management-content">
                <div className="hero-header">
                    <h1>Quản lý Hero Banner</h1>
                    <button className="btn-add" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        Thêm Banner
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="hero-grid">
                        {banners.map((banner) => (
                            <div key={banner._id} className="hero-card">
                                <div className="hero-image-wrapper">
                                    <img src={banner.imageUrl} alt={banner.title} className="hero-image" />
                                    <span className={`hero-status-badge ${banner.isActive ? 'active' : 'inactive'}`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="hero-info">
                                    <h3>{banner.title}</h3>
                                    <p className="hero-description">{banner.description}</p>
                                    <div className="hero-banner-meta">
                                        <span className="hero-order">Order: {banner.order}</span>
                                        <div className="hero-actions">
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleOpenModal(banner)}
                                                title="Edit"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                onClick={() => handleDelete(banner._id)}
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{editingBanner ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h2>
                                <button className="btn-close" onClick={handleCloseModal}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                {!editingBanner && (
                                    <div className="form-group">
                                        <label>Chọn Phim (Tự động điền thông tin)</label>
                                        <input
                                            type="text"
                                            className="movie-search-input"
                                            placeholder="Tìm kiếm phim..."
                                            value={movieSearch}
                                            onChange={(e) => setMovieSearch(e.target.value)}
                                        />
                                        <div className="movie-list">
                                            {movies.map(movie => (
                                                <div
                                                    key={movie._id}
                                                    className={`movie-item ${formData.movieId === movie._id ? 'selected' : ''}`}
                                                    onClick={() => handleSelectMovie(movie)}
                                                >
                                                    <img src={movie.poster} alt={movie.title} />
                                                    <div className="movie-item-info">
                                                        <h4>{movie.title}</h4>
                                                        <p>{movie.releaseYear}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Tiêu đề</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Hình ảnh URL (Poster/Backdrop)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group" style={{ display: 'flex', gap: '2rem' }}>
                                    <div>
                                        <label>Thứ tự hiển thị</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                            style={{ width: '100px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            id="isActive"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <label htmlFor="isActive" style={{ margin: 0, color: '#FFFFFF' }}>Hiển thị</label>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        {editingBanner ? 'Cập nhật' : 'Thêm mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroManagement;
