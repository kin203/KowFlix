import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { DARK_THEME, LIGHT_THEME } from '../constants/colors';
import { authAPI } from '../services/api/authAPI';
import { StatusBar } from 'expo-status-bar';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    // Default to dark theme if no user or no setting
    const [theme, setTheme] = useState(DARK_THEME);

    useEffect(() => {
        if (user && user.mobileSettings && user.mobileSettings.theme === 'light') {
            setTheme(LIGHT_THEME);
        } else {
            setTheme(DARK_THEME);
        }
    }, [user, user?.mobileSettings?.theme]);

    const toggleTheme = async (newThemeValue) => { // 'light' or 'dark'
        const newTheme = newThemeValue === 'light' ? LIGHT_THEME : DARK_THEME;
        setTheme(newTheme);

        try {
            await authAPI.updateMobileSettings({ theme: newThemeValue });
        } catch (error) {
            console.error('Failed to persist theme:', error);
            // Revert on error? Or just log.
        }
    };

    return (
        <ThemeContext.Provider value={{ colors: theme, themeMode: theme.mode, toggleTheme }}>
            <StatusBar style={theme.statusBar} />
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
