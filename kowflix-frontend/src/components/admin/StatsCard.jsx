import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './StatsCard.css';

const StatsCard = ({ icon: Icon, title, value, trend, trendValue, color = '#FFD700' }) => {
    const isPositive = trend === 'up';

    return (
        <div className="stats-card">
            <div className="stats-icon" style={{ backgroundColor: `${color}15` }}>
                <Icon size={24} style={{ color }} />
            </div>

            <div className="stats-content">
                <p className="stats-title">{title}</p>
                <h3 className="stats-value">{value}</h3>

                {trendValue && (
                    <div className={`stats-trend ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{trendValue}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
