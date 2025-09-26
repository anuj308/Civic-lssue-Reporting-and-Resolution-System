// Department leaderboard mock data and ranking logic

export interface DepartmentMetrics {
  issuesResolved: number;
  avgResolutionTime: number; // in days
  userSatisfaction: number; // 1-5 rating
  efficiency: number; // percentage (0-100)
  responseTime: number; // in hours
  publicEngagement: number; // total votes + comments
  totalIssuesAssigned: number;
  activeIssues: number;
}

export interface Department {
  id: string;
  name: string;
  state: string;
  city: string;
  category: string; // e.g., 'municipal', 'water', 'electricity', etc.
  head: string;
  contact: string;
  metrics: DepartmentMetrics;
  rank?: number;
  score?: number;
  trend?: 'up' | 'down' | 'stable';
  description: string;
  achievements: string[];
  lastUpdated: string;
}

// Mock data for departments across India
export const mockDepartments: Department[] = [
  {
    id: 'delhi-mcd',
    name: 'Municipal Corporation of Delhi',
    state: 'Delhi',
    city: 'Delhi',
    category: 'municipal',
    head: 'Shelly Oberoi',
    contact: '+91-11-2336-0000',
    description: 'Handles municipal services including waste management, street lighting, and public infrastructure in Delhi.',
    achievements: [
      'Reduced average resolution time by 40% in Q4 2024',
      'Achieved 95% user satisfaction rating',
      'Resolved 50,000+ issues in the last year'
    ],
    lastUpdated: '2024-09-25',
    metrics: {
      issuesResolved: 45230,
      avgResolutionTime: 2.3,
      userSatisfaction: 4.8,
      efficiency: 94.2,
      responseTime: 1.2,
      publicEngagement: 125430,
      totalIssuesAssigned: 48000,
      activeIssues: 2770
    }
  },
  {
    id: 'mumbai-mcgm',
    name: 'Municipal Corporation of Greater Mumbai',
    state: 'Maharashtra',
    city: 'Mumbai',
    category: 'municipal',
    head: 'Ipsita Shah',
    contact: '+91-22-2262-0000',
    description: 'Manages civic services for Mumbai metropolitan area including traffic, sanitation, and urban planning.',
    achievements: [
      'Implemented AI-powered issue categorization',
      'Partnered with 50+ NGOs for community outreach',
      'Zero tolerance policy for corruption'
    ],
    lastUpdated: '2024-09-24',
    metrics: {
      issuesResolved: 38750,
      avgResolutionTime: 3.1,
      userSatisfaction: 4.6,
      efficiency: 91.8,
      responseTime: 1.8,
      publicEngagement: 98750,
      totalIssuesAssigned: 42200,
      activeIssues: 3450
    }
  },
  {
    id: 'bangalore-bbmp',
    name: 'Bruhat Bengaluru Mahanagara Palike',
    state: 'Karnataka',
    city: 'Bangalore',
    category: 'municipal',
    head: 'Tushar Girinath',
    contact: '+91-80-2266-0000',
    description: 'Oversees municipal administration and development in Bangalore, India\'s IT capital.',
    achievements: [
      'Digital transformation completed in 2023',
      'Smart city initiatives launched',
      'Awarded for best e-governance practices'
    ],
    lastUpdated: '2024-09-23',
    metrics: {
      issuesResolved: 42100,
      avgResolutionTime: 2.8,
      userSatisfaction: 4.7,
      efficiency: 92.5,
      responseTime: 1.5,
      publicEngagement: 108900,
      totalIssuesAssigned: 45500,
      activeIssues: 3400
    }
  },
  {
    id: 'chennai-cmc',
    name: 'Chennai Municipal Corporation',
    state: 'Tamil Nadu',
    city: 'Chennai',
    category: 'municipal',
    head: 'Priya Rajan',
    contact: '+91-44-2538-0000',
    description: 'Manages civic amenities and infrastructure development in Chennai.',
    achievements: [
      'Flood management system upgraded',
      'Green initiatives expanded city-wide',
      'Mobile app adoption rate of 85%'
    ],
    lastUpdated: '2024-09-22',
    metrics: {
      issuesResolved: 35600,
      avgResolutionTime: 3.4,
      userSatisfaction: 4.5,
      efficiency: 89.7,
      responseTime: 2.1,
      publicEngagement: 87650,
      totalIssuesAssigned: 39700,
      activeIssues: 4100
    }
  },
  {
    id: 'kolkata-kmc',
    name: 'Kolkata Municipal Corporation',
    state: 'West Bengal',
    city: 'Kolkata',
    category: 'municipal',
    head: 'Firhad Hakim',
    contact: '+91-33-2286-0000',
    description: 'Handles municipal governance and service delivery in Kolkata.',
    achievements: [
      'Heritage conservation projects completed',
      'Waste-to-energy plant operational',
      'Community participation increased by 60%'
    ],
    lastUpdated: '2024-09-21',
    metrics: {
      issuesResolved: 31200,
      avgResolutionTime: 3.7,
      userSatisfaction: 4.3,
      efficiency: 87.4,
      responseTime: 2.4,
      publicEngagement: 72300,
      totalIssuesAssigned: 35700,
      activeIssues: 4500
    }
  },
  {
    id: 'hyderabad-ghmc',
    name: 'Greater Hyderabad Municipal Corporation',
    state: 'Telangana',
    city: 'Hyderabad',
    category: 'municipal',
    head: 'Amrapali Kata',
    contact: '+91-40-2322-0000',
    description: 'Manages urban services and development in Hyderabad metropolitan area.',
    achievements: [
      'Smart traffic management system deployed',
      'Solar power adoption in public spaces',
      'Digital literacy programs for citizens'
    ],
    lastUpdated: '2024-09-20',
    metrics: {
      issuesResolved: 38900,
      avgResolutionTime: 2.9,
      userSatisfaction: 4.6,
      efficiency: 91.2,
      responseTime: 1.7,
      publicEngagement: 94500,
      totalIssuesAssigned: 42700,
      activeIssues: 3800
    }
  },
  {
    id: 'pune-pmc',
    name: 'Pune Municipal Corporation',
    state: 'Maharashtra',
    city: 'Pune',
    category: 'municipal',
    head: 'Vijay Kumbhar',
    contact: '+91-20-2550-0000',
    description: 'Oversees municipal services in Pune, known for its educational institutions.',
    achievements: [
      'Tree plantation drive completed',
      'Digital payment systems integrated',
      'Youth engagement programs launched'
    ],
    lastUpdated: '2024-09-19',
    metrics: {
      issuesResolved: 28900,
      avgResolutionTime: 3.2,
      userSatisfaction: 4.4,
      efficiency: 88.9,
      responseTime: 1.9,
      publicEngagement: 67800,
      totalIssuesAssigned: 32500,
      activeIssues: 3600
    }
  },
  {
    id: 'ahmedabad-amc',
    name: 'Ahmedabad Municipal Corporation',
    state: 'Gujarat',
    city: 'Ahmedabad',
    category: 'municipal',
    head: 'Mukesh Kumar',
    contact: '+91-79-2550-0000',
    description: 'Manages civic services in Ahmedabad, Gujarat\'s largest city.',
    achievements: [
      'Riverfront development project completed',
      'Public transport integration improved',
      'Clean city initiatives recognized nationally'
    ],
    lastUpdated: '2024-09-18',
    metrics: {
      issuesResolved: 26700,
      avgResolutionTime: 3.5,
      userSatisfaction: 4.2,
      efficiency: 86.8,
      responseTime: 2.2,
      publicEngagement: 59200,
      totalIssuesAssigned: 30700,
      activeIssues: 4000
    }
  },
  {
    id: 'jaipur-jmc',
    name: 'Jaipur Municipal Corporation',
    state: 'Rajasthan',
    city: 'Jaipur',
    category: 'municipal',
    head: 'Akhil Arora',
    contact: '+91-141-270-0000',
    description: 'Handles municipal administration in the Pink City of Jaipur.',
    achievements: [
      'Heritage zone maintenance improved',
      'Digital grievance redressal system',
      'Community health programs expanded'
    ],
    lastUpdated: '2024-09-17',
    metrics: {
      issuesResolved: 23400,
      avgResolutionTime: 3.8,
      userSatisfaction: 4.1,
      efficiency: 85.2,
      responseTime: 2.5,
      publicEngagement: 52100,
      totalIssuesAssigned: 27500,
      activeIssues: 4100
    }
  },
  {
    id: 'lucknow-lmc',
    name: 'Lucknow Municipal Corporation',
    state: 'Uttar Pradesh',
    city: 'Lucknow',
    category: 'municipal',
    head: 'Suresh Kumar Gupta',
    contact: '+91-522-262-0000',
    description: 'Manages civic services in Lucknow, Uttar Pradesh capital.',
    achievements: [
      'Ganga rejuvenation projects initiated',
      'Smart metering for water supply',
      'Cultural heritage preservation efforts'
    ],
    lastUpdated: '2024-09-16',
    metrics: {
      issuesResolved: 19800,
      avgResolutionTime: 4.1,
      userSatisfaction: 3.9,
      efficiency: 82.6,
      responseTime: 2.8,
      publicEngagement: 45600,
      totalIssuesAssigned: 24000,
      activeIssues: 4200
    }
  }
];

