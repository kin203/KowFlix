import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const CategoryChip = ({ categories, selectedCategory, onSelect }) => {
    const { colors } = useTheme();

    if (!categories || categories.length === 0) {
        return null;
    }

    const renderItem = ({ item }) => {
        const isSelected = selectedCategory?._id === item._id;

        return (
            <TouchableOpacity
                style={[
                    styles.chip,
                    {
                        backgroundColor: colors.backgroundCard,
                        borderColor: colors.border
                    },
                    isSelected && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary
                    }
                ]}
                onPress={() => onSelect(item)}
            >
                <Text style={[
                    styles.text,
                    { color: colors.textSecondary },
                    isSelected && {
                        color: colors.background, // Text color on selected chip (primary background)
                        fontWeight: FONT_WEIGHTS.semibold
                    }
                ]}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item._id || item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.lg,
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        // backgroundColor handled dynamically
        borderRadius: RADIUS.round,
        marginRight: SPACING.sm,
        borderWidth: 1,
        // borderColor handled dynamically
    },
    text: {
        // color handled dynamically
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
    },
});

export default CategoryChip;
