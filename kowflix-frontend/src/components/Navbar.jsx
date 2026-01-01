import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, User, ChevronDown, LogOut, Settings, Menu, X, Heart, Clock, AlertTriangle } from 'lucide-react';
import { authAPI, navMenuAPI } from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

const Navbar = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    // State
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profile, setProfile] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMaintenance, setIsMaintenance] = useState(false);

    const isAdmin = profile?.role === 'admin' || profile?.isAdmin;

    // Maintenance Mode Check
    useEffect(() => {
        const checkStatus = () => {
            setIsMaintenance(localStorage.getItem('maintenanceMode') === 'true');
        };
        checkStatus();
        window.addEventListener('storage', checkStatus);
        window.addEventListener('maintenance_update', checkStatus);
        return () => {
            window.removeEventListener('storage', checkStatus);
            window.removeEventListener('maintenance_update', checkStatus);
        };
    }, []);

    // Scroll Listener
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initialize (Auth & Menus)
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
            const res = await authAPI.getProfile();
            setProfile(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Don't auto-logout on simple profile fetch error unless 401, but keeping it simple
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchMenuItems = async () => {
        try {
            const res = await navMenuAPI.getAll();
            if (res.data && Array.isArray(res.data)) {
                setMenuItems(res.data);
            } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                setMenuItems(res.data.data);
            } else {
                setMenuItems([]);
            }
        } catch (err) {
            console.error('Error fetching menu:', err);
            setMenuItems([]);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setProfile(null);
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setShowMobileSearch(false);
        }
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return t('navbar.good_morning', 'Chào buổi sáng');
        if (hour < 18) return t('navbar.good_afternoon', 'Chào buổi chiều');
        return t('navbar.good_evening', 'Chào buổi tối');
    };

    const shouldShowMenuItem = (item) => {
        return true;
    };

    return (
        <>
            {isMaintenance && (
                <div className="maintenance-banner">
                    <AlertTriangle size={16} />
                    <span>{t('maintenance.active_banner') || 'Maintenance Mode is Active (Visible to Admins only)'}</span>
                </div>
            )}
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''} ${isMaintenance ? 'has-banner' : ''}`}>
                <div className="navbar-left">
                    {/* ... rest of navbar */}
                    <Link to="/" className="logo">KowFlix</Link>

                    {/* Permanent Search Bar */}
                    <form onSubmit={handleSearch} className="search-form-navbar desktop-only">
                        <input
                            type="text"
                            className="search-input-navbar"
                            placeholder={t('navbar.search_placeholder')}
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
                                        <span>{t('navbar.profile')}</span>
                                    </Link>
                                    <Link to="/profile#wishlist" className="dropdown-item">
                                        <Heart size={18} />
                                        <span>{t('navbar.my_list')}</span>
                                    </Link>
                                    <Link to="/profile#history" className="dropdown-item">
                                        <Clock size={18} />
                                        <span>{t('navbar.history')}</span>
                                    </Link>
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item">
                                            <Settings size={18} />
                                            <span>{t('navbar.admin_panel')}</span>
                                        </Link>
                                    )}
                                    <div className="dropdown-divider"></div>
                                    <button onClick={handleLogout} className="dropdown-item logout">
                                        <LogOut size={18} />
                                        <span>{t('navbar.logout')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="login-btn desktop-only">{t('navbar.login')}</Link>
                    )}

                    <LanguageSwitcher />

                    <button
                        className="mobile-search-toggle mobile-only"
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                    >
                        <Search size={22} />
                    </button>

                    <button
                        className="mobile-menu-btn mobile-only"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label="Toggle menu"
                    >
                        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Search Bar */}
                {showMobileSearch && (
                    <form onSubmit={handleSearch} className="mobile-search-bar mobile-only">
                        <input
                            type="text"
                            placeholder={t('navbar.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                        <button type="button" onClick={() => setShowMobileSearch(false)}>
                            <X size={20} />
                        </button>
                    </form>
                )}

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
                                        {t('navbar.greeting')}, <strong>{profile.username || 'Bạn'}</strong>! 👋
                                    </p>
                                    <p className="greeting-subtext">
                                        {getGreeting()} 🎬
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
                                            <span>{t('navbar.profile')}</span>
                                        </Link>
                                        <Link to="/profile#wishlist" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                            <Heart size={20} />
                                            <span>{t('navbar.my_list')}</span>
                                        </Link>
                                        <Link to="/profile#history" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                            <Clock size={20} />
                                            <span>{t('navbar.history')}</span>
                                        </Link>
                                        {isAdmin && (
                                            <Link to="/admin" className="mobile-menu-item" onClick={() => setShowMobileMenu(false)}>
                                                <Settings size={20} />
                                                <span>{t('navbar.admin_panel')}</span>
                                            </Link>
                                        )}
                                        <button onClick={() => { handleLogout(); setShowMobileMenu(false); }} className="mobile-menu-item logout">
                                            <LogOut size={20} />
                                            <span>{t('navbar.logout')}</span>
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" className="mobile-login-btn" onClick={() => setShowMobileMenu(false)}>
                                        {t('navbar.login')}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
};

export default Navbar;
