import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api/authAPI';
import { profileAPI } from '../services/api/profileAPI';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { getImageUrl } from '../utils/imageUtils';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, loading, refreshUser } = useAuth();
    const insets = useSafeAreaInsets();
    const [uploading, setUploading] = useState(false);
    // Stats removed per user request
    const getDisplayName = () => {
        if (!user) return 'User';
        // Priority: Profile Name > Username > Email Username
        if (user.profile?.name) return user.profile.name;
        if (user.username) return user.username;
        if (user.email) return user.email.split('@')[0];
        return 'User';
    };

    const displayName = getDisplayName();

    const handleAvatarUpdate = async () => {
        try {
            // Request permission
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Quyền truy cập bị từ chối', 'Bạn cần cấp quyền truy cập thư viện ảnh để đổi Avatar.');
                return;
            }

            // Pick image
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled) {
                setUploading(true);
                const asset = result.assets[0];

                // Construct Form Data
                const formData = new FormData();
                formData.append('avatar', {
                    uri: asset.uri,
                    name: asset.fileName || 'avatar.jpg',
                    type: asset.mimeType || 'image/jpeg',
                });

                // Call API
                const response = await authAPI.uploadAvatar(formData);
                console.log('Upload response:', response.data);

                if (response.data.success) {
                    await refreshUser(); // Reload user data to update UI
                    Alert.alert('Thành công', 'Cập nhật Avatar thành công!');
                } else {
                    Alert.alert('Thất bại', response.data.message || 'Không thể cập nhật Avatar');
                }
            }
        } catch (error) {
            console.error('Avatar update error:', error);
            Alert.alert('Lỗi', 'Đã xảy ra lỗi khi tải ảnh lên.');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc muốn đăng xuất?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', onPress: logout, style: 'destructive' },
            ]
        );
    };

    const menuItems = [
        {
            icon: 'heart-outline',
            title: 'Danh sách yêu thích',
            onPress: () => navigation.navigate('Wishlist'),
            color: '#FF6B6B'
        },
        {
            icon: 'time-outline',
            title: 'Lịch sử xem',
            onPress: () => navigation.navigate('History'),
            color: '#4ECDC4'
        },
        {
            icon: 'settings-outline',
            title: 'Cài đặt',
            onPress: () => navigation.navigate('Settings'),
            color: COLORS.textSecondary
        },
        {
            icon: 'lock-closed-outline',
            title: 'Đổi mật khẩu',
            onPress: () => navigation.navigate('ChangePassword'),
            color: COLORS.textSecondary
        }
    ];

    if (loading) {
        return (
            <View style={globalStyles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    const avatarSource = (user?.profile?.avatar || user?.avatarUrl) ? { uri: getImageUrl(user.profile?.avatar || user.avatarUrl) } : null;

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Profile */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {uploading ? (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                                <ActivityIndicator color={COLORS.primary} />
                            </View>
                        ) : avatarSource ? (
                            <Image
                                source={avatarSource}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={handleAvatarUpdate}
                            disabled={uploading}
                        >
                            <Ionicons name="pencil" size={16} color={COLORS.background} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.username}>{displayName}</Text>
                    <Text style={styles.email}>{user?.email}</Text>

                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role || 'Member'}</Text>
                    </View>
                </View>



                {/* Menu Options */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={22} color={item.color} />
                            </View>
                            <Text style={styles.menuTitle}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    content: {
        padding: SPACING.lg,
        paddingBottom: 100 + 34, // Approximate safe area, but better to use insets in style prop if possible. 
        // Since this is a static style object, we'll handle it in the component render instead.
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    avatarContainer: {
        marginBottom: SPACING.md,
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.backgroundCard,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.primary,
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    username: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    email: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    roleBadge: {
        backgroundColor: COLORS.backgroundCard,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    roleText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.xl,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: COLORS.border,
        alignSelf: 'center',
    },
    menuContainer: {
        marginBottom: SPACING.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundCard,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuTitle: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        fontWeight: FONT_WEIGHTS.medium,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.error, // Fallback if error color not defined, check below
        backgroundColor: '#FF4757',
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.md,
    },
    logoutButtonText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.semibold,
        color: '#FFFFFF',
        marginLeft: SPACING.sm,
    },
    versionText: {
        textAlign: 'center',
        color: COLORS.textMuted,
        fontSize: FONT_SIZES.xs,
        marginTop: SPACING.lg,
    },
});

export default ProfileScreen;
