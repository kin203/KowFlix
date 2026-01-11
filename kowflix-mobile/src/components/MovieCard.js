import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { COLORS, RADIUS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { IMAGE_PLACEHOLDER } from '../constants/config';
import { getImageUrl } from '../utils/imageUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.35; // 35% of screen width

const MovieCard = ({ movie, onPress }) => {
    const [imageError, setImageError] = React.useState(false);

    // Normalize path - check for 'poster' field first as per DB schema
    const rawPath = movie.poster || movie.posterUrl || movie.thumbnailUrl;
    const imageUrl = getImageUrl(rawPath);
    const finalSource = imageError ? { uri: IMAGE_PLACEHOLDER } : { uri: imageUrl };

    // Smart rating check
    const getDisplayRating = () => {
        // Helper to safely parse rating
        const parseRating = (value) => {
            if (!value) return 0;
            const num = parseFloat(value);
            return !isNaN(num) && num > 0 ? num : 0;
        };

        const rating = parseRating(movie.rating);
        if (rating > 0) return rating.toFixed(1);

        const voteAverage = parseRating(movie.vote_average);
        if (voteAverage > 0) return voteAverage.toFixed(1);

        const imdbRating = parseRating(movie.imdbRating); // Check camelCase
        if (imdbRating > 0) return imdbRating.toFixed(1);

        const imdb_rating = parseRating(movie.imdb_rating); // Check snake_case
        if (imdb_rating > 0) return imdb_rating.toFixed(1);

        return null;
    };

    const displayRating = getDisplayRating();

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress(movie)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={finalSource}
                    style={styles.poster}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />

                {displayRating && (
                    <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={10} color="#FFD700" />
                        <Text style={styles.ratingText}>{displayRating}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
                {movie.title}
            </Text>
            <Text style={styles.year}>
                {(() => {
                    if (movie.releaseYear) return movie.releaseYear;
                    if (movie.year) return movie.year;
                    if (movie.releaseDate) return new Date(movie.releaseDate).getFullYear();
                    // Fallback to createdAt if nothing else exists (better than N/A for new movies)
                    if (movie.createdAt) return new Date(movie.createdAt).getFullYear();
                    return 'N/A';
                })()}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginRight: SPACING.md,
    },
    imageContainer: {
        height: CARD_WIDTH * 1.5,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.backgroundCard,
        position: 'relative',
    },
    poster: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        backgroundColor: 'rgba(0,0,0,0.7)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
    },
    ratingText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.bold,
        marginLeft: 2,
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.semibold,
    },
    year: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.xs,
        marginTop: 2,
    },
});

export default MovieCard;
