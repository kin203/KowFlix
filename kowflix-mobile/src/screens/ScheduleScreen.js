import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { movieAPI } from '../services/api/movieAPI';
import { COLORS, SPACING, RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../constants/colors';
import { globalStyles } from '../styles/globalStyles';
import { IMAGE_PLACEHOLDER } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { getImageUrl } from '../utils/imageUtils';

const DAYS = [
    { id: 'Mon', label: 'T2' },
    { id: 'Tue', label: 'T3' },
    { id: 'Wed', label: 'T4' },
    { id: 'Thu', label: 'T5' },
    { id: 'Fri', label: 'T6' },
    { id: 'Sat', label: 'T7' },
    { id: 'Sun', label: 'CN' },
];

const ScheduleScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [selectedDay, setSelectedDay] = useState(DAYS[0].id);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schedule, setSchedule] = useState({});

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            const res = await movieAPI.getAll({ limit: 20 });
            if (res.data.success) {
                const fetchedMovies = res.data.data;
                setMovies(fetchedMovies);
                generateSchedule(fetchedMovies);
            }
        } catch (error) {
            console.error('Fetch schedule error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fake schedule generation
    const generateSchedule = (movieList) => {
        const newSchedule = {};
        DAYS.forEach(day => {
            // Randomly select 3-5 movies for each day
            const count = Math.floor(Math.random() * 3) + 3;
            const shuffled = [...movieList].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, count).map((movie, index) => ({
                ...movie,
                time: `${18 + index}:00`, // Fake time: 18:00, 19:00, ...
                room: `P0${index + 1}`   // Fake room
            }));
            newSchedule[day.id] = selected;
        });
        setSchedule(newSchedule);
    };

    const renderDayItem = ({ item }) => {
        const isSelected = selectedDay === item.id;
        return (
            <TouchableOpacity
                style={[styles.dayItem, isSelected && styles.dayItemSelected]}
                onPress={() => setSelectedDay(item.id)}
            >
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderScheduleItem = ({ item }) => {
        const rawPath = item.poster || item.posterUrl || item.thumbnailUrl;
        const imageUrl = getImageUrl(rawPath);
        return (
            <TouchableOpacity
                style={styles.movieCard}
                onPress={() => console.log('Press schedule movie', item.title)}
            >
                <Text style={styles.timeText}>{item.time}</Text>
                <View style={styles.movieContent}>
                    <Image source={{ uri: imageUrl }} style={styles.poster} />
                    <View style={styles.movieInfo}>
                        <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                        <View style={styles.metaRow}>
                            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.metaText}>{item.duration}p</Text>

                            <View style={styles.dot} />

                            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.metaText}>{item.room}</Text>
                        </View>
                        <View style={styles.genreRow}>
                            {/* Mock genres */}
                            <Text style={styles.genreText}>Hành động, Viễn tưởng</Text>
                        </View>
                    </View>
                    <View style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Đặt vé</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[globalStyles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lịch Chiếu</Text>
            </View>

            {/* Day Selector */}
            <View style={styles.daySelector}>
                <FlatList
                    data={DAYS}
                    renderItem={renderDayItem}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayListContent}
                />
            </View>

            {/* Schedule List */}
            {loading ? (
                <View style={globalStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={schedule[selectedDay] || []}
                    renderItem={renderScheduleItem}
                    keyExtractor={(item, index) => item._id + index}
                    contentContainerStyle={styles.scheduleList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có lịch chiếu</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        padding: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    headerTitle: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.text,
    },
    daySelector: {
        marginBottom: SPACING.md,
    },
    dayListContent: {
        paddingHorizontal: SPACING.lg,
    },
    dayItem: {
        width: 50,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.backgroundCard,
        marginRight: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dayItemSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    dayText: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.textSecondary,
    },
    dayTextSelected: {
        color: COLORS.background,
    },
    scheduleList: {
        padding: SPACING.lg,
        paddingBottom: 100,
    },
    movieCard: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
        alignItems: 'flex-start',
    },
    timeText: {
        width: 50,
        fontSize: FONT_SIZES.lg,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
    movieContent: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    poster: {
        width: 70,
        height: 100,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.border,
    },
    movieInfo: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    movieTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    metaText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginLeft: 4,
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.textSecondary,
        marginHorizontal: 6,
    },
    genreRow: {
        marginTop: 4,
    },
    genreText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textMuted,
        fontStyle: 'italic',
    },
    actionButton: {
        position: 'absolute',
        bottom: SPACING.sm,
        right: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.sm,
    },
    actionButtonText: {
        fontSize: FONT_SIZES.xs,
        fontWeight: FONT_WEIGHTS.bold,
        color: COLORS.background,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        color: COLORS.textMuted,
    },
});

export default ScheduleScreen;
