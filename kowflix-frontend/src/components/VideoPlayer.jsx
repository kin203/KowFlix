// src/components/VideoPlayer.jsx
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Hls from 'hls.js';
import './VideoPlayer.css';

const VideoPlayer = ({ src, poster, onProgress, initialTime = 0, movieId, subtitles = [] }) => {
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(initialTime);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
    const [audioTracks, setAudioTracks] = useState([]);
    const [currentAudio, setCurrentAudio] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [isLoadingQuality, setIsLoadingQuality] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [currentSubtitle, setCurrentSubtitle] = useState(-1); // -1 = Off

    // Initialize HLS
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });

            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Get available qualities
                const levels = hls.levels.map((level, index) => ({
                    index,
                    height: level.height,
                    bitrate: level.bitrate,
                    label: `${level.height}p`
                }));
                setQualities(levels);

                // Get audio tracks
                if (hls.audioTracks.length > 0) {
                    const tracks = hls.audioTracks.map((track, index) => ({
                        index,
                        name: track.name || track.lang || `Track ${index + 1}`,
                        lang: track.lang
                    }));
                    setAudioTracks(tracks);
                }

                // Seek to initial time if provided
                if (initialTime > 0) {
                    video.currentTime = initialTime;
                }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS Error:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error, trying to recover...');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error, trying to recover...');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.error('Fatal error, cannot recover');
                            hls.destroy();
                            break;
                    }
                }
            });

            hlsRef.current = hls;

            return () => {
                hls.destroy();
            };
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = src;
        }
    }, [src, initialTime]);

    // Auto-save progress every 10 seconds
    useEffect(() => {
        if (isPlaying && onProgress) {
            progressIntervalRef.current = setInterval(() => {
                if (videoRef.current) {
                    onProgress({
                        currentTime: videoRef.current.currentTime,
                        duration: videoRef.current.duration
                    });
                }
            }, 10000); // Save every 10 seconds

            return () => {
                if (progressIntervalRef.current) {
                    clearInterval(progressIntervalRef.current);
                }
            };
        }
    }, [isPlaying, onProgress]);

    // Save progress on unmount
    useEffect(() => {
        return () => {
            if (onProgress && videoRef.current) {
                onProgress({
                    currentTime: videoRef.current.currentTime,
                    duration: videoRef.current.duration
                });
            }
        };
    }, [onProgress]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls && isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);

            return () => {
                if (controlsTimeoutRef.current) {
                    clearTimeout(controlsTimeoutRef.current);
                }
            };
        }
    }, [showControls, isPlaying]);

    // Video event handlers
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);

            // Update buffered
            if (videoRef.current.buffered.length > 0) {
                const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
                setBuffered((bufferedEnd / videoRef.current.duration) * 100);
            }
        }
    };
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // Control handlers
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const handleSeek = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (videoRef.current) {
            videoRef.current.currentTime = pos * duration;
        }
    };

    const handleProgressHover = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        setHoverTime(pos * duration);
    };

    const handleProgressLeave = () => {
        setHoverTime(null);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            setIsMuted(newVolume === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            videoRef.current.muted = newMuted;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            videoRef.current?.parentElement?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const changeQuality = (levelIndex) => {
        if (hlsRef.current && videoRef.current && !isLoadingQuality) {
            setIsLoadingQuality(true);
            const wasPlaying = !videoRef.current.paused;
            const savedTime = videoRef.current.currentTime;

            // Pause video during quality switch to prevent glitches
            if (wasPlaying) {
                videoRef.current.pause();
            }

            // Change quality level
            hlsRef.current.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
            setShowSettings(false);

            // Wait for level switch to complete, then restore playback state
            const onLevelSwitched = () => {
                if (videoRef.current) {
                    // Restore time position
                    videoRef.current.currentTime = savedTime;

                    // Small delay to ensure new segments are loaded
                    setTimeout(() => {
                        if (videoRef.current && wasPlaying) {
                            videoRef.current.play().catch(err => {
                                console.error('Failed to resume playback:', err);
                            });
                        }
                        setIsLoadingQuality(false);
                    }, 100);
                }

                // Remove the event listener after handling
                hlsRef.current?.off(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
            };

            // Fallback timeout in case event doesn't fire
            const fallbackTimeout = setTimeout(() => {
                setIsLoadingQuality(false);
                hlsRef.current?.off(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
            }, 3000);

            hlsRef.current.on(Hls.Events.LEVEL_SWITCHED, () => {
                clearTimeout(fallbackTimeout);
                onLevelSwitched();
            });
        }
    };

    const changeAudioTrack = (trackIndex) => {
        if (hlsRef.current) {
            hlsRef.current.audioTrack = trackIndex;
            setCurrentAudio(trackIndex);
            setShowSettings(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ignore if typing in input or textarea
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
                return;
            }

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (videoRef.current) videoRef.current.currentTime -= 10;
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (videoRef.current) videoRef.current.currentTime += 10;
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    toggleMute();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying]);

    // Format time as HH:MM:SS or MM:SS
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`video-player-container ${!showControls ? 'hide-cursor' : ''}`}
            onMouseMove={() => setShowControls(true)}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
            <video
                ref={videoRef}
                className="video-player"
                poster={poster}
                onPlay={handlePlay}
                onPause={handlePause}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                crossOrigin="anonymous"
            >
                {/* Add subtitle tracks */}
                {subtitles && subtitles.map((subtitle, index) => (
                    <track
                        key={index}
                        kind="subtitles"
                        src={subtitle.path}
                        srcLang={subtitle.language}
                        label={subtitle.label}
                        default={subtitle.default}
                    />
                ))}
            </video>

            {/* Loading indicator during quality switch */}
            {isLoadingQuality && (
                <div className="quality-loading">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {/* Controls Overlay */}
            <div className={`video-controls ${showControls ? 'show' : ''}`}>
                {/* Progress Bar */}
                <div
                    className="kf-video-progress-container"
                    onClick={handleSeek}
                    onMouseMove={handleProgressHover}
                    onMouseLeave={handleProgressLeave}
                >
                    <div className="kf-video-progress-buffered" style={{ width: `${buffered}%` }} />
                    <div className="kf-video-progress-played" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    <div className="kf-video-progress-thumb" style={{ left: `${(currentTime / duration) * 100}%` }} />

                    {/* Hover time tooltip */}
                    {hoverTime !== null && (
                        <div
                            className="kf-video-progress-tooltip"
                            style={{ left: `${(hoverTime / duration) * 100}%` }}
                        >
                            {formatTime(hoverTime)}
                        </div>
                    )}
                </div>

                {/* Bottom Controls */}
                <div className="controls-bottom">
                    <div className="controls-left">
                        <button className="control-btn" onClick={togglePlay}>
                            {isPlaying ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>

                        <div className="volume-control">
                            <button className="control-btn" onClick={toggleMute}>
                                {isMuted || volume === 0 ? (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                                    </svg>
                                ) : (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                    </svg>
                                )}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                        </div>

                        <span className="time-display">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="controls-right">
                        <button className="control-btn" onClick={() => setShowSettings(!showSettings)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                            </svg>
                        </button>

                        <button className="control-btn" onClick={toggleFullscreen}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                {isFullscreen ? (
                                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                                ) : (
                                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Menu */}
            {showSettings && (
                <div className="settings-menu">
                    <div className="settings-section">
                        <h4>{t('player.quality')}</h4>
                        <button
                            className={currentQuality === -1 ? 'active' : ''}
                            onClick={() => changeQuality(-1)}
                            disabled={isLoadingQuality}
                        >
                            {t('player.auto')}
                        </button>
                        {qualities.map((quality) => (
                            <button
                                key={quality.index}
                                className={currentQuality === quality.index ? 'active' : ''}
                                onClick={() => changeQuality(quality.index)}
                                disabled={isLoadingQuality}
                            >
                                {quality.label}
                            </button>
                        ))}
                    </div>

                    {audioTracks.length > 1 && (
                        <div className="settings-section">
                            <h4>{t('player.audio')}</h4>
                            {audioTracks.map((track) => (
                                <button
                                    key={track.index}
                                    className={currentAudio === track.index ? 'active' : ''}
                                    onClick={() => changeAudioTrack(track.index)}
                                >
                                    {track.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Subtitles Section */}
                    {subtitles && subtitles.length > 0 && (
                        <div className="settings-section">
                            <h4>{t('player.subtitles')}</h4>
                            <button
                                className={currentSubtitle === -1 ? 'active' : ''}
                                onClick={() => {
                                    setCurrentSubtitle(-1);
                                    // Disable all text tracks
                                    if (videoRef.current) {
                                        Array.from(videoRef.current.textTracks).forEach(track => {
                                            track.mode = 'disabled';
                                        });
                                    }
                                }}
                            >
                                {t('player.off')}
                            </button>
                            {subtitles.map((subtitle, index) => (
                                <button
                                    key={index}
                                    className={currentSubtitle === index ? 'active' : ''}
                                    onClick={() => {
                                        setCurrentSubtitle(index);
                                        // Enable selected track, disable others
                                        if (videoRef.current) {
                                            Array.from(videoRef.current.textTracks).forEach((track, i) => {
                                                track.mode = i === index ? 'showing' : 'disabled';
                                            });
                                        }
                                    }}
                                >
                                    {subtitle.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;
