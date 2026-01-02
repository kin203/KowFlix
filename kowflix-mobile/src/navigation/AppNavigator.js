import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import SplashScreen from '../screens/SplashScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import WatchScreen from '../screens/WatchScreen';
import WishlistScreen from '../screens/WishlistScreen';

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
        </Stack.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated, loading } = useAuth();
    const [showSplash, setShowSplash] = useState(true);

    useEffect(() => {
        if (!loading) {
            setTimeout(() => setShowSplash(false), 500);
        }
    }, [loading]);

    if (showSplash || loading) {
        return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? <AuthenticatedNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
};

export default AppNavigator;
