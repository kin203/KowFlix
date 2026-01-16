import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors, themeMode, toggleTheme } = useTheme();

    // Local state for UI toggles only (notifications logic separate)
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    // Dark mode state derived from context
    const isDarkMode = themeMode === 'dark';

    const handleThemeToggle = (value) => {
        toggleTheme(value ? 'dark' : 'light');
    };

    const renderHeader = () => (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Cài đặt</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    const renderSection = (title, children) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.backgroundCard }]}>{children}</View>
        </View>
    );

    const renderSettingItem = ({ icon, title, value, type = 'arrow', onPress, onToggle }) => (
        <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={type === 'arrow' ? onPress : () => onToggle(!value)}
            disabled={type === 'switch' && onToggle === undefined}
        >
            <View style={styles.settingIconContainer}>
                <Ionicons name={icon} size={20} color={colors.textSecondary} />
            </View>
            <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>

            {type === 'switch' && (
                <Switch
                    trackColor={{ false: '#767577', true: colors.primary }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                    onValueChange={onToggle}
                    value={value}
                />
            )}

            {type === 'arrow' && (
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            )}

            {type === 'value' && (
                <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.content}>

                {renderSection('Giao diện & Thông báo', (
                    <>
                        {renderSettingItem({
                            icon: 'moon-outline',
                            title: 'Chế độ tối',
                            value: isDarkMode,
                            type: 'switch',
                            onToggle: handleThemeToggle
                        })}
                        {renderSettingItem({
                            icon: 'notifications-outline',
                            title: 'Thông báo đẩy',
                            value: notificationsEnabled,
                            type: 'switch',
                            onToggle: setNotificationsEnabled
                        })}
                    </>
                ))}

                {/* Account Section - Password Change removed per request */}

                {renderSection('Thông tin ứng dụng', (
                    <>
                        {renderSettingItem({
                            icon: 'information-circle-outline',
                            title: 'Phiên bản',
                            value: '1.0.0',
                            type: 'value'
                        })}
                        {renderSettingItem({
                            icon: 'document-text-outline',
                            title: 'Điều khoản sử dụng',
                            onPress: () => Alert.alert('Thông tin', 'Đang cập nhật...')
                        })}
                        {renderSettingItem({
                            icon: 'shield-checkmark-outline',
                            title: 'Chính sách bảo mật',
                            onPress: () => Alert.alert('Thông tin', 'Đang cập nhật...')
                        })}
                    </>
                ))}

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled dynamically
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        // color handled dynamically
    },
    content: {
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.sm,
        // color handled dynamically
        fontWeight: FONT_WEIGHTS.bold,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
    },
    sectionContent: {
        // backgroundColor handled dynamically
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    settingIconContainer: {
        marginRight: SPACING.md,
        width: 24,
        alignItems: 'center',
    },
    settingTitle: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        // color handled dynamically
    },
    valueText: {
        fontSize: FONT_SIZES.sm,
        // color handled dynamically
    },
});

export default SettingsScreen;
