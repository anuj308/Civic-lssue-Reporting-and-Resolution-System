import React from 'react';
import {
  Breadcrumbs as MuiBreadcrumbs,
  Link,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectBreadcrumbs } from '../../store/slices/uiSlice';

const Breadcrumbs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useSelector(selectBreadcrumbs);

  // Auto-generate breadcrumbs if not set in Redux
  const getAutoBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    const items = [
      { label: 'Dashboard', path: '/dashboard' }
    ];

    pathnames.forEach((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ');
      
      items.push({ label, path });
    });

    return items;
  };

  const breadcrumbItems = breadcrumbs.length > 0 ? breadcrumbs : getAutoBreadcrumbs();

  const handleBreadcrumbClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        px: 3,
        py: 1.5,
        backgroundColor: 'transparent',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: 'text.secondary',
          },
        }}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return isLast ? (
            <Typography
              key={item.label}
              color="text.primary"
              variant="body2"
              fontWeight={500}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {index === 0 && <Home fontSize="small" />}
              {item.label}
            </Typography>
          ) : (
            <Link
              key={item.label}
              component="button"
              variant="body2"
              onClick={() => handleBreadcrumbClick(item.path)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {index === 0 && <Home fontSize="small" />}
              {item.label}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Paper>
  );
};

export default Breadcrumbs;
