import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Modal } from 'react-native';
import Constants from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api/authAPI';

const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { colors, themeMode, toggleTheme } = useTheme();

    // Local state for UI toggles only (notifications logic separate)
    // Initial state based on user profile. 
    // Default to true if not set (consistent with backend default)
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

    const { user, updateMobileSettings } = useAuth();

    // Sync state with user profile when screen focuses or user changes
    React.useEffect(() => {
        if (user?.mobileSettings?.pushEnabled !== undefined) {
            setNotificationsEnabled(user.mobileSettings.pushEnabled);
        }
    }, [user]);

    const handleNotificationToggle = async (value) => {
        // Optimistic update handled by local state, but we rely on context for truth
        // setNotificationsEnabled(value); // Let useEffect handle sync from context to avoid conflict

        try {
            const result = await updateMobileSettings({ pushEnabled: value });
            if (!result.success) {
                Alert.alert('Lỗi', 'Không thể cập nhật cài đặt thông báo.');
                // Revert is automatic if context doesn't update, but we can force it conceptually
            }
        } catch (error) {
            console.error('Failed to update push settings:', error);
            Alert.alert('Lỗi', 'Không thể cập nhật cài đặt thông báo.');
        }
    };

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
            onPress={() => {
                if (type === 'switch' && onToggle) {
                    onToggle(!value);
                } else if (onPress) {
                    onPress();
                }
            }}
            disabled={(type === 'switch' && !onToggle) || (!onPress && type !== 'switch')}
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

    const [modalVisible, setModalVisible] = React.useState(false);

    const TERMS_OF_SERVICE = `
1. Giới thiệu dịch vụ

Kowflix là nền tảng cung cấp dịch vụ xem phim và nội dung giải trí trực tuyến, cho phép người dùng truy cập, tìm kiếm và thưởng thức nội dung thông qua internet trên các thiết bị được hỗ trợ.

2. Điều kiện sử dụng

Người dùng phải từ 13 tuổi trở lên hoặc theo quy định pháp luật tại quốc gia cư trú.
Người dùng chịu trách nhiệm về mọi hoạt động diễn ra trên tài khoản của mình.
Không sử dụng Kowflix cho mục đích trái pháp luật, gian lận, phá hoại hoặc xâm phạm quyền lợi của bên thứ ba.

3. Tài khoản người dùng

Một số tính năng có thể yêu cầu đăng ký tài khoản.
Người dùng cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật.
Kowflix có quyền tạm khóa hoặc chấm dứt tài khoản nếu phát hiện vi phạm điều khoản.

4. Nội dung và bản quyền

Tất cả nội dung hiển thị trên Kowflix (bao gồm phim, hình ảnh, video, giao diện, logo) đều thuộc quyền sở hữu của Kowflix hoặc bên cấp phép.
Nghiêm cấm sao chép, tải xuống, phân phối, phát tán hoặc sử dụng nội dung cho mục đích thương mại khi chưa có sự cho phép bằng văn bản.
Người dùng không được can thiệp, phá vỡ hoặc tìm cách vượt qua các biện pháp bảo vệ bản quyền.

5. Hành vi bị cấm

Người dùng không được:
Sử dụng ứng dụng để phát tán nội dung độc hại, phản cảm, vi phạm pháp luật.
Tấn công hệ thống, gây gián đoạn dịch vụ hoặc truy cập trái phép dữ liệu.
Lợi dụng lỗi hệ thống để trục lợi.

6. Giới hạn trách nhiệm

Kowflix không đảm bảo dịch vụ sẽ hoạt động liên tục, không lỗi hoặc không bị gián đoạn.
Kowflix không chịu trách nhiệm đối với thiệt hại phát sinh do việc sử dụng hoặc không thể sử dụng dịch vụ, trừ khi pháp luật có quy định khác.
Nội dung có thể bị thay đổi, cập nhật hoặc gỡ bỏ mà không cần báo trước.

7. Liên kết bên thứ ba

Ứng dụng có thể chứa liên kết đến website hoặc dịch vụ của bên thứ ba. Kowflix không chịu trách nhiệm về nội dung, chính sách hay hoạt động của các bên này.

8. Thay đổi điều khoản

Kowflix có quyền cập nhật hoặc điều chỉnh điều khoản này bất kỳ lúc nào. Các thay đổi sẽ có hiệu lực ngay khi được công bố trên ứng dụng hoặc website.

9. Chấm dứt dịch vụ

Kowflix có quyền tạm ngừng hoặc chấm dứt cung cấp dịch vụ mà không cần thông báo trước trong trường hợp:
Người dùng vi phạm điều khoản
Yêu cầu từ cơ quan quản lý nhà nước
Lý do kỹ thuật hoặc vận hành

10. Luật áp dụng

Điều khoản này được điều chỉnh và giải thích theo pháp luật Việt Nam.

11. Thông tin liên hệ

Email hỗ trợ: work.nk203@gmail.com
Website: https://facebook.com/nk203
`;

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
                            onToggle: handleNotificationToggle
                        })}
                    </>
                ))}

                {/* Account Section - Password Change removed per request */}

                {renderSection('Thông tin ứng dụng', (
                    <>
                        {renderSettingItem({
                            icon: 'information-circle-outline',
                            title: 'Phiên bản',
                            value: Constants.expoConfig?.version || '1.0.3',
                            type: 'value'
                        })}
                        {renderSettingItem({
                            icon: 'document-text-outline',
                            title: 'Điều khoản sử dụng',
                            onPress: () => setModalVisible(true)
                        })}
                        {renderSettingItem({
                            icon: 'shield-checkmark-outline',
                            title: 'Chính sách bảo mật',
                            onPress: () => setModalVisible(true)
                        })}
                    </>
                ))}

            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)' }]}>
                    <View style={[styles.modalContent, { backgroundColor: colors.backgroundCard, paddingTop: insets.top }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Điều khoản & Chính sách</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Ionicons name="close" size={28} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.modalText, { color: colors.text }]}>{TERMS_OF_SERVICE}</Text>
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        flex: 1,
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.md,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    modalBody: {
        padding: SPACING.md,
    },
    modalText: {
        fontSize: FONT_SIZES.md,
        lineHeight: 24,
    },
});

export default SettingsScreen;
