import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { DARK_THEME, LIGHT_THEME } from '../constants/colors';
import { authAPI } from '../services/api/authAPI';
import { StatusBar } from 'expo-status-bar';
import { saveTheme, getTheme } from '../utils/storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { user } = useAuth();
    // Default to dark theme
    const [theme, setTheme] = useState(DARK_THEME);

    // Load theme from storage on mount
    useEffect(() => {
        const loadTheme = async () => {
            const savedThemeMode = await getTheme();
            if (savedThemeMode === 'light') {
                setTheme(LIGHT_THEME);
            } else if (savedThemeMode === 'dark') {
                setTheme(DARK_THEME);
            } else {
                // If no local theme, fallback to user setting or default
                if (user && user.mobileSettings && user.mobileSettings.theme === 'light') {
                    setTheme(LIGHT_THEME);
                } else {
                    setTheme(DARK_THEME);
                }
            }
        };
        loadTheme();
    }, [user]); // user dependency to update if no local setting found

    const toggleTheme = async (newThemeValue) => { // 'light' or 'dark'
        const newTheme = newThemeValue === 'light' ? LIGHT_THEME : DARK_THEME;
        setTheme(newTheme);

        // Save locally
        await saveTheme(newThemeValue);

        // Optional: Persist to DB (User said not strictly required, but harmless to keep if working)
        try {
            if (user) {
                authAPI.updateMobileSettings({ theme: newThemeValue }).catch(() => { });
            }
        } catch (error) {
            // Ignore error
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
