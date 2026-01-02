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
    Share,
    Alert, // Added Alert
    FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, RADIUS } from '../constants/colors';
import { getImageUrl } from '../utils/imageUtils';
import { movieAPI } from '../services/api/movieAPI';
import { wishlistAPI } from '../services/api/wishlistAPI';
import { commentAPI } from '../services/api/commentAPI';
import { useAuth } from '../context/AuthContext';
import { TextInput } from 'react-native';

const { width } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
    const { movieId, movie: initialMovieData } = route.params;
    const { isAuthenticated } = useAuth(); // Get auth state
    const insets = useSafeAreaInsets();

    const [movie, setMovie] = useState(initialMovieData || null);
    const [loading, setLoading] = useState(!initialMovieData);
    const [recommendations, setRecommendations] = useState([]); // Added recommendations state
    const [comments, setComments] = useState([]); // Comments state
    const [userComment, setUserComment] = useState(''); // Comment input
    const [submittingComment, setSubmittingComment] = useState(false);

    const [playingTrailer, setPlayingTrailer] = useState(false);
    const [activeTab, setActiveTab] = useState('cast'); // 'cast', 'recommendations', 'comments'
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false); // New state

    useEffect(() => {
        if (isAuthenticated) {
            checkWishlistStatus();
        }
    }, [movieId, isAuthenticated]);

    const checkWishlistStatus = async () => {
        try {
            const wishRes = await wishlistAPI.checkStatus(movieId);
            if (wishRes.data.success) {
                // Backend returns { success: true, data: { inWishlist: boolean } }
                setIsInWishlist(!!wishRes.data.data?.inWishlist);
            }
        } catch (err) {
            console.log('Check wishlist error:', err);
        }
    };

    const fetchComments = async () => {
        try {
            const res = await commentAPI.getMovieComments(movieId);
            if (res.data.success) {
                setComments(res.data.data);
            }
        } catch (error) {
            console.log('Fetch comments error:', error);
        }
    };

    const fetchMovieDetails = async () => {
        try {
            const response = await movieAPI.getById(movieId);
            if (response.data.success) {
                setMovie(response.data.data);
            }

            if (movieAPI.getRecommendations) {
                const recResponse = await movieAPI.getRecommendations(movieId);
                if (recResponse.data.success) {
                    setRecommendations(recResponse.data.data || []);
                }
            }

            await fetchComments();
        } catch (error) {
            console.error('Fetch movie details error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!userComment.trim()) return;
        if (!isAuthenticated) {
            Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để bình luận.");
            return;
        }

        setSubmittingComment(true);
        try {
            const res = await commentAPI.create({
                movieId,
                content: userComment
            });
            if (res.data.success) {
                setUserComment('');
                fetchComments();
                Alert.alert("Thành công", "Đã đăng bình luận!");
            }
        } catch (error) {
            console.error('Post comment error:', error);
            Alert.alert("Lỗi", "Không thể đăng bình luận.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handlePlayPress = () => {
        navigation.navigate('Watch', { movie });
    };

    const handleAddToMyList = () => {
        Alert.alert("Thông báo", "Đã thêm vào danh sách xem sau!");
    };

    const handleFavorite = async () => {
        try {
            if (isInWishlist) {
                await wishlistAPI.remove(movieId);
                setIsInWishlist(false);
                Alert.alert("Thông báo", "Đã xóa khỏi danh sách yêu thích");
            } else {
                await wishlistAPI.add(movieId);
                setIsInWishlist(true);
                Alert.alert("Thông báo", "Đã thêm vào danh sách yêu thích");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || '';
            if (error.response?.status === 400 && (errorMessage.includes('Already in wishlist') || errorMessage.includes('exist'))) {
                // Auto-correct state
                setIsInWishlist(true);
                Alert.alert("Thông báo", "Phim đã có trong danh sách yêu thích");
            } else {
                console.error('Toggle wishlist error:', error);
                Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích");
            }
        }
    };

    // ... (renderHeader, renderActionButtons kept same implicitly by only replacing logic block)

    // ... (Skip to Tab Rendering part)
    /* 
       Note: The tool replaces a contiguous block. 
       I need to replace from 'useEffect' (line 46) down to the end of Tab Content 'line 361' 
       to cover both logic fixes and the ternary rendering fix.
       This is a large block. I will try to target specific blocks if possible, 
       but the logic changes are intertwined.
       Let's replace the Logic Block first (useEffect to handleShare), 
       then the Tab Rendering block.
    */

    // Changing approach: Replace Logic Block first.


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
        <View style={[styles.actionGrid, { justifyContent: 'flex-start', gap: 20 }]}>
            <TouchableOpacity style={styles.actionItem} onPress={handleFavorite}>
                <Ionicons
                    name={isInWishlist ? "heart" : "heart-outline"}
                    size={24}
                    color={isInWishlist ? COLORS.primary : "#FFF"}
                />
                <Text style={[styles.actionText, isInWishlist && { color: COLORS.primary }]}>
                    {isInWishlist ? "Đã thích" : "Yêu thích"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => setActiveTab('comments')}>
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
                        {['cast', 'recommendations', 'comments'].map(tab => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab === 'cast' ? 'Diễn viên' : tab === 'recommendations' ? 'Đề xuất' : 'Bình luận'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    {activeTab === 'cast' && (
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
                                </View>
                            )) : (
                                <Text style={styles.emptyText}>Đang cập nhật diễn viên...</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'recommendations' && (
                        <View style={styles.recommendationList}>
                            {recommendations.length > 0 ? (
                                <FlatList
                                    data={recommendations}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(item) => item._id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.recommendationItem}
                                            onPress={() => navigation.push('MovieDetail', { movieId: item._id, movie: item })}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(item.poster) }}
                                                style={styles.recommendationPoster}
                                            />
                                            <Text style={styles.recommendationTitle} numberOfLines={1}>{item.title}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            ) : (
                                <Text style={styles.emptyText}>Chưa có đề xuất nào.</Text>
                            )}
                        </View>
                    )}

                    {activeTab === 'comments' && (
                        <View style={styles.reviewSection}>
                            {/* Input */}
                            <View style={styles.reviewInputContainer}>
                                <TextInput
                                    style={styles.reviewInput}
                                    placeholder="Viết bình luận..."
                                    placeholderTextColor={COLORS.textMuted}
                                    value={userComment}
                                    onChangeText={setUserComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    style={[styles.postButton, !userComment.trim() && { opacity: 0.5 }]}
                                    onPress={handlePostComment}
                                    disabled={submittingComment || !userComment.trim()}
                                >
                                    <Ionicons name="send" size={20} color="#000" />
                                </TouchableOpacity>
                            </View>

                            {/* List */}
                            {comments.length > 0 ? comments.map((comment) => (
                                <View key={comment._id} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewerName}>{comment.userId?.username || 'Người dùng'}</Text>
                                        <Text style={styles.reviewDate}>
                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewContent}>{comment.content}</Text>
                                </View>
                            )) : (
                                <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                            )}
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
        paddingVertical: SPACING.md,
    },
    recommendationItem: {
        marginRight: SPACING.md,
        width: 120,
    },
    recommendationPoster: {
        width: 120,
        height: 180,
        borderRadius: RADIUS.sm,
        marginBottom: SPACING.xs,
    },
    recommendationTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.sm,
        fontWeight: 'bold',
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: SPACING.lg,
    },
    reviewSection: {
        marginTop: SPACING.md,
    },
    reviewInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        marginBottom: SPACING.lg,
    },
    reviewInput: {
        flex: 1,
        color: '#FFF',
        paddingVertical: 8,
        minHeight: 40,
    },
    postButton: {
        backgroundColor: COLORS.primary,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACING.xs,
    },
    reviewItem: {
        backgroundColor: COLORS.backgroundCard,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    reviewerName: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: FONT_SIZES.sm,
    },
    reviewDate: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.xs,
    },
    reviewContent: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        lineHeight: 20,
    },
});

export default MovieDetailScreen;
