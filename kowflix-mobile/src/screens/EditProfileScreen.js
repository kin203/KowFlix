import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { useTheme } from '../context/ThemeContext';
import { profileAPI } from '../services/api/profileAPI';

const EditProfileScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();
    const { colors } = useTheme();

    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.profile?.name || '');
        }
    }, [user]);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const response = await profileAPI.updateProfile({
                name,
            });

            if (response.data.success) {
                await refreshUser();
                Alert.alert('Thành công', 'Cập nhật thông tin thành công');
                navigation.goBack();
            } else {
                Alert.alert('Thất bại', response.data.message || 'Không thể cập nhật thông tin');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Thông tin tài khoản</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.backgroundCard,
                                    borderColor: colors.border,
                                    color: colors.textMuted
                                }
                            ]}
                            value={user?.email}
                            editable={false}
                        />
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>Email không thể thay đổi</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Tên hiển thị</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.backgroundCard,
                                    borderColor: colors.border,
                                    color: colors.text
                                }
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập tên hiển thị"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: colors.primary }]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={[styles.saveButtonText, { color: colors.background }]}>Lưu thay đổi</Text>
                        )}
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <TouchableOpacity
                        style={[styles.changePasswordButton, { borderColor: colors.primary }]}
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                        <Text style={[styles.changePasswordText, { color: colors.primary }]}>Đổi mật khẩu</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.semibold,
    },
    content: {
        padding: SPACING.lg,
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.medium,
        marginBottom: SPACING.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.md,
    },
    helperText: {
        fontSize: FONT_SIZES.xs,
        marginTop: 4,
        fontStyle: 'italic',
    },
    saveButton: {
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    saveButtonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
    },
    divider: {
        height: 1,
        marginVertical: SPACING.xl,
    },
    changePasswordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        borderWidth: 1,
    },
    changePasswordText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        marginLeft: SPACING.sm,
    },
});

export default EditProfileScreen;
