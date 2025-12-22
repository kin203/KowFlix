import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { categoryAPI } from '../services/api';
import './CategoryManagement.css';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showModal, setShowModal] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        color: '#FFD700',
        link: '',
        icon: '🎬',
        backgroundImage: '',
        order: 0,
        isActive: true
    });

    const availableIcons = [
        '🎬', '🎥', '🎞️', '📽️', '🎭', '🎪',
        '💥', '😄', '💕', '👻', '🚀', '🎨',
        '🦸', '📺', '🇻🇳', '⏰', '👘', '🇰🇷',
        '🎌', '🔥', '⚡', '✨', '🌟', '💫',
        '🎯', '🎮', '🎲', '🎰', '🏆', '🎖️',
        '❤️', '💛', '💚', '💙', '💜', '🖤'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await categoryAPI.getAll();
            setCategories(data.data || []);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setMessage({ type: 'error', text: 'Failed to load categories' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory._id, formData);
                setMessage({ type: 'success', text: 'Category updated successfully!' });
            } else {
                await categoryAPI.create(formData);
                setMessage({ type: 'success', text: 'Category created successfully!' });
            }

            fetchCategories();
            handleCloseModal();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Operation failed'
            });
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            color: category.color || '#FFD700',
            link: category.link || '',
            icon: category.icon || '🎬',
            backgroundImage: category.backgroundImage || '',
            order: category.order || 0,
            isActive: category.isActive !== undefined ? category.isActive : true
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        try {
            await categoryAPI.delete(id);
            setMessage({ type: 'success', text: 'Category deleted successfully!' });
            fetchCategories();
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Delete failed'
            });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            slug: '',
            description: '',
            color: '#FFD700',
            link: '',
            icon: '🎬',
            backgroundImage: '',
            order: 0,
            isActive: true
        });
    };


    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData({
            ...formData,
            name,
            slug: generateSlug(name)
        });
    };

    return (
        <div className="admin-dashboard-container">
            <DashboardSidebar />
            <div className="admin-dashboard-content">
                <div className="admin-header">
                    <div>
                        <h1>Category Management</h1>
                        <p>Manage movie categories</p>
                    </div>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        + Add Category
                    </button>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div className="loading">Loading categories...</div>
                ) : (
                    <div className="categories-section">
                        <table className="categories-table">
                            <thead>
                                <tr>
                                    <th>Icon</th>
                                    <th>Name</th>
                                    <th>Slug</th>
                                    <th>Color</th>
                                    <th>Order</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((category) => (
                                    <tr key={category._id}>
                                        <td className="category-icon">{category.icon}</td>
                                        <td>{category.name}</td>
                                        <td><code>{category.slug}</code></td>
                                        <td>
                                            <div className="color-preview" style={{ backgroundColor: category.color }}></div>
                                        </td>
                                        <td>{category.order}</td>
                                        <td>
                                            <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn-secondary"
                                                onClick={() => handleEdit(category)}
                                                style={{ marginRight: '0.5rem' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDelete(category._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showModal && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h2>{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Name *</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleNameChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Slug *</label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Background Image URL</label>
                                    <input
                                        type="url"
                                        name="backgroundImage"
                                        value={formData.backgroundImage}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                    {formData.backgroundImage && (
                                        <div className="image-preview">
                                            <img src={formData.backgroundImage} alt="Background preview" />
                                        </div>
                                    )}
                                    <small style={{ color: '#888', marginTop: '0.5rem', display: 'block' }}>
                                        Paste image URL from Imgur, Google Drive, or any image hosting service
                                    </small>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Icon</label>
                                        <div className="icon-picker-container">
                                            <div
                                                className="icon-display"
                                                onClick={() => setShowIconPicker(!showIconPicker)}
                                            >
                                                <span className="selected-icon">{formData.icon}</span>
                                                <span className="picker-arrow">▼</span>
                                            </div>
                                            {showIconPicker && (
                                                <div className="icon-grid">
                                                    {availableIcons.map((icon, index) => (
                                                        <div
                                                            key={index}
                                                            className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                                            onClick={() => {
                                                                setFormData({ ...formData, icon });
                                                                setShowIconPicker(false);
                                                            }}
                                                        >
                                                            {icon}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-field">
                                        <label>Color</label>
                                        <input
                                            type="color"
                                            name="color"
                                            value={formData.color}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Link</label>
                                        <input
                                            type="text"
                                            name="link"
                                            value={formData.link}
                                            onChange={handleInputChange}
                                            placeholder="/category/action"
                                            required
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label>Order</label>
                                        <input
                                            type="number"
                                            name="order"
                                            value={formData.order}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-field checkbox-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleInputChange}
                                        />
                                        <span>Active</span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="submit" className="submit-btn">
                                        {editingCategory ? 'Update' : 'Create'}
                                    </button>
                                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                                        Cancel
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
