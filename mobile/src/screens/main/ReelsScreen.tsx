import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import {
  Card,
  Avatar,
  IconButton,
  Chip,
  Surface,
  Button,
  FAB,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootState, useAppDispatch } from '../../store/store';
import {
  fetchPublicIssues,
  fetchNearbyIssues,
  voteIssue,
  removeVote,
  addComment,
  clearError,
} from '../../store/slices/issueSlice';
import { theme } from '../../theme/index';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ReelItemProps {
  item: any;
  index: number;
  currentIndex: number;
  onVote: (issueId: string, voteType: 'upvote' | 'downvote') => void;
  onComment: (issueId: string) => void;
  onShare: (issue: any) => void;
  onNavigateToIssue: (issueId: string) => void;
}

const ReelItem: React.FC<ReelItemProps> = ({
  item: issue,
  index,
  currentIndex,
  onVote,
  onComment,
  onShare,
  onNavigateToIssue,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const player = useVideoPlayer(issue.media?.videos?.[0] || '', (player) => {
    player.loop = true;
    player.muted = isMuted;
  });

  useEffect(() => {
    if (index === currentIndex) {
      setIsPlaying(true);
      player.play();
    } else {
      setIsPlaying(false);
      player.pause();
    }
  }, [index, currentIndex, player]);

  const togglePlayback = async () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = async () => {
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    onVote(issue.id, voteType);
  };

  const renderMedia = () => {
    if (issue.media?.videos && issue.media.videos.length > 0) {
      return (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
        />
      );
    } else if (issue.media?.images && issue.media.images.length > 0) {
      return (
        <TouchableOpacity
          style={styles.media}
          onPress={togglePlayback}
          activeOpacity={0.9}
        >
          <Card.Cover
            source={{ uri: issue.media.images[0] }}
            style={styles.media}
          />
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={[styles.media, styles.noMedia]}>
          <Text style={styles.noMediaText}>No Media</Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.reelContainer}>
      {/* Media Content */}
      <View style={styles.mediaContainer}>
        {renderMedia()}

        {/* Play/Pause Overlay */}
        {issue.media?.videos && issue.media.videos.length > 0 && (
          <TouchableOpacity
            style={styles.playPauseOverlay}
            onPress={togglePlayback}
            activeOpacity={0.7}
          >
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              size={60}
              iconColor="white"
              style={styles.playPauseButton}
            />
          </TouchableOpacity>
        )}

        {/* Volume Control */}
        {issue.media?.videos && issue.media.videos.length > 0 && (
          <IconButton
            icon={isMuted ? 'volume-off' : 'volume-high'}
            size={24}
            iconColor="white"
            style={styles.volumeButton}
            onPress={toggleMute}
          />
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVote('upvote')}
          >
            <IconButton
              icon={issue.userVote === 'upvote' ? 'thumb-up' : 'thumb-up-outline'}
              size={28}
              iconColor={issue.userVote === 'upvote' ? '#2196F3' : 'white'}
            />
            <Text style={styles.actionText}>
              {issue.upvotesCount || issue.voteScore || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleVote('downvote')}
          >
            <IconButton
              icon={issue.userVote === 'downvote' ? 'thumb-down' : 'thumb-down-outline'}
              size={28}
              iconColor={issue.userVote === 'downvote' ? '#F44336' : 'white'}
            />
            <Text style={styles.actionText}>
              {issue.downvotesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(issue.id)}
          >
            <IconButton
              icon="comment-outline"
              size={28}
              iconColor="white"
            />
            <Text style={styles.actionText}>
              {issue.commentsCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(issue)}
          >
            <IconButton
              icon="share-outline"
              size={28}
              iconColor="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Issue Info Overlay */}
      <TouchableOpacity
        style={styles.infoOverlay}
        onPress={() => onNavigateToIssue(issue.id)}
        activeOpacity={0.9}
      >
        <View style={styles.userInfo}>
          <Avatar.Text
            size={32}
            label={(issue.reportedBy?.name || 'Anonymous').charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {issue.reportedBy?.name || 'Anonymous'}
            </Text>
            <Text style={styles.timeAgo}>
              {issue.daysSinceReported ? `${issue.daysSinceReported} days ago` : 'Recently'}
            </Text>
          </View>
        </View>

        <View style={styles.issueDetails}>
          <Text style={styles.issueTitle} numberOfLines={2}>
            {issue.title || 'Untitled Issue'}
          </Text>
          <Text style={styles.issueDescription} numberOfLines={3}>
            {issue.description || 'No description available'}
          </Text>

          <View style={styles.issueMeta}>
            <Chip
              style={styles.categoryChip}
              textStyle={styles.categoryChipText}
              compact
            >
              {issue.category || 'Other'}
            </Chip>

            <Chip
              style={styles.statusChip}
              textStyle={styles.statusChipText}
              compact
            >
              {issue.statusDisplay || issue.status || 'Unknown'}
            </Chip>
          </View>

          <Text style={styles.location}>
            📍 {issue.location?.address || 'Location not available'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const ReelsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { publicIssues, isLoading, error } = useSelector((state: RootState) => state.issues);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasMoreIssues, setHasMoreIssues] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadInitialIssues();
      return () => {
        // Cleanup when screen loses focus
      };
    }, [])
  );

  const loadInitialIssues = async () => {
    try {
      console.log('🎬 Loading initial reels...');
      await dispatch(fetchPublicIssues({
        page: 1,
        limit: 10,
        fields: 'id,title,description,category,priority,status,statusDisplay,location,timeline,reportedBy,voteScore,upvotesCount,downvotesCount,commentsCount,userVote,daysSinceReported,media'
      })).unwrap();
      console.log('✅ Initial reels loaded');
    } catch (err) {
      console.error('❌ Failed to load initial reels:', err);
    }
  };

  const loadMoreIssues = async () => {
    if (isLoadingMore || !hasMoreIssues) return;

    setIsLoadingMore(true);
    try {
      console.log('🎬 Loading more reels...');
      const nextPage = Math.floor(publicIssues.length / 10) + 1;
      const result = await dispatch(fetchPublicIssues({
        page: nextPage,
        limit: 10,
        fields: 'id,title,description,category,priority,status,statusDisplay,location,timeline,reportedBy,voteScore,upvotesCount,downvotesCount,commentsCount,userVote,daysSinceReported,media'
      })).unwrap();

      const newIssuesCount = result.issues?.length || 0;
      if (newIssuesCount === 0) {
        setHasMoreIssues(false);
      }
      console.log(`✅ Loaded ${newIssuesCount} more reels`);
    } catch (err) {
      console.error('❌ Failed to load more reels:', err);
      setHasMoreIssues(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleVote = async (issueId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'Please log in to vote on issues.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login' as never) }
        ]
      );
      return;
    }

    try {
      const issue = publicIssues.find(i => i.id === issueId);
      if (!issue) return;

      if (issue.userVote === voteType) {
        await dispatch(removeVote(issueId)).unwrap();
      } else {
        await dispatch(voteIssue({ issueId, voteType })).unwrap();
      }
    } catch (err) {
      console.error('❌ Failed to vote:', err);
      Alert.alert('Error', 'Failed to register your vote. Please try again.');
    }
  };

  const handleComment = (issueId: string) => {
    // Navigate to issue detail with comments tab
    navigation.navigate('IssueDetail', { 
      issueId,
      initialTab: 'comments'
    });
  };

  const handleShare = async (issue: any) => {
    try {
      const shareMessage = `Check out this civic issue: ${issue.title}\n\n${issue.description}\n\nReported ${issue.daysSinceReported || 0} days ago in ${issue.location?.address || 'your area'}`;

      const result = await Share.share({
        message: shareMessage,
        title: issue.title,
      });

      if (result.action === Share.sharedAction) {
        console.log('✅ Issue shared successfully');
      }
    } catch (err) {
      console.error('❌ Failed to share:', err);
    }
  };

  const handleNavigateToIssue = (issueId: string) => {
    navigation.navigate('IssueDetail', { issueId });
  };

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const mostVisibleItem = viewableItems.reduce((prev: any, current: any) => {
        return (prev.isViewable && current.isViewable) 
          ? (current.itemVisiblePercent > prev.itemVisiblePercent ? current : prev)
          : (current.isViewable ? current : prev);
      });
      if (mostVisibleItem && mostVisibleItem.index !== undefined) {
        setCurrentIndex(mostVisibleItem.index);
      }
    }
  }, []);

  const onScrollToIndexFailed = (info: any) => {
    console.warn('Scroll to index failed:', info);
  };

  const onMomentumScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const currentIndex = Math.round(offsetY / screenHeight);
    setCurrentIndex(currentIndex);
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 80, // Require 80% visibility to consider item viewable
    minimumViewTime: 100, // Item must be visible for at least 100ms
  };

  const renderReelItem = ({ item, index }: { item: any; index: number }) => (
    <ReelItem
      item={item}
      index={index}
      currentIndex={currentIndex}
      onVote={handleVote}
      onComment={handleComment}
      onShare={handleShare}
      onNavigateToIssue={handleNavigateToIssue}
    />
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.footerText}>Loading more reels...</Text>
        </View>
      );
    }

    if (!hasMoreIssues && publicIssues.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerText}>No more reels available</Text>
          <Button
            mode="outlined"
            onPress={loadInitialIssues}
            style={styles.refreshButton}
          >
            Refresh
          </Button>
        </View>
      );
    }

    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Surface style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>No Reels Yet</Text>
        <Text style={styles.emptyDescription}>
          Civic issues will appear here as they're reported in your community.
        </Text>
        <Button
          mode="contained"
          onPress={loadInitialIssues}
          style={styles.emptyButton}
          icon="refresh"
        >
          Refresh
        </Button>
      </Surface>
    </View>
  );

  if (isLoading && publicIssues.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading reels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {publicIssues.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={publicIssues}
          renderItem={renderReelItem}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToInterval={screenHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToIndexFailed={onScrollToIndexFailed}
          onEndReached={loadMoreIssues}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          initialNumToRender={3}
          maxToRenderPerBatch={2}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: screenHeight,
            offset: screenHeight * index,
            index,
          })}
        />
      )}

      {/* Report Issue FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('ReportIssue' as never)}
        label="Report Issue"
      />

      {/* Error Snackbar would go here if needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  reelContainer: {
    height: screenHeight,
    width: screenWidth,
    backgroundColor: 'black',
  },
  mediaContainer: {
    flex: 1,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  noMedia: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  noMediaText: {
    color: 'white',
    fontSize: 18,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    zIndex: 10,
  },
  playPauseButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  volumeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    margin: 0,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: 16,
    paddingBottom: 32,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  issueDetails: {
    marginBottom: 8,
  },
  issueTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  issueDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  issueMeta: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 8,
  },
  categoryChipText: {
    color: 'white',
    fontSize: 12,
  },
  statusChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusChipText: {
    color: 'white',
    fontSize: 12,
  },
  location: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 32,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  footerLoader: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  footerEnd: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'black',
  },
  footerText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  refreshButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default ReelsScreen;