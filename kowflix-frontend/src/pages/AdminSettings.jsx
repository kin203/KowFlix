import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { settingAPI } from '../services/api/settingAPI';
import { Moon, Sun, Globe, AlertTriangle, Monitor, Save } from 'lucide-react';
import './AdminSettings.css';

const AdminSettings = () => {
    const { t, i18n } = useTranslation();
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        // Apply theme on initial load
        if (theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [theme]);

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    };

    const handleLanguageChange = (lang) => {
        i18n.changeLanguage(lang);
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await settingAPI.getAll();
                setMaintenanceMode(data.maintenanceMode === true);
                // Sync local storage for immediate consistency
                localStorage.setItem('maintenanceMode', data.maintenanceMode === true);
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        try {
            // Save to backend
            await settingAPI.update('maintenanceMode', maintenanceMode, 'System maintenance mode');

            // Save to localStorage for client-side caching
            localStorage.setItem('maintenanceMode', maintenanceMode);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);

            // Force a re-render/check in App.jsx
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('maintenance_update'));
        } catch (error) {
            console.error("Failed to save settings:", error);
            // Optionally show error to user
        }
    };

    return (
        <div className="admin-container">
            <DashboardSidebar />
            <div className="admin-content" style={{ marginLeft: '250px', padding: '2rem', width: 'calc(100% - 250px)' }}>
                <h1 className="admin-title">{t('settings.title') || 'Settings'}</h1>

                <div className="settings-grid">
                    {/* Appearance */}
                    <div className="settings-card">
                        <div className="card-header">
                            <Monitor className="card-icon" />
                            <h2>{t('settings.appearance') || 'Appearance'}</h2>
                        </div>
                        <div className="card-body">
                            <div className="setting-item">
                                <label>{t('settings.theme') || 'Theme'}</label>
                                <div className="theme-toggle">
                                    <button
                                        className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                        onClick={() => handleThemeChange('light')}
                                    >
                                        <Sun size={18} /> Light
                                    </button>
                                    <button
                                        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                        onClick={() => handleThemeChange('dark')}
                                    >
                                        <Moon size={18} /> Dark
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Language */}
                    <div className="settings-card">
                        <div className="card-header">
                            <Globe className="card-icon" />
                            <h2>{t('settings.language') || 'Language'}</h2>
                        </div>
                        <div className="card-body">
                            <div className="setting-item">
                                <label>{t('settings.select_language') || 'Select Language'}</label>
                                <select
                                    value={i18n.language}
                                    onChange={(e) => handleLanguageChange(e.target.value)}
                                    className="settings-select"
                                >
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="en">English</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* System */}
                    <div className="settings-card">
                        <div className="card-header">
                            <AlertTriangle className="card-icon" />
                            <h2>{t('settings.system') || 'System'}</h2>
                        </div>
                        <div className="card-body">
                            <div className="setting-item">
                                <div className="toggle-row">
                                    <label>
                                        {t('settings.maintenance_mode') || 'Maintenance Mode'}
                                        <span className="info-tooltip" title="Disables site for non-admins">ℹ️</span>
                                    </label>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={maintenanceMode}
                                            onChange={(e) => setMaintenanceMode(e.target.checked)}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <p className="setting-desc">
                                    {t('settings.maintenance_desc') || 'Prevents users from accessing the site. Activates after a 5-minute countdown.'}
                                </p>
                            </div>

                            <div className="setting-item">
                                <label>{t('settings.items_per_page') || 'Items Per Page (Admin)'}</label>
                                <input
                                    type="number"
                                    value={itemsPerPage}
                                    onChange={(e) => setItemsPerPage(e.target.value)}
                                    className="settings-input"
                                    min="5"
                                    max="100"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="btn-save" onClick={handleSave}>
                        <Save size={18} /> {t('common.save') || 'Save Changes'}
                    </button>
                    {showSuccess && <span className="save-success">{t('common.saved') || 'Saved successfully!'}</span>}
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
