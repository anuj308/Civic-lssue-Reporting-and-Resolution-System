import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Surface,
  Text,
  Chip,
  IconButton,
  Button,
  Card,
  Divider,
  Avatar,
  ActivityIndicator,
  Banner,
  Portal,
  Dialog,
  TextInput,
  FAB,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Video, ResizeMode, Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { theme } from "../../theme";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  fetchIssueById,
  clearError,
  voteIssue,
  removeVote,
  addComment,
  deleteComment,
} from "../../store/slices/issueSlice";
import { RootStackParamList } from "../../navigation/types";

const { width } = Dimensions.get("window");
const PHOTO_WIDTH = width - 32;
const PHOTO_HEIGHT = PHOTO_WIDTH * 0.6;

type IssueDetailRouteProp = RouteProp<RootStackParamList, "IssueDetail">;

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: "user" | "admin" | "moderator";
  };
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

interface TimelineEvent {
  id: string;
  type: "status_change" | "comment" | "update" | "priority_change";
  title: string;
  description?: string;
  timestamp: string;
  author?: string;
  data?: any;
}

export default function IssueDetailScreen() {
  const route = useRoute<IssueDetailRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { issueId } = route.params;

  // Redux state
  const {
    currentIssue: issue,
    isLoading,
    error,
  } = useAppSelector((state) => state.issues);
  const { user } = useAppSelector((state) => state.auth);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    loadIssue();
  }, [issueId]);

  // Video setup
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.warn("Failed to setup audio mode:", error);
      }
    };

    setupAudio();

    return () => {
      // Cleanup audio mode when component unmounts
    };
  }, []);

  const loadIssue = async () => {
    try {
      console.log("🔍 Loading issue details for ID:", issueId);
      await dispatch(fetchIssueById(issueId)).unwrap();
      console.log("✅ Issue details loaded successfully");
    } catch (error: any) {
      console.error("❌ Error loading issue:", error);
      Alert.alert("Error", error || "Failed to load issue details");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIssue();
    setRefreshing(false);
  };

  const handleVote = async () => {
    if (!issue || voting) return;

    try {
      setVoting(true);

      if (issue.userVote) {
        // Remove existing vote
        await dispatch(removeVote(issue.id)).unwrap();
      } else {
        // Add upvote
        await dispatch(
          voteIssue({ issueId: issue.id, voteType: "upvote" })
        ).unwrap();
      }
    } catch (error: any) {
      console.error("Error voting on issue:", error);
      Alert.alert("Error", error || "Failed to vote on issue");
    } finally {
      setVoting(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !issue || submittingComment) return;

    try {
      setSubmittingComment(true);
      await dispatch(
        addComment({ issueId: issue.id, message: newComment.trim() })
      ).unwrap();
      setNewComment("");
      setShowCommentDialog(false);
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      Alert.alert("Error", error || "Failed to submit comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return theme.colors.warning;
      case "in_progress":
        return theme.colors.primary;
      case "resolved":
        return theme.colors.success;
      case "rejected":
        return theme.colors.error;
      default:
        return theme.colors.outline;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "high":
        return "#F44336";
      case "critical":
        return "#9C27B0";
      default:
        return theme.colors.outline;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "infrastructure":
        return "road-variant";
      case "environment":
        return "leaf";
      case "safety":
        return "shield-check";
      case "traffic":
        return "traffic-light";
      case "utilities":
        return "power-plug";
      case "parks":
        return "tree";
      case "waste":
        return "delete";
      case "housing":
        return "home";
      case "health":
        return "medical-bag";
      case "education":
        return "school";
      case "transport":
        return "bus";
      default:
        return "alert-circle";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case "status_change":
        return "flag";
      case "comment":
        return "comment";
      case "update":
        return "update";
      case "priority_change":
        return "priority-high";
      default:
        return "circle";
    }
  };

  if (isLoading && !issue) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading issue details...</Text>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Issue Not Found</Text>
        <Text style={styles.errorSubtitle}>
          The issue you're looking for doesn't exist or has been removed.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        <View style={styles.content}>
          {/* Photo Carousel */}
          {issue.media?.images && issue.media.images.length > 0 && (
            <View style={styles.photoContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(
                    e.nativeEvent.contentOffset.x / PHOTO_WIDTH
                  );
                  setCurrentPhotoIndex(index);
                }}
              >
                {issue.media.images.map((imageUrl: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: imageUrl }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {issue.media.images.length > 1 && (
                <View style={styles.photoIndicators}>
                  {issue.media.images.map((_: any, index: number) => (
                    <View
                      key={index}
                      style={[
                        styles.photoIndicator,
                        index === currentPhotoIndex &&
                          styles.activePhotoIndicator,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Video Section */}
          {issue.media?.videos && issue.media.videos.length > 0 && (
            <View style={styles.videoSection}>
              <Text style={styles.sectionTitle}>Videos</Text>
              {issue.media.videos.map((videoUrl: string, index: number) => (
                <View key={`video-${index}`} style={styles.videoContainer}>
                  <Video
                    source={{ uri: videoUrl }}
                    style={styles.video}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping={false}
                  />
                  <Text style={styles.videoLabel}>Video {index + 1}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Issue Content */}
          {/* Title and Status */}
          <View style={styles.titleSection}>
            <View style={styles.categoryRow}>
              <Icon
                name={getCategoryIcon(issue.category)}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.categoryText}>{issue.category}</Text>
              <View style={styles.headerSpacer} />
              <View style={styles.headerActions}>
                <IconButton icon="share-variant" size={24} />
                <IconButton icon="bookmark-outline" size={24} />
              </View>
            </View>

            <Text style={styles.title}>{issue.title}</Text>
            <View style={styles.statusRow}>
              <Chip
                mode="flat"
                style={[
                  styles.statusChip,
                  { backgroundColor: getStatusColor(issue.status) + "20" },
                ]}
                textStyle={[
                  styles.chipText,
                  { color: getStatusColor(issue.status) },
                ]}
              >
                {issue.status.replace("_", " ").toUpperCase()}
              </Chip>
              <Chip
                mode="flat"
                style={[
                  styles.priorityChip,
                  { backgroundColor: getPriorityColor(issue.priority) + "20" },
                ]}
                textStyle={[
                  styles.chipText,
                  { color: getPriorityColor(issue.priority) },
                ]}
              >
                {issue.priority.toUpperCase()}
              </Chip>
            </View>
          </View>

          {/* Author and Date */}
          <Surface style={styles.authorSection}>
            <View style={styles.authorRow}>
              <Avatar.Text
                size={40}
                label={issue.reportedBy?.name?.charAt(0) || "U"}
              />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>
                  {issue.reportedBy?.name || "Anonymous User"}
                </Text>
                <Text style={styles.authorDate}>
                  Reported {formatDate(issue.createdAt)}
                </Text>
              </View>
            </View>
          </Surface>

          {/* Description */}
          <Surface style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{issue.description}</Text>
          </Surface>

          {/* Location */}
          <Surface style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Icon name="map-marker" size={20} color={theme.colors.primary} />
              <Text style={styles.locationText}>{issue.location.address}</Text>
            </View>
            <Button
              mode="outlined"
              icon="map"
              onPress={() => {
                /* Open map */
              }}
              style={styles.mapButton}
            >
              View on Map
            </Button>
          </Surface>

          {/* Tags */}
          {issue.tags && issue.tags.length > 0 && (
            <Surface style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {issue.tags.map((tag: string, index: number) => (
                  <Chip key={index} mode="outlined" compact style={styles.tag}>
                    #{tag}
                  </Chip>
                ))}
              </View>
            </Surface>
          )}

          {/* Assignment Info */}
          {issue.assignedDepartment && (
            <Surface style={styles.assignmentSection}>
              <Text style={styles.sectionTitle}>Assigned To</Text>
              <View style={styles.assignmentRow}>
                <Icon
                  name="account-group"
                  size={20}
                  color={theme.colors.primary}
                />
                <View style={styles.assignmentInfo}>
                  <Text style={styles.assignmentName}>
                    {issue.assignedDepartment.name || "Department"}
                  </Text>
                  <Text style={styles.assignmentDepartment}>
                    {issue.assignedDepartment.code || "Code"}
                  </Text>
                </View>
              </View>
            </Surface>
          )}

          {/* Stats */}
          <Surface style={styles.statsSection}>
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={styles.statButton}
                onPress={handleVote}
                disabled={voting}
              >
                <Icon
                  name={
                    issue?.userVote === "upvote"
                      ? "thumb-up"
                      : "thumb-up-outline"
                  }
                  size={20}
                  color={
                    issue?.userVote === "upvote"
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
                <Text
                  style={[
                    styles.statText,
                    issue?.userVote === "upvote" && {
                      color: theme.colors.primary,
                    },
                  ]}
                >
                  {issue?.voteScore || 0}
                </Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Icon
                  name="comment-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.statText}>
                  {issue?.comments?.length || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon
                  name="eye-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.statText}>
                  {issue?.analytics?.views || 0}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon
                  name="calendar"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.statText}>
                  {issue?.daysSinceReported || 0} days
                </Text>
              </View>
            </View>
          </Surface>

          {/* Basic Timeline showing status history */}
          <Surface style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <Icon name="flag" size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Issue Reported</Text>
                <Text style={styles.timelineDescription}>
                  Issue was submitted and is{" "}
                  {issue.statusDisplay || issue.status}
                </Text>
                <View style={styles.timelineFooter}>
                  <Text style={styles.timelineAuthor}>
                    {issue.reportedBy?.name || "Anonymous"}
                  </Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(issue.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {issue.updatedAt !== issue.createdAt && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Icon name="update" size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Last Updated</Text>
                  <Text style={styles.timelineDescription}>
                    Issue status or details were updated
                  </Text>
                  <View style={styles.timelineFooter}>
                    <Text style={styles.timelineAuthor}>System</Text>
                    <Text style={styles.timelineDate}>
                      {formatDate(issue.updatedAt)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Surface>
          {/* Comments Section */}

          {issue?.comments && issue.comments.length > 0 && (
            <Surface style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>
                Comments ({issue.comments.length})
              </Text>
              {issue.comments.map((comment) => (
                <View key={comment.id} style={styles.comment}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthor}>
                      <Avatar.Text
                        size={32}
                        label={comment.user.name.charAt(0).toUpperCase()}
                      />
                      <View style={styles.commentAuthorInfo}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={styles.commentAuthorName}>
                            {comment.user.name}
                          </Text>
                          {comment.isOfficial && (
                            <Chip
                              mode="outlined"
                              compact
                              style={styles.adminChip}
                            >
                              Official
                            </Chip>
                          )}
                        </View>
                        <Text style={styles.commentDate}>
                          {formatDate(comment.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.commentContent}>{comment.message}</Text>
                </View>
              ))}
            </Surface>
          )}
        </View>
      </ScrollView>

      {/* Comment FAB */}
      <FAB
        icon="comment-plus"
        style={styles.fab}
        onPress={() => setShowCommentDialog(true)}
      />

      {/* Comment Dialog */}
      <Portal>
        <Dialog
          visible={showCommentDialog}
          onDismiss={() => setShowCommentDialog(false)}
        >
          <Dialog.Title>Add Comment</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              placeholder="Share your thoughts about this issue..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              style={styles.commentInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCommentDialog(false)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSubmitComment}
              loading={submittingComment}
              disabled={!newComment.trim() || submittingComment}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.onSurface,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: theme.colors.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: theme.colors.surface,
    elevation: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerActions: {
    flexDirection: "row",
  },
  headerSpacer: {
    flex: 1,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoIndicators: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  photoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  activePhotoIndicator: {
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  videoSection: {
    marginBottom: 16,
  },
  videoContainer: {
    marginBottom: 15,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: 250,
  },
  videoLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  titleSection: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.onSurface,
    lineHeight: 32,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
  },
  statusChip: {
    height: 28,
  },
  priorityChip: {
    height: 28,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "600",
  },
  authorSection: {
    padding: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  authorName: {
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  authorDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  descriptionSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  description: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  locationSection: {
    padding: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 8,
    flex: 1,
    color: theme.colors.onSurface,
  },
  mapButton: {
    alignSelf: "flex-start",
  },
  tagsSection: {
    padding: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    height: 28,
  },
  assignmentSection: {
    padding: 16,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  assignmentInfo: {
    marginLeft: 8,
    flex: 1,
  },
  assignmentName: {
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  assignmentDepartment: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  estimationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  estimationText: {
    marginLeft: 6,
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  statsSection: {
    padding: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 24,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: "500",
  },
  timelineSection: {
    padding: 16,
  },
  timelineItem: {
    position: "relative",
    paddingLeft: 32,
    paddingBottom: 16,
  },
  timelineIcon: {
    position: "absolute",
    left: 0,
    top: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  timelineDescription: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  timelineFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timelineAuthor: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "500",
  },
  timelineDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  timelineLine: {
    position: "absolute",
    left: 11,
    top: 26,
    bottom: -16,
    width: 2,
    backgroundColor: theme.colors.outline,
  },
  commentsSection: {
    padding: 16,
  },
  commentsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  comment: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: "row",
    flex: 1,
  },
  commentAuthorInfo: {
    marginLeft: 8,
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentAuthorName: {
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  adminChip: {
    height: 20,
    backgroundColor: theme.colors.primaryContainer,
  },
  commentDate: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  commentContent: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    gap: 16,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  commentInput: {
    backgroundColor: theme.colors.surface,
  },
});
