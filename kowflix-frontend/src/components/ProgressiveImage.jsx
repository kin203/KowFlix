// src/components/ProgressiveImage.jsx
import { useState, useEffect } from 'react';
import './ProgressiveImage.css';

const ProgressiveImage = ({ src, lqip, alt, className = '' }) => {
    const [imageSrc, setImageSrc] = useState(lqip || src);
    const [imageLoading, setImageLoading] = useState(true);

    useEffect(() => {
        if (!src) return;

        const img = new Image();
        img.src = src;

        img.onload = () => {
            setImageSrc(src);
            setImageLoading(false);
        };

        img.onerror = () => {
            setImageLoading(false);
        };
    }, [src]);

    return (
        <div className={`progressive-image-container ${className}`}>
            <img
                src={imageSrc}
                alt={alt}
                className={`progressive-image ${imageLoading && lqip ? 'loading' : 'loaded'}`}
            />
            {imageLoading && (
                <div className="image-loader">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
};

export default ProgressiveImage;
