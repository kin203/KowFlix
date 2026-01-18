import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS, FONT_SIZES } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Notification') {
                        iconName = focused ? 'notifications' : 'notifications-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary || COLORS.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingBottom: Platform.OS === 'ios' ? 0 : 5, // Let safe area handle iOS naturally, or adjust if needed
                    paddingTop: 5,
                    height: 60 + (Platform.OS === 'android' ? 0 : 0), // Adjust if needed, but for Android Edge-to-Edge we usually need layout adjustments.
                    // Wait, standard bottom tabs handle safe area automatically if NOT explicitly overridden with fixed height.
                    // But here we want a custom height.
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 5,
                },
                tabBarLabelStyle: {
                    fontSize: FONT_SIZES.xs,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarLabel: 'Trang chủ' }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{ tabBarLabel: 'Duyệt tìm' }}
            />
            <Tab.Screen
                name="Notification"
                component={NotificationScreen}
                options={{ tabBarLabel: 'Thông báo', tabBarBadge: null }} // Badge could be dynamic later
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Tài khoản' }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;

