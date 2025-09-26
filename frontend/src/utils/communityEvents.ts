// Community events mock data and utilities

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  category: 'awareness' | 'cleaning' | 'education' | 'health' | 'environment' | 'social';
  type: 'campaign' | 'drive' | 'workshop' | 'rally' | 'festival' | 'meeting';
  date: string;
  time: string;
  duration: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  organizer: {
    name: string;
    type: 'government' | 'ngo' | 'community' | 'private';
    contact?: string;
  };
  capacity: number;
  registeredCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  requirements?: string[];
  benefits?: string[];
  images?: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  distance?: number; // in km from user location
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock community events data for Punjab/Jalandhar area
export const mockCommunityEvents: CommunityEvent[] = [
  {
    id: 'clean-jalandhar-2025',
    title: 'Jalandhar City Cleanliness Drive 2025',
    description: 'Join hands to make Jalandhar cleaner and greener! This mega cleanliness drive will cover major markets, parks, and residential areas. Volunteers will be provided with cleaning equipment, gloves, and refreshments.',
    category: 'cleaning',
    type: 'drive',
    date: '2025-10-15',
    time: '07:00',
    duration: '4 hours',
    location: {
      address: 'Model Town Market, Jalandhar',
      city: 'Jalandhar',
      state: 'Punjab',
      coordinates: { lat: 31.3260, lng: 75.5762 }
    },
    organizer: {
      name: 'Jalandhar Municipal Corporation',
      type: 'government',
      contact: '+91-181-222-0000'
    },
    capacity: 500,
    registeredCount: 387,
    status: 'upcoming',
    priority: 'high',
    tags: ['cleanliness', 'environment', 'volunteer', 'community'],
    requirements: ['Comfortable clothing', 'Water bottle', 'Mask (optional)'],
    benefits: ['Community service certificate', 'Refreshments provided', 'Networking opportunity'],
    images: ['/images/events/clean-drive-1.jpg', '/images/events/clean-drive-2.jpg'],
    contactInfo: {
      phone: '+91-181-222-0000',
      email: 'events@jmc.punjab.gov.in',
      website: 'https://jmc.punjab.gov.in'
    },
    distance: 2.5,
    isRegistered: false,
    createdAt: '2025-09-20',
    updatedAt: '2025-09-25'
  },
  {
    id: 'swachh-bharat-awareness',
    title: 'Swachh Bharat Mission Awareness Campaign',
    description: 'Interactive awareness session about Swachh Bharat Mission goals, progress, and individual contributions. Includes expert talks, Q&A session, and distribution of educational materials.',
    category: 'awareness',
    type: 'campaign',
    date: '2025-10-08',
    time: '10:00',
    duration: '3 hours',
    location: {
      address: 'Guru Nanak Dev University Auditorium',
      city: 'Amritsar',
      state: 'Punjab',
      coordinates: { lat: 31.6340, lng: 74.8723 }
    },
    organizer: {
      name: 'Swachh Bharat Mission Punjab',
      type: 'government'
    },
    capacity: 300,
    registeredCount: 245,
    status: 'upcoming',
    priority: 'high',
    tags: ['swachh-bharat', 'awareness', 'education', 'government'],
    requirements: ['ID proof for entry'],
    benefits: ['Certificate of participation', 'Educational materials', 'Refreshments'],
    contactInfo: {
      phone: '+91-183-225-8800',
      email: 'info@swachhbharatpunjab.in'
    },
    distance: 85.3,
    isRegistered: false,
    createdAt: '2025-09-15',
    updatedAt: '2025-09-22'
  },
  {
    id: 'plastic-free-jalandhar',
    title: 'Plastic-Free Jalandhar Initiative',
    description: 'Community workshop on reducing plastic usage and promoting sustainable alternatives. Learn about plastic-free living, zero-waste practices, and how to organize local initiatives.',
    category: 'environment',
    type: 'workshop',
    date: '2025-09-28',
    time: '14:00',
    duration: '2 hours',
    location: {
      address: 'Green Valley Community Center, Jalandhar',
      city: 'Jalandhar',
      state: 'Punjab',
      coordinates: { lat: 31.3097, lng: 75.5800 }
    },
    organizer: {
      name: 'Green Punjab Foundation',
      type: 'ngo',
      contact: '+91-98765-43210'
    },
    capacity: 100,
    registeredCount: 78,
    status: 'upcoming',
    priority: 'medium',
    tags: ['plastic-free', 'environment', 'sustainability', 'workshop'],
    requirements: ['Notebook and pen', 'Reusable water bottle'],
    benefits: ['Free eco-friendly kit', 'Networking with environmentalists', 'Certificate'],
    contactInfo: {
      phone: '+91-98765-43210',
      email: 'contact@greenpunjab.org',
      website: 'https://greenpunjab.org'
    },
    distance: 1.2,
    isRegistered: true,
    createdAt: '2025-09-10',
    updatedAt: '2025-09-25'
  },
  {
    id: 'women-safety-rally',
    title: 'Women Safety Awareness Rally',
    description: 'Mass rally to raise awareness about women safety, self-defense techniques, and community support systems. Includes demonstrations, expert sessions, and pledge-taking ceremony.',
    category: 'social',
    type: 'rally',
    date: '2025-10-20',
    time: '09:00',
    duration: '5 hours',
    location: {
      address: 'Rama Mandi Chowk to Civil Lines',
      city: 'Jalandhar',
      state: 'Punjab',
      coordinates: { lat: 31.3256, lng: 75.5792 }
    },
    organizer: {
      name: 'Punjab Women Commission',
      type: 'government'
    },
    capacity: 1000,
    registeredCount: 756,
    status: 'upcoming',
    priority: 'high',
    tags: ['women-safety', 'social', 'awareness', 'rally'],
    requirements: ['Comfortable walking shoes', 'Water bottle'],
    benefits: ['Safety kit distribution', 'Self-defense training certificate', 'Community recognition'],
    contactInfo: {
      phone: '+91-181-267-0000',
      email: 'info@punjabwomen.gov.in'
    },
    distance: 0.8,
    isRegistered: false,
    createdAt: '2025-09-18',
    updatedAt: '2025-09-24'
  },
  {
    id: 'digital-literacy-camp',
    title: 'Digital Literacy Camp for Seniors',
    description: 'Free digital literacy program for senior citizens covering smartphone usage, online banking, social media safety, and basic computer skills. Hands-on training with experienced instructors.',
    category: 'education',
    type: 'workshop',
    date: '2025-10-05',
    time: '09:30',
    duration: '6 hours',
    location: {
      address: 'Old Age Home, Nakodar Road',
      city: 'Jalandhar',
      state: 'Punjab',
      coordinates: { lat: 31.3567, lng: 75.5856 }
    },
    organizer: {
      name: 'Digital India Initiative',
      type: 'government'
    },
    capacity: 50,
    registeredCount: 42,
    status: 'upcoming',
    priority: 'medium',
    tags: ['digital-literacy', 'education', 'seniors', 'technology'],
    requirements: ['Basic reading skills', 'Bring your own smartphone if available'],
    benefits: ['Digital literacy certificate', 'Free lunch provided', 'Ongoing support'],
    contactInfo: {
      phone: '+91-1800-111-555',
      email: 'support@digitalindia.gov.in',
      website: 'https://digitalindia.gov.in'
    },
    distance: 3.7,
    isRegistered: false,
    createdAt: '2025-09-12',
    updatedAt: '2025-09-23'
  },
  {
    id: 'tree-plantation-drive',
    title: 'Urban Tree Plantation Drive',
    description: 'Mass tree plantation drive in urban areas to increase green cover. Participate in planting and nurturing trees in parks, roadside areas, and community spaces.',
    category: 'environment',
    type: 'drive',
    date: '2025-11-02',
    time: '08:00',
    duration: '3 hours',
    location: {
      address: 'Cantonment Board Park',
      city: 'Jalandhar Cantt',
      state: 'Punjab',
      coordinates: { lat: 31.2800, lng: 75.6200 }
    },
    organizer: {
      name: 'Punjab Forest Department',
      type: 'government'
    },
    capacity: 200,
    registeredCount: 156,
    status: 'upcoming',
    priority: 'medium',
    tags: ['tree-plantation', 'environment', 'green-cover', 'community'],
    requirements: ['Gardening gloves', 'Water bottle', 'Hat/cap'],
    benefits: ['Certificate of participation', 'Free saplings for home', 'Environmental awareness kit'],
    contactInfo: {
      phone: '+91-181-267-1000',
      email: 'plantation@punjabforest.gov.in'
    },
    distance: 5.2,
    isRegistered: false,
    createdAt: '2025-09-14',
    updatedAt: '2025-09-25'
  },
  {
    id: 'health-camp-rural',
    title: 'Free Health Check-up Camp',
    description: 'Comprehensive health check-up camp offering blood pressure monitoring, diabetes screening, general physician consultation, and basic dental care. Free medicines for eligible patients.',
    category: 'health',
    type: 'campaign',
    date: '2025-10-12',
    time: '08:30',
    duration: '8 hours',
    location: {
      address: 'Primary Health Center, Phillaur',
      city: 'Phillaur',
      state: 'Punjab',
      coordinates: { lat: 31.0200, lng: 75.7800 }
    },
    organizer: {
      name: 'National Health Mission Punjab',
      type: 'government'
    },
    capacity: 300,
    registeredCount: 198,
    status: 'upcoming',
    priority: 'high',
    tags: ['health', 'medical', 'free-checkup', 'rural'],
    requirements: ['Aadhaar card', 'Previous medical reports if any'],
    benefits: ['Free consultations', 'Basic medicines', 'Health awareness materials'],
    contactInfo: {
      phone: '+91-1826-222-000',
      email: 'health@punjab.gov.in'
    },
    distance: 18.5,
    isRegistered: false,
    createdAt: '2025-09-16',
    updatedAt: '2025-09-24'
  },
  {
    id: 'youth-employment-seminar',
    title: 'Youth Employment & Skill Development Seminar',
    description: 'Interactive seminar on career opportunities, skill development programs, and entrepreneurship. Guest speakers from industry, government officials, and successful entrepreneurs.',
    category: 'education',
    type: 'workshop',
    date: '2025-10-25',
    time: '11:00',
    duration: '4 hours',
    location: {
      address: 'DAV College Auditorium',
      city: 'Jalandhar',
      state: 'Punjab',
      coordinates: { lat: 31.3256, lng: 75.5792 }
    },
    organizer: {
      name: 'Punjab Skill Development Mission',
      type: 'government'
    },
    capacity: 400,
    registeredCount: 312,
    status: 'upcoming',
    priority: 'medium',
    tags: ['employment', 'skills', 'youth', 'career'],
    requirements: ['Student ID or resume', 'Notebook'],
    benefits: ['Career counseling', 'Skill assessment', 'Networking opportunities'],
    contactInfo: {
      phone: '+91-181-267-5000',
      email: 'skills@punjab.gov.in',
      website: 'https://skillpunjab.gov.in'
    },
    distance: 1.5,
    isRegistered: false,
    createdAt: '2025-09-19',
    updatedAt: '2025-09-25'
  }
];

