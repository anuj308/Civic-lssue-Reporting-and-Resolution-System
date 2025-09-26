import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Avatar,
  Divider,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Close,
  LocationOn,
  Phone,
  Person,
  Star,
  AccessTime,
  CheckCircle,
  TrendingUp,
  People,
  Business,
  EmojiEvents,
  Timeline,
} from '@mui/icons-material';
import { Department } from '../../utils/departmentLeaderboard';

interface DepartmentDetailsModalProps {
  department: Department | null;
  open: boolean;
  onClose: () => void;
}

const DepartmentDetailsModal: React.FC<DepartmentDetailsModalProps> = ({
  department,
  open,
  onClose,
}) => {
  if (!department) return null;

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'success';
    if (efficiency >= 80) return 'warning';
    return 'error';
  };

  const getSatisfactionColor = (satisfaction: number) => {
    if (satisfaction >= 4.5) return 'success';
    if (satisfaction >= 4.0) return 'warning';
    return 'error';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: department.rank === 1 ? 'gold' : department.rank === 2 ? 'silver' : department.rank === 3 ? '#CD7F32' : 'primary.main',
                width: 56,
                height: 56,
              }}
            >
              {department.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {department.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Rank #{department.rank} • Score: {department.score}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="large">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Department Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Location:</strong> {department.city}, {department.state}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Person color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Head:</strong> {department.head}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Contact:</strong> {department.contact}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Business color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Category:</strong>
                        <Chip
                          label={department.category.charAt(0).toUpperCase() + department.category.slice(1)}
                          size="small"
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timeline color="action" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Last Updated:</strong> {new Date(department.lastUpdated).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Metrics */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Performance Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="success.main" fontWeight="bold">
                      {formatNumber(department.metrics.issuesResolved)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Issues Resolved
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccessTime color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="info.main" fontWeight="bold">
                      {department.metrics.avgResolutionTime}d
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Resolution Time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Star color={getSatisfactionColor(department.metrics.userSatisfaction) as any} sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color={`${getSatisfactionColor(department.metrics.userSatisfaction)}.main`} fontWeight="bold">
                      {department.metrics.userSatisfaction}/5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      User Satisfaction
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                      {formatNumber(department.metrics.publicEngagement)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Public Engagement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Detailed Metrics */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Efficiency & Response
                </Typography>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Efficiency Rate</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {department.metrics.efficiency}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={department.metrics.efficiency}
                    color={getEfficiencyColor(department.metrics.efficiency)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Response Time</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {department.metrics.responseTime}h
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, 100 - department.metrics.responseTime * 10)}
                    color="secondary"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Active Issues</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {department.metrics.activeIssues}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Total Assigned</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatNumber(department.metrics.totalIssuesAssigned)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Achievements */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Achievements
                </Typography>
                <List dense>
                  {department.achievements.map((achievement, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <EmojiEvents color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={achievement} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  About This Department
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {department.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            // Could add functionality to view issues for this department
            console.log('View issues for department:', department.id);
          }}
        >
          View Issues
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DepartmentDetailsModal;