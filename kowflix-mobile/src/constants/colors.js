// Color Palette - Dark Theme (Default)
export const DARK_THEME = {
    mode: 'dark',
    primary: '#FFD700',        // Gold/Yellow
    primaryDark: '#FFA500',    // Orange
    primaryLight: '#FFEB3B',   // Light Yellow
    background: '#0A0A0A',     // Almost Black
    backgroundLight: '#1A1A1A', // Dark Gray
    backgroundCard: '#1E1E1E',  // Card Background
    text: '#FFFFFF',           // White
    textSecondary: '#B0B0B0',  // Light Gray
    textMuted: '#707070',      // Muted Gray
    accent: '#FF6B6B',         // Red
    error: '#FF4757',          // Bright Red
    success: '#4CAF50',        // Green
    warning: '#FF9800',        // Orange
    info: '#2196F3',           // Blue
    border: '#2A2A2A',         // Border color
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.5)',
    transparent: 'transparent',
    statusBar: 'light'
};

// Color Palette - Light Theme
export const LIGHT_THEME = {
    mode: 'light',
    primary: '#FFD700',        // Gold/Yellow
    primaryDark: '#FFA500',    // Orange
    primaryLight: '#FFEB3B',   // Light Yellow
    background: '#F5F5F5',     // Light Gray/White
    backgroundLight: '#FFFFFF', // Pure White
    backgroundCard: '#FFFFFF',  // White Card
    text: '#000000',           // Black
    textSecondary: '#666666',  // Dark Gray
    textMuted: '#999999',      // Gray
    accent: '#FF6B6B',         // Red
    error: '#FF4757',          // Bright Red
    success: '#4CAF50',        // Green
    warning: '#FF9800',        // Orange
    info: '#2196F3',           // Blue
    border: '#E0E0E0',         // Light Border
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    transparent: 'transparent',
    statusBar: 'dark'
};

// Default export for backward compatibility (points to Dark Theme)
export const COLORS = DARK_THEME;

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Border Radius
export const RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 999,
};

// Font Sizes
export const FONT_SIZES = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Font Weights - Use string keywords for React Native
export const FONT_WEIGHTS = {
    regular: 'normal',  // or '400'
    medium: '500',
    semibold: '600',
    bold: 'bold',       // or '700'
};