// Utility functions
export const getEventsByLocation = (lat: number, lng: number, radiusKm: number = 50): CommunityEvent[] => {
  return mockCommunityEvents.map(event => ({
    ...event,
    distance: calculateDistance(lat, lng, event.location.coordinates.lat, event.location.coordinates.lng)
  })).filter(event => event.distance! <= radiusKm);
};

export const getEventsByCategory = (category: CommunityEvent['category']): CommunityEvent[] => {
  return mockCommunityEvents.filter(event => event.category === category);
};

export const getEventsByDateRange = (startDate: string, endDate: string): CommunityEvent[] => {
  return mockCommunityEvents.filter(event => {
    const eventDate = new Date(event.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return eventDate >= start && eventDate <= end;
  });
};

export const getUpcomingEvents = (): CommunityEvent[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return mockCommunityEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= today && event.status === 'upcoming';
  });
};

export const getEventsByPriority = (priority: CommunityEvent['priority']): CommunityEvent[] => {
  return mockCommunityEvents.filter(event => event.priority === priority);
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get user's current location (mock for Punjab/Jalandhar)
export const getUserLocation = () => {
  return {
    lat: 31.3260, // Jalandhar coordinates
    lng: 75.5762,
    city: 'Jalandhar',
    state: 'Punjab'
  };
};

// Get events near user location
export const getNearbyEvents = (maxDistance: number = 25): CommunityEvent[] => {
  const userLocation = getUserLocation();
  return getEventsByLocation(userLocation.lat, userLocation.lng, maxDistance);
};

// Search events by text
export const searchEvents = (query: string): CommunityEvent[] => {
  const lowercaseQuery = query.toLowerCase();
  return mockCommunityEvents.filter(event =>
    event.title.toLowerCase().includes(lowercaseQuery) ||
    event.description.toLowerCase().includes(lowercaseQuery) ||
    event.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    event.location.city.toLowerCase().includes(lowercaseQuery) ||
    event.organizer.name.toLowerCase().includes(lowercaseQuery)
  );
};

// Get event statistics
export const getEventStats = () => {
  const totalEvents = mockCommunityEvents.length;
  const upcomingEvents = mockCommunityEvents.filter(e => e.status === 'upcoming').length;
  const registeredUsers = mockCommunityEvents.reduce((sum, event) => sum + event.registeredCount, 0);
  const totalCapacity = mockCommunityEvents.reduce((sum, event) => sum + event.capacity, 0);

  return {
    totalEvents,
    upcomingEvents,
    registeredUsers,
    totalCapacity,
    utilizationRate: Math.round((registeredUsers / totalCapacity) * 100)
  };
};