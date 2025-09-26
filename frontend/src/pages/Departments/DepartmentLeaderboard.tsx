import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Chip,
  Avatar,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search,
  FilterList,
  EmojiEvents,
  TrendingUp,
  LocationOn,
  Business,
} from '@mui/icons-material';
import DepartmentCard from '../../components/Departments/DepartmentCard';
import DepartmentDetailsModal from '../../components/Departments/DepartmentDetailsModal';
import {
  getRankedDepartments,
  getDepartmentStats,
  Department,
  getDepartmentsByState,
  getDepartmentsByCategory,
} from '../../utils/departmentLeaderboard';

const DepartmentLeaderboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const departments = useMemo(() => getRankedDepartments(), []);
  const stats = useMemo(() => getDepartmentStats(), []);

  // Get unique states and categories for filters
  const states = useMemo(() => {
    const uniqueStates = [...new Set(departments.map(dept => dept.state))];
    return uniqueStates.sort();
  }, [departments]);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(departments.map(dept => dept.category))];
    return uniqueCategories.sort();
  }, [departments]);

  // Filter departments based on search and filters
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.state.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesState = !selectedState || dept.state === selectedState;
      const matchesCategory = !selectedCategory || dept.category === selectedCategory;

      return matchesSearch && matchesState && matchesCategory;
    });
  }, [departments, searchTerm, selectedState, selectedCategory]);

  const handleDepartmentClick = (department: Department) => {
    setSelectedDepartment(department);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDepartment(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedCategory('');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          <EmojiEvents sx={{ mr: 2, verticalAlign: 'middle' }} />
          Department Leadership Board
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={2}>
          Celebrating Excellence in Civic Service Across India
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover top-performing departments and see how your city measures up in delivering quality civic services
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Business sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalDepartments}
              </Typography>
              <Typography variant="body2">
                Total Departments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.totalIssuesResolved.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Issues Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.avgSatisfaction}/5
              </Typography>
              <Typography variant="body2">
                Avg Satisfaction
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <LocationOn sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                {stats.avgResolutionTime}d
              </Typography>
              <Typography variant="body2">
                Avg Resolution Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performer Highlight */}
      {stats.topPerformer && (
        <Card sx={{ mb: 4, bgcolor: 'gold', color: 'black' }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'white', width: 64, height: 64 }}>
                <EmojiEvents sx={{ fontSize: 32 }} />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h5" fontWeight="bold">
                  🏆 Top Performer: {stats.topPerformer.name}
                </Typography>
                <Typography variant="body1">
                  {stats.topPerformer.city}, {stats.topPerformer.state} • Score: {stats.topPerformer.score}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Leading with {stats.topPerformer.metrics.issuesResolved.toLocaleString()} issues resolved and {stats.topPerformer.metrics.userSatisfaction}/5 user satisfaction!
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filter Departments
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search departments, cities, or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={selectedState}
                  label="State"
                  onChange={(e) => setSelectedState(e.target.value)}
                >
                  <MenuItem value="">All States</MenuItem>
                  {states.map(state => (
                    <MenuItem key={state} value={state}>{state}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={clearFilters}
                disabled={!searchTerm && !selectedState && !selectedCategory}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Showing {filteredDepartments.length} of {departments.length} departments
        </Typography>
        <Chip
          label={`${filteredDepartments.length} Results`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Department Cards */}
      <Grid container spacing={3}>
        {filteredDepartments.map((department) => (
          <Grid item xs={12} lg={6} key={department.id}>
            <DepartmentCard
              department={department}
              onClick={handleDepartmentClick}
            />
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {filteredDepartments.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No departments found matching your criteria
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search terms or filters
          </Typography>
          <Button
            variant="outlined"
            onClick={clearFilters}
            sx={{ mt: 2 }}
          >
            Clear All Filters
          </Button>
        </Box>
      )}

      {/* Department Details Modal */}
      <DepartmentDetailsModal
        department={selectedDepartment}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </Container>
  );
};

export default DepartmentLeaderboard;