// Calculate composite score for ranking
export const calculateDepartmentScore = (metrics: DepartmentMetrics): number => {
  // Normalize each metric to 0-100 scale
  const normalizedResolutionTime = Math.max(0, 100 - (metrics.avgResolutionTime * 10)); // Lower time = higher score
  const normalizedSatisfaction = (metrics.userSatisfaction / 5) * 100;
  const normalizedEfficiency = metrics.efficiency;
  const normalizedResponseTime = Math.max(0, 100 - (metrics.responseTime * 20)); // Lower time = higher score
  const normalizedEngagement = Math.min(100, (metrics.publicEngagement / 1000)); // Scale engagement

  // Weights for each metric
  const weights = {
    issuesResolved: 0.15, // 15% - volume matters but not everything
    resolutionTime: 0.25, // 25% - speed is crucial
    satisfaction: 0.30, // 30% - user happiness is paramount
    efficiency: 0.15, // 15% - how well they handle assigned work
    responseTime: 0.10, // 10% - initial response speed
    engagement: 0.05  // 5% - community involvement
  };

  const score =
    (metrics.issuesResolved / 100) * weights.issuesResolved * 100 + // Scale issues resolved
    normalizedResolutionTime * weights.resolutionTime +
    normalizedSatisfaction * weights.satisfaction +
    normalizedEfficiency * weights.efficiency +
    normalizedResponseTime * weights.responseTime +
    normalizedEngagement * weights.engagement;

  return Math.round(score * 100) / 100; // Round to 2 decimal places
};

