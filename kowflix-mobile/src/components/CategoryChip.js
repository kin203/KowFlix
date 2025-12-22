import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';

const CategoryChip = ({ categories, selectedCategory, onSelect }) => {
    if (!categories || categories.length === 0) {
        return null;
    }

    const renderItem = ({ item }) => {
        const isSelected = selectedCategory?._id === item._id;

        return (
            <TouchableOpacity
                style={[
                    styles.chip,
                    isSelected && styles.chipSelected
                ]}
                onPress={() => onSelect(item)}
            >
                <Text style={[
                    styles.text,
                    isSelected && styles.textSelected
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
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.round,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    text: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.medium,
    },
    textSelected: {
        color: COLORS.background, // Black text on yellow background
        fontWeight: FONT_WEIGHTS.semibold,
    },
});

export default CategoryChip;
