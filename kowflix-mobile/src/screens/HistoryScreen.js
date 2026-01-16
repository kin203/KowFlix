import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { progressAPI } from '../services/api/progressAPI';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import { getImageUrl } from '../utils/imageUtils';

import { useTheme } from '../context/ThemeContext';

const HistoryScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await progressAPI.getWatchHistory();
            if (res.data.success) {
                setHistory(res.data.data);
            }
        } catch (error) {
            console.error('Fetch history error:', error);
            // Don't show alert on simple fetch failure to avoid annoyance, just log
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const handleMoviePress = (item) => {
        navigation.navigate('MovieDetail', { movieId: item.movie._id, movie: item.movie });
    };

    const renderItem = ({ item }) => {
        // item structure from backend: { _id, movie: {...}, currentTime, duration, percentage, lastWatched }
        const movie = item.movie;
        if (!movie) return null;

        const progressPercent = Math.round(item.percentage);

        return (
            <TouchableOpacity
                style={[styles.itemContainer, { backgroundColor: colors.backgroundCard }]}
                onPress={() => handleMoviePress(item)}
            >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                    <Image
                        source={{ uri: getImageUrl(movie.poster) }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                    {/* Progress Bar overlay on bottom of thumbnail */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: colors.primary }]} />
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{movie.title}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {new Date(item.lastWatched).toLocaleDateString('vi-VN')}
                    </Text>
                    <View style={styles.metaContainer}>
                        <Text style={[styles.progressText, { color: colors.primary }]}>Đã xem {progressPercent}%</Text>
                        <Ionicons name="play-circle-outline" size={16} color={colors.primary} style={{ marginLeft: 8 }} />
                    </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textMuted || '#666'} />
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Lịch sử xem</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="time-outline" size={64} color={colors.textMuted || '#666'} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Bạn chưa xem phim nào</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={[
                        styles.listContent,
                        { paddingBottom: insets.bottom + SPACING.lg }
                    ]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    backButton: {
        marginRight: SPACING.md,
        padding: 4,
    },
    headerTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.bold,
        // color handled dynamically
    },
    listContent: {
        padding: SPACING.md,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor handled dynamically
        marginBottom: SPACING.md,
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
    },
    thumbnailContainer: {
        position: 'relative',
        width: 80,
        height: 120,
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    progressBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    progressBarFill: {
        height: '100%',
        // backgroundColor handled dynamically
    },
    infoContainer: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'center',
    },
    title: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        // color handled dynamically
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FONT_SIZES.xs,
        // color handled dynamically
        marginBottom: 8,
    },
    metaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontSize: FONT_SIZES.xs,
        // color handled dynamically
        fontWeight: FONT_WEIGHTS.medium,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: SPACING.md,
        // color handled dynamically
        fontSize: FONT_SIZES.md,
    },
});

export default HistoryScreen;
