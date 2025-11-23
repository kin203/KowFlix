import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './PatrioticLoader.css';

const PatrioticLoader = () => {
    const [loading, setLoading] = useState(false);
    const location = useLocation();

    useEffect(() => {
        // Don't show loader on video player page
        if (location.pathname.startsWith('/watch')) {
            setLoading(false);
            return;
        }

        // Show loader on route change
        setLoading(true);

        // Hide after delay (to ensure message is seen)
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2500); // 2.5 seconds

        return () => clearTimeout(timer);
    }, [location.pathname]);

    if (!loading) return null;

    return (
        <div className="patriotic-loader-screen">
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
