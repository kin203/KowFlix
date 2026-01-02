import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

const WatchScreen = ({ route, navigation }) => {
    const { movie } = route.params;
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(true);

    // Prioritize streamUrl, fallback to videoUrl or trailerUrl
    const videoUrl = movie.streamUrl || movie.videoUrl || (movie.trailerKey ? `https://www.youtube.com/embed/${movie.trailerKey}` : null);

    // Simple HTML content to wrap video if it's a direct file, ensuring full screen
    // For HLS, modern WebViews handle it, or we can use a player like Clappr/VideoJS in the HTML.
    // simpler approach: Direct link for WebView often works for simple playback.
    // But for better control, we might want to inject a player.
    // For this MVP, we will try direct load first.

    // If it's a youtube link or embed, direct URI is fine.

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />
            <View style={styles.playerContainer}>
                {videoUrl ? (
                    <WebView
                        source={{ uri: videoUrl }}
                        style={styles.webview}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsFullscreenVideo={true}
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        mediaPlaybackRequiresUserAction={false}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        )}
                    />
                ) : (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={50} color={COLORS.textSecondary} />
                        <Text style={styles.errorText}>Không tìm thấy nguồn phát phim.</Text>
                    </View>
                )}
            </View>

            {/* Back Button Overlay */}
            <TouchableOpacity
                style={[styles.backButton, { top: insets.top + 10 }]}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    playerContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    webview: {
        flex: 1,
        backgroundColor: '#000',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: COLORS.textSecondary,
        marginTop: 10,
    }
});

export default WatchScreen;
