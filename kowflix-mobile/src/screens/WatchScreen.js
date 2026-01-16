import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Text, BackHandler, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/colors';
import { movieAPI } from '../services/api/movieAPI';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTheme } from '../context/ThemeContext';

const WatchScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const { movie } = route.params;
    const [source, setSource] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State
    const [showControls, setShowControls] = useState(true);
    const [isLocked, setIsLocked] = useState(false);
    const [resizeMode, setResizeMode] = useState('contain'); // contain, cover
    const [showQualitySelector, setShowQualitySelector] = useState(false);

    // Player State
    const [activeQualities, setActiveQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState('Auto');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Refs
    const controlsTimeoutRef = useRef(null);
    const isTogglingRef = useRef(false);
    const savedTimeRef = useRef(0);

    // Initialize Video Player
    const player = useVideoPlayer(source, player => {
        player.loop = false;
        player.timeUpdateEventInterval = 0.5;
        if (source) {
            player.play();
            if (savedTimeRef.current > 0) {
                player.currentTime = savedTimeRef.current;
                savedTimeRef.current = 0; // Reset after seek
            }
            setIsPlaying(true);
        }
    });

    // --- State Synchronization ---
    useEffect(() => {
        if (!player) return;

        const subPlaying = player.addListener('playingChange', (playing) => {
            if (!isTogglingRef.current) {
                setIsPlaying(playing);
            }
            if (playing) {
                setIsLoading(false); // Hide loader when playing starts
            }
            if (player.duration > 0 && duration === 0) setDuration(player.duration);
        });

        const subTime = player.addListener('timeUpdate', (event) => {
            setCurrentTime(event.currentTime);
            if (player.duration > 0 && duration === 0) {
                setDuration(player.duration);
            }
            // Also hide loader if time is progressing (double check)
            if (event.currentTime > 0 && isLoading) {
                setIsLoading(false);
            }
            if (isPlaying && showControls && !isLocked && !showQualitySelector) {
                resetControlsTimeout();
            }
        });

        const subStatus = player.addListener('statusChange', (status) => {
            if (status.duration > 0) setDuration(status.duration);
            if (!isTogglingRef.current && typeof status.isPlaying === 'boolean') {
                setIsPlaying(status.isPlaying);
            }
            // If error or ready
            if (status.error) {
                setError('Lỗi phát video: ' + status.error.message);
                setIsLoading(false);
            }
        });

        return () => {
            subPlaying.remove();
            subTime.remove();
            subStatus.remove();
        };
    }, [player, showControls, isPlaying, isLocked, duration, showQualitySelector, isLoading]); // Added isLoading dependency


    // --- Controls Logic ---
    const resetControlsTimeout = () => {
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying && !isLocked && !showQualitySelector) {
                setShowControls(false);
            }
        }, 3000);
    };

    const toggleControls = () => {
        if (showQualitySelector) {
            setShowQualitySelector(false);
            return;
        }
        if (showControls) {
            setShowControls(false);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        } else {
            setShowControls(true);
            resetControlsTimeout();
        }
    };

    const togglePlay = () => {
        if (player) {
            isTogglingRef.current = true;
            const shouldPlay = !isPlaying;
            setIsPlaying(shouldPlay);

            if (shouldPlay) {
                player.play();
                resetControlsTimeout();
            } else {
                player.pause();
            }

            setTimeout(() => {
                isTogglingRef.current = false;
                if (player.playing !== shouldPlay) {
                    setIsPlaying(player.playing);
                }
            }, 600);
        }
    };

    const toggleResizeMode = () => {
        setResizeMode(prev => (prev === 'contain' ? 'cover' : 'contain'));
        resetControlsTimeout();
    };

    const seekBy = (seconds) => {
        if (player) {
            const newTime = Math.max(0, Math.min(player.duration, player.currentTime + seconds));
            player.currentTime = newTime;
            setCurrentTime(newTime);
            resetControlsTimeout();
        }
    };

    const seekTo = (value) => {
        if (player) {
            player.currentTime = value;
            setCurrentTime(value);
            resetControlsTimeout();
        }
    };

    const changeQuality = (qualityObj) => {
        if (qualityObj.quality === currentQuality) {
            setShowQualitySelector(false);
            return;
        }

        // Save time and switch
        savedTimeRef.current = currentTime;
        setIsLoading(true);
        setSource(qualityObj.url);
        setCurrentQuality(qualityObj.quality);
        setShowQualitySelector(false);
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };


    // --- API & Lifecycle ---
    const fetchStreamUrl = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await movieAPI.play(movie._id);
            if (response.data.success) {
                const data = response.data.data;
                let finalSource = null;
                let qualities = [];

                if (data.qualities && data.qualities.length > 0) {
                    // Extract qualities
                    qualities = data.qualities;
                    const preferred = qualities.find(q => q.quality === '1080p') ||
                        qualities.find(q => q.quality === '720p') ||
                        qualities[0];
                    finalSource = preferred.url;
                    setCurrentQuality(preferred.quality);
                } else if (data.master) {
                    // Just master HLS
                    qualities = [{ quality: 'Auto', url: data.master }];
                    finalSource = data.master;
                    setCurrentQuality('Auto');
                }

                if (finalSource) {
                    setActiveQualities(qualities);
                    setSource(finalSource);

                    // Track view
                    movieAPI.trackView(movie._id).catch(err => console.log('Track view error:', err));
                } else {
                    setError('Không tìm thấy nguồn phim.');
                }
            } else {
                setError('Lỗi kết nối máy chủ.');
            }
        } catch (err) {
            setError('Không thể tải phim.');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch data on mount
    useEffect(() => {
        if (!source) fetchStreamUrl();
    }, [movie._id]); // Only run once per movie

    // Handle Orientation and Back Button
    useFocusEffect(
        useCallback(() => {
            // Lock to LANDSCAPE when entering
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            // Hide StatusBar
            StatusBar.setHidden(true);

            const backAction = () => {
                if (showQualitySelector) {
                    setShowQualitySelector(false);
                    return true;
                }
                handleBack();
                return true;
            };
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

            return () => {
                // Cleanup: Unlock orientation and show status bar
                backHandler.remove();
                ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                StatusBar.setHidden(false);

                // Note: Player pause/cleanup is handled by the player hook/component unmount
            };
        }, []) // Empty dependency array to ensure this only runs on mount/unmount of the screen focus
    );

    // Initial pause on focus loss (optional, but good for cleanup)
    useFocusEffect(
        useCallback(() => {
            return () => {
                if (player) {
                    try { player.pause(); } catch (e) { }
                }
            };
        }, [player])
    );

    const handleBack = () => {
        navigation.goBack();
    };


    // --- Render ---
    return (
        <View style={styles.container}>
            <StatusBar hidden={true} />

            <TouchableWithoutFeedback onPress={toggleControls}>
                <View style={styles.videoContainer}>
                    {source ? (
                        <VideoView
                            style={StyleSheet.absoluteFill}
                            player={player}
                            nativeControls={false}
                            contentFit={resizeMode}
                        />
                    ) : (
                        !isLoading && (
                            <View style={styles.centerMsg}>
                                <TouchableOpacity style={styles.errorBackBtn} onPress={handleBack}>
                                    <Ionicons name="arrow-back" size={30} color="white" />
                                </TouchableOpacity>
                                <Ionicons name="alert-circle-outline" size={50} color={colors.error} />
                                <Text style={styles.errorText}>{error || 'Lỗi không xác định'}</Text>
                                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={fetchStreamUrl}>
                                    <Text style={styles.retryText}>Thử lại</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                </View>
            </TouchableWithoutFeedback>

            {/* Loading Indicator */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Đang tải phim...</Text>
                </View>
            )}

            {/* Controls Overlay */}
            {source && (showControls || !isPlaying || showQualitySelector) && (
                <View style={[styles.overlay, isLocked && styles.transparentOverlay]} pointerEvents="box-none">

                    {/* Header */}
                    {!isLocked && !showQualitySelector && (
                        <View style={styles.header}>
                            <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
                                <Ionicons name="chevron-back" size={30} color="white" />
                            </TouchableOpacity>
                            <Text style={styles.title} numberOfLines={1}>{movie.title}</Text>

                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={() => setShowQualitySelector(true)} style={styles.headerBtn}>
                                    <Ionicons name="settings-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsLocked(true)} style={styles.headerBtn}>
                                    <Ionicons name="lock-open-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Quality Selector Overlay */}
                    {showQualitySelector && (
                        <View style={styles.qualityOverlay}>
                            <Text style={styles.qualityTitle}>Chất lượng video</Text>
                            <ScrollView style={styles.qualityList}>
                                {activeQualities.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.qualityItem,
                                            currentQuality === item.quality && { borderBottomColor: colors.primary }
                                        ]}
                                        onPress={() => changeQuality(item)}
                                    >
                                        <Text style={[
                                            styles.qualityText,
                                            currentQuality === item.quality && { color: colors.primary, fontWeight: 'bold' }
                                        ]}>
                                            {item.quality}
                                        </Text>
                                        {currentQuality === item.quality && (
                                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.closeQualityBtn} onPress={() => setShowQualitySelector(false)}>
                                <Text style={styles.closeQualityText}>Đóng</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Locked State Button */}
                    {isLocked && !showQualitySelector && (
                        <View style={styles.lockedContainer}>
                            <TouchableOpacity onPress={() => setIsLocked(false)} style={styles.unlockBtn}>
                                <Ionicons name="lock-closed" size={20} color="black" />
                                <Text style={styles.unlockText}>Mở khóa</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Center Action Buttons */}
                    {!isLocked && !showQualitySelector && (
                        <View style={styles.centerControls}>
                            <TouchableOpacity onPress={() => seekBy(-10)} style={styles.controlBtn}>
                                <MaterialIcons name="replay-10" size={50} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={togglePlay} style={styles.playBtn}>
                                <Ionicons name={isPlaying ? "pause" : "play"} size={45} color="black" />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => seekBy(10)} style={styles.controlBtn}>
                                <MaterialIcons name="forward-10" size={50} color="white" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Bottom Bar */}
                    {!isLocked && !showQualitySelector && (
                        <View style={styles.bottomBar}>
                            <View style={styles.progressContainer}>
                                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={duration > 0 ? duration : 1}
                                    value={currentTime}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="rgba(255,255,255,0.3)"
                                    thumbTintColor={colors.primary}
                                    onSlidingComplete={seekTo}
                                />
                                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                            </View>

                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.actionItem} onPress={toggleResizeMode}>
                                    <MaterialIcons name="aspect-ratio" size={20} color="white" />
                                    <Text style={styles.actionText}>
                                        {resizeMode === 'contain' ? 'Vừa' : 'Zoom'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.actionItem}>
                                    <Ionicons name="chatbox-ellipses-outline" size={20} color="white" />
                                    <Text style={styles.actionText}>Phụ đề</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerMsg: { alignItems: 'center', justifyContent: 'center' },
    errorText: { color: 'white', marginTop: 10, fontSize: 16 },
    errorBackBtn: { position: 'absolute', top: -100, left: -150, padding: 10 },
    retryBtn: { marginTop: 15, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 5 }, // backgroundColor dynamic
    retryText: { color: 'black', fontWeight: 'bold' },

    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', zIndex: 20 },
    loadingText: { color: 'white', marginTop: 10 },

    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between', zIndex: 10 },
    transparentOverlay: { backgroundColor: 'transparent' },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
    headerBtn: { padding: 8 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    title: { flex: 1, color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginHorizontal: 10 },

    lockedContainer: { alignItems: 'flex-end', paddingTop: 20, paddingRight: 20 },
    unlockBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    unlockText: { fontWeight: 'bold', marginLeft: 4, color: 'black' },

    centerControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 50 },
    controlBtn: { alignItems: 'center' },
    playBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },

    bottomBar: { paddingHorizontal: 20, paddingBottom: 20 },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    slider: { flex: 1, marginHorizontal: 10, height: 40 },
    timeText: { color: 'white', fontSize: 13, minWidth: 45, textAlign: 'center' },

    actions: { flexDirection: 'row', justifyContent: 'center', gap: 30 },
    actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { color: 'white', fontSize: 14, fontWeight: '500' },

    qualityOverlay: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 250, backgroundColor: 'rgba(0,0,0,0.9)', padding: 20, zIndex: 30, justifyContent: 'center' },
    qualityTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    qualityList: { maxHeight: 200 },
    qualityItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
    activeQualityItem: { // handled in JSX style override
    },
    qualityText: { color: '#ccc', fontSize: 16 },
    activeQualityText: { // handled in JSX style override
    },
    closeQualityBtn: { marginTop: 20, padding: 10, backgroundColor: '#333', alignItems: 'center', borderRadius: 5 },
    closeQualityText: { color: 'white', fontWeight: 'bold' }
});

export default WatchScreen;
