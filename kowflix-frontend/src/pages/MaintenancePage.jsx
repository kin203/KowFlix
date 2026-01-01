import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import './MaintenancePage.css';

const MaintenancePage = () => {
    const { t } = useTranslation();

    return (
        <div className="maintenance-container">
            <div className="maintenance-icon">
                <Wrench size={80} />
            </div>
            <h1 className="maintenance-title">{t('maintenance.title')}</h1>
            <p className="maintenance-message">
                {t('maintenance.message')}
                <br />
                {t('maintenance.sub_message')}
            </p>
        </div>
    );
};

export default MaintenancePage;
