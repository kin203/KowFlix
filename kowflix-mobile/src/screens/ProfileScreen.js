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
import { SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import * as ImagePicker from 'expo-image-picker';
import { authAPI } from '../services/api/authAPI';
import { profileAPI } from '../services/api/profileAPI';
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { getImageUrl } from '../utils/imageUtils';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, loading, refreshUser } = useAuth();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [uploading, setUploading] = useState(false);
    const [stats, setStats] = useState({ watchedCount: 0, commentCount: 0, wishlistCount: 0 });

    useFocusEffect(
        React.useCallback(() => {
            let isActive = true;
            const fetchStats = async () => {
                try {
                    const response = await profileAPI.getStats();
                    if (isActive && response.data.success) {
                        setStats(response.data.data || { historyCount: 0, commentCount: 0, wishlistCount: 0 });
                    }
                } catch (error) {
                    console.error('Error fetching stats:', error);
                }
            };
            fetchStats();

            return () => {
                isActive = false;
            };
        }, []) // Empty dependency array ensures it runs on focus
    );
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
            icon: 'person-circle-outline',
            title: 'Thông tin tài khoản',
            onPress: () => navigation.navigate('EditProfile'),
            color: colors.primary
        },
        {
            icon: 'settings-outline',
            title: 'Cài đặt',
            onPress: () => navigation.navigate('Settings'),
            color: colors.textSecondary
        }
    ];

    if (loading) {
        return (
            <View style={[globalStyles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const avatarSource = (user?.profile?.avatar || user?.avatarUrl) ? { uri: getImageUrl(user.profile?.avatar || user.avatarUrl) } : null;

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Profile */}
                <View style={styles.header}>
                    <View style={styles.avatarContainer}>
                        {uploading ? (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: colors.primary }]}>
                                <ActivityIndicator color={colors.primary} />
                            </View>
                        ) : avatarSource ? (
                            <Image
                                source={avatarSource}
                                style={[styles.avatar, { borderColor: colors.primary }]}
                            />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundCard, borderColor: colors.primary }]}>
                                <Text style={[styles.avatarText, { color: colors.primary }]}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: colors.primary, borderColor: colors.background }]}
                            onPress={handleAvatarUpdate}
                            disabled={uploading}
                        >
                            <Ionicons name="pencil" size={16} color={colors.background} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.username, { color: colors.text }]}>{displayName}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

                    <View style={[styles.roleBadge, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                        <Text style={[styles.roleText, { color: colors.textMuted }]}>{user?.role || 'Member'}</Text>
                    </View>
                </View>

                {/* Stats Container - Restored */}
                <View style={[styles.statsContainer, { backgroundColor: colors.backgroundCard }]}>
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.historyCount || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Đã xem</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.commentCount || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bình luận</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statNumber, { color: colors.text }]}>{stats?.wishlistCount || 0}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Yêu thích</Text>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.menuItem, { backgroundColor: colors.backgroundCard }]}
                            onPress={item.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                <Ionicons name={item.icon} size={22} color={item.color} />
                            </View>
                            <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.error }]} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.logoutButtonText}>Đăng xuất</Text>
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: colors.textMuted }]}>Phiên bản 1.0.0</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor handled dynamically
    },
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
        // borderColor handled dynamically
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        // backgroundColor handled dynamically
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        // borderColor handled dynamically
    },
    avatarText: {
        fontSize: 40,
        fontWeight: FONT_WEIGHTS.bold,
        // color handled dynamically
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        // backgroundColor handled dynamically
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        // borderColor handled dynamically
    },
    username: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: FONT_WEIGHTS.bold,
        // color handled dynamically
        marginBottom: 4,
    },
    email: {
        fontSize: FONT_SIZES.md,
        // color handled dynamically
        marginBottom: SPACING.sm,
    },
    roleBadge: {
        // backgroundColor handled dynamically
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        // borderColor handled dynamically
    },
    roleText: {
        fontSize: FONT_SIZES.xs,
        // color handled dynamically
        textTransform: 'uppercase',
    },

    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.md, // Reduced padding for cleaner look
        borderRadius: RADIUS.md,
        marginBottom: SPACING.xl,
        // backgroundColor handled dynamically
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: FONT_SIZES.xl,
        fontWeight: '600', // Changed from bold to 600 for delicate look
        marginBottom: 4,
        // color handled dynamically
    },
    statLabel: {
        fontSize: FONT_SIZES.xs, // Smaller font for label
        // color handled dynamically
        fontWeight: '400',
    },
    statDivider: {
        width: 1,
        height: '60%', // Shorter divider
        alignSelf: 'center',
        // backgroundColor handled dynamically
        opacity: 0.5,
    },

    menuContainer: {
        marginBottom: SPACING.xl,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor handled dynamically
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
        // color handled dynamically
        fontWeight: FONT_WEIGHTS.medium,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor handled dynamically
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
        // color handled dynamically
        fontSize: FONT_SIZES.xs,
        marginTop: SPACING.lg,
    },
});

export default ProfileScreen;
