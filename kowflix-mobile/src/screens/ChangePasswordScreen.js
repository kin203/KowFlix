import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { authAPI } from '../services/api/authAPI';

const ChangePasswordScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.changePassword({
                currentPassword,
                newPassword
            });

            if (response.data.success) {
                Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert('Thất bại', response.data.message || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Change password error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
            Alert.alert('Lỗi', message);
        } finally {
            setLoading(false);
        }
    };

    const renderInput = ({ label, value, onChangeText, secureTextEntry, toggleSecure, placeholder }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                />
                <TouchableOpacity onPress={toggleSecure} style={styles.eyeIcon}>
                    <Ionicons
                        name={secureTextEntry ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
                <View style={{ width: 24 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {renderInput({
                        label: 'Mật khẩu hiện tại',
                        value: currentPassword,
                        onChangeText: setCurrentPassword,
                        secureTextEntry: !showCurrentPassword,
                        toggleSecure: () => setShowCurrentPassword(!showCurrentPassword),
                        placeholder: 'Nhập mật khẩu hiện tại'
                    })}

                    {renderInput({
                        label: 'Mật khẩu mới',
                        value: newPassword,
                        onChangeText: setNewPassword,
                        secureTextEntry: !showNewPassword,
                        toggleSecure: () => setShowNewPassword(!showNewPassword),
                        placeholder: 'Nhập mật khẩu mới'
                    })}

                    {renderInput({
                        label: 'Xác nhận mật khẩu mới',
                        value: confirmPassword,
                        onChangeText: setConfirmPassword,
                        secureTextEntry: !showConfirmPassword,
                        toggleSecure: () => setShowConfirmPassword(!showConfirmPassword),
                        placeholder: 'Nhập lại mật khẩu mới'
                    })}

                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.disabledButton]}
                        onPress={handleChangePassword}
                        disabled={loading}
                    >
                        <Text style={styles.submitButtonText}>
                            {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: SPACING.lg,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        marginBottom: SPACING.sm,
        fontWeight: FONT_WEIGHTS.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    input: {
        flex: 1,
        padding: SPACING.md,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
    },
    eyeIcon: {
        padding: SPACING.md,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
    },
});

export default ChangePasswordScreen;
