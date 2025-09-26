import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Info,
  Star,
  AccessTime,
  CheckCircle,
  People,
} from '@mui/icons-material';
import { Department } from '../../utils/departmentLeaderboard';

interface DepartmentCardProps {
  department: Department;
  onClick: (department: Department) => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({ department, onClick }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'success.main';
      case 'down':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.shadows[8],
          borderColor: 'primary.main',
        },
        border: department.rank <= 3 ? '2px solid' : '1px solid',
        borderColor: department.rank === 1 ? 'gold' : department.rank === 2 ? 'silver' : department.rank === 3 ? '#CD7F32' : 'divider',
        position: 'relative',
      }}
      onClick={() => onClick(department)}
    >
      {/* Rank Badge */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: department.rank === 1 ? 'gold' : department.rank === 2 ? 'silver' : department.rank === 3 ? '#CD7F32' : 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: department.rank <= 3 ? 'white' : 'text.primary',
          fontWeight: 'bold',
          fontSize: '1.2rem',
          zIndex: 1,
        }}
      >
        #{department.rank}
      </Box>

      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {/* Header */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Avatar
                sx={{
                  bgcolor: department.rank === 1 ? 'gold' : department.rank === 2 ? 'silver' : department.rank === 3 ? '#CD7F32' : 'primary.main',
                  width: 48,
                  height: 48,
                }}
              >
                {department.name.charAt(0)}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" noWrap>
                  {department.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {department.city}, {department.state}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {getTrendIcon(department.trend || 'stable')}
                <Typography variant="h5" fontWeight="bold" color={getTrendColor(department.trend || 'stable')}>
                  {department.score}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Key Metrics */}
          <Grid item xs={12}>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Box display="flex" alignItems="center" gap={1}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="body2">
                  {formatNumber(department.metrics.issuesResolved)} resolved
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <AccessTime color="action" fontSize="small" />
                <Typography variant="body2">
                  {department.metrics.avgResolutionTime}d avg
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Star color="warning" fontSize="small" />
                <Typography variant="body2">
                  {department.metrics.userSatisfaction}/5 rating
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <People color="info" fontSize="small" />
                <Typography variant="body2">
                  {formatNumber(department.metrics.publicEngagement)} engaged
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Progress Bars */}
          <Grid item xs={12}>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Efficiency
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {department.metrics.efficiency}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={department.metrics.efficiency}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: department.metrics.efficiency >= 90 ? 'success.main' : department.metrics.efficiency >= 80 ? 'warning.main' : 'error.main',
                  },
                }}
              />
            </Box>
          </Grid>

          {/* Category and Status */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Chip
                label={department.category.charAt(0).toUpperCase() + department.category.slice(1)}
                size="small"
                color="primary"
                variant="outlined"
              />
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  Active: {department.metrics.activeIssues}
                </Typography>
                <Tooltip title="View detailed information">
                  <IconButton size="small" color="primary">
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default DepartmentCard;