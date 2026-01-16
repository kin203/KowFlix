import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { COLORS, FONT_WEIGHTS, FONT_SIZES } from '../constants/colors';
import { APP_NAME, APP_SLOGAN, SPLASH_DURATION } from '../constants/config';

const SplashScreen = ({ onFinish }) => {
    // Start with opacity 0
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Parallel animation: Fade In
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Timer to finish
        const timer = setTimeout(() => {
            onFinish();
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* App Name */}
                <Text style={styles.logoText}>{APP_NAME}</Text>

                {/* Slogan */}
                <Text style={styles.slogan}>{APP_SLOGAN}</Text>
            </Animated.View>
        </View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure Black
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        width: '100%',
    },
    logoText: {
        fontSize: 48,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.primary, // Gold/Yellow
        marginBottom: 10,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    slogan: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        letterSpacing: 1,
    },
});

export default SplashScreen;
