import { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import '../pages/VideoError.css';

const VideoPlayerWrapper = ({ src, poster, onProgress, initialTime, movieId, subtitles }) => {
    const [hlsError, setHlsError] = useState(null);

    // Listen for HLS errors from console
    useEffect(() => {
        const originalConsoleError = console.error;

        console.error = (...args) => {
            // Call original console.error
            originalConsoleError.apply(console, args);

            // Check if it's an HLS error
            if (args[0] === 'HLS Error:' && args[1]) {
                const data = args[1];

                // Show error for network errors (even non-fatal)
                if (data.type === 'networkError' && data.details === 'levelLoadError') {
                    setHlsError({
                        code: 'ERR_03',
                        message: 'Không thể tải video. Vui lòng kiểm tra kết nối mạng.'
                    });
                }

                // Handle fatal errors
                if (data.fatal) {
                    if (data.type === 'networkError') {
                        setHlsError({
                            code: 'ERR_03',
                            message: 'Lỗi kết nối mạng. Đang thử khôi phục...'
                        });
                    } else if (data.type === 'mediaError') {
                        setHlsError({
                            code: 'ERR_04',
                            message: 'Lỗi phát video. Đang thử khôi phục...'
                        });
                    } else {
                        setHlsError({
                            code: 'ERR_05',
                            message: 'Lỗi nghiêm trọng. Không thể phát video.'
                        });
                    }
                }
            }
        };

        return () => {
            console.error = originalConsoleError;
        };
    }, []);

    if (hlsError) {
        return (
            <div className="video-error-container">
                <div className="error-icon">⚠️</div>
                <div className="error-code">{hlsError.code}</div>
                <div className="error-message">{hlsError.message}</div>
            </div>
        );
    }

    return (
        <VideoPlayer
            src={src}
            poster={poster}
            onProgress={onProgress}
            initialTime={initialTime}
            movieId={movieId}
            subtitles={subtitles}
        />
    );
};

export default VideoPlayerWrapper;
