import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import MovieCard from './MovieCard';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';

const MovieCarousel = ({ title, movies, onMoviePress }) => {
    if (!movies || movies.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <FlatList
                data={movies}
                renderItem={({ item }) => (
                    <MovieCard movie={item} onPress={onMoviePress} />
                )}
                keyExtractor={(item) => item._id || item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                snapToAlignment="start"
                decelerationRate="fast"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: SPACING.lg,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.text,
        marginLeft: SPACING.lg,
        marginBottom: SPACING.md,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
    },
});

export default MovieCarousel;
