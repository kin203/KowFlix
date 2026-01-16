import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { wishlistAPI } from '../services/api/wishlistAPI';
import MovieCard from '../components/MovieCard';
import { COLORS, SPACING, FONT_SIZES } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../context/ThemeContext';

const WishlistScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchWishlist = async () => {
        try {
            const response = await wishlistAPI.getWishlist();
            if (response.data.success) {
                setMovies(response.data.data);
            }
        } catch (error) {
            console.error('Fetch wishlist error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchWishlist();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchWishlist();
    };

    const renderItem = ({ item }) => (
        <View style={styles.gridItem}>
            <MovieCard
                movie={item}
                onPress={() => navigation.push('MovieDetail', { movieId: item._id, movie: item })}
            />
        </View>
    );

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Danh sách yêu thích</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={movies}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="heart-dislike-outline" size={64} color={colors.textMuted || '#666'} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>Chưa có phim nào trong danh sách</Text>
                        </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
        // color handled dynamically
    },
    listContent: {
        padding: SPACING.md,
    },
    gridItem: {
        flex: 1 / 2,
        marginBottom: SPACING.md,
        alignItems: 'center',
        paddingHorizontal: SPACING.xs,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        // color handled dynamically
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.md,
    },
    backButton: {
        padding: 4,
    }
});

export default WishlistScreen;
