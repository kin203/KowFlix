import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { categoryAPI } from '../services/api';
import { Plus, Edit2, Trash2, X, Move } from 'lucide-react';
import './CategoryManagement.css';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        color: '#FFD700',
        link: '',
        icon: '🎬',
        order: 0,
        isActive: true
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await categoryAPI.getAll();
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                color: category.color,
                link: category.link,
                icon: category.icon,
                order: category.order,
                isActive: category.isActive
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                color: '#FFD700',
                link: '',
                icon: '🎬',
                order: categories.length,
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory._id, formData);
            } else {
                await categoryAPI.create(formData);
            }
            fetchCategories();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save category:', error);
            alert(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                await categoryAPI.delete(id);
                fetchCategories();
            } catch (error) {
                console.error('Failed to delete category:', error);
                alert('Failed to delete category');
            }
        }
    };

    return (
        <div className="category-management-container">
            <DashboardSidebar />
            <div className="category-content">
                <div className="category-header">
                    <h1>Quản lý Danh mục</h1>
                    <button className="btn-add" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        Thêm Danh mục
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="category-grid">
                        {categories.map((category) => (
                            <div key={category._id} className="category-card" style={{ borderLeft: `4px solid ${category.color}` }}>
                                <div className="category-icon" style={{ color: category.color }}>
                                    {category.icon}
                                </div>
                                <div className="category-info">
                                    <h3>{category.name}</h3>
                                    <p className="category-link">Link: {category.link}</p>
                                </div>
                                <div className="category-actions">
                                    <button
                                        className="btn-icon"
                                        onClick={() => handleOpenModal(category)}
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        className="btn-icon delete"
                                        onClick={() => handleDelete(category._id)}
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{editingCategory ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục mới'}</h2>
                                <button className="btn-close" onClick={handleCloseModal}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tên danh mục</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ví dụ: Phim Hành Động"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Link (Slug)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                        required
                                        placeholder="Ví dụ: action-movies"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Icon (Emoji)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="🎬"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Màu sắc</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="color-preview"
                                        />
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="category-modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        {editingCategory ? 'Cập nhật' : 'Thêm mới'}
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

export default CategoryManagement;
