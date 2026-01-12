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
    Alert,
    FlatList,
    TextInput
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

const { width } = Dimensions.get('window');

const MovieDetailScreen = ({ route, navigation }) => {
    const { movieId, movie: initialMovieData } = route.params;
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id || user?._id;
    const insets = useSafeAreaInsets();

    const [movie, setMovie] = useState(initialMovieData || null);
    const [loading, setLoading] = useState(!initialMovieData);
    const [recommendations, setRecommendations] = useState([]);
    const [comments, setComments] = useState([]);
    const [userComment, setUserComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    const [playingTrailer, setPlayingTrailer] = useState(false);
    const [activeTab, setActiveTab] = useState('cast'); // 'cast', 'recommendations', 'comments'
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            checkWishlistStatus();
        }
        fetchMovieDetails();
    }, [movieId, isAuthenticated]);

    const checkWishlistStatus = async () => {
        try {
            const wishRes = await wishlistAPI.checkStatus(movieId);
            if (wishRes.data.success) {
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
            let currentMovie = initialMovieData;

            if (response.data.success) {
                currentMovie = response.data.data;
                setMovie(currentMovie);
            }

            // Get Recommendations based on Genre
            if (currentMovie && currentMovie.genres && currentMovie.genres.length > 0) {
                const firstGenre = typeof currentMovie.genres[0] === 'string'
                    ? currentMovie.genres[0]
                    : currentMovie.genres[0].name;

                // Fetch movies with same genre
                const recResponse = await movieAPI.getAll({ genre: firstGenre, limit: 10 });
                if (recResponse.data.success) {
                    // Filter out current movie
                    const related = recResponse.data.data.filter(m => m._id !== movieId);
                    setRecommendations(related);
                }
            } else if (movieAPI.getRecommendations) {
                // Fallback to old method if no genre
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

    const [replyingTo, setReplyingTo] = useState(null); // { id: string, name: string }

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
                content: userComment,
                parentId: replyingTo ? replyingTo.id : null
            });
            if (res.data.success) {
                setUserComment('');
                setReplyingTo(null);
                fetchComments();
                // Alert.alert("Thành công", "Đã đăng bình luận!"); // Remove annoying alert for chat-like experience
            }
        } catch (error) {
            console.error('Post comment error:', error);
            Alert.alert("Lỗi", "Không thể đăng bình luận.");
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleReply = (comment) => {
        const name = comment.userId?.profile?.name || comment.userId?.email?.split('@')[0] || 'Người dùng';
        setReplyingTo({ id: comment._id, name });
        // Optionally focus input here if possible
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const handleLike = async (comment) => {
        if (!isAuthenticated) {
            Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để thích bình luận.");
            return;
        }
        try {
            // Optimistic update could be done here, but for simplicity we fetch or just manual update state
            await commentAPI.like(comment._id);
            // Refresh comments to get latest counts and state
            fetchComments();
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleDislike = async (comment) => {
        if (!isAuthenticated) {
            Alert.alert("Yêu cầu đăng nhập", "Bạn cần đăng nhập để không thích bình luận.");
            return;
        }
        try {
            await commentAPI.dislike(comment._id);
            fetchComments();
        } catch (error) {
            console.error('Dislike error:', error);
        }
    };

    const handlePlayPress = () => {
        navigation.navigate('Watch', { movie });
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
                setIsInWishlist(true);
                Alert.alert("Thông báo", "Phim đã có trong danh sách yêu thích");
            } else {
                console.error('Toggle wishlist error:', error);
                Alert.alert("Lỗi", "Không thể cập nhật danh sách yêu thích");
            }
        }
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

    const getYear = () => {
        if (movie.releaseYear) return movie.releaseYear;
        if (movie.year) return movie.year;
        if (movie.releaseDate) {
            const d = new Date(movie.releaseDate);
            if (!isNaN(d.getTime())) return d.getFullYear();
        }
        if (movie.createdAt) {
            const d = new Date(movie.createdAt);
            if (!isNaN(d.getTime())) return d.getFullYear();
        }
        return 'N/A';
    };

    if (!movie) return <View style={styles.loadingContainer} />;

    const backdropUrl = getImageUrl(movie.backdrop || movie.poster);

    // Check for trailer key
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

                <TouchableOpacity
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>

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
                            <Text style={styles.tagText}>{getYear()}</Text>
                        </View>
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
                            <View style={styles.reviewInputWrapper}>
                                {replyingTo && (
                                    <View style={styles.replyContext}>
                                        <Text style={styles.replyContextText}>Đang trả lời: <Text style={{ fontWeight: 'bold' }}>{replyingTo.name}</Text></Text>
                                        <TouchableOpacity onPress={cancelReply}>
                                            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <View style={styles.reviewInputContainer}>
                                    <TextInput
                                        style={styles.reviewInput}
                                        placeholder={replyingTo ? "Viết câu trả lời..." : "Viết bình luận..."}
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
                            </View>

                            {/* List */}
                            {comments.length > 0 ? comments.map((comment) => (
                                <View key={comment._id} style={styles.reviewItem}>
                                    <View style={styles.reviewHeader}>
                                        <Text style={styles.reviewerName}>{comment.userId?.profile?.name || comment.userId?.email?.split('@')[0] || 'Người dùng'}</Text>
                                        <Text style={styles.reviewDate}>
                                            {new Date(comment.createdAt).toLocaleDateString('vi-VN')}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewContent}>{comment.content}</Text>

                                    {/* Interaction Buttons (Like, Dislike, Reply) */}
                                    <View style={styles.interactionRow}>
                                        <TouchableOpacity style={styles.interactionBtn} onPress={() => handleLike(comment)}>
                                            <Ionicons
                                                name={user && comment.likes?.includes(userId) ? "thumbs-up" : "thumbs-up-outline"}
                                                size={16}
                                                color={user && comment.likes?.includes(userId) ? COLORS.primary : COLORS.textSecondary}
                                            />
                                            <Text style={[styles.interactionText, user && comment.likes?.includes(userId) && { color: COLORS.primary }]}>
                                                {comment.likeCount || 0}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.interactionBtn} onPress={() => handleDislike(comment)}>
                                            <Ionicons
                                                name={user && comment.dislikes?.includes(userId) ? "thumbs-down" : "thumbs-down-outline"}
                                                size={16}
                                                color={user && comment.dislikes?.includes(userId) ? COLORS.error : COLORS.textSecondary}
                                            />
                                            <Text style={[styles.interactionText, user && comment.dislikes?.includes(userId) && { color: COLORS.error }]}>
                                                {comment.dislikeCount || 0}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={styles.interactionBtn} onPress={() => handleReply(comment)}>
                                            <Text style={styles.replyBtnText}>Trả lời</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Replies Section */}
                                    {comment.replies && comment.replies.length > 0 && (
                                        <View style={styles.repliesContainer}>
                                            {comment.replies.map((reply) => (
                                                <View key={reply._id} style={styles.replyItem}>
                                                    <View style={styles.reviewHeader}>
                                                        <Text style={styles.reviewerName}>{reply.userId?.profile?.name || reply.userId?.email?.split('@')[0] || 'Người dùng'}</Text>
                                                        <Text style={styles.reviewDate}>
                                                            {new Date(reply.createdAt).toLocaleDateString('vi-VN')}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.reviewContent}>{reply.content}</Text>

                                                    {/* Like/Dislike for Reply */}
                                                    <View style={[styles.interactionRow, { marginTop: 4 }]}>
                                                        <TouchableOpacity style={styles.interactionBtn} onPress={() => handleLike(reply)}>
                                                            <Ionicons
                                                                name={user && reply.likes?.includes(userId) ? "thumbs-up" : "thumbs-up-outline"}
                                                                size={14}
                                                                color={user && reply.likes?.includes(userId) ? COLORS.primary : COLORS.textSecondary}
                                                            />
                                                            <Text style={[styles.interactionText, { fontSize: 10 }, user && reply.likes?.includes(userId) && { color: COLORS.primary }]}>
                                                                {reply.likeCount || 0}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        <TouchableOpacity style={styles.interactionBtn} onPress={() => handleDislike(reply)}>
                                                            <Ionicons
                                                                name={user && reply.dislikes?.includes(userId) ? "thumbs-down" : "thumbs-down-outline"}
                                                                size={14}
                                                                color={user && reply.dislikes?.includes(userId) ? COLORS.error : COLORS.textSecondary}
                                                            />
                                                            <Text style={[styles.interactionText, { fontSize: 10 }, user && reply.dislikes?.includes(userId) && { color: COLORS.error }]}>
                                                                {reply.dislikeCount || 0}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
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
        height: width * 0.6,
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
        marginTop: -20,
    },
    watchButton: {
        backgroundColor: COLORS.primary,
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
    interactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 15,
    },
    interactionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
    },
    interactionText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    replyBtnText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
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
    repliesContainer: {
        marginTop: SPACING.sm,
        paddingLeft: SPACING.md,
        borderLeftWidth: 2,
        borderLeftColor: '#444',
    },
    replyItem: {
        marginTop: SPACING.sm,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
    },
    interactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 15,
    },
    interactionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 2,
    },
    interactionText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    replyBtnText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    reviewInputWrapper: {
        marginBottom: SPACING.lg,
    },
    replyContext: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#222',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderTopLeftRadius: RADIUS.md,
        borderTopRightRadius: RADIUS.md,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    replyContextText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});

export default MovieDetailScreen;
