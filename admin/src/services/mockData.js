export const mockDepartments = [
    {
        _id: '1',
        name: 'Public Works Department',
        code: 'PWD',
        isActive: true,
        contactPhone: '+91 9876543210',
        email: 'pwd@gov.in',
        issuesCount: 45,
        resolvedCount: 32
    },
    {
        _id: '2',
        name: 'Water Supply Department',
        code: 'WSD',
        isActive: true,
        contactPhone: '+91 9123456780',
        email: 'wsd@gov.in',
        issuesCount: 32,
        resolvedCount: 28
    },
    {
        _id: '3',
        name: 'Electricity Board',
        code: 'EB',
        isActive: false,
        contactPhone: '+91 9988776655',
        email: 'eb@gov.in',
        issuesCount: 28,
        resolvedCount: 25
    },
    {
        _id: '4',
        name: 'Sanitation Department',
        code: 'SD',
        isActive: true,
        contactPhone: '+91 9090909090',
        email: 'sd@gov.in',
        issuesCount: 25,
        resolvedCount: 22
    }
    // ... add more departments if needed
];

export const mockIssues = [
    {
        _id: '1',
        title: 'Large pothole on Main Street',
        category: 'roads',
        status: 'in_progress',
        priority: 'high',
        location: {
            address: '123 Main St, City',
            coordinates: [73.856743, 18.520430]
        },
        department: {
            _id: '1',
            name: 'Public Works Department',
            code: 'PWD'
        },
        reportedBy: {
            _id: '1',
            name: 'John Doe',
            phone: '+91 9876543210'
        },
        createdAt: '2023-09-25T10:30:00Z',
        updatedAt: '2023-09-26T15:45:00Z',
        mediaUrls: ['https://example.com/photo1.jpg'],
        votes: { up: 15, down: 2 },
        timeline: [
            {
                status: 'reported',
                timestamp: '2023-09-25T10:30:00Z',
                note: 'Issue reported by citizen'
            },
            {
                status: 'acknowledged',
                timestamp: '2023-09-25T11:00:00Z',
                note: 'Assigned to PWD'
            },
            {
                status: 'in_progress',
                timestamp: '2023-09-26T15:45:00Z',
                note: 'Work crew dispatched'
            }
        ]
    },
    {
        _id: '2',
        title: 'Water leakage near Park Avenue',
        category: 'water',
        status: 'pending',
        priority: 'medium',
        location: {
            address: '45 Park Ave, City',
            coordinates: [73.857000, 18.521000]
        },
        department: {
            _id: '2',
            name: 'Water Supply Department',
            code: 'WSD'
        },
        reportedBy: {
            _id: '2',
            name: 'Priya Singh',
            phone: '+91 9123456780'
        },
        createdAt: '2023-09-27T09:00:00Z',
        updatedAt: '2023-09-27T09:00:00Z',
        mediaUrls: ['https://example.com/water1.jpg'],
        votes: { up: 8, down: 0 },
        timeline: [
            {
                status: 'reported',
                timestamp: '2023-09-27T09:00:00Z',
                note: 'Leakage reported by resident'
            }
        ]
    },
    {
        _id: '3',
        title: 'Streetlight not working at 5th Cross',
        category: 'electricity',
        status: 'resolved',
        priority: 'low',
        location: {
            address: '5th Cross, City',
            coordinates: [73.858000, 18.522000]
        },
        department: {
            _id: '3',
            name: 'Electricity Board',
            code: 'EB'
        },
        reportedBy: {
            _id: '3',
            name: 'Amit Kumar',
            phone: '+91 9988776655'
        },
        createdAt: '2023-09-20T18:00:00Z',
        updatedAt: '2023-09-22T10:00:00Z',
        mediaUrls: [],
        votes: { up: 5, down: 1 },
        timeline: [
            {
                status: 'reported',
                timestamp: '2023-09-20T18:00:00Z',
                note: 'Streetlight issue reported'
            },
            {
                status: 'acknowledged',
                timestamp: '2023-09-21T08:00:00Z',
                note: 'Assigned to EB'
            },
            {
                status: 'resolved',
                timestamp: '2023-09-22T10:00:00Z',
                note: 'Streetlight repaired'
            }
        ]
    },
    {
        _id: '4',
        title: 'Garbage not collected in Sector 7',
        category: 'sanitation',
        status: 'pending',
        priority: 'medium',
        location: {
            address: 'Sector 7, City',
            coordinates: [73.859000, 18.523000]
        },
        department: {
            _id: '4',
            name: 'Sanitation Department',
            code: 'SD'
        },
        reportedBy: {
            _id: '4',
            name: 'Ravi Patel',
            phone: '+91 9090909090'
        },
        createdAt: '2023-09-28T07:30:00Z',
        updatedAt: '2023-09-28T07:30:00Z',
        mediaUrls: ['https://example.com/garbage1.jpg'],
        votes: { up: 12, down: 3 },
        timeline: [
            {
                status: 'reported',
                timestamp: '2023-09-28T07:30:00Z',
                note: 'Garbage issue reported'
            }
        ]
    }
    // ... add more issues if needed
];

