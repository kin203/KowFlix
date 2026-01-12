import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { movieAPI } from '../services/api';
import './CategoryPage.css';

// Mapping for flags - extended based on common movie countries
const COUNTRY_FLAGS = {
    'Vietnam': '🇻🇳', 'Việt Nam': '🇻🇳',
    'China': '🇨🇳', 'Trung Quốc': '🇨🇳',
    'South Korea': '🇰🇷', 'Hàn Quốc': '🇰🇷', 'Korea': '🇰🇷',
    'United States of America': '🇺🇸', 'United States': '🇺🇸', 'Mỹ': '🇺🇸', 'USA': '🇺🇸',
    'Japan': '🇯🇵', 'Nhật Bản': '🇯🇵',
    'Thailand': '🇹🇭', 'Thái Lan': '🇹🇭',
    'India': '🇮🇳', 'Ấn Độ': '🇮🇳',
    'France': '🇫🇷', 'Pháp': '🇫🇷',
    'United Kingdom': '🇬🇧', 'Anh': '🇬🇧', 'UK': '🇬🇧',
    'Germany': '🇩🇪', 'Đức': '🇩🇪',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺', 'Úc': '🇦🇺',
    'Spain': '🇪🇸', 'Tây Ban Nha': '🇪🇸',
    'Italy': '🇮🇹', 'Ý': '🇮🇹',
    'Russia': '🇷🇺', 'Nga': '🇷🇺',
    'Taiwan': '🇹🇼', 'Đài Loan': '🇹🇼',
    'Hong Kong': '🇭🇰', 'Hồng Kông': '🇭🇰',
    'Israel': '🇮🇱',
    'Philippines': '🇵🇭',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽'
};

const getFlag = (countryName) => {
    // Normalize string to match keys if needed, or return default
    return COUNTRY_FLAGS[countryName] || '🌍';
};

const AllCountriesPage = () => {
    const { t } = useTranslation();
    const [countries, setCountries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await movieAPI.getFilters();
                if (res.data && res.data.success && res.data.data.countries) {
                    setCountries(res.data.data.countries);
                }
            } catch (error) {
                console.error("Failed to fetch countries:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCountries();
    }, []);

    return (
        <div className="category-page">
            <Navbar />

            <Link to="/" className="back-button">
                <ArrowLeft size={24} />
                {t('navbar.home')}
            </Link>

            <div className="category-content">
                <div className="category-header">
                    <h1 className="category-title">{t('common.countries', 'Quốc gia')}</h1>
                </div>

                {loading ? (
                    <div className="category-loading">
                        <div className="loading-spinner"></div>
                    </div>
                ) : (
                    <div className="countries-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '1.5rem',
                        marginTop: '2rem'
                    }}>
                        {countries.map(countryName => (
                            <Link
                                to={`/country/${encodeURIComponent(countryName)}`}
                                key={countryName}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: 'white',
                                    transition: 'all 0.3s ease',
                                    minHeight: '160px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>{getFlag(countryName)}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600', textAlign: 'center' }}>{countryName}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllCountriesPage;
