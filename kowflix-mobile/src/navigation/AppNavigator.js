import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { SPLASH_DURATION } from '../constants/config';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import WatchScreen from '../screens/WatchScreen';
import WishlistScreen from '../screens/WishlistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

const Stack = createStackNavigator();

const AuthenticatedNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
                name="MovieDetail"
                component={MovieDetailScreen}
                options={{
                    animation: 'slide_from_right',
                    presentation: 'card'
                }}
            />
            <Stack.Screen
                name="Watch"
                component={WatchScreen}
                options={{
                    orientation: 'landscape', // Force landscape if using orientation package, else mostly handled by OS or Player
                    headerShown: false,
                    presentation: 'modal'
                }}
            />
            <Stack.Screen
                name="Wishlist"
                component={WishlistScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="History"
                component={HistoryScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ChangePassword"
                component={ChangePasswordScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        // Force Splash to show for exactly SPLASH_DURATION
        // "loading" from AuthContext is now fast (storage only), so this timer is the main constraint.
        const timer = setTimeout(() => {
            setShowSplash(false);
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, []); // Run once on mount

    // Only show splash if explicitly requested OR if we are still reading storage (very fast)
    // If showSplash is false (timer done) AND loading is false (storage read), we show app.
    if (showSplash || loading) {
        return <SplashScreen onFinish={() => { }} />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AuthenticatedNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default AppNavigator;
