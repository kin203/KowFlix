import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { navMenuAPI } from '../services/api';
import { Plus, Trash2, Edit2, X, ChevronDown, ChevronRight } from 'lucide-react';
import './NavMenuManagement.css';

const NavMenuManagement = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [flatMenuItems, setFlatMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({
        label: '',
        path: '',
        icon: 'fa-home',
        order: 0,
        isActive: true,
        parentId: null,
        requiresAuth: false,
        requiresAdmin: false,
        isExternal: false,
        description: ''
    });

    // Font Awesome icons list
    const fontAwesomeIcons = [
        'fa-home', 'fa-film', 'fa-tv', 'fa-star', 'fa-fire',
        'fa-heart', 'fa-play', 'fa-list', 'fa-search', 'fa-user',
        'fa-users', 'fa-cog', 'fa-bell', 'fa-bookmark', 'fa-clock',
        'fa-calendar', 'fa-folder', 'fa-tag', 'fa-tags', 'fa-trophy',
        'fa-crown', 'fa-gem', 'fa-rocket', 'fa-bolt', 'fa-magic',
        'fa-globe', 'fa-compass', 'fa-map', 'fa-video', 'fa-camera',
        'fa-image', 'fa-music', 'fa-headphones', 'fa-microphone', 'fa-gamepad',
        'fa-puzzle-piece', 'fa-gift', 'fa-shopping-cart', 'fa-store', 'fa-ticket',
        'fa-popcorn', 'fa-masks-theater', 'fa-drama', 'fa-comedy', 'fa-ghost'
    ];

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await navMenuAPI.getAllAdmin();
            if (response.data.success) {
                setMenuItems(response.data.data);
                setFlatMenuItems(response.data.flatData || []);
            }
        } catch (error) {
            console.error('Failed to fetch menu items:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                label: item.label || '',
                path: item.path || '',
                icon: item.icon || 'fa-home',
                order: item.order || 0,
                isActive: item.isActive !== undefined ? item.isActive : true,
                parentId: item.parentId || null,
                requiresAuth: item.requiresAuth || false,
                requiresAdmin: item.requiresAdmin || false,
                isExternal: item.isExternal || false,
                description: item.description || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                label: '',
                path: '',
                icon: 'fa-home',
                order: 0,
                isActive: true,
                parentId: null,
                requiresAuth: false,
                requiresAdmin: false,
                isExternal: false,
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setShowIconPicker(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await navMenuAPI.update(editingItem._id, formData);
            } else {
                await navMenuAPI.create(formData);
            }
            fetchMenuItems();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to save menu item:', error);
            alert('Failed to save menu item');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will also delete all submenu items.')) {
            try {
                await navMenuAPI.delete(id);
                fetchMenuItems();
            } catch (error) {
                console.error('Failed to delete menu item:', error);
                alert('Failed to delete menu item');
            }
        }
    };

    const renderMenuItem = (item, isSubItem = false) => (
        <div key={item._id} className={`menu-item-row ${isSubItem ? 'submenu-item' : ''}`}>
            <div className="menu-item-info">
                {isSubItem && <ChevronRight size={16} className="submenu-indicator" />}
                {item.icon && <i className={`fas ${item.icon} menu-item-icon`}></i>}
                <div className="menu-item-details">
                    <h4>{item.label}</h4>
                    <p>{item.path}</p>
                </div>
            </div>
            <div className="menu-item-meta">
                <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                </span>
                {item.requiresAuth && <span className="badge auth">Auth Required</span>}
                {item.requiresAdmin && <span className="badge admin">Admin Only</span>}
                <span className="order-badge">Order: {item.order}</span>
            </div>
            <div className="menu-item-actions">
                <button className="btn-icon edit" onClick={() => handleOpenModal(item)} title="Edit">
                    <Edit2 size={18} />
                </button>
                <button className="btn-icon delete" onClick={() => handleDelete(item._id)} title="Delete">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="navmenu-management-container">
            <DashboardSidebar />
            <div className="navmenu-content">
                <div className="navmenu-header">
                    <h1>Quản lý Menu Navbar</h1>
                    <button className="btn-add" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        Thêm Menu Item
                    </button>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="menu-items-list">
                        {menuItems.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                Chưa có menu item nào
                            </div>
                        ) : (
                            menuItems.map(item => (
                                <div key={item._id} className="menu-group">
                                    {renderMenuItem(item)}
                                    {item.subItems && item.subItems.length > 0 && (
                                        <div className="submenu-items">
                                            {item.subItems.map(subItem => renderMenuItem(subItem, true))}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Create/Edit Modal */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content navmenu-modal">
                            <div className="modal-header">
                                <h2>{editingItem ? 'Chỉnh sửa Menu Item' : 'Thêm Menu Item mới'}</h2>
                                <button className="btn-close" onClick={handleCloseModal}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Tên hiển thị *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.label}
                                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                            required
                                            placeholder="Home, Movies, Series..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Đường dẫn *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.path}
                                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                                            required
                                            placeholder="/, /movies, /series..."
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Icon (Font Awesome)</label>
                                    <div className="icon-picker-container">
                                        <div
                                            className="icon-display"
                                            onClick={() => setShowIconPicker(!showIconPicker)}
                                        >
                                            <i className={`fas ${formData.icon}`}></i>
                                            <span>{formData.icon}</span>
                                            <ChevronDown size={16} />
                                        </div>
                                        {showIconPicker && (
                                            <div className="icon-grid">
                                                {fontAwesomeIcons.map((icon) => (
                                                    <div
                                                        key={icon}
                                                        className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setFormData({ ...formData, icon });
                                                            setShowIconPicker(false);
                                                        }}
                                                        title={icon}
                                                    >
                                                        <i className={`fas ${icon}`}></i>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Parent Menu</label>
                                        <select
                                            className="form-input"
                                            value={formData.parentId || ''}
                                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                                        >
                                            <option value="">None (Main Menu)</option>
                                            {flatMenuItems.filter(item => !item.parentId && item._id !== editingItem?._id).map(item => (
                                                <option key={item._id} value={item._id}>{item.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Thứ tự</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Mô tả</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                        placeholder="Mô tả ngắn về menu item..."
                                    />
                                </div>

                                <div className="form-checkboxes">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.requiresAuth}
                                            onChange={(e) => setFormData({ ...formData, requiresAuth: e.target.checked })}
                                        />
                                        <span>Requires Authentication</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.requiresAdmin}
                                            onChange={(e) => setFormData({ ...formData, requiresAdmin: e.target.checked })}
                                        />
                                        <span>Admin Only</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.isExternal}
                                            onChange={(e) => setFormData({ ...formData, isExternal: e.target.checked })}
                                        />
                                        <span>External Link</span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        {editingItem ? 'Cập nhật' : 'Tạo mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Font Awesome CDN */}
            <link
                rel="stylesheet"
                href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
            />
        </div>
    );
};

export default NavMenuManagement;
