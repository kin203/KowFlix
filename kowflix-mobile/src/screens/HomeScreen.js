import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { movieAPI } from '../services/api/movieAPI';
import { categoryAPI } from '../services/api/categoryAPI';
import { heroAPI } from '../services/api/heroAPI';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';

// Components
import HeroCarousel from '../components/HeroCarousel';
import CategoryChip from '../components/CategoryChip';
import MovieCarousel from '../components/MovieCarousel';

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [movies, setMovies] = useState([]); // Trending
    const [topRatedMovies, setTopRatedMovies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [heroBanners, setHeroBanners] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [moviesRes, categoriesRes, heroRes, topRatedRes] = await Promise.all([
                movieAPI.getAll({ limit: 10 }), // Trending
                categoryAPI.getActive(),
                heroAPI.getAll(true),
                movieAPI.getAll({ limit: 10, sort: '-rating' }) // Top Rated simulation
            ]);

            if (moviesRes.data.success) {
                setMovies(moviesRes.data.data || []);
            }

            if (categoriesRes.data.success) {
                setCategories(categoriesRes.data.data || []);
            }

            if (heroRes.data.success) {
                setHeroBanners(heroRes.data.data || []);
            }

            if (topRatedRes.data.success) {
                setTopRatedMovies(topRatedRes.data.data || []);
            } else {
                // Fallback if API flexible sorting not supported yet, just use some movies
                setTopRatedMovies(moviesRes.data.data?.slice(0, 5) || []);
            }

        } catch (error) {
            console.error('Failed to fetch home data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleMoviePress = (movie) => {
        // Navigate to WatchScreen (TODO: Implement WatchScreen)
        console.log('Movie pressed:', movie.title);
        // navigation.navigate('Watch', { movieId: movie._id });
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        // TODO: Filter movies or navigate to CategoryScreen
        console.log('Category selected:', category.name);
        navigation.navigate('Search', { categoryId: category._id, categoryName: category.name });
    };

    const handlePlayPress = (movie) => {
        console.log('Play pressed:', movie.title);
        // navigation.navigate('Watch', { movieId: movie._id });
    };

    const handleInfoPress = (movie) => {
        console.log('Info pressed:', movie.title);
        // Show modal or navigate to details
    };

    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, { paddingTop: 0 }]}>
            {/* Remove paddingTop here and handle it inside ScrollView or Header if needed for translucent effect */}
            {/* But for now let's keep it simple with black background behind status bar */}

            <StatusBarTranslucent />

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        progressViewOffset={insets.top} // Ensure spinner is visible
                    />
                }
                contentContainerStyle={{ paddingBottom: 130 }} // Increased space for bottom tab safe area
            >
                {/* Hero Carousel - Edge to Edge */}
                <HeroCarousel
                    banners={heroBanners}
                    onPlayPress={handlePlayPress}
                    onInfoPress={handleInfoPress}
                />

                {/* Categories */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Danh mục</Text>
                    <CategoryChip
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelect={handleCategorySelect}
                    />
                </View>

                {/* Trending Movies */}
                <MovieCarousel
                    title="Phim Mới Cập Nhật"
                    movies={movies}
                    onMoviePress={handleMoviePress}
                />

                {/* Top Rated Movies */}
                <MovieCarousel
                    title="Đánh Giá Cao"
                    movies={topRatedMovies}
                    onMoviePress={handleMoviePress}
                />

            </ScrollView>
        </View>
    );
};

// Helper component for StatusBar style
const StatusBarTranslucent = () => {
    return (
        <View style={{ position: 'absolute', top: 0 }} />
        // StatusBar is controlled by App.js, but we ensure layout is correct
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    loadingText: {
        color: COLORS.text,
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.md,
    },
    sectionContainer: {
        marginTop: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.text,
        marginLeft: SPACING.lg,
        marginBottom: SPACING.md,
    },
});

export default HomeScreen;

