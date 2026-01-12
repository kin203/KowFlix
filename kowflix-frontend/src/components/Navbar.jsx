import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LogOut, Settings, X, Heart, Clock, AlertTriangle } from 'lucide-react';
import { authAPI, navMenuAPI, movieAPI } from '../services/api';
import NotificationDropdown from './NotificationDropdown';



import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

// Import Custom SVG Icons
import LogoFull from '../assets/icons/logo_full.svg?react';
import LogoIcon from '../assets/icons/app_icon.svg?react';
import SearchIcon from '../assets/icons/search.svg?react';
import ProfileIcon from '../assets/icons/profile.svg?react';
import LibraryIcon from '../assets/icons/library.svg?react';

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

    const isAdmin = profile?.role === 'admin' || profile?.isAdmin;

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
            if (res.data && res.data.success) {
                setProfile(res.data.data);
            } else {
                setProfile(res.data);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Don't auto-logout on simple profile fetch error unless 401
            if (err.response && err.response.status === 401) {
                handleLogout();
            }
        }
    };

    const fetchMenuItems = async () => {
        try {
            const [menuRes, filterRes] = await Promise.all([
                navMenuAPI.getAll(),
                movieAPI.getFilters()
            ]);

            let items = [];
            if (menuRes.data && Array.isArray(menuRes.data)) {
                items = menuRes.data;
            } else if (menuRes.data && menuRes.data.data && Array.isArray(menuRes.data.data)) {
                items = menuRes.data.data;
            }

            // Inject filters into menu items
            if (filterRes.data && filterRes.data.success) {
                const { countries, genres } = filterRes.data.data;

                items = items.map(item => {
                    // Inject Countries into 'Series' / 'Quốc gia'
                    if (item.label === 'Series' || item.label === 'Quốc gia') {
                        const countrySubItems = countries.map(c => ({
                            label: c,
                            path: `/country/${encodeURIComponent(c)}`,
                            _id: `country-${c}`
                        }));
                        return { ...item, title: 'Quốc gia', label: 'Quốc gia', path: '/country', subItems: countrySubItems };
                    }

                    // Inject Genres into 'Movies' / 'Thể loại'
                    if (item.label === 'Movies' || item.label === 'Thể loại') {
                        const genreSubItems = genres.map(g => ({
                            label: g,
                            path: `/genre/${encodeURIComponent(g)}`,
                            _id: `genre-${g}`
                        }));
                        return { ...item, title: 'Thể loại', label: 'Thể loại', path: '/movie', subItems: genreSubItems };
                    }

                    return item;
                });
            }

            setMenuItems(items);
        } catch (err) {
            console.error('Error fetching menu or filters:', err);
            // Fallback to basic menu if filters fail
            try {
                const res = await navMenuAPI.getAll();
                setMenuItems(res.data?.data || []);
            } catch (e) { setMenuItems([]); }
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
        // Hide duplicate Home item
        if (item.path === '/' || item.label.toLowerCase() === 'home' || item.label.toLowerCase() === 'trang chủ') {
            return false;
        }
        return true;
    };

    const getLabel = (label) => {
        // Map backend labels to i18n keys
        const i18nMap = {
            'Movies': 'navbar.movies',
            'Series': 'navbar.series',
            'New & Popular': 'navbar.new_and_popular', // Need to add this key
            'Home': 'navbar.home',
            'My List': 'navbar.my_list',
            'Countries': 'footer.countries',
            'Genres': 'footer.categories'
        };

        const key = i18nMap[label];
        if (key) {
            return t(key);
        }

        // Return label as is if no map found (or handle backend dynamic names)
        return label;
    };

    return (
        <>
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="navbar-left">
                    <Link to="/" className="logo-container">
                        {/* Desktop Logo */}
                        <div className="desktop-only">
                            <LogoFull height={30} width={100} />
                        </div>
                        {/* Mobile Logo */}
                        <div className="mobile-only">
                            <LogoIcon height={32} width={32} />
                        </div>
                    </Link>

                    {/* Permanent Search Bar */}
                    <form onSubmit={handleSearch} className="search-form-navbar desktop-only">
                        <input
                            type="text"
                            className="search-input-navbar"
                            placeholder={t('navbar.search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <SearchIcon className="navbar-search-icon text-gray-400" width={20} height={20} />
                    </form>

                </div>

                {/* Dynamic Nav Links - Centered */}
                <ul className="nav-links desktop-only">
                    {/* Static Home Link First */}
                    <li>
                        <Link to="/">
                            {t('navbar.home', 'Trang chủ')}
                        </Link>
                    </li>

                    {menuItems.filter(item => shouldShowMenuItem(item)).map((item) => (
                        <li key={item._id || item.path} className={item.subItems && item.subItems.length > 0 ? 'has-submenu' : ''}>
                            {item.isExternal ? (
                                <a href={item.path} target="_blank" rel="noopener noreferrer">
                                    {/* Fallback to legacy icon class if new SVG not mapped, assuming library logic or just text */}
                                    {item.label}
                                    {item.subItems && item.subItems.length > 0 && <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />}
                                </a>
                            ) : (
                                <Link to={item.path}>
                                    <span className="nav-item-label">{getLabel(item.label)}</span>
                                    {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                                        <ChevronDown size={14} style={{ marginLeft: '0.25rem' }} />
                                    )}
                                </Link>
                            )}

                            {/* Submenu Dropdown */}
                            {item.subItems && item.subItems.length > 0 && (
                                <ul className="submenu-dropdown">
                                    {item.subItems.filter(subItem => shouldShowMenuItem(subItem)).map((subItem) => (
                                        <li key={subItem._id || subItem.path}>
                                            {subItem.isExternal ? (
                                                <a href={subItem.path} target="_blank" rel="noopener noreferrer">
                                                    <span>{subItem.label}</span>
                                                </a>
                                            ) : (
                                                <Link to={subItem.path}>
                                                    <span>{getLabel(subItem.label)}</span>
                                                </Link>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>

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
                                        <ProfileIcon width={24} height={24} className="text-white" />
                                    </div>
                                )}
                                <ChevronDown size={16} className="dropdown-arrow" />
                            </div>

                            {showDropdown && (
                                <div className="dropdown-menu">
                                    <Link to="/profile" className="dropdown-item">
                                        <ProfileIcon width={18} height={18} className="mr-2" />
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
                        <SearchIcon width={22} height={22} className="text-white" />
                    </button>

                    <button
                        className="mobile-menu-btn mobile-only"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label="Toggle menu"
                    >
                        {showMobileMenu ? <X size={24} /> : <LibraryIcon width={24} height={24} className="text-white" />}
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
                                <h3 className="flex items-center gap-2">
                                    <LogoIcon width={24} height={24} /> Menu
                                </h3>
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
                                {/* Static Home Link Mobile */}
                                <li>
                                    <Link to="/" onClick={() => setShowMobileMenu(false)}>
                                        Trang chủ
                                    </Link>
                                </li>

                                {menuItems.filter(item => shouldShowMenuItem(item)).map((item) => (
                                    <li key={item._id || item.path}>
                                        {item.isExternal ? (
                                            <a
                                                href={item.path}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setShowMobileMenu(false)}
                                            >
                                                {/* Fallback for API icons */}
                                                {item.icon && <i className={`fas ${item.icon}`} style={{ marginRight: '0.5rem' }}></i>}
                                                {item.label}
                                            </a>
                                        ) : (
                                            <Link to={item.path} onClick={() => setShowMobileMenu(false)}>
                                                {/* Fallback for API icons */}
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
                                            <ProfileIcon width={20} height={20} />
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
