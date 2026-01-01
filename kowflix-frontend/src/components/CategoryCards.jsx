import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './CategoryCards.css';

const CategoryCards = ({ categories = [] }) => {
    const { t, i18n } = useTranslation();
    const isEnglish = i18n.language === 'en';
    const sliderRef = useRef(null);

    const scroll = (direction) => {
        if (sliderRef.current) {
            const containerWidth = sliderRef.current.offsetWidth;
            const scrollAmount = containerWidth * 0.8;
            const start = sliderRef.current.scrollLeft;
            const target = direction === 'left' ? start - scrollAmount : start + scrollAmount;
            const duration = 500;
            const startTime = performance.now();

            const animateScroll = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

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

    if (!categories || categories.length === 0) {
        return null;
    }

    return (
        <div className="category-section">
            <h2 className="category-title">{t('home.interested_in')}</h2>
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
                            key={category._id}
                            href={category.link}
                            className="category-card"
                            style={{
                                backgroundImage: category.backgroundImage
                                    ? `linear-gradient(to right, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.6) 50%, transparent 100%), url(${category.backgroundImage})`
                                    : 'none',
                                backgroundColor: category.backgroundImage ? 'transparent' : category.color,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            <span className="category-icon">{category.icon}</span>
                            <span className="category-name">
                                {(isEnglish && category.name_en) ? category.name_en : category.name}
                            </span>
                            <span className="category-link">
                                {t('common.more_info')} <ChevronRight size={16} />
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
