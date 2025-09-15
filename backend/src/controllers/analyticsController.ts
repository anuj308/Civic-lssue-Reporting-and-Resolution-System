import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue';
import { User } from '../models/User';
import { Department } from '../models/Department';

/**
 * Get dashboard overview statistics
 */
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    // Base filters based on user role
    let issueFilter: any = {};
    if (userRole === 'department_head' || userRole === 'field_worker') {
      const user = await User.findById(userId).populate('department');
      if (user?.department) {
        issueFilter.assignedDepartment = user.department;
      }
    }

    // Get current month and year for time-based filtering
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Total counts
    const totalIssues = await Issue.countDocuments(issueFilter);
    const totalUsers = userRole === 'admin' ? await User.countDocuments() : null;
    const totalDepartments = userRole === 'admin' ? await Department.countDocuments() : null;

    // Status-wise breakdown
    const statusStats = await Issue.aggregate([
      { $match: issueFilter },
      { 
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Priority-wise breakdown
    const priorityStats = await Issue.aggregate([
      { $match: issueFilter },
      { 
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Category-wise breakdown
    const categoryStats = await Issue.aggregate([
      { $match: issueFilter },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly trend (last 12 months)
    const monthlyTrend = await Issue.aggregate([
      { 
        $match: {
          ...issueFilter,
          createdAt: { $gte: new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: 1 },
          resolved: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
            } 
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Recent activity
    const recentIssues = await Issue.find(issueFilter)
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedDepartment', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Performance metrics
    const avgResolutionTime = await Issue.aggregate([
      {
        $match: {
          ...issueFilter,
          status: 'resolved',
          'timeline.resolved': { $exists: true },
          'timeline.reported': { $exists: true }
        }
      },
      {
        $project: {
          resolutionTime: {
            $divide: [
              { $subtract: ['$timeline.resolved', '$timeline.reported'] },
              1000 * 60 * 60 * 24 // Convert to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: '$resolutionTime' }
        }
      }
    ]);

    const overview = {
      totalIssues,
      totalUsers,
      totalDepartments,
      statusBreakdown: statusStats,
      priorityBreakdown: priorityStats,
      categoryBreakdown: categoryStats,
      monthlyTrend,
      recentIssues,
      averageResolutionTime: avgResolutionTime[0]?.avgDays || 0
    };

    res.status(200).json({
      success: true,
      data: { overview }
    });
  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get issue statistics with time-based filtering
 */
export const getIssueStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, department, category, status } = req.query;

    // Build filter
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (department) {
      filter.assignedDepartment = department;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    // Time-series data (daily basis)
    const timeSeriesData = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
            } 
          },
          pending: { 
            $sum: { 
              $cond: [{ $in: ['$status', ['pending', 'acknowledged']] }, 1, 0] 
            } 
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Department-wise performance
    const departmentPerformance = await Issue.aggregate([
      { $match: filter },
      { $lookup: {
          from: 'departments',
          localField: 'assignedDepartment',
          foreignField: '_id',
          as: 'department'
        }
      },
      { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$assignedDepartment',
          departmentName: { $first: '$department.name' },
          totalIssues: { $sum: 1 },
          resolvedIssues: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
            } 
          },
          pendingIssues: { 
            $sum: { 
              $cond: [{ $in: ['$status', ['pending', 'acknowledged']] }, 1, 0] 
            } 
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'resolved'] },
                    { $ne: ['$timeline.resolved', null] },
                    { $ne: ['$timeline.reported', null] }
                  ]
                },
                {
                  $divide: [
                    { $subtract: ['$timeline.resolved', '$timeline.reported'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          resolutionRate: {
            $cond: [
              { $gt: ['$totalIssues', 0] },
              { $multiply: [{ $divide: ['$resolvedIssues', '$totalIssues'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalIssues: -1 } }
    ]);

    // Priority distribution over time
    const priorityTrend = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            priority: '$priority',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Category performance metrics
    const categoryMetrics = await Issue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          totalIssues: { $sum: 1 },
          resolvedIssues: { 
            $sum: { 
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
            } 
          },
          urgentIssues: { 
            $sum: { 
              $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] 
            } 
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$status', 'resolved'] },
                    { $ne: ['$timeline.resolved', null] },
                    { $ne: ['$timeline.reported', null] }
                  ]
                },
                {
                  $divide: [
                    { $subtract: ['$timeline.resolved', '$timeline.reported'] },
                    1000 * 60 * 60 * 24
                  ]
                },
                null
              ]
            }
          }
        }
      },
      {
        $addFields: {
          resolutionRate: {
            $cond: [
              { $gt: ['$totalIssues', 0] },
              { $multiply: [{ $divide: ['$resolvedIssues', '$totalIssues'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalIssues: -1 } }
    ]);

    const statistics = {
      timeSeriesData,
      departmentPerformance,
      priorityTrend,
      categoryMetrics
    };

    res.status(200).json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Error getting issue statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const { departmentId, startDate, endDate } = req.query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    // Build main filter
    const filter: any = { ...dateFilter };
    if (departmentId) {
      filter.assignedDepartment = new mongoose.Types.ObjectId(departmentId as string);
    }

    // Resolution metrics
    const resolutionMetrics = await Issue.aggregate([
      { $match: filter },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                totalIssues: { $sum: 1 },
                resolvedIssues: { 
                  $sum: { 
                    $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
                  } 
                },
                pendingIssues: { 
                  $sum: { 
                    $cond: [{ $in: ['$status', ['pending', 'acknowledged']] }, 1, 0] 
                  } 
                },
                inProgressIssues: { 
                  $sum: { 
                    $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] 
                  } 
                },
                rejectedIssues: { 
                  $sum: { 
                    $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] 
                  } 
                }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                totalIssues: { $sum: 1 },
                resolvedIssues: { 
                  $sum: { 
                    $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] 
                  } 
                },
                avgResolutionTime: {
                  $avg: {
                    $cond: [
                      { 
                        $and: [
                          { $eq: ['$status', 'resolved'] },
                          { $ne: ['$timeline.resolved', null] },
                          { $ne: ['$timeline.reported', null] }
                        ]
                      },
                      {
                        $divide: [
                          { $subtract: ['$timeline.resolved', '$timeline.reported'] },
                          1000 * 60 * 60 * 24
                        ]
                      },
                      null
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    // Response time analysis
    const responseTimeMetrics = await Issue.aggregate([
      { 
        $match: {
          ...filter,
          'timeline.acknowledged': { $exists: true }
        }
      },
      {
        $project: {
          responseTime: {
            $divide: [
              { $subtract: ['$timeline.acknowledged', '$timeline.reported'] },
              1000 * 60 * 60 // Convert to hours
            ]
          },
          priority: 1,
          status: 1
        }
      },
      {
        $group: {
          _id: '$priority',
          avgResponseTime: { $avg: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          count: { $sum: 1 }
        }
      }
    ]);

    // User satisfaction metrics (based on feedback)
    const satisfactionMetrics = await Issue.aggregate([
      { 
        $match: {
          ...filter,
          'feedback.rating': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$feedback.rating' },
          totalFeedbacks: { $sum: 1 },
          ratingDistribution: {
            $push: '$feedback.rating'
          }
        }
      },
      {
        $addFields: {
          ratingBreakdown: {
            '5': { 
              $size: { 
                $filter: { 
                  input: '$ratingDistribution', 
                  cond: { $eq: ['$$this', 5] } 
                } 
              } 
            },
            '4': { 
              $size: { 
                $filter: { 
                  input: '$ratingDistribution', 
                  cond: { $eq: ['$$this', 4] } 
                } 
              } 
            },
            '3': { 
              $size: { 
                $filter: { 
                  input: '$ratingDistribution', 
                  cond: { $eq: ['$$this', 3] } 
                } 
              } 
            },
            '2': { 
              $size: { 
                $filter: { 
                  input: '$ratingDistribution', 
                  cond: { $eq: ['$$this', 2] } 
                } 
              } 
            },
            '1': { 
              $size: { 
                $filter: { 
                  input: '$ratingDistribution', 
                  cond: { $eq: ['$$this', 1] } 
                } 
              } 
            }
          }
        }
      }
    ]);

    // SLA compliance (Service Level Agreement)
    const slaMetrics = await Issue.aggregate([
      { $match: filter },
      {
        $addFields: {
          expectedResolutionDays: {
            $switch: {
              branches: [
                { case: { $eq: ['$priority', 'urgent'] }, then: 1 },
                { case: { $eq: ['$priority', 'high'] }, then: 3 },
                { case: { $eq: ['$priority', 'medium'] }, then: 7 },
                { case: { $eq: ['$priority', 'low'] }, then: 14 }
              ],
              default: 7
            }
          },
          actualResolutionDays: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$status', 'resolved'] },
                  { $ne: ['$timeline.resolved', null] },
                  { $ne: ['$timeline.reported', null] }
                ]
              },
              {
                $divide: [
                  { $subtract: ['$timeline.resolved', '$timeline.reported'] },
                  1000 * 60 * 60 * 24
                ]
              },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: '$priority',
          totalIssues: { $sum: 1 },
          resolvedInTime: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$actualResolutionDays', null] },
                    { $lte: ['$actualResolutionDays', '$expectedResolutionDays'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          resolvedLate: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$actualResolutionDays', null] },
                    { $gt: ['$actualResolutionDays', '$expectedResolutionDays'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          totalResolved: {
            $sum: {
              $cond: [
                { $ne: ['$actualResolutionDays', null] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          slaCompliance: {
            $cond: [
              { $gt: ['$totalResolved', 0] },
              { $multiply: [{ $divide: ['$resolvedInTime', '$totalResolved'] }, 100] },
              0
            ]
          }
        }
      }
    ]);

    const metrics = {
      resolution: resolutionMetrics[0],
      responseTime: responseTimeMetrics,
      satisfaction: satisfactionMetrics[0] || null,
      slaCompliance: slaMetrics
    };

    res.status(200).json({
      success: true,
      data: { metrics }
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Export data for reporting
 */
export const exportData = async (req: Request, res: Response) => {
  try {
    const { 
      format = 'json', 
      startDate, 
      endDate, 
      department, 
      category, 
      status,
      includeDetails = 'false'
    } = req.query;

    // Build filter
    const filter: any = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    if (department) {
      filter.assignedDepartment = department;
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    let data;
    if (includeDetails === 'true') {
      // Export detailed issue data
      data = await Issue.find(filter)
        .populate('reportedBy', 'firstName lastName email phone')
        .populate('assignedTo', 'firstName lastName email')
        .populate('assignedDepartment', 'name type')
        .select('-comments -upvotes')
        .sort({ createdAt: -1 });
    } else {
      // Export summary statistics
      data = await Issue.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              category: '$category',
              status: '$status',
              priority: '$priority'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': -1 } }
      ]);
    }

    // Set appropriate headers based on format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=civic_issues_export.csv');
      
      // Convert to CSV (simplified for this example)
      const csvData = data.map((item: any) => 
        Object.values(item).join(',')
      ).join('\n');
      
      res.send(csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=civic_issues_export.json');
      res.status(200).json({
        success: true,
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
        data
      });
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get trending issues
 */
export const getTrendingIssues = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const timeframe = req.query.timeframe as string || '7d'; // 7d, 30d, 90d

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const trendingIssues = await Issue.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          visibility: 'public',
          status: { $in: ['pending', 'acknowledged', 'in_progress'] }
        }
      },
      {
        $addFields: {
          upvoteCount: { $size: { $ifNull: ['$upvotes', []] } },
          commentCount: { $size: { $ifNull: ['$comments', []] } },
          daysSinceCreated: {
            $divide: [
              { $subtract: [now, '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $add: [
              { $multiply: ['$upvoteCount', 3] },
              { $multiply: ['$commentCount', 2] },
              { $cond: [{ $eq: ['$priority', 'urgent'] }, 10, 0] },
              { $cond: [{ $eq: ['$priority', 'high'] }, 5, 0] },
              { $divide: [10, { $add: ['$daysSinceCreated', 1] }] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'reportedBy',
          foreignField: '_id',
          as: 'reportedBy'
        }
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'assignedDepartment',
          foreignField: '_id',
          as: 'assignedDepartment'
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          priority: 1,
          status: 1,
          location: 1,
          upvoteCount: 1,
          commentCount: 1,
          trendingScore: 1,
          createdAt: 1,
          'reportedBy.firstName': 1,
          'reportedBy.lastName': 1,
          'assignedDepartment.name': 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { 
        trendingIssues,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting trending issues:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
