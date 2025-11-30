// src/components/SkeletonLoader.jsx
import './SkeletonLoader.css';

export const MovieCardSkeleton = () => (
    <div className="movie-card-skeleton">
        <div className="skeleton-poster shimmer"></div>
    </div>
);

export const MovieSliderSkeleton = () => (
    <div className="movie-slider">
        <div className="skeleton-title shimmer"></div>
        <div className="slider-container">
            {[...Array(6)].map((_, i) => (
                <MovieCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

export const HeroSkeleton = () => (
    <div className="hero-skeleton">
        <div className="skeleton-hero-bg shimmer"></div>
        <div className="skeleton-hero-content">
            <div className="skeleton-hero-title shimmer"></div>
            <div className="skeleton-hero-desc shimmer"></div>
            <div className="skeleton-hero-desc shimmer" style={{ width: '70%' }}></div>
            <div className="skeleton-hero-buttons">
                <div className="skeleton-btn shimmer"></div>
                <div className="skeleton-btn shimmer"></div>
            </div>
        </div>
    </div>
);

export const CategoryCardSkeleton = () => (
    <div className="category-card-skeleton shimmer"></div>
);

export default { MovieCardSkeleton, MovieSliderSkeleton, HeroSkeleton, CategoryCardSkeleton };
