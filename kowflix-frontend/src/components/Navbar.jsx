import React, { useState, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [profile, setProfile] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            setProfile(data.data);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        setProfile(null);
        navigate('/login');
    };

    const isAdmin = profile?.role === 'admin';

    return (
        <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
            <div className="navbar-left">
                <Link to="/" className="logo">KowFlix</Link>
                <ul className="nav-links">
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/series">Series</Link></li>
                    <li><Link to="/movies">Movies</Link></li>
                    <li><Link to="/new">New & Popular</Link></li>
                    <li><Link to="/list">My List</Link></li>
                </ul>
            </div>

            <div className="navbar-right">
                <Search className="icon" size={20} />
                <Bell className="icon" size={20} />

                {isLoggedIn ? (
                    <div
                        className="profile-dropdown"
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
                    <Link to="/login" className="login-btn">Sign In</Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
