import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './CategoryCards.css';

const CategoryCards = () => {
    const sliderRef = useRef(null);

    const categories = [
        { id: 1, name: 'Marvel', color: '#5865F2', link: '/category/marvel' },
        { id: 2, name: '4K', color: '#57F287', link: '/category/4k' },
        { id: 3, name: 'Sitcom', color: '#3BA55C', link: '/category/sitcom' },
        { id: 4, name: 'Lồng Tiếng Việt', color: '#9B59B6', link: '/category/vietnamese-dub' },
        { id: 5, name: 'Xuyên Không', color: '#F39C12', link: '/category/time-travel' },
        { id: 6, name: 'Cổ Trang', color: '#E74C3C', link: '/category/historical' },
        { id: 7, name: 'Hành Động', color: '#E67E22', link: '/category/action' },
        { id: 8, name: 'Kinh Dị', color: '#34495E', link: '/category/horror' },
        { id: 9, name: 'Hài Hước', color: '#F1C40F', link: '/category/comedy' },
        { id: 10, name: 'Tình Cảm', color: '#E91E63', link: '/category/romance' },
    ];

    const scroll = (direction) => {
        if (sliderRef.current) {
            const containerWidth = sliderRef.current.offsetWidth;
            const scrollAmount = containerWidth * 0.8;
            const start = sliderRef.current.scrollLeft;
            const target = direction === 'left' ? start - scrollAmount : start + scrollAmount;
            const duration = 500; // 500ms animation
            const startTime = performance.now();

            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function for smooth animation
                const easeInOutCubic = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                sliderRef.current.scrollLeft = start + (target - start) * easeInOutCubic;

                if (progress < 1) {
                    requestAnimationFrame(animateScroll);
                }
            };

            requestAnimationFrame(animateScroll);
        }
    };

    return (
        <div className="category-section">
            <h2 className="category-title">Bạn đang quan tâm gì?</h2>
            <div className="category-slider-container">
                <button
                    className="category-nav-btn category-nav-left"
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="category-slider" ref={sliderRef}>
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
                </div>

                <button
                    className="category-nav-btn category-nav-right"
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                >
                    <ChevronRight size={24} />
                </button>
            </div>
        </div>
    );
};

export default CategoryCards;
