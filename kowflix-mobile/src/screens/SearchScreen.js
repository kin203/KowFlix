import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Keyboard,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { movieAPI } from '../services/api/movieAPI';
import { categoryAPI } from '../services/api/categoryAPI';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import MovieCard from '../components/MovieCard';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation, route }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Get category param from navigation
    useEffect(() => {
        if (route.params?.categoryId) {
            const cat = { _id: route.params.categoryId, name: route.params.categoryName };
            setSelectedCategory(cat);
            // Search will be triggered by the main useEffect observing selectedCategory
        }
    }, [route.params]);

    // Fetch categories for filtering
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getActive();
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    // Debounce search when query or category changes
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            handleSearch(query, selectedCategory?._id);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query, selectedCategory]);

    const handleSearch = async (text, categoryId) => {
        setLoading(true);

        try {
            const params = {
                q: text,
                limit: 20
            };

            if (categoryId) {
                params.categoryId = categoryId;
            }

            // If empty search and no category, maybe show trending or nothing
            if (!text.trim() && !categoryId) {
                setResults([]);
                setLoading(false);
                return;
            }

            const res = await movieAPI.getAll(params);
            if (res.data.success) {
                setResults(res.data.data);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        Keyboard.dismiss();
    };

    const handleCategorySelect = (category) => {
        const newCat = selectedCategory?._id === category._id ? null : category;
        setSelectedCategory(newCat);
        // Search triggered by useEffect
    };

    const handleSearchSubmit = () => {
        handleSearch(query, selectedCategory?._id);
        Keyboard.dismiss();
    };

    const renderMovieItem = ({ item }) => (
        <View style={styles.gridItem}>
            <MovieCard
                movie={item}
                onPress={() => navigation.push('MovieDetail', { movieId: item._id, movie: item })}
            />
        </View>
    );

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            {/* Search Bar */}
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard }]}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Tìm kiếm phim, diễn viên..."
                        placeholderTextColor={colors.textMuted || '#666'}
                        value={query}
                        onChangeText={setQuery}
                        autoCapitalize="none"
                        returnKeyType="search"
                        onSubmitEditing={handleSearchSubmit}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Filter Chips */}
            <View style={[styles.filterContainer, { borderBottomColor: colors.border }]}>
                <FlatList
                    data={categories}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ paddingHorizontal: SPACING.md }}
                    renderItem={({ item }) => {
                        const isSelected = selectedCategory?._id === item._id;
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.chip,
                                    { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                                ]}
                                onPress={() => handleCategorySelect(item)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: colors.textSecondary },
                                    isSelected && { color: colors.background, fontWeight: 'bold' } // Assuming selected text color should contrast with primary
                                ]}>
                                    {item.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Results */}
            {loading ? (
                <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderMovieItem}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={
                        query.length > 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không tìm thấy phim nào</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="film-outline" size={64} color={colors.border} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nhập tên phim để tìm kiếm</Text>
                            </View>
                        )
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: SPACING.md,
        // backgroundColor handled dynamically
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor handled dynamically
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8, // Fixed height for input
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        // color handled dynamically
        fontSize: FONT_SIZES.md,
        paddingVertical: 4, // Reduce padding to align text
    },
    filterContainer: {
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        // backgroundColor handled dynamically
        marginRight: SPACING.sm,
        borderWidth: 1,
        // borderColor handled dynamically
    },
    chipSelected: {
        // backgroundColor handled dynamically
        // borderColor handled dynamically
    },
    chipText: {
        fontSize: FONT_SIZES.sm,
        // color handled dynamically
    },
    chipTextSelected: {
        // color handled dynamically
        fontWeight: 'bold',
    },
    listContent: {
        padding: SPACING.md,
        paddingBottom: 100, // Space for tab bar
    },
    gridItem: {
        flex: 1 / 2, // 2 columns
        marginBottom: SPACING.md,
        alignItems: 'center',
        paddingHorizontal: SPACING.xs, // Add spacing between items
    },
    columnWrapper: {
        justifyContent: 'flex-start', // Left align
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        // color handled dynamically
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.md,
    },
});

export default SearchScreen;
