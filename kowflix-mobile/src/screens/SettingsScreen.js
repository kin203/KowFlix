import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { authAPI } from '../services/api/authAPI';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { user, refreshUser } = useAuth(); // Assuming refreshUser updates local user state from backend

    // Initialize state from user's saved settings or default to true (Dark Mode)
    const initialDarkMode = user?.mobileSettings?.theme === 'light' ? false : true;

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(initialDarkMode);
    const [updating, setUpdating] = useState(false);

    const handleThemeToggle = async (value) => {
        setDarkModeEnabled(value);
        const theme = value ? 'dark' : 'light';

        try {
            setUpdating(true);
            await authAPI.updateMobileSettings({ theme });
            // Optionally refresh user to sync state immediately, though local state handles UI
            if (refreshUser) await refreshUser();
        } catch (error) {
            console.error('Update theme error:', error);
            // Revert on failure? For now just log.
        } finally {
            setUpdating(false);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Cài đặt</Text>
            <View style={{ width: 24 }} />
        </View>
    );

    const renderSection = (title, children) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );

    const renderSettingItem = ({ icon, title, value, type = 'arrow', onPress, onToggle }) => (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={type === 'arrow' ? onPress : () => onToggle(!value)}
            disabled={(type === 'switch' && !onToggle) || updating}
        >
            <View style={styles.settingIconContainer}>
                <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.settingTitle}>{title}</Text>

            {type === 'switch' && (
                <Switch
                    trackColor={{ false: '#767577', true: COLORS.primary }}
                    thumbColor={value ? '#fff' : '#f4f3f4'}
                    onValueChange={onToggle}
                    value={value}
                    disabled={updating}
                />
            )}

            {type === 'arrow' && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            )}

            {type === 'value' && (
                <Text style={styles.valueText}>{value}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.content}>

                {renderSection('Giao diện & Thông báo', (
                    <>
                        {renderSettingItem({
                            icon: 'moon-outline',
                            title: 'Chế độ tối',
                            value: darkModeEnabled,
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
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.text,
    },
    content: {
        padding: SPACING.md,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        fontWeight: FONT_WEIGHTS.bold,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.sm,
        textTransform: 'uppercase',
    },
    sectionContent: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingIconContainer: {
        marginRight: SPACING.md,
        width: 24,
        alignItems: 'center',
    },
    settingTitle: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    valueText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
});

export default SettingsScreen;
