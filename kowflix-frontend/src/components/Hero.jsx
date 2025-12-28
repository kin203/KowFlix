import React, { useState, useEffect } from 'react';
import { Play, Info, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../services/api';
import MovieInfoModal from './MovieInfoModal';
import './Hero.css';

const Hero = ({ heroBanners = [] }) => {
    const [showModal, setShowModal] = useState(false);
    const [activeBanner, setActiveBanner] = useState(null);
    const [inWishlist, setInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
        if (heroBanners.length > 0 && !activeBanner) {
            setActiveBanner(heroBanners[0]);
        }
    }, [heroBanners, activeBanner]);

    // Check if movie is in wishlist
    useEffect(() => {
        const checkWishlist = async () => {
            if (!activeBanner?.movieId?._id) return;
            try {
                const { data } = await wishlistAPI.check(activeBanner.movieId._id);
                setInWishlist(data.data.inWishlist);
            } catch (error) {
                console.error('Error checking wishlist:', error);
            }
        };
        checkWishlist();
    }, [activeBanner]);

    if (!activeBanner || !activeBanner.movieId) return null;

    const handleToggleWishlist = async () => {
        if (wishlistLoading) return;
        setWishlistLoading(true);
        try {
            if (inWishlist) {
                await wishlistAPI.remove(movie._id);
                setInWishlist(false);
            } else {
                await wishlistAPI.add(movie._id);
                setInWishlist(true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert(error.response?.data?.message || 'Vui lòng đăng nhập để thêm vào yêu thích');
        } finally {
            setWishlistLoading(false);
        }
    };

    // Extract movie data from populated movieId
    const movie = activeBanner.movieId;
    const title = activeBanner.title || movie.title;
    const description = activeBanner.description || movie.description;
    // Prioritize backdrop for better quality, then custom imageUrl, then poster as fallback
    const imageUrl = movie.backdrop || activeBanner.imageUrl || movie.poster;

    const year = movie.releaseYear || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '2024');

    const formatRuntime = (minutes) => {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    // YouTube embed URL for trailer
    const getTrailerUrl = (trailerKey) => {
        if (!trailerKey) return null;
        return `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
    };

    const trailerUrl = (movie.useTrailer !== false) ? getTrailerUrl(movie.trailerKey) : null;

    return (
        <>
            <div className="hero">
                {/* Video Trailer or Backdrop Image */}
                {trailerUrl ? (
                    <iframe
                        className="hero-video"
                        src={trailerUrl}
                        title="Movie Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <div
                        className="hero-background"
                        style={{
                            backgroundImage: `url(${imageUrl})`
                        }}
                    />
                )}

                {/* Preload trailers for carousel banners */}
                {heroBanners.map((banner) => {
                    const m = banner.movieId;
                    if (!m || banner._id === activeBanner._id || !m.trailerKey || m.useTrailer === false) return null;
                    return (
                        <iframe
                            key={banner._id}
                            src={getTrailerUrl(m.trailerKey)}
                            title={`Preload ${banner.title}`}
                            style={{ display: 'none' }}
                            frameBorder="0"
                        />
                    );
                })}

                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1 className="hero-title">{title}</h1>

                    <div className="hero-meta">
                        {movie.imdbRating && (
                            <span className="badge badge-rating">
                                IMDb {movie.imdbRating.toFixed(1)}
                            </span>
                        )}
                        <span className="badge badge-year">{year}</span>
                        {movie.runtime && (
                            <span className="badge badge-duration">
                                {formatRuntime(movie.runtime)}
                            </span>
                        )}
                        <span className="badge badge-quality">HD</span>
                    </div>

                    {movie.genres && movie.genres.length > 0 && (
                        <div className="hero-genres">
                            {movie.genres.slice(0, 4).map((genre, index) => (
                                <span key={index} className="genre-tag">{genre}</span>
                            ))}
                        </div>
                    )}

                    <p className="hero-description">{description}</p>

                    <div className="hero-buttons">
                        <Link to={`/watch/${movie._id}`} className="btn-play">
                            <Play fill="black" size={24} />
                            <span>Xem ngay</span>
                        </Link>
                        <button className="btn-info" onClick={() => setShowModal(true)}>
                            <Info size={24} />
                        </button>
                        <button
                            className={`btn-favorite ${inWishlist ? 'active' : ''}`}
                            onClick={handleToggleWishlist}
                            disabled={wishlistLoading}
                        >
                            <Heart size={24} fill={inWishlist ? 'currentColor' : 'none'} />
                        </button>
                    </div>
                </div>

                <div className="hero-carousel">
                    {heroBanners.map((banner) => (
                        <div
                            key={banner._id}
                            className={`carousel-item ${activeBanner._id === banner._id ? 'active' : ''}`}
                            onClick={() => setActiveBanner(banner)}
                        >
                            <img src={banner.movieId?.backdrop || banner.imageUrl || banner.movieId?.poster} alt={banner.title} />
                        </div>
                    ))}
                </div>
            </div>

            {showModal && (
                <MovieInfoModal
                    movie={movie}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default Hero;