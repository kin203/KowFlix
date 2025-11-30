import React, { useState, useEffect } from 'react';
import { Search, User, ChevronDown, LogOut, Settings, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, navMenuAPI } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [profile, setProfile] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetchProfile();
        }
        fetchMenuItems();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            setProfile(data.data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const fetchMenuItems = async () => {
        try {
            const response = await navMenuAPI.getAll();
            if (response.data.success) {
                setMenuItems(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch menu items:', error);
            // Fallback to default menu if API fails
            setMenuItems([
                { label: 'Home', path: '/', isActive: true },
                { label: 'Movies', path: '/movies', isActive: true },
                { label: 'Series', path: '/series', isActive: true }
            ]);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setProfile(null);
        navigate('/login');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'buổi sáng';
        if (hour < 18) return 'buổi chiều';
        return 'buổi tối';
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const isAdmin = profile?.role === 'admin';

    const shouldShowMenuItem = (item) => {
        if (!item.isActive) return false;
        if (item.requiresAdmin && !isAdmin) return false;
        if (item.requiresAuth && !isLoggedIn) return false;
        return true;
    };

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-left">
                <Link to="/" className="logo">KowFlix</Link>

                {/* Permanent Search Bar */}
                <form onSubmit={handleSearch} className="search-form-navbar desktop-only">
                    <input
                        type="text"
                        className="search-input-navbar"
                        placeholder="Tìm kiếm phim, diễn viên..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="navbar-search-icon" size={20} strokeWidth={2.5} />
                </form>

                {/* Dynamic Nav Links */}
                <ul className="nav-links desktop-only">
                    {menuItems.filter(item => shouldShowMenuItem(item)).map((item) => (
                        <li key={item._id || item.path} className={item.subItems && item.subItems.length > 0 ? 'has-submenu' : ''}>
                            {item.isExternal ? (
                                <a href={item.path} target="_blank" rel="noopener noreferrer">
                                    {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '0.5rem' }}></i>}
                                    {item.label}
                                    {item.subItems && item.subItems.length > 0 && <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />}
                                </a>
                            ) : (
                                <Link to={item.path}>
                                    {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '0.5rem' }}></i>}
                                    {item.label}
                                    {item.subItems && item.subItems.length > 0 && <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />}
                                </Link>
                            )}

                            {/* Submenu Dropdown */}
                            {item.subItems && item.subItems.length > 0 && (
                                <ul className="submenu-dropdown">
                                    {item.subItems.filter(subItem => shouldShowMenuItem(subItem)).map((subItem) => (
                                        <li key={subItem._id || subItem.path}>
                                            {subItem.isExternal ? (
                                                <a href={subItem.path} target="_blank" rel="noopener noreferrer">
                                                    {subItem.icon && <i className={`fas ${subItem.icon}`}></i>}
                                                    <span>{subItem.label}</span>
                                                </a>
                                            ) : (
                                                <Link to={subItem.path}>
                                                    {subItem.icon && <i className={`fas ${subItem.icon}`}></i>}
                                                    <span>{subItem.label}</span>
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="navbar-right">
                {isLoggedIn && <NotificationDropdown />}

                {isLoggedIn ? (
                    <div
                        className="profile-dropdown desktop-only"
                        onMouseEnter={() => setShowDropdown(true)}
                        onMouseLeave={() => setShowDropdown(false)}
                    >
                        <div className="profile-trigger">
                            {profile?.profile?.avatar ? (
                                <img
                                    src={profile.profile.avatar}
                                    alt="Avatar"
                                    className="profile-avatar"
                                />
                            ) : (
                                <div className="profile-icon">
                                    <User size={20} />
                                </div>
                            )}
                            <ChevronDown size={16} className="dropdown-arrow" />
                        </div>

                        {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item">
                                    <User size={18} />
                                    <span>Profile</span>
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className="dropdown-item">
                                        <Settings size={18} />
                                        <span>Admin Panel</span>
                                    </Link>
                                )}
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item logout">
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link to="/login" className="login-btn desktop-only">Sign In</Link>
                )}

                <button
                    className="mobile-menu-btn mobile-only"
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    aria-label="Toggle menu"
                >
                    {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <div className="mobile-menu-header">
                            <h3>Menu</h3>
                            <button onClick={() => setShowMobileMenu(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        {isLoggedIn && profile && (
                            <div className="mobile-greeting">
                                <p className="greeting-text">
                                    Xin chào, <strong>{profile.username || 'Bạn'}</strong>! 👋
                                </p>
                                <p className="greeting-subtext">
                                    Chúc bạn {getGreeting()} vui vẻ! 🎬
                                </p>
                            </div>
                        )}

                        <ul className="mobile-nav-links">
                            {menuItems.filter(item => shouldShowMenuItem(item)).map((item) => (
                                <li key={item._id || item.path}>
                                    {item.isExternal ? (
                                        <a
                                            href={item.path}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => setShowMobileMenu(false)}
                                        >
                                            {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '0.5rem' }}></i>}
                                            {item.label}
                                        </a>
                                    ) : (
                                        <Link to={item.path} onClick={() => setShowMobileMenu(false)}>
                                            {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '0.5rem' }}></i>}
                                            {item.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>

                        <div className="mobile-menu-footer">
                            {isLoggedIn ? (
                                <>
                                    <Link to="/profile" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                        <User size={20} />
                                        <span>Profile</span>
                                    </Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                            <Settings size={20} />
                                            <span>Admin Panel</span>
                                        </Link>
                                    )}
                                    <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="mobile-menu-item logout">
                                        <LogOut size={20} />
                                        <span>Logout</span>
                                    </button>
                                </>
                            ) : (
                                <Link to="/login" className="mobile-login-btn" onClick={() => setShowMobileMenu(false)}>
                                    Sign In
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
