import React, { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

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
                    {localStorage.getItem('user') && JSON.parse(localStorage.getItem('user')).role === 'admin' && (
                        <li><Link to="/admin" style={{ color: '#e50914' }}>Admin</Link></li>
                    )}
                </ul>
            </div>

            <div className="navbar-right">
                <Search className="icon" size={20} />
                <Bell className="icon" size={20} />
                <div className="profile-icon"></div>
            </div>
        </nav>
    );
};

export default Navbar;
