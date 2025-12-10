import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PatrioticLoader.css';

const PatrioticLoader = () => {
    const [loading, setLoading] = useState(false);
    const [shrinking, setShrinking] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Don't show loader on video player page or admin pages
        if (location.pathname.startsWith('/watch') || location.pathname.startsWith('/admin')) {
            setLoading(false);
            setShrinking(false);
            return;
        }

        // Show loader on route change
        setLoading(true);
        setShrinking(false);

        // Start shrinking animation 0.3s before hiding
        const shrinkTimer = setTimeout(() => {
            setShrinking(true);
        }, 1500); // Start shrinking at 1.5s

        // Hide after delay
        const hideTimer = setTimeout(() => {
            setLoading(false);
            setShrinking(false);
        }, 1800); // Total duration: 1.8 seconds

        return () => {
            clearTimeout(shrinkTimer);
            clearTimeout(hideTimer);
        };
    }, [location.pathname]);

    if (!loading) return null;

    return (
        <div className={`patriotic-loader-screen ${shrinking ? 'shrinking' : ''}`}>
            <div className="loader-content">
                <img src="/soldier.png" alt="Soldier" className="loader-soldier" />
                <div className="loader-message-box">
                    <img src="/vietnam-flag-new.png" alt="Vietnam Flag" className="loader-flag-icon" />
                    <h2>Hoàng Sa & Trường Sa là của Việt Nam!</h2>
                </div>
                <div className="loader-spinner"></div>
            </div>
        </div>
    );
};

export default PatrioticLoader;
