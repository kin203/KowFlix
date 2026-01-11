import React from 'react';
import { useTranslation } from 'react-i18next';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <div className="footer-logo">
                        <h2>KowFlix</h2>
                        <p>{t('footer.slogan')}</p>
                    </div>
                    <p className="footer-description">
                        {t('footer.description')}
                    </p>
                </div>

                <div className="footer-links">
                    <div className="footer-column">
                        <h3>{t('footer.categories')}</h3>
                        <ul>
                            <li><a href="/genre/action">Hành Động</a></li>
                            <li><a href="/genre/drama">Chính Kịch</a></li>
                            <li><a href="/genre/comedy">Hài Hước</a></li>
                            <li><a href="/genre/horror">Kinh Dị</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>{t('footer.countries')}</h3>
                        <ul>
                            <li><a href="/country/vietnam">Việt Nam</a></li>
                            <li><a href="/country/korea">Hàn Quốc</a></li>
                            <li><a href="/country/china">Trung Quốc</a></li>
                            <li><a href="/country/usa">Âu Mỹ</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>{t('footer.new_releases')}</h3>
                        <ul>
                            <li><a href="/new/movies">Phim lẻ mới</a></li>
                            <li><a href="/new/series">Phim bộ mới</a></li>
                            <li><a href="/new/anime">Hoạt hình mới</a></li>
                            <li><a href="/new/4k">Phim 4K</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-social">
                    <h3>{t('footer.connect')}</h3>
                    <div className="social-icons">
                        <a href="#" aria-label="Facebook"><Facebook size={24} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={24} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={24} /></a>
                        <a href="#" aria-label="Youtube"><Youtube size={24} /></a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2025 KowFlix. {t('footer.rights')}</p>
            </div>
        </footer>
    );
};

export default Footer;