// Add new mock issue categories
export const issueCategories = {
  roads: {
    label: 'Roads & Infrastructure',
    icon: '🚗',
    color: 'blue'
  },
  water_supply: {
    label: 'Water Supply',
    icon: '💧',
    color: 'cyan'
  },
  electricity: {
    label: 'Electricity',
    icon: '⚡',
    color: 'yellow'
  },
  sanitation: {
    label: 'Sanitation',
    icon: '🗑️',
    color: 'green'
  },
  public_safety: {
    label: 'Public Safety',
    icon: '🚨',
    color: 'red'
  },
  parks: {
    label: 'Parks & Recreation',
    icon: '🌳',
    color: 'emerald'
  },
  street_lights: {
    label: 'Street Lights',
    icon: '💡',
    color: 'amber'
  },
  noise: {
    label: 'Noise Complaints',
    icon: '📢',
    color: 'purple'
  }
};

// Add timeline events types
export const timelineEventTypes = {
  reported: {
    icon: '🔔',
    color: 'slate'
  },
  acknowledged: {
    icon: '👁️',
    color: 'blue'
  },
  assigned: {
    icon: '📋',
    color: 'indigo'
  },
  in_progress: {
    icon: '🚧',
    color: 'yellow'
  },
  resolved: {
    icon: '✅',
    color: 'green'
  },
  rejected: {
    icon: '❌',
    color: 'red'
  }
};

// Extend mockDepartmentIssues with more varied data
export const mockDepartmentIssues = [
  {
    _id: '1',
    title: 'Water pipeline leakage on MG Road',
    description: 'Major water leakage causing road damage and water wastage',
    category: 'water_supply',
    priority: 'high',
    status: 'pending',
    location: {
      address: '123 MG Road, Near City Mall',
      coordinates: [73.856743, 18.520430]
    },
    reportedBy: {
      _id: 'user1',
      name: 'John Doe',
      phone: '+91 9876543210'
    },
    createdAt: '2023-09-25T10:30:00Z',
    updatedAt: '2023-09-26T15:45:00Z',
    mediaUrls: ['https://example.com/photo1.jpg'],
    votes: { up: 15, down: 2 }
  },
  {
    _id: '2',
    title: 'Broken water meter',
    description: 'Water meter showing incorrect readings',
    category: 'water_supply',
    priority: 'medium',
    status: 'in_progress',
    location: {
      address: '45 Park Street',
      coordinates: [73.856743, 18.520430]
    },
    reportedBy: {
      _id: 'user2',
      name: 'Jane Smith',
      phone: '+91 9876543211'
    },
    createdAt: '2023-09-24T08:30:00Z',
    updatedAt: '2023-09-26T09:45:00Z',
    mediaUrls: [],
    votes: { up: 5, down: 1 }
  },
  {
    _id: '3',
    title: 'Low water pressure',
    description: 'Very low water pressure in residential area',
    category: 'water_supply',
    priority: 'low',
    status: 'resolved',
    location: {
      address: '78 Lake View Road',
      coordinates: [73.856743, 18.520430]
    },
    reportedBy: {
      _id: 'user3',
      name: 'Mike Johnson',
      phone: '+91 9876543212'
    },
    createdAt: '2023-09-23T14:30:00Z',
    updatedAt: '2023-09-25T16:45:00Z',
    mediaUrls: [],
    votes: { up: 8, down: 0 }
  },
  {
    _id: '4',
    title: 'Tree fallen on power lines',
    description: 'Large tree has fallen during storm and damaged power lines',
    category: 'electricity',
    priority: 'high',
    status: 'in_progress',
    location: {
      address: '789 Storm Avenue',
      coordinates: [73.859123, 18.523456]
    },
    reportedBy: {
      _id: 'user4',
      name: 'Sarah Wilson',
      phone: '+91 9876543213'
    },
    createdAt: '2023-09-28T08:30:00Z',
    updatedAt: '2023-09-28T09:45:00Z',
    mediaUrls: ['https://example.com/tree1.jpg', 'https://example.com/tree2.jpg'],
    votes: { up: 25, down: 1 },
    timeline: [
      {
        status: 'reported',
        timestamp: '2023-09-28T08:30:00Z',
        note: 'Emergency situation reported'
      },
      {
        status: 'acknowledged',
        timestamp: '2023-09-28T08:35:00Z',
        note: 'Emergency team dispatched'
      },
      {
        status: 'in_progress',
        timestamp: '2023-09-28T09:45:00Z',
        note: 'Tree removal in progress'
      }
    ]
  },
  {
    _id: '5',
    title: 'Park playground equipment damaged',
    description: 'Swing set and slide need urgent repairs',
    category: 'parks',
    priority: 'medium',
    status: 'pending',
    location: {
      address: 'Central Park, Kids Zone',
      coordinates: [73.857789, 18.521234]
    },
    reportedBy: {
      _id: 'user5',
      name: 'Rita Patel',
      phone: '+91 9876543214'
    },
    createdAt: '2023-09-27T14:30:00Z',
    mediaUrls: ['https://example.com/park1.jpg'],
    votes: { up: 12, down: 0 }
  }
];

