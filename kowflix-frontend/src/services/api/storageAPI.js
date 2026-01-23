import axios from 'axios';

// Storage Server URL (Configurable via env, default to local/remote)
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://192.168.100.52';
// const STORAGE_URL = 'https://nk203.id.vn'; // Backup remote

const storageAPI = {
    /**
     * Upload video directly to storage server
     * @param {File} file - Video file
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<string>} Uploaded file path
     */
    uploadVideo: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${STORAGE_URL}/api/upload/video`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(percentCompleted);
                }
            }
        });

        return response.data.path;
    },

    /**
     * Check server status
     */
    checkStatus: async () => {
        try {
            await axios.get(`${STORAGE_URL}/api/status`);
            return true;
        } catch (error) {
            return false;
        }
    }
};

export default storageAPI;
