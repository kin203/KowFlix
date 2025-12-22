import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api/authAPI';
import { saveToken, getToken, removeToken, saveUser, getUser, removeUser } from '../utils/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is logged in on app start
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await getToken();
            if (token) {
                // Fetch user profile
                const response = await authAPI.getProfile();
                if (response.data.success) {
                    setUser(response.data.data);
                    setIsAuthenticated(true);
                } else {
                    // Invalid token
                    await logout();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            if (response.data.success) {
                const { token, user } = response.data.data;
                await saveToken(token);
                await saveUser(user);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng nhập thất bại'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            if (response.data.success) {
                const { token, user } = response.data.data;
                await saveToken(token);
                await saveUser(user);
                setUser(user);
                setIsAuthenticated(true);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Registration failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng ký thất bại'
            };
        }
    };

    const logout = async () => {
        try {
            await removeToken();
            await removeUser();
            setUser(null);
            setIsAuthenticated(false);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const updateUserProfile = async (data) => {
        try {
            const response = await authAPI.updateProfile(data);
            if (response.data.success) {
                setUser(response.data.data);
                await saveUser(response.data.data);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Update profile failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật thất bại'
            };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated,
                login,
                register,
                logout,
                updateUserProfile,
                refreshUser: checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
