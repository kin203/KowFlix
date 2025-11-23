import React from 'react';
import { ChevronRight } from 'lucide-react';
import './CategoryCards.css';

const CategoryCards = () => {
    const categories = [
        { id: 1, name: 'Marvel', color: '#5865F2', link: '/category/marvel' },
        { id: 2, name: '4K', color: '#57F287', link: '/category/4k' },
        { id: 3, name: 'Sitcom', color: '#3BA55C', link: '/category/sitcom' },
        { id: 4, name: 'Lồng Tiếng Việt', color: '#9B59B6', link: '/category/vietnamese-dub' },
        { id: 5, name: 'Xuyên Không', color: '#F39C12', link: '/category/time-travel' },
        { id: 6, name: 'Cổ Trang', color: '#E74C3C', link: '/category/historical' },
    ];

    return (
        <div className="category-section">
            <h2 className="category-title">Bạn đang quan tâm gì?</h2>
            <div className="category-grid">
                {categories.map((category) => (
                    <a
                        key={category.id}
                        href={category.link}
                        className="category-card"
                        style={{ backgroundColor: category.color }}
                    >
                        <span className="category-name">{category.name}</span>
                        <span className="category-link">
                            Xem chi tiết <ChevronRight size={16} />
                        </span>
                    </a>
                ))}
                <div className="category-card category-more">
                    <span className="category-name">+4 chủ đề</span>
                </div>
            </div>
        </div>
    );
};

export default CategoryCards;