export const mockStats = {
    totalIssues: 156,
    resolvedIssues: 89,
    pendingIssues: 45,
    inProgressIssues: 22,
    departments: 12,
    activeDepartments: 10,
    totalUsers: 1250,
    issuesByCategory: {
        roads: 45,
        water: 32,
        electricity: 28,
        sanitation: 25,
        others: 26
    },
    recentActivity: [
        {
            type: 'status_change',
            issueId: '1',
            title: 'Pothole repair',
            oldStatus: 'pending',
            newStatus: 'in_progress',
            timestamp: '2023-09-26T15:45:00Z'
        },
        {
            type: 'new_issue',
            issueId: '2',
            title: 'Water leakage near Park Avenue',
            timestamp: '2023-09-27T09:00:00Z'
        },
        {
            type: 'status_change',
            issueId: '3',
            title: 'Streetlight not working at 5th Cross',
            oldStatus: 'acknowledged',
            newStatus: 'resolved',
            timestamp: '2023-09-22T10:00:00Z'
        },
        {
            type: 'new_issue',
            issueId: '4',
            title: 'Garbage not collected in Sector 7',
            timestamp: '2023-09-28T07:30:00Z'
        }
    ],
    trendingIssues: [
        {
            category: 'roads',
            count: 15,
            trend: 'up',
            percentage: 23
        },
        {
            category: 'water_supply',
            count: 12,
            trend: 'down',
            percentage: 8
        },
        {
            category: 'electricity',
            count: 9,
            trend: 'stable',
            percentage: 0
        }
    ],
    departmentPerformance: [
        {
            id: '1',
            name: 'Public Works',
            resolvedCount: 45,
            averageResolutionTime: '2.5 days',
            satisfactionRate: 92
        },
        {
            id: '2',
            name: 'Water Supply',
            resolvedCount: 38,
            averageResolutionTime: '1.8 days',
            satisfactionRate: 88
        }
    ],
    weeklyTrends: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        reported: [12, 15, 8, 10, 14, 5, 7],
        resolved: [10, 12, 7, 9, 11, 4, 6]
    },
    issueBreakdown: {
      thisMonth: {
        total: 248,
        resolved: 156,
        pending: 62,
        inProgress: 30,
        highPriority: 45,
        avgResolutionTime: '2.3 days',
        satisfaction: 87
      },
      trends: {
        dailyReports: [12, 15, 18, 14, 22, 16, 19], // Last 7 days
        resolutionTimes: [2.1, 1.8, 2.4, 2.0, 2.3], // Last 5 days avg
        satisfaction: [85, 88, 86, 89, 87] // Last 5 days %
      }
    },
    departmentInsights: [
      {
        id: '1',
        name: 'Public Works',
        stats: {
          activeIssues: 45,
          resolvedThisWeek: 28,
          avgResponseTime: '1.2 hours',
          avgResolutionTime: '2.1 days',
          satisfaction: 92,
          trend: 'up'
        },
        performance: {
          efficiency: 94,
          quality: 88,
          responsiveness: 90
        }
      },
      // ...more departments
    ],
    hotspots: [
      {
        area: 'Downtown',
        issues: 45,
        mostCommon: 'roads',
        trend: 'up',
        coordinates: [73.856743, 18.520430]
      }
      // ...more hotspots
    ],
    citizenEngagement: {
      totalUsers: 12500,
      activeUsers: 3200,
      newUsersThisMonth: 450,
      reportingRate: 78, // % of active users who reported issues
      topContributors: [
        {
          id: 'user1',
          name: 'John Doe',
          reportsSubmitted: 12,
          upvotes: 156
        }
        // ...more users
      ]
    }
};