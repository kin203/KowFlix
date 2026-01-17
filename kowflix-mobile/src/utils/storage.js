import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const KEYS = {
    TOKEN: '@kowflix_token',
    USER: '@kowflix_user',
    THEME: '@kowflix_theme',
};

// Save token
export const saveToken = async (token) => {
    try {
        await AsyncStorage.setItem(KEYS.TOKEN, token);
        return true;
    } catch (error) {
        console.error('Error saving token:', error);
        return false;
    }
};

// Get token
export const getToken = async () => {
    try {
        const token = await AsyncStorage.getItem(KEYS.TOKEN);
        return token;
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

// Remove token
export const removeToken = async () => {
    try {
        await AsyncStorage.removeItem(KEYS.TOKEN);
        return true;
    } catch (error) {
        console.error('Error removing token:', error);
        return false;
    }
};

// Save user data
export const saveUser = async (user) => {
    try {
        await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
        return true;
    } catch (error) {
        console.error('Error saving user:', error);
        return false;
    }
};

// Get user data
export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem(KEYS.USER);
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

// Remove user data
export const removeUser = async () => {
    try {
        await AsyncStorage.removeItem(KEYS.USER);
        return true;
    } catch (error) {
        console.error('Error removing user:', error);
        return false;
    }
};

// Save theme
export const saveTheme = async (theme) => {
    try {
        await AsyncStorage.setItem(KEYS.THEME, theme);
        return true;
    } catch (error) {
        console.error('Error saving theme:', error);
        return false;
    }
};

// Get theme
export const getTheme = async () => {
    try {
        const theme = await AsyncStorage.getItem(KEYS.THEME);
        return theme;
    } catch (error) {
        console.error('Error getting theme:', error);
        return null;
    }
};

// Clear all storage
export const clearStorage = async () => {
    try {
        await AsyncStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing storage:', error);
        return false;
    }
};
