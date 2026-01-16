import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    FlatList,
    TouchableOpacity
} from 'react-native';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { IMAGE_PLACEHOLDER } from '../constants/config';
import { getImageUrl } from '../utils/imageUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = width * 1.2; // Taller ratio for mobile

const HeroCarousel = ({ banners, onPlayPress, onInfoPress }) => {
    const { colors } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    // Auto scroll
    useEffect(() => {
        if (!banners || banners.length <= 1) return;

        const interval = setInterval(() => {
            let nextIndex = activeIndex + 1;
            if (nextIndex >= banners.length) {
                nextIndex = 0;
            }
            if (flatListRef.current) {
                flatListRef.current.scrollToIndex({
                    index: nextIndex,
                    animated: true
                });
                setActiveIndex(nextIndex);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [activeIndex, banners]);

    if (!banners || banners.length === 0) return null;

    const renderItem = ({ item }) => {
        // Helper to extract data from HeroBanner object which contains populated movieId
        const movie = item.movieId || {};

        // Prioritize: 
        // 1. Custom Banner Image (item.imageUrl)
        // 2. Movie Poster (movie.poster) - optimized for mobile portrait
        // 3. Movie Backdrop (movie.backdrop)
        const rawPath = item.imageUrl || movie.poster || movie.backdrop || movie.posterUrl || movie.thumbnailUrl;
        const imageUrl = getImageUrl(rawPath);

        const title = item.title || movie.title || '';
        const genres = movie.genres || [];

        return (
            <TouchableOpacity
                style={styles.itemContainer}
                activeOpacity={0.9}
                onPress={() => onInfoPress(movie)}
            >
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)', colors.background]}
                    style={styles.gradient}
                >
                    <View style={styles.contentContainer}>
                        <Text style={[styles.title, { color: '#FFF' }]} numberOfLines={2}>
                            {title}
                        </Text>

                        {genres.length > 0 && (
                            <Text style={[styles.genre, { color: 'rgba(255,255,255,0.8)' }]}>
                                {genres.map(g => g.name || g).slice(0, 3).join(' • ')}
                            </Text>
                        )}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const handleMomentumScrollEnd = (event) => {
        const contentOffset = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffset / width);
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={banners}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
            />

            {/* Pagination Dots */}
            <View style={styles.pagination}>
                {banners.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            index === activeIndex ?
                                { backgroundColor: colors.primary, width: 10, height: 10 } :
                                { backgroundColor: 'rgba(255,255,255,0.4)' }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT,
        marginBottom: SPACING.lg,
    },
    itemContainer: {
        width: width,
        height: ITEM_HEIGHT,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50%', // Only darken the bottom half
        justifyContent: 'flex-end',
        padding: SPACING.lg,
        paddingBottom: SPACING.xl, // Lower text comfortably
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    hdBadge: {
        // backgroundColor handled dynamically
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    hdText: {
        // color handled dynamically
        fontSize: 10,
        fontWeight: 'bold',
    },
    tags: {
        // color handled dynamically
        fontSize: FONT_SIZES.sm,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        // color handled dynamically
        marginBottom: SPACING.xs,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    genre: {
        fontSize: FONT_SIZES.sm,
        // color handled dynamically
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    tapHint: {
        fontSize: FONT_SIZES.xs,
        color: 'rgba(255,255,255,0.6)',
        marginTop: SPACING.xs,
    },
    pagination: {
        position: 'absolute',
        bottom: SPACING.md,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});

export default HeroCarousel;
