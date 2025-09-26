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
  // ... add more departments
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
  // ... add more issues
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
    }
  ]
};