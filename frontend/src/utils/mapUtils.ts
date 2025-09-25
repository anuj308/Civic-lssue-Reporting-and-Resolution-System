// Removed Issue import since we're using any type for flexibility with different API response formats

export interface MapIssue {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  createdAt: string;
  author: string;
  upvotes: number;
  voteScore: number;
  reportedBy?: {
    name: string;
  };
}

export interface IssueCluster {
  id: string;
  coordinate: {
    lat: number;
    lng: number;
  };
  issues: MapIssue[];
  count: number;
}

export const transformIssueForMap = (issue: any): MapIssue => {
  // Handle different API response structures
  let latitude: number, longitude: number, address: string;
  
  console.log('🔧 Transforming issue for map:', issue.id || issue._id, 'location:', issue.location);
  
  if (issue.location.coordinates && Array.isArray(issue.location.coordinates)) {
    // Standard issue format: coordinates are [lng, lat]
    latitude = issue.location.coordinates[1];
    longitude = issue.location.coordinates[0];
    address = issue.location.address;
    console.log('📍 Using coordinates format:', { latitude, longitude, address });
  } else if (issue.location.latitude && issue.location.longitude) {
    // Map API format: direct latitude/longitude properties
    latitude = issue.location.latitude;
    longitude = issue.location.longitude;
    address = issue.location.address;
    console.log('📍 Using lat/lng format:', { latitude, longitude, address });
  } else {
    console.warn('⚠️ Issue has invalid location format:', issue.id, issue.location);
    // Fallback to prevent crashes
    latitude = 0;
    longitude = 0;
    address = 'Unknown location';
  }

  return {
    id: issue._id || issue.id,
    title: issue.title,
    category: issue.category,
    priority: issue.priority,
    status: issue.status,
    location: {
      latitude,
      longitude,
      address,
    },
    createdAt: issue.createdAt,
    author: issue.reportedBy?.name || 'Anonymous',
    upvotes: issue.upvotes || 0,
    voteScore: issue.voteScore || 0,
    reportedBy: issue.reportedBy,
  };
};

export const createIssueClusters = (issues: MapIssue[], clusterDistance: number = 0.001): IssueCluster[] => {
  console.log('🔄 Creating clusters from issues:', issues.length, 'issues');
  
  if (issues.length === 0) {
    console.log('⚠️ No issues to cluster');
    return [];
  }

  // Filter out issues with invalid coordinates
  const validIssues = issues.filter(issue => {
    const hasValidCoords = issue.location && 
      typeof issue.location.latitude === 'number' && 
      typeof issue.location.longitude === 'number' &&
      !isNaN(issue.location.latitude) && 
      !isNaN(issue.location.longitude) &&
      issue.location.latitude >= -90 && issue.location.latitude <= 90 &&
      issue.location.longitude >= -180 && issue.location.longitude <= 180 &&
      (issue.location.latitude !== 0 || issue.location.longitude !== 0); // Exclude 0,0 coordinates as they're likely fallbacks

    if (!hasValidCoords) {
      console.log('❌ Issue filtered out due to invalid coordinates:', issue.id, issue.location);
    }

    return hasValidCoords;
  });

  console.log('📊 Valid issues for clustering:', validIssues.length);

  // Simple clustering algorithm based on distance
  const clusters: IssueCluster[] = [];
  const processedIssues = new Set<string>();

  validIssues.forEach(issue => {
    if (processedIssues.has(issue.id)) return;

    const nearbyIssues = validIssues.filter(otherIssue => {
      if (processedIssues.has(otherIssue.id) || issue.id === otherIssue.id) return false;

      const distance = Math.sqrt(
        Math.pow(issue.location.latitude - otherIssue.location.latitude, 2) +
        Math.pow(issue.location.longitude - otherIssue.location.longitude, 2)
      );

      return distance < clusterDistance;
    });

    const clusterIssues = [issue, ...nearbyIssues];
    clusterIssues.forEach(clusterIssue => processedIssues.add(clusterIssue.id));

    if (clusterIssues.length > 1) {
      // Create cluster
      const centerLat = clusterIssues.reduce((sum, i) => sum + i.location.latitude, 0) / clusterIssues.length;
      const centerLng = clusterIssues.reduce((sum, i) => sum + i.location.longitude, 0) / clusterIssues.length;

      clusters.push({
        id: `cluster_${issue.id}`,
        coordinate: {
          lat: centerLat,
          lng: centerLng,
        },
        issues: clusterIssues,
        count: clusterIssues.length,
      });
    } else {
      // Single issue
      clusters.push({
        id: issue.id,
        coordinate: {
          lat: issue.location.latitude,
          lng: issue.location.longitude,
        },
        issues: [issue],
        count: 1,
      });
    }
  });

  console.log('🎯 Final clusters created:', clusters.length);
  return clusters;
};

