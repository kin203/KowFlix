import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './EngagementChart.css';

const EngagementChart = ({ data, title = "Engagement Trends", subtitle = "Weekly Overview" }) => {
    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].payload.day}</p>
                    <p className="tooltip-value">
                        <span className="tooltip-dot"></span>
                        {payload[0].value.toLocaleString()} views
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="engagement-chart-card">
            <div className="chart-header">
                <div>
                    <h3>{title}</h3>
                    <span className="chart-subtitle">{subtitle}</span>
                </div>
                <div className="chart-legend">
                    <span className="legend-dot"></span>
                    <span className="legend-text">Views</span>
                </div>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#FFD700" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
                        <XAxis
                            dataKey="day"
                            stroke="#888"
                            style={{ fontSize: '0.85rem' }}
                            tick={{ fill: '#888' }}
                        />
                        <YAxis
                            stroke="#888"
                            style={{ fontSize: '0.85rem' }}
                            tick={{ fill: '#888' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#FFD700"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EngagementChart;
