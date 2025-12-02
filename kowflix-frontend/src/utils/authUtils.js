// Helper function to decode JWT token and get userId
export const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        // Decode JWT token (format: header.payload.signature)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload.userId || payload._id;
    } catch (error) {
        console.error('Error decoding token');
        return null;
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};
