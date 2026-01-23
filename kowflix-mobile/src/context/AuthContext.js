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
            // 1. Fast check: Read token from storage
            const token = await getToken();

            if (token) {
                // Optimistically set authenticated so app can load Home immediately
                setIsAuthenticated(true);

                // 2. Background check: Fetch user profile
                // We do NOT await this before setting loading=false
                fetchProfileInBackground();
            }
        } catch (error) {
            // console.error('Auth check failed:', error);
            await logout();
        } finally {
            // Unblock Splash Screen immediately after storage check
            setLoading(false);
        }
    };

    const fetchProfileInBackground = async () => {
        try {
            const response = await authAPI.getProfile();
            if (response.data.success) {
                setUser(response.data.data);
            } else {
                // Token invalid - logout silently or prompt user?
                // For now, silent logout to avoid jarring UX if it happens rarely
                // console.log('Token invalid in background check');
                await logout();
            }
        } catch (error) {
            // console.error('Background profile fetch failed:', error);
            // If network error, we might still want to keep the user "logged in" with cached data if we had it.
            // But since we don't persist user profile to storage yet, we might end up with no user data.
            // For now, if 401, logout. Else keep authenticated (maybe offline).
            if (error.response?.status === 401) {
                await logout();
            }
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
            // console.error('Login failed:', error);
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
            // console.error('Registration failed:', error);
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
            // console.error('Logout failed:', error);
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
            // console.error('Update profile failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Cập nhật thất bại'
            };
        }
    };

    const updateMobileSettings = async (settings) => {
        try {
            const response = await authAPI.updateMobileSettings(settings);
            if (response.data.success) {
                // Merge new settings with existing user data
                const updatedUser = {
                    ...user,
                    mobileSettings: {
                        ...user.mobileSettings,
                        ...settings
                    }
                };
                setUser(updatedUser);
                await saveUser(updatedUser);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            console.error('Update settings failed:', error);
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
                updateMobileSettings,
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