export const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'pothole':
    case 'road_maintenance':
      return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
    case 'streetlight':
    case 'electrical':
      return 'M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.2 3-3.3 3-5.7 0-3.9-3.1-7-7-7z';
    case 'garbage':
    case 'waste':
      return 'M7 21q-.825 0-1.413-.588T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.588 1.413T17 21H7Z';
    case 'water_supply':
    case 'water':
      return 'M12 2c-5.33 4.55-8 8.48-8 11.8c0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z';
    case 'sewerage':
      return 'm9 11l3-3l3 3l-3 3l-3-3zm-1 0l-2.5 2.5L3 11l2.5-2.5L8 11z';
    case 'traffic':
      return 'M20 10h-3V8.86c1.72-.45 3-2 3-3.86h-3V3c0-.55-.45-1-1-1H8c-.55 0-1 .45-1 1v2H4c0 1.86 1.28 3.41 3 3.86V10H4c0 1.86 1.28 3.41 3 3.86V16H4c0 1.86 1.28 3.41 3 3.86V22c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-2.14c1.72-.45 3-2 3-3.86h-3v-2.14c1.72-.45 3-2 3-3.86z';
    case 'park_maintenance':
    case 'parks':
      return 'M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66C7.16 17.16 9 12.06 17 10zm0-6C6.27 4.11 4 18.89 4 18.89l2 .67C8.07 13.25 9.09 6.69 17 4z';
    case 'construction':
      return 'M13.783 15.172l2.121-2.121 5.996 5.996-2.121 2.122zM17.5 10c1.38 0 2.5-1.12 2.5-2.5 0-1.38-1.12-2.5-2.5-2.5S15 6.12 15 7.5c0 1.38 1.12 2.5 2.5 2.5z';
    case 'noise_pollution':
      return 'M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83z';
    case 'air_pollution':
    case 'water_pollution':
      return 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z';
    case 'stray_animals':
      return 'M4.5 9.5C5.33 9.5 6 8.83 6 8s-.67-1.5-1.5-1.5S3 7.17 3 8s.67 1.5 1.5 1.5zm0 2C3.12 11.5 2 12.62 2 14s1.12 2.5 2.5 2.5S7 15.38 7 14s-1.12-2.5-2.5-2.5z';
    case 'illegal_parking':
      return 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z';
    case 'illegal_construction':
      return 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';
    case 'public_transport':
      return 'M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10z';
    case 'healthcare':
      return 'M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z';
    case 'education':
      return 'M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z';
    default:
      return 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'low':
      return '#4CAF50';
    case 'medium':
      return '#FF9800';
    case 'high':
      return '#F44336';
    case 'critical':
      return '#9C27B0';
    default:
      return '#757575';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#FF9800';
    case 'acknowledged':
      return '#2196F3';
    case 'in_progress':
      return '#9C27B0';
    case 'resolved':
      return '#4CAF50';
    case 'closed':
      return '#4CAF50';
    case 'rejected':
      return '#F44336';
    default:
      return '#757575';
  }
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const createMarkerIcon = (cluster: IssueCluster): string => {
  if (cluster.count === 1) {
    const issue = cluster.issues[0];
    const priorityColor = getPriorityColor(issue.priority);
    const statusColor = getStatusColor(issue.status);
    
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2C11.6 2 8 5.6 8 10c0 8 8 18 8 18s8-10 8-18c0-4.4-3.6-8-8-8z" fill="${statusColor}" stroke="#fff" stroke-width="2"/>
        <circle cx="16" cy="10" r="4" fill="white"/>
        <text x="16" y="13" text-anchor="middle" fill="${priorityColor}" font-size="8" font-weight="bold">${issue.priority.charAt(0).toUpperCase()}</text>
      </svg>
    `)}`;
  } else {
    // Cluster marker
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#1976d2" stroke="#fff" stroke-width="3"/>
        <text x="20" y="25" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${cluster.count}</text>
      </svg>
    `)}`;
  }
};