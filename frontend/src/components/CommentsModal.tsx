import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Alert,
} from "@mui/material";
import {
  Close,
  AdminPanelSettings,
  Person,
  AccessTime,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AppDispatch } from "../../store/store";
import { apiService } from "../services/api";

interface Comment {
  id: string;
  user: {
    _id: string;
    name: string;
  };
  message: string;
  timestamp: string;
  isOfficial: boolean;
}

interface CommentsModalProps {
  open: boolean;
  onClose: () => void;
  issueId: string;
  issueTitle: string;
  totalComments: number;
}

const CommentsModal: React.FC<CommentsModalProps> = ({
  open,
  onClose,
  issueId,
  issueTitle,
  totalComments,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    if (open && issueId) {
      fetchComments();
    }
  }, [open, issueId]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.get(`/issues/${issueId}/comments?limit=5`);

      // API service returns data.data directly, so response is already the comments data
      if (response && response.comments) {
        setComments(response.comments);
      } else {
        setError("Failed to load comments");
      }
    } catch (err: any) {
      console.error("Error fetching comments:", err);
      setError(err.response?.data?.message || "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate(`/issues/${issueId}`);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth={false}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          maxHeight: '90vh',
          width: { xs: '95vw', sm: '400px' },
          margin: { xs: '5vh auto', sm: '10px' },
          position: 'fixed',
          right: { xs: 'auto', sm: 16 },
          top: { xs: 'auto', sm: 16 },
          bottom: { xs: 'auto', sm: 16 },
          height: { xs: '90vh', sm: 'auto' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          px: 2,
          pt: 2,
        }}
      >
        <Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Comments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {issueTitle.length > 50 ? `${issueTitle.substring(0, 50)}...` : issueTitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 0, flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        ) : comments.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              px: 2,
            }}
          >
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              No comments yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Be the first to comment on this issue!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {comments.map((comment, index) => (
              <React.Fragment key={comment.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    px: 2,
                    alignItems: 'flex-start',
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 50 }}>
                    <Avatar
                      sx={{
                        bgcolor: comment.isOfficial ? 'primary.main' : 'grey.400',
                        width: 40,
                        height: 40,
                      }}
                    >
                      {comment.isOfficial ? (
                        <AdminPanelSettings sx={{ fontSize: 20 }} />
                      ) : (
                        <Person sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {comment.user.name}
                        </Typography>
                        {comment.isOfficial && (
                          <Chip
                            label="Official"
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 1,
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {comment.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(comment.timestamp)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}

        {totalComments > 5 && !loading && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Showing {comments.length} of {totalComments} comments
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, pt: 1, flexDirection: 'column', gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          Close
        </Button>
        {totalComments > 5 && (
          <Button
            onClick={handleViewAll}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              },
            }}
          >
            View All Comments
          </Button>
        )}
        {totalComments <= 5 && totalComments > 0 && (
          <Button
            onClick={handleViewAll}
            variant="contained"
            color="primary"
            fullWidth
          >
            View Issue Details
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CommentsModal;