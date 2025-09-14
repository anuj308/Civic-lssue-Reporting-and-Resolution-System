import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Paper,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  ReportProblem,
  Business,
  CheckCircle,
  Warning,
  Error,
  Info,
  Refresh,
  MoreVert,
  Assignment,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../store/store';
import {
  fetchDashboardMetrics,
  selectDashboardMetrics,
  selectAnalyticsLoading,
  selectAnalyticsError,
} from '../../store/slices/analyticsSlice';
import {
  setBreadcrumbs,
  setPageTitle,
} from '../../store/slices/uiSlice';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  isLoading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
  isLoading = false,
}) => {
  const theme = useTheme();
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const isPositiveChange = change && change > 0;
  const isNegativeChange = change && change < 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            
            {isLoading ? (
              <Box sx={{ my: 2 }}>
                <LinearProgress />
              </Box>
            ) : (
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ mb: 1 }}>
                {formatValue(value)}
              </Typography>
            )}
            
            {change !== undefined && changeLabel && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositiveChange && <TrendingUp color="success" fontSize="small" />}
                {isNegativeChange && <TrendingDown color="error" fontSize="small" />}
                <Typography
                  variant="body2"
                  color={isPositiveChange ? 'success.main' : isNegativeChange ? 'error.main' : 'text.secondary'}
                >
                  {Math.abs(change)}% {changeLabel}
                </Typography>
              </Box>
            )}
          </Box>
          
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  
  const dashboardMetrics = useSelector(selectDashboardMetrics);
  const loading = useSelector(selectAnalyticsLoading);
  const error = useSelector(selectAnalyticsError);

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    dispatch(setBreadcrumbs([
      { label: 'Dashboard', path: '/dashboard' }
    ]));
    
    // Fetch dashboard data
    dispatch(fetchDashboardMetrics());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboardMetrics());
  };

  // Chart data
  const issuesTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Reported',
        data: [65, 59, 80, 81, 56, 55],
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`,
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: [28, 48, 40, 19, 86, 27],
        borderColor: theme.palette.success.main,
        backgroundColor: `${theme.palette.success.main}20`,
        tension: 0.4,
      },
    ],
  };

  const statusDistributionData = {
    labels: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    datasets: [
      {
        data: [30, 25, 35, 10],
        backgroundColor: [
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.grey[500],
        ],
        borderWidth: 0,
      },
    ],
  };

  const departmentPerformanceData = {
    labels: ['Public Works', 'Health', 'Transportation', 'Safety', 'Parks'],
    datasets: [
      {
        label: 'Resolution Rate (%)',
        data: [85, 92, 78, 88, 90],
        backgroundColor: theme.palette.primary.main,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Error loading dashboard data
        </Typography>
        <Button variant="contained" onClick={handleRefresh} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Dashboard Overview
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Issues"
            value={dashboardMetrics?.totalIssues || 0}
            change={5.2}
            changeLabel="from last month"
            icon={<ReportProblem />}
            color="primary"
            isLoading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={dashboardMetrics?.activeUsers || 0}
            change={2.1}
            changeLabel="from last month"
            icon={<People />}
            color="success"
            isLoading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Issues"
            value={dashboardMetrics?.pendingIssues || 0}
            change={-1.5}
            changeLabel="from last week"
            icon={<Warning />}
            color="warning"
            isLoading={loading}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Resolution Rate"
            value={`${dashboardMetrics?.resolutionRate || 0}%`}
            change={3.2}
            changeLabel="from last month"
            icon={<CheckCircle />}
            color="info"
            isLoading={loading}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Issues Trend */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                  Issues Trend
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line data={issuesTrendData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Issue Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Doughnut data={statusDistributionData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Department Performance */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Department Performance
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar data={departmentPerformanceData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Assignment />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New issue reported"
                    secondary="Pothole on Main Street"
                  />
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'success.main' }}>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Issue resolved"
                    secondary="Street light repair completed"
                  />
                </ListItem>
                
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'info.main' }}>
                      <People />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="New user registered"
                    secondary="John Doe joined the platform"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
