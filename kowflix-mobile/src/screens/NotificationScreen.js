import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../services/api/notificationAPI';
import { useTheme } from '../context/ThemeContext';
import { globalStyles } from '../styles/globalStyles';
import { SPACING, FONT_SIZES, RADIUS } from '../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getAll();
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Fetch notifications error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const handleMarkAsRead = async (item) => {
        if (item.isRead) return;
        try {
            await notificationAPI.markAsRead(item._id);
            // Update local state
            setNotifications(prev => prev.map(n =>
                n._id === item._id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Mark as read error:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể đánh dấu đã đọc tất cả');
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'new_movie': return 'film';
            case 'update': return 'refresh';
            case 'system': return 'information-circle';
            case 'comment': return 'chatbubble';
            case 'like': return 'heart';
            case 'warning': return 'warning';
            case 'error': return 'alert-circle';
            case 'success': return 'checkmark-circle';
            default: return 'notifications';
        }
    };

    const getColorForType = (type) => {
        switch (type) {
            case 'new_movie': return colors.primary;
            case 'update': return '#3B82F6';
            case 'system': return '#6B7280';
            case 'comment': return '#8B5CF6';
            case 'like': return '#EF4444';
            case 'warning': return '#F59E0B';
            case 'error': return '#EF4444';
            case 'success': return '#10B981';
            default: return colors.primary;
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.itemContainer,
                { backgroundColor: item.isRead ? 'transparent' : colors.card || 'rgba(255,255,255,0.05)' }
            ]}
            onPress={() => handleMarkAsRead(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Ionicons name={getIconForType(item.type)} size={24} color={getColorForType(item.type)} />
            </View>
            <View style={styles.contentContainer}>
                <Text style={[styles.title, { color: colors.text, fontWeight: item.isRead ? 'normal' : 'bold' }]}>
                    {item.title}
                </Text>
                <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={[styles.time, { color: colors.textMuted }]}>
                    {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: vi }) : ''}
                </Text>
            </View>
            {!item.isRead && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Thông báo</Text>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={handleMarkAllAsRead}>
                        <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm }}>Đọc tất cả</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Không có thông báo nào</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: SPACING.xl,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    contentContainer: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZES.md,
        marginBottom: 4,
    },
    message: {
        fontSize: FONT_SIZES.sm,
        marginBottom: 6,
    },
    time: {
        fontSize: FONT_SIZES.xs,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: SPACING.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.md,
    }
});

export default NotificationScreen;
