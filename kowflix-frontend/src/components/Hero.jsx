import React, { useState } from 'react';
import { Play, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import MovieInfoModal from './MovieInfoModal';
import './Hero.css';

const Hero = ({ movie }) => {
    const [showModal, setShowModal] = useState(false);

    // Fallback if no movie provided
    if (!movie) return null;

    return (
        <>
            <div
                className="hero"
                style={{ backgroundImage: `url(${movie.poster || ''})` }}
            >
                <div className="hero-overlay"></div>

                <div className="hero-content">
                    <h1 className="hero-title">{movie.title}</h1>
                    <p className="hero-description">{movie.description}</p>

                    <div className="hero-buttons">
                        <Link to={`/watch/${movie._id}`} className="btn-play">
                            <Play fill="black" size={24} /> Play
                        </Link>
                        <button className="btn-info" onClick={() => setShowModal(true)}>
                            <Info size={24} /> More Info
                        </button>
                    </div>
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
