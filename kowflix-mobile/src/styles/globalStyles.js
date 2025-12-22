import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';

export const globalStyles = StyleSheet.create({
    // Containers
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    scrollContainer: {
        flexGrow: 1,
        backgroundColor: COLORS.background,
    },

    // Text Styles
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.text,
    },

    subtitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.text,
    },

    body: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.regular,
        color: COLORS.text,
    },

    caption: {
        fontSize: FONT_SIZES.sm,
        fontWeight: FONT_WEIGHTS.regular,
        color: COLORS.textSecondary,
    },

    // Buttons
    button: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        color: COLORS.background,
    },

    buttonSecondary: {
        backgroundColor: COLORS.backgroundCard,
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    buttonSecondaryText: {
        color: COLORS.text,
    },

    // Cards
    card: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },

    // Input
    input: {
        backgroundColor: COLORS.backgroundCard,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },

    // Loading
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },

    // Error
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.lg,
    },

    errorText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.accent,
        textAlign: 'center',
        marginTop: SPACING.md,
    },

    // Centered
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Row
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
});
