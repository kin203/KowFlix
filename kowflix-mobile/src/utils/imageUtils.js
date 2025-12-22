import { MEDIA_BASE_URL, IMAGE_PLACEHOLDER } from '../constants/config';

/**
 * Helper to get full media URL
 * @param {string} path - The image path from API (could be relative or full URL)
 * @returns {string} - Full usable URL for React Native Image component
 */
export const getImageUrl = (path) => {
    if (!path) return IMAGE_PLACEHOLDER;

    // If it's already a full URL (cloudinary or external)
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // If it's a data URI (base64)
    if (path.startsWith('data:image')) {
        return path;
    }

    // Normalize path: replace backslashes (Windows) with forward slashes
    let cleanPath = path.replace(/\\/g, '/');

    // If it's a relative path, append base url
    // Add slash if missing
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${MEDIA_BASE_URL}${cleanPath}`;
};