// Get ranked departments
export const getRankedDepartments = (): Department[] => {
  const departmentsWithScores = mockDepartments.map(dept => ({
    ...dept,
    score: calculateDepartmentScore(dept.metrics)
  }));

  // Sort by score descending
  departmentsWithScores.sort((a, b) => b.score - a.score);

  // Assign ranks and trends (mock trends for now)
  return departmentsWithScores.map((dept, index) => ({
    ...dept,
    rank: index + 1,
    trend: index < 3 ? 'up' : index > 6 ? 'down' : 'stable' as const
  }));
};

// Get department by ID
export const getDepartmentById = (id: string): Department | undefined => {
  return mockDepartments.find(dept => dept.id === id);
};

// Get departments by category
export const getDepartmentsByCategory = (category: string): Department[] => {
  return mockDepartments.filter(dept => dept.category === category);
};

// Get departments by state
export const getDepartmentsByState = (state: string): Department[] => {
  return mockDepartments.filter(dept => dept.state === state);
};

// Get top performing departments
export const getTopDepartments = (limit: number = 5): Department[] => {
  return getRankedDepartments().slice(0, limit);
};

// Get department statistics
export const getDepartmentStats = () => {
  const totalDepartments = mockDepartments.length;
  const totalIssuesResolved = mockDepartments.reduce((sum, dept) => sum + dept.metrics.issuesResolved, 0);
  const avgSatisfaction = mockDepartments.reduce((sum, dept) => sum + dept.metrics.userSatisfaction, 0) / totalDepartments;
  const avgResolutionTime = mockDepartments.reduce((sum, dept) => sum + dept.metrics.avgResolutionTime, 0) / totalDepartments;

  return {
    totalDepartments,
    totalIssuesResolved,
    avgSatisfaction: Math.round(avgSatisfaction * 100) / 100,
    avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
    topPerformer: getTopDepartments(1)[0]
  };
};