import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  Collapse,
  IconButton,
  useTheme,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  ReportProblem,
  Business,
  Analytics,
  Notifications,
  Settings,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  AdminPanelSettings,
  Assignment,
  TrendingUp,
  SupervisorAccount,
  NotificationsActive,
  Security,
  Map,
  Add,
  AccountCircle,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  width: number;
  collapsedWidth: number;
  isMobile: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  children?: MenuItem[];
  roles?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  onToggle,
  width,
  collapsedWidth,
  isMobile,
}) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

  // Define menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    const isAdmin = user?.role && ['admin', 'department_head', 'department_staff'].includes(user.role);
    
    if (isAdmin) {
      // Admin menu items
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <Dashboard />,
          path: '/dashboard',
        },
        {
          id: 'issues',
          label: 'Issues Management',
          icon: <ReportProblem />,
          children: [
            {
              id: 'issues-list',
              label: 'All Issues',
              icon: <Assignment />,
              path: '/issues',
            },
            {
              id: 'issues-map',
              label: 'Issue Map',
              icon: <Map />,
              path: '/map',
            },
          ],
        },
        {
          id: 'users',
          label: 'User Management',
          icon: <People />,
          path: '/users',
          roles: ['admin'],
        },
        {
          id: 'departments',
          label: 'Departments',
          icon: <Business />,
          path: '/departments',
          roles: ['admin', 'department_head'],
        },
        {
          id: 'analytics',
          label: 'Analytics & Reports',
          icon: <Analytics />,
          children: [
            {
              id: 'analytics-overview',
              label: 'Overview',
              icon: <TrendingUp />,
              path: '/analytics',
            },
            {
              id: 'analytics-performance',
              label: 'Performance',
              icon: <Analytics />,
              path: '/analytics/performance',
            },
          ],
        },
        {
          id: 'notifications',
          label: 'Notifications',
          icon: <Notifications />,
          children: [
            {
              id: 'notifications-list',
              label: 'All Notifications',
              icon: <NotificationsActive />,
              path: '/notifications',
            },
            {
              id: 'notifications-create',
              label: 'Create Announcement',
              icon: <NotificationsActive />,
              path: '/notifications/create',
              roles: ['admin', 'department_head'],
            },
          ],
        },
        {
          id: 'settings',
          label: 'System Settings',
          icon: <Settings />,
          path: '/settings',
          roles: ['admin'],
        },
      ];
    } else {
      // User menu items
      return [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: <Dashboard />,
          path: '/dashboard',
        },
        {
          id: 'my-issues',
          label: 'My Issues',
          icon: <Assignment />,
          path: '/my-issues',
        },
        {
          id: 'report-issue',
          label: 'Report Issue',
          icon: <Add />,
          path: '/report-issue',
        },
        {
          id: 'map',
          label: 'Issue Map',
          icon: <Map />,
          path: '/map',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: <AccountCircle />,
          path: '/profile',
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  const handleItemClick = (item: MenuItem) => {
    if (item.children) {
      handleExpandToggle(item.id);
    } else if (item.path) {
      navigate(item.path);
      if (isMobile) {
        onToggle();
      }
    }
  };

  const handleExpandToggle = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return user && roles.includes(user.role);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item.roles)) return null;

    const isActive = isItemActive(item.path);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => handleItemClick(item)}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              pl: level > 0 ? 4 : 2.5,
              backgroundColor: isActive ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
                color: isActive ? 'primary.main' : 'inherit',
              }}
            >
              {item.icon}
            </ListItemIcon>
            
            {open && (
              <>
                <ListItemText
                  primary={item.label}
                  sx={{
                    opacity: open ? 1 : 0,
                    color: isActive ? 'primary.main' : 'inherit',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
                
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
                  />
                )}
                
                {hasChildren && (
                  <IconButton size="small" sx={{ ml: 1 }}>
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>

        {hasChildren && open && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawerContent = (
    <>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          px: open ? 2 : 1,
          py: 2,
          minHeight: 64,
        }}
      >
        {open && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user?.role && ['admin', 'department_head', 'department_staff'].includes(user.role) ? (
              <>
                <AdminPanelSettings color="primary" />
                <Typography variant="h6" noWrap fontWeight="bold">
                  Admin Panel
                </Typography>
              </>
            ) : (
              <>
                <AccountCircle color="primary" />
                <Typography variant="h6" noWrap fontWeight="bold">
                  User Dashboard
                </Typography>
              </>
            )}
          </Box>
        )}
        
        {!isMobile && (
          <IconButton onClick={onToggle} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* User Info */}
      {open && user && (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 1,
              bgcolor: 'primary.main',
            }}
          >
            {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || ''}
          </Avatar>
          <Typography variant="subtitle2" noWrap>
            {user.firstName || 'User'} {user.lastName || ''}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {user.role?.replace('_', ' ').toUpperCase() || 'USER'}
          </Typography>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {menuItems.map(item => renderMenuItem(item))}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: width,
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? width : collapsedWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: open ? width : collapsedWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          position: 'fixed', // Make it overlay on desktop
          height: '100vh',
          zIndex: theme.zIndex.drawer,
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
