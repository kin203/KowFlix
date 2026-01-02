import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
    Share
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } from '../constants/colors';
import { getImageUrl } from '../utils/imageUtils';
import { movieAPI } from '../services/api/movieAPI';

const { width } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
    const { movieId, movie: initialMovieData } = route.params;
    const insets = useSafeAreaInsets();

    const [movie, setMovie] = useState(initialMovieData || null);
    const [loading, setLoading] = useState(!initialMovieData);
    const [playingTrailer, setPlayingTrailer] = useState(false);
    const [activeTab, setActiveTab] = useState('cast'); // 'cast' or 'recommendations'
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    useEffect(() => {
        fetchMovieDetails();
    }, [movieId]);

    const fetchMovieDetails = async () => {
        try {
            // Fetch full details if we only have basic info or need fresh data
            // Also fetch similar movies, cast etc. if API supports it
            // For now, assume movieAPI.getById returns full info
            const response = await movieAPI.getById(movieId);
            if (response.data.success) {
                setMovie(response.data.data);
            }
        } catch (error) {
            console.error('Fetch movie details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPress = () => {
        // Navigate to full screen player
        navigation.navigate('Watch', { movie });
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Xem phim ${movie?.title} tại KowFlix!`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    if (!movie) return <View style={styles.loadingContainer} />;

    const backdropUrl = getImageUrl(movie.backdrop || movie.poster);
    const posterUrl = getImageUrl(movie.poster);

    // Check for trailer key (Youtube ID) based on user DB schema
    const hasTrailer = movie.useTrailer && movie.trailerKey;
    const trailerUrl = hasTrailer ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&modestbranding=1&rel=0` : null;

    const renderHeader = () => {
        if (playingTrailer && hasTrailer && trailerUrl) {
            return (
                <View style={styles.videoContainer}>
                    <WebView
                        style={styles.webView}
                        javaScriptEnabled={true}
                        source={{ uri: trailerUrl }}
                        scalesPageToFit={true}
                        allowsFullscreenVideo={true}
                    />
                    <TouchableOpacity
                        style={styles.closeTrailerButton}
                        onPress={() => setPlayingTrailer(false)}
                    >
                        <Ionicons name="close" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.headerImageContainer}>
                <Image source={{ uri: backdropUrl }} style={styles.backdrop} resizeMode="cover" />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)', COLORS.background]}
                    style={styles.gradient}
                />

                {/* Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>

                {/* Trailer Toggle Button (if has trailer) */}
                {hasTrailer && (
                    <TouchableOpacity
                        style={styles.playTrailerButton}
                        onPress={() => setPlayingTrailer(true)}
                    >
                        <Ionicons name="play-circle-outline" size={50} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderActionButtons = () => (
        <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="heart-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>Yêu thích</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="add" size={28} color="#FFF" />
                <Text style={styles.actionText}>Thêm vào</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>{movie.rating?.toFixed(1) || '0.0'}</Text>
                </View>
                <Text style={styles.actionText}>Đánh giá</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>Bình luận</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color="#FFF" />
                <Text style={styles.actionText}>Chia sẻ</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                <View style={styles.contentContainer}>
                    {/* Main Action Button */}
                    <TouchableOpacity style={styles.watchButton} onPress={handlePlayPress}>
                        <Ionicons name="play" size={24} color="#000" />
                        <Text style={styles.watchButtonText}>Xem phim</Text>
                    </TouchableOpacity>

                    {/* Title & Stats */}
                    <Text style={styles.title}>{movie.title}</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.imdbBadge}>
                            <Text style={styles.imdbText}>IMDb {movie.imdbRating || movie.rating || 'N/A'}</Text>
                        </View>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{movie.ageRating || 'T13'}</Text>
                        </View>
                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{new Date(movie.releaseDate || movie.year).getFullYear()}</Text>
                        </View>
                        {/* Quality Badge */}
                        <View style={[styles.tagBadge, { borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={styles.tagText}>{movie.quality || 'HD'}</Text>
                        </View>
                    </View>

                    {/* Genres */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                        {movie.genres?.map((genre, index) => (
                            <View key={index} style={styles.genreTag}>
                                <Text style={styles.genreText}>{genre.name || genre}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text
                            style={styles.description}
                            numberOfLines={isDescriptionExpanded ? undefined : 3}
                        >
                            {movie.description || 'Chưa có mô tả.'}
                        </Text>
                        <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                            <Text style={styles.moreText}>{isDescriptionExpanded ? 'Thu gọn' : 'Chi tiết'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Actions Grid */}
                    {renderActionButtons()}

                    {/* Tabs */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'cast' && styles.activeTabButton]}
                            onPress={() => setActiveTab('cast')}
                        >
                            <Text style={[styles.tabText, activeTab === 'cast' && styles.activeTabText]}>Diễn viên</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tabButton, activeTab === 'recommendations' && styles.activeTabButton]}
                            onPress={() => setActiveTab('recommendations')}
                        >
                            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.activeTabText]}>Đề xuất</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'cast' ? (
                        <View style={styles.castList}>
                            {movie.cast?.length > 0 ? movie.cast.map((actor, idx) => (
                                <View key={idx} style={styles.castItem}>
                                    <Image
                                        source={{ uri: getImageUrl(actor.profile_path || null) }}
                                        style={styles.castImage}
                                    />
                                    <View style={styles.castInfo}>
                                        <Text style={styles.castName}>{actor.name}</Text>
                                        <Text style={styles.characterName}>{actor.character || 'Diễn viên'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.castInfoButton}>
                                        <Text style={styles.castInfoButtonText}>Thông tin</Text>
                                    </TouchableOpacity>
                                </View>
                            )) : (
                                <Text style={styles.emptyText}>Đang cập nhật diễn viên...</Text>
                            )}
                        </View>
                    ) : (
                        <View style={styles.recommendationList}>
                            <Text style={styles.emptyText}>Chưa có đề xuất nào.</Text>
                        </View>
                    )}

                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    headerImageContainer: {
        height: width * 0.6, // 16:9 ratio approx
        width: '100%',
        position: 'relative',
    },
    videoContainer: {
        height: width * 0.6,
        width: '100%',
        backgroundColor: '#000',
    },
    webView: {
        flex: 1,
    },
    backdrop: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        left: SPACING.lg,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    closeTrailerButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 5,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    playTrailerButton: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -25,
        marginLeft: -25,
    },
    contentContainer: {
        padding: SPACING.lg,
        marginTop: -20, // Overlap slightly
    },
    watchButton: {
        backgroundColor: COLORS.primary, // Yellow
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.lg,
    },
    watchButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: FONT_SIZES.lg,
        marginLeft: 8,
    },
    title: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: SPACING.sm,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        flexWrap: 'wrap',
    },
    imdbBadge: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
        marginBottom: 4,
    },
    imdbText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.xs,
        fontWeight: 'bold',
    },
    tagBadge: {
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 8,
        marginBottom: 4,
    },
    tagText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.xs,
    },
    genreScroll: {
        marginBottom: SPACING.lg,
    },
    genreTag: {
        backgroundColor: '#333',
        borderRadius: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
    },
    genreText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
    },
    descriptionContainer: {
        marginBottom: SPACING.xl,
    },
    description: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        lineHeight: 22,
    },
    moreText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginTop: 4,
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.sm,
    },
    actionItem: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: COLORS.textSecondary,
        fontSize: 10,
        marginTop: 6,
    },
    ratingBadge: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    ratingBadgeText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
        marginBottom: SPACING.md,
    },
    tabButton: {
        paddingVertical: SPACING.sm,
        marginRight: SPACING.xl,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    activeTabText: {
        color: COLORS.primary,
    },
    castList: {
        marginTop: SPACING.sm,
    },
    castItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    castImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: SPACING.md,
    },
    castInfo: {
        flex: 1,
    },
    castName: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: FONT_SIZES.md,
        marginBottom: 2,
    },
    characterName: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    castInfoButton: {
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 15,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    castInfoButtonText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.xs,
    },
    recommendationList: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
});

export default MovieDetailScreen;
