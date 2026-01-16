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
import { SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme } from '../context/ThemeContext';

// Components
import HeroCarousel from '../components/HeroCarousel';
import CategoryChip from '../components/CategoryChip';
import MovieCarousel from '../components/MovieCarousel';

const HomeScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Data States
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [topRatedMovies, setTopRatedMovies] = useState([]);
    const [heroBanners, setHeroBanners] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryMovies, setCategoryMovies] = useState({});

    // Popular Genres for Rows
    const POPULAR_GENRES = ['Phim Hành Động', 'Phim Lãng Mạn', 'Phim Hài', 'Phim Hoạt Hình'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Core Data in Parallel
            const [trendingRes, topRatedRes, heroRes, categoriesRes] = await Promise.all([
                movieAPI.getTrendingMovies(10),
                movieAPI.getTopRatedMovies(10),
                heroAPI.getAll(true),
                categoryAPI.getActive()
            ]);

            // Set Core Data
            setTrendingMovies(trendingRes.data.data || []);
            setTopRatedMovies(topRatedRes.data.data || []);
            setHeroBanners(heroRes.data.success ? heroRes.data.data : []);
            setCategories(categoriesRes.data.success ? categoriesRes.data.data : []);

            // Fetch Category Rows in Parallel
            const categoryPromises = POPULAR_GENRES.map(genre =>
                movieAPI.getAll({ genre, limit: 10 })
                    .then(res => ({ genre, data: res.data.data || [] }))
                    .catch(err => ({ genre, data: [] }))
            );

            const categoryResults = await Promise.all(categoryPromises);
            const newCategoryMovies = {};
            categoryResults.forEach(({ genre, data }) => {
                if (data.length > 0) {
                    newCategoryMovies[genre] = data;
                }
            });
            setCategoryMovies(newCategoryMovies);

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
        navigation.navigate('MovieDetail', { movieId: movie._id, movie });
    };

    const handleCategorySelect = (category) => {
        setSelectedCategory(category);
        navigation.navigate('Search', { categoryId: category._id, categoryName: category.name });
    };

    const handlePlayPress = (movie) => {
        navigation.navigate('MovieDetail', { movieId: movie._id, movie });
    };

    const handleInfoPress = (movie) => {
        navigation.navigate('MovieDetail', { movieId: movie._id, movie });
    };

    if (loading) {
        return (
            <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={[globalStyles.container, { paddingTop: 0, backgroundColor: colors.background }]}>
            <StatusBarTranslucent />

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        progressViewOffset={insets.top}
                    />
                }
                contentContainerStyle={{ paddingBottom: 130 }}
            >
                {/* Hero Carousel */}
                <HeroCarousel
                    banners={heroBanners}
                    onPlayPress={handlePlayPress}
                    onInfoPress={handleInfoPress}
                />

                {/* Categories */}
                <View style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh mục</Text>
                    <CategoryChip
                        categories={categories}
                        selectedCategory={selectedCategory}
                        onSelect={handleCategorySelect}
                    />
                </View>

                {/* Trending Movies */}
                <MovieCarousel
                    title="Top Thịnh Hành"
                    movies={trendingMovies}
                    onMoviePress={handleMoviePress}
                />

                {/* Top Rated Movies */}
                <MovieCarousel
                    title="Đánh Giá Cao"
                    movies={topRatedMovies}
                    onMoviePress={handleMoviePress}
                />

                {/* Category Rows */}
                {Object.entries(categoryMovies).map(([genre, movieList]) => (
                    <MovieCarousel
                        key={genre}
                        title={genre}
                        movies={movieList}
                        onMoviePress={handleMoviePress}
                    />
                ))}

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
        // color handled dynamically
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.md,
    },
    sectionContainer: {
        marginTop: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.semibold,
        // color handled dynamically
        marginLeft: SPACING.lg,
        marginBottom: SPACING.md,
    },
});

export default HomeScreen;

