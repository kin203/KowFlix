import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import './MaintenanceBanner.css';

const MaintenanceBanner = ({ scheduledTime }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!scheduledTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const target = new Date(scheduledTime).getTime();
            const distance = target - now;

            if (distance < 0) {
                // Time's up, should be redirected by App.jsx shortly
                setTimeLeft('00:00');
                clearInterval(interval);
                return;
            }

            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [scheduledTime]);

    if (!isVisible || !scheduledTime) return null;

    return (
        <div className="maintenance-warning-banner">
            <div className="banner-content">
                <AlertTriangle className="banner-icon" />
                <span className="banner-text">
                    Thông báo: Hệ thống sẽ bảo trì trong <span className="countdown">{timeLeft}</span> phút nữa.
                    Xin bạn thông cảm và chờ thông báo mới nhất từ chúng tôi!
                </span>
            </div>
        </div>
    );
};

export default MaintenanceBanner;
