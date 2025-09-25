import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Grid,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  ArrowBack,
  LocationOn,
  Person,
  AccessTime,
  Comment,
  ThumbUp,
  ThumbDown,
  Edit,
  Delete,
  Send,
  Close,
  Download,
  ThumbUpAltOutlined,
  ThumbDownAltOutlined,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { format } from "date-fns";

import { selectUser } from "../../store/slices/authSlice";
import {
  fetchIssueById,
  updateIssue,
  deleteIssue,
  selectSelectedIssue,
  selectIssuesLoading,
  selectIssuesError,
  addIssueComment,
  voteOnIssue,
  removeVoteFromIssue,
} from "../../store/slices/issueSlice";
import { setBreadcrumbs } from "../../store/slices/uiSlice";

const IssueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const issue = useSelector(selectSelectedIssue);
  const isLoading = useSelector(selectIssuesLoading);
  const error = useSelector(selectIssuesError);

  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchIssueById(id));
    }
  }, [id]); // Remove dispatch from dependencies

  useEffect(() => {
    if (issue) {
      console.log('🔄 IssueDetail - issue updated:', {
        _id: issue._id,
        userVote: issue.userVote,
        upvotes: issue.upvotes,
        downvotes: issue.votes?.downvotes?.length || 0,
        voteScore: issue.voteScore
      });
      setEditForm({
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
      });
    }
  }, [issue]);

  const handleBack = () => {
    navigate("/my-issues");
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!id) return;

    setIsUpdating(true);
    try {
      await dispatch(
        updateIssue({
          issueId: id,
          issueData: editForm,
        })
      ).unwrap();
      setEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update issue:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm("Are you sure you want to delete this issue?")) {
      setIsDeleting(true);
      try {
        await dispatch(deleteIssue(id)).unwrap();
        navigate("/my-issues");
      } catch (error) {
        console.error("Failed to delete issue:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !id) return;

    setIsCommenting(true);
    try {
      await dispatch(
        addIssueComment({
          issueId: id,
          content: newComment.trim(),
          isInternal: false,
        })
      ).unwrap();
      setNewComment("");
      setCommentDialogOpen(false);
    } catch (error) {
      console.error("Failed to add comment:", error);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!id) return;

    console.log('🚀 IssueDetail - handleVote called with:', voteType);
    console.log('🚀 IssueDetail - current issue.userVote:', issue?.userVote);
    console.log('🚀 IssueDetail - current issue.upvotes:', issue?.upvotes);
    console.log('🚀 IssueDetail - current issue.downvotes:', issue?.votes?.downvotes?.length || 0);

    setIsVoting(true);
    try {
      await dispatch(
        voteOnIssue({
          issueId: id,
          voteType,
        })
      ).unwrap();

      console.log('✅ IssueDetail - vote successful');
    } catch (error) {
      console.error("❌ IssueDetail - Failed to vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (!id) return;

    console.log('🚀 IssueDetail - handleRemoveVote called');
    console.log('🚀 IssueDetail - current issue.userVote:', issue?.userVote);

    setIsVoting(true);
    try {
      await dispatch(removeVoteFromIssue(id)).unwrap();

      console.log('✅ IssueDetail - remove vote successful');
    } catch (error) {
      console.error("❌ IssueDetail - Failed to remove vote:", error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "acknowledged":
        return "info";
      case "in_progress":
        return "primary";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "success";
      case "medium":
        return "warning";
      case "high":
        return "error";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !issue) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Failed to load issue details. Please try again.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Issues
        </Button>
      </Box>
    );
  }

  const isOwner = user?.id === issue.reportedBy._id;
  const canEdit = isOwner && issue.status === "pending";

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <Box flex={1}>
          <Typography variant="h4" gutterBottom>
            Issue Details
          </Typography>
          <Breadcrumbs>
            <Link
              color="inherit"
              href="#"
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Link>
            <Link
              color="inherit"
              href="#"
              onClick={() => navigate("/my-issues")}
            >
              My Issues
            </Link>
            <Typography color="text.primary">{issue.title}</Typography>
          </Breadcrumbs>
        </Box>
        {canEdit && (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={handleEdit}
              disabled={isUpdating}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Main Issue Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Typography variant="h5" gutterBottom>
                  {issue.title}
                </Typography>
                <Box display="flex" gap={1}>
                  <Chip
                    label={issue.status.replace("_", " ").toUpperCase()}
                    color={getStatusColor(issue.status)}
                    size="small"
                  />
                  <Chip
                    label={issue.priority.toUpperCase()}
                    color={getPriorityColor(issue.priority)}
                    size="small"
                  />
                </Box>
              </Box>

              <Typography variant="body1" paragraph>
                {issue.description}
              </Typography>

              {/* Issue Images */}
              {issue.media?.images && issue.media.images.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Images
                  </Typography>
                  <Grid container spacing={2}>
                    {issue.media.images.map(
                      (imageUrl: string, index: number) => (
                        <Grid item xs={6} sm={4} key={index}>
                          <Box position="relative">
                            <Paper
                              sx={{
                                height: 120,
                                backgroundImage: `url(${imageUrl})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                borderRadius: 1,
                                cursor: "pointer",
                              }}
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const filename = `issue-image-${index + 1}.jpg`;
                                handleDownload(imageUrl, filename);
                              }}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>
              )}

              {/* Issue Videos */}
              {issue.media?.videos && issue.media.videos.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Videos
                  </Typography>
                  <Grid container spacing={2}>
                    {issue.media.videos.map(
                      (videoUrl: string, index: number) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box position="relative">
                            <video
                              controls
                              style={{
                                width: '100%',
                                maxHeight: '300px',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                              }}
                              src={videoUrl}
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const filename = `issue-video-${index + 1}.mp4`;
                                handleDownload(videoUrl, filename);
                              }}
                            >
                              <Download fontSize="small" />
                            </IconButton>
                          </Box>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>
              )}

              {/* Location */}
              {issue.location && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>
                    Location
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      {issue.location.address ||
                        "Location coordinates available"}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Timeline */}
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Timeline
                </Typography>
                {issue.timeline && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <AccessTime fontSize="small" color="action" />
                      <Typography variant="body2">
                        REPORTED -{" "}
                        {format(new Date(issue.timeline.reported), "PPp")}
                      </Typography>
                    </Box>
                    {issue.timeline.acknowledged && (
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          ACKNOWLEDGED -{" "}
                          {format(new Date(issue.timeline.acknowledged), "PPp")}
                        </Typography>
                      </Box>
                    )}
                    {issue.timeline.started && (
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          STARTED -{" "}
                          {format(new Date(issue.timeline.started), "PPp")}
                        </Typography>
                      </Box>
                    )}
                    {issue.timeline.resolved && (
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          RESOLVED -{" "}
                          {format(new Date(issue.timeline.resolved), "PPp")}
                        </Typography>
                      </Box>
                    )}
                    {issue.timeline.closed && (
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          CLOSED -{" "}
                          {format(new Date(issue.timeline.closed), "PPp")}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  Comments ({issue.comments?.length || 0})
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Comment />}
                  onClick={() => setCommentDialogOpen(true)}
                >
                  Add Comment
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {issue.comments && issue.comments.length > 0 ? (
                issue.comments.map((comment) => (
                  <Box key={comment._id} mb={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {comment.user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {comment.user.name}
                          {comment.isOfficial && (
                            <Chip
                              label="Official"
                              size="small"
                              color="primary"
                              sx={{ ml: 1, height: 18 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(comment.timestamp), "PPp")}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ ml: 5 }}>
                      {comment.message}
                    </Typography>
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                ))
              ) : (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                  py={4}
                >
                  No comments yet. Be the first to comment!
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Issue Information
              </Typography>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reported By
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Person fontSize="small" color="action" />
                  <Typography variant="body2">
                    {issue.reportedBy.name}
                  </Typography>
                </Box>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {issue.category.replace("_", " ").toUpperCase()}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {format(new Date(issue.createdAt), "PPp")}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {format(new Date(issue.updatedAt), "PPp")}
                </Typography>
              </Box>

              {/* Votes */}
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Community Feedback
                </Typography>
                <Box display="flex" gap={2}>
                  <Button
                    size="small"
                    startIcon={
                      issue.userVote === 'upvote' ? (
                        <ThumbUp color="success" />
                      ) : (
                        <ThumbUpAltOutlined />
                      )
                    }
                    variant={issue.userVote === 'upvote' ? "contained" : "outlined"}
                    color="success"
                    onClick={() => {
                      if (issue.userVote === 'upvote') {
                        handleRemoveVote();
                      } else {
                        handleVote('upvote');
                      }
                    }}
                    disabled={isVoting}
                  >
                    {issue.upvotes || 0}
                  </Button>
                  <Button
                    size="small"
                    startIcon={
                      issue.userVote === 'downvote' ? (
                        <ThumbDown color="error" />
                      ) : (
                        <ThumbDownAltOutlined />
                      )
                    }
                    variant={issue.userVote === 'downvote' ? "contained" : "outlined"}
                    color="error"
                    onClick={() => {
                      if (issue.userVote === 'downvote') {
                        handleRemoveVote();
                      } else {
                        handleVote('downvote');
                      }
                    }}
                    disabled={isVoting}
                  >
                    {issue.votes?.downvotes?.length || 0}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comment Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            label="Your comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCommentSubmit}
            variant="contained"
            startIcon={<Send />}
            disabled={!newComment.trim() || isCommenting}
          >
            {isCommenting ? "Posting..." : "Post Comment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Issue</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={editForm.title}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, title: e.target.value }))
            }
            sx={{ mt: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Description"
            value={editForm.description}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, description: e.target.value }))
            }
            sx={{ mt: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Category"
            value={editForm.category}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, category: e.target.value }))
            }
            sx={{ mt: 2 }}
          >
            {[
              "pothole",
              "streetlight",
              "garbage",
              "water",
              "electricity",
              "other",
            ].map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Priority"
            value={editForm.priority}
            onChange={(e) =>
              setEditForm((prev) => ({ ...prev, priority: e.target.value }))
            }
            sx={{ mt: 2 }}
          >
            {["low", "medium", "high", "critical"].map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={isUpdating}
          >
            {isUpdating ? <CircularProgress size={20} /> : "Update"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IssueDetail;
