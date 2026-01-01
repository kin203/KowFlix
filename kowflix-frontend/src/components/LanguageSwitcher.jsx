import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'vi' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="language-switcher"
            aria-label="Switch Language"
            title={i18n.language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
            <Globe size={20} strokeWidth={2.5} />
            <span className="lang-code">{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
        </button>
    );
};

export default LanguageSwitcher;
