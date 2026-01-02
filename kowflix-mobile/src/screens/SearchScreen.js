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

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation, route }) => {
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
            handleSearch('', cat._id); // Trigger search with category
        }
    }, [route.params]);

    // Fetch categories for filtering
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    const handleSearch = async (text, categoryId = selectedCategory?._id) => {
        setQuery(text); // Update UI immediately
        setLoading(true);

        try {
            // Basic debounce logic could be here, but for now calling directly
            // In production, use lodash.debounce
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

    // Manual debounce wrapper
    const [timer, setTimer] = useState(null);
    const onSearchChange = (text) => {
        setQuery(text);
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => {
            handleSearch(text);
        }, 500);
        setTimer(newTimer);
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
        Keyboard.dismiss();
    };

    const handleCategorySelect = (category) => {
        const newCat = selectedCategory?._id === category._id ? null : category;
        setSelectedCategory(newCat);
        handleSearch(query, newCat?._id);
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
        <View style={[globalStyles.container, { paddingTop: insets.top }]}>
            {/* Search Bar */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm kiếm phim..."
                        placeholderTextColor={COLORS.textMuted}
                        value={query}
                        onChangeText={onSearchChange}
                        autoCapitalize="none"
                        returnKeyType="search"
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Filter Chips */}
            <View style={styles.filterContainer}>
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
                                    isSelected && styles.chipSelected
                                ]}
                                onPress={() => handleCategorySelect(item)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected
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
                <View style={globalStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
                                <Text style={styles.emptyText}>Không tìm thấy phim nào</Text>
                            </View>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="film-outline" size={64} color={COLORS.border} />
                                <Text style={styles.emptyText}>Nhập tên phim để tìm kiếm</Text>
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
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 8, // Fixed height for input
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        paddingVertical: 4, // Reduce padding to align text
    },
    filterContainer: {
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.backgroundCard,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    chipTextSelected: {
        color: COLORS.background,
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
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.md,
    },
});

export default SearchScreen;
