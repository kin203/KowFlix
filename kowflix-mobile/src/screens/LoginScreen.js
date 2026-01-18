import React, { useState } from 'react';
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
    Image,
} from 'react-native';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { APP_NAME } from '../constants/config';
import { useTheme } from '../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useAuth();
    const { colors } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (!isValidEmail(email)) {
            Alert.alert('Lỗi', 'Email không hợp lệ');
            return;
        }

        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
            Alert.alert('Đăng nhập thất bại', result.message);
        }
        // Navigation will be handled by AuthContext/AppNavigator
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={[styles.logo, { color: colors.primary }]}>{APP_NAME}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Đăng nhập để tiếp tục</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.backgroundCard,
                                    borderColor: colors.border,
                                    color: colors.text
                                }
                            ]}
                            placeholder="Nhập email của bạn"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Mật khẩu</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.backgroundCard,
                                    borderColor: colors.border,
                                    color: colors.text
                                }
                            ]}
                            placeholder="Nhập mật khẩu"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={true}
                            autoCapitalize="none"
                        />

                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.background} />
                        ) : (
                            <Text style={[styles.buttonText, { color: colors.background }]}>Đăng nhập</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.linkText, { color: colors.primary }]}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled dynamically
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logo: {
        fontSize: 48,
        fontWeight: FONT_WEIGHTS.bold,
        // color handled dynamically
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        // color handled dynamically
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
        // color handled dynamically
        marginBottom: SPACING.sm,
    },
    input: {
        // backgroundColor handled dynamically
        borderWidth: 1,
        // borderColor handled dynamically
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.md,
        // color handled dynamically
    },
    button: {
        // backgroundColor handled dynamically
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        // color handled dynamically
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    footerText: {
        fontSize: FONT_SIZES.md,
        // color handled dynamically
    },
    linkText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        // color handled dynamically
    },
});

export default LoginScreen;
