import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { APP_NAME, APP_SLOGAN, SPLASH_DURATION } from '../constants/config';

const SplashScreen = ({ onFinish }) => {
    const fadeAnim = new Animated.Value(0);

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Auto navigate after duration
        const timer = setTimeout(() => {
            onFinish();
        }, SPLASH_DURATION);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <Text style={styles.logo}>{APP_NAME}</Text>
                <Text style={styles.slogan}>{APP_SLOGAN}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
    },
    logo: {
        fontSize: 48,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.primary,
        marginBottom: 16,
        letterSpacing: 2,
    },
    slogan: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
});

export default SplashScreen;
