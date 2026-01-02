// src/config/config.js
import dotenv from 'dotenv';

// Load environment variables immediately
dotenv.config();

/**
 * Validates that required environment variables are present
 * @param {string[]} requiredVars - Array of required environment variable names
 * @throws {Error} If any required variable is missing
 */
const validateEnvVars = (requiredVars) => {
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        console.warn(
            `⚠️  Warning: Missing environment variables: ${missing.join(', ')}\n` +
            `Some features may not work correctly. Please check your .env file.`
        );
    }
};

// Required environment variables (only critical ones)
const REQUIRED_VARS = [
    'MONGO_URI'
];

// Validate required variables
try {
    const missing = REQUIRED_VARS.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        throw new Error(
            `Missing critical environment variables: ${missing.join(', ')}\n` +
            `Please check your .env file and ensure all required variables are set.`
        );
    }
} catch (error) {
    console.error('❌ Configuration Error:', error.message);
    process.exit(1);
}

/**
 * Centralized configuration object
 */
const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        env: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV !== 'production',
        isProduction: process.env.NODE_ENV === 'production'
    },

    // Database Configuration
    database: {
        uri: process.env.MONGO_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || (() => {
            if (process.env.NODE_ENV === 'production') {
                throw new Error('JWT_SECRET is required in production!');
            }
            console.warn('⚠️  WARNING: Using default JWT_SECRET for development. Please set JWT_SECRET in .env file!');
            return 'dev-secret-key-please-change-in-production';
        })(),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },

    // Media Paths Configuration
    media: {
        root: process.env.MEDIA_ROOT || '',
        uploadDir: process.env.UPLOAD_DIR || 'uploads',
        posterDir: process.env.POSTER_DIR || 'posters',
        hlsDir: process.env.HLS_DIR || 'hls',
        thumbDir: process.env.THUMB_DIR || 'thumbnails',
        publicUrl: process.env.PUBLIC_MEDIA_URL || 'http://localhost:5000/media'
    },

    // Remote Agent Configuration (using Tunnel)
    remote: {
        agentUrl: process.env.REMOTE_AGENT_URL || 'https://nk203.id.vn',
        enabled: true // Always enabled if agentUrl is set (or defaulted)
    },

    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
        enabled: Boolean(
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_SECRET
        )
    },

    // TMDb API Configuration
    tmdb: {
        apiKey: process.env.TMDB_API_KEY || '',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p',
        enabled: Boolean(process.env.TMDB_API_KEY)
    },

    // CORS Configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    }
};

/**
 * Get configuration value by path
 * @param {string} path - Dot-separated path to config value (e.g., 'server.port')
 * @returns {*} Configuration value
 */
export const getConfig = (path) => {
    return path.split('.').reduce((obj, key) => obj?.[key], config);
};

/**
 * Check if a feature is enabled
 * @param {string} feature - Feature name (e.g., 'cloudinary', 'remote', 'tmdb')
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (feature) => {
    const featureConfig = config[feature];
    return featureConfig?.enabled === true;
};

export default config;
