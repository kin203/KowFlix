import React from 'react';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <div className="footer-logo">
                        <h2>KowFlix</h2>
                        <p>Phim hay mỗi ngày</p>
                    </div>
                    <p className="footer-description">
                        KowFlix - Phim hay về tất cả. Trung tâm phim chất lượng cao nhất Việt Nam. Huyền ảnh, lồng tiếng Việt lẻ. Kho phim mới không có quảng cáo, phim chất lượng cao, phim lẻ, phim bộ, phim hoạt hình được cập nhật hàng ngày. Trung Quốc, Hàn Lẻ, Thái Lan, Nhật Bản, Âu Mỹ... đa dạng thể loại: Khám phá nền văn minh phim lẻ tuyệt hay nhất 2024 chất lượng 4K!
                    </p>
                </div>

                <div className="footer-links">
                    <div className="footer-column">
                        <h3>Thể loại</h3>
                        <ul>
                            <li><a href="/genre/action">Hành Động</a></li>
                            <li><a href="/genre/drama">Chính Kịch</a></li>
                            <li><a href="/genre/comedy">Hài Hước</a></li>
                            <li><a href="/genre/horror">Kinh Dị</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Quốc gia</h3>
                        <ul>
                            <li><a href="/country/vietnam">Việt Nam</a></li>
                            <li><a href="/country/korea">Hàn Quốc</a></li>
                            <li><a href="/country/china">Trung Quốc</a></li>
                            <li><a href="/country/usa">Âu Mỹ</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Phim mới</h3>
                        <ul>
                            <li><a href="/new/movies">Phim lẻ mới</a></li>
                            <li><a href="/new/series">Phim bộ mới</a></li>
                            <li><a href="/new/anime">Hoạt hình mới</a></li>
                            <li><a href="/new/4k">Phim 4K</a></li>
                        </ul>
                    </div>
                </div>

                <div className="footer-social">
                    <h3>Kết nối với chúng tôi</h3>
                    <div className="social-icons">
                        <a href="#" aria-label="Facebook"><Facebook size={24} /></a>
                        <a href="#" aria-label="Twitter"><Twitter size={24} /></a>
                        <a href="#" aria-label="Instagram"><Instagram size={24} /></a>
                        <a href="#" aria-label="Youtube"><Youtube size={24} /></a>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; 2024 KowFlix. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
