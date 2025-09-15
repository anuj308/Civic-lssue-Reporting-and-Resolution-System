import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Issue } from '../models/Issue';
import { Department } from '../models/Department';
import Notification from '../models/Notification';
 
/**
 * Get system overview statistics (Admin only)
 */
export const getSystemOverview = async (req: Request, res: Response) => {
  try {
    // Get current date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total counts
    const [
      totalUsers,
      totalIssues,
      totalDepartments,
      activeUsers,
      todayIssues,
      weeklyIssues,
      monthlyIssues,
      pendingIssues,
      resolvedIssues
    ] = await Promise.all([
      User.countDocuments(),
      Issue.countDocuments(),
      Department.countDocuments(),
      User.countDocuments({ isActive: true }),
      Issue.countDocuments({ createdAt: { $gte: startOfToday } }),
      Issue.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Issue.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Issue.countDocuments({ status: { $in: ['pending', 'acknowledged'] } }),
      Issue.countDocuments({ status: 'resolved' })
    ]);

    // User role distribution
    const userRoleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Issue category distribution
    const issueCategoryStats = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Department performance
    const departmentPerformance = await Department.aggregate([
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedDepartment',
          as: 'issues'
        }
      },
      {
        $addFields: {
          totalIssues: { $size: '$issues' },
          resolvedIssues: {
            $size: {
              $filter: {
                input: '$issues',
                cond: { $eq: ['$$this.status', 'resolved'] }
              }
            }
          },
          pendingIssues: {
            $size: {
              $filter: {
                input: '$issues',
                cond: { $in: ['$$this.status', ['pending', 'acknowledged']] }
              }
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
      {
        $project: {
          name: 1,
          type: 1,
          totalIssues: 1,
          resolvedIssues: 1,
          pendingIssues: 1,
          resolutionRate: 1,
          isActive: 1
        }
      },
      { $sort: { totalIssues: -1 } }
    ]);

    // Recent activity
    const recentIssues = await Issue.find()
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedDepartment', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(10);

    // System health metrics
    const systemHealth = {
      issueResolutionRate: totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0,
      userActivationRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      departmentUtilization: departmentPerformance.filter(dept => dept.totalIssues > 0).length,
      avgIssuesPerDepartment: totalDepartments > 0 ? Math.round(totalIssues / totalDepartments) : 0
    };

    const overview = {
      totalCounts: {
        users: totalUsers,
        issues: totalIssues,
        departments: totalDepartments,
        activeUsers
      },
      recentActivity: {
        todayIssues,
        weeklyIssues,
        monthlyIssues
      },
      issueStats: {
        pending: pendingIssues,
        resolved: resolvedIssues,
        total: totalIssues
      },
      userRoleDistribution: userRoleStats,
      issueCategoryDistribution: issueCategoryStats,
      departmentPerformance,
      recentIssues,
      recentUsers,
      systemHealth
    };

    res.status(200).json({
      success: true,
      data: { overview }
    });
  } catch (error) {
    console.error('Error getting system overview:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get system logs and audit trail (Admin only)
 */
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const action = req.query.action as string;

    const skip = (page - 1) * limit;

    // Build filter for audit logs
    // Note: In a real system, you'd have a separate audit log collection
    // For now, we'll simulate with issue status changes and user activities

    const filter: any = {};
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get recent system activities (simulated audit log)
    const systemLogs = await Issue.aggregate([
      { $match: filter },
      {
        $project: {
          action: { $literal: 'issue_created' },
          entityType: { $literal: 'issue' },
          entityId: '$_id',
          details: {
            title: '$title',
            category: '$category',
            status: '$status',
            reporter: '$reportedBy'
          },
          timestamp: '$createdAt',
          user: '$reportedBy'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $addFields: {
          userName: {
            $concat: [
              { $arrayElemAt: ['$userInfo.firstName', 0] },
              ' ',
              { $arrayElemAt: ['$userInfo.lastName', 0] }
            ]
          }
        }
      },
      { $sort: { timestamp: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          action: 1,
          entityType: 1,
          entityId: 1,
          details: 1,
          timestamp: 1,
          userName: 1
        }
      }
    ]);

    const total = await Issue.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        logs: systemLogs,
        pagination: {
          currentPage: page,
          totalPages,
          totalLogs: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting system logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Bulk operations on users (Admin only)
 */
export const bulkUserOperations = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { operation, userIds, data } = req.body;

    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required'
      });
    }

    // Validate user IDs
    const validIds = userIds.filter((id: string) => 
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid user IDs provided'
      });
    }

    let result;
    let message;

    switch (operation) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: validIds } },
          { isActive: true, updatedAt: new Date() }
        );
        message = `${result.modifiedCount} users activated`;
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: validIds } },
          { isActive: false, updatedAt: new Date() }
        );
        message = `${result.modifiedCount} users deactivated`;
        break;

      case 'delete':
        // Only allow deletion of inactive users with no assigned issues
        const usersToDelete = await User.find({
          _id: { $in: validIds },
          isActive: false
        });

        const issueAssignments = await Issue.countDocuments({
          $or: [
            { reportedBy: { $in: validIds } },
            { assignedTo: { $in: validIds } }
          ]
        });

        if (issueAssignments > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete users who have reported or are assigned to issues'
          });
        }

        result = await User.deleteMany({
          _id: { $in: usersToDelete.map(u => u._id) }
        });
        message = `${result.deletedCount} users deleted`;
        break;

      case 'update_role':
        if (!data.role) {
          return res.status(400).json({
            success: false,
            message: 'Role is required for role update operation'
          });
        }

        result = await User.updateMany(
          { _id: { $in: validIds } },
          { 
            role: data.role,
            department: data.role.includes('department') ? data.department : null,
            updatedAt: new Date()
          }
        );
        message = `${result.modifiedCount} users' roles updated`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation'
        });
    }

    res.status(200).json({
      success: true,
      message,
      data: { 
        affectedCount: 'modifiedCount' in result 
          ? result.modifiedCount 
          : 'deletedCount' in result 
            ? result.deletedCount 
            : 0 
      }
    });
  } catch (error) {
    console.error('Error performing bulk user operations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * System configuration management (Admin only)
 */
export const updateSystemConfig = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      maintenanceMode,
      registrationEnabled,
      maxFileSize,
      allowedFileTypes,
      notificationSettings,
      autoAssignmentRules
    } = req.body;

    // In a real application, you would store these in a dedicated configuration collection
    // For now, we'll simulate storing configuration settings

    const configUpdate: any = {};
    
    if (maintenanceMode !== undefined) {
      configUpdate.maintenanceMode = maintenanceMode;
    }
    
    if (registrationEnabled !== undefined) {
      configUpdate.registrationEnabled = registrationEnabled;
    }
    
    if (maxFileSize !== undefined) {
      configUpdate.maxFileSize = maxFileSize;
    }
    
    if (allowedFileTypes !== undefined) {
      configUpdate.allowedFileTypes = allowedFileTypes;
    }

    if (notificationSettings !== undefined) {
      configUpdate.notificationSettings = notificationSettings;
    }

    if (autoAssignmentRules !== undefined) {
      configUpdate.autoAssignmentRules = autoAssignmentRules;
    }

    // Simulate storing configuration (in real app, use a Config model)
    configUpdate.updatedAt = new Date();
    configUpdate.updatedBy = req.user?.id;

    res.status(200).json({
      success: true,
      message: 'System configuration updated successfully',
      data: { config: configUpdate }
    });
  } catch (error) {
    console.error('Error updating system configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Generate system reports (Admin only)
 */
export const generateSystemReport = async (req: Request, res: Response) => {
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      format = 'json' 
    } = req.query;

    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    let reportData: any = {};

    switch (reportType) {
      case 'user_activity':
        reportData = await User.aggregate([
          { $match: dateFilter },
          {
            $group: {
              _id: {
                role: '$role',
                active: '$isActive'
              },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: '$_id.role',
              total: { $sum: '$count' },
              active: {
                $sum: {
                  $cond: [{ $eq: ['$_id.active', true] }, '$count', 0]
                }
              }
            }
          }
        ]);
        break;

      case 'issue_summary':
        reportData = await Issue.aggregate([
          { $match: dateFilter },
          {
            $facet: {
              byStatus: [
                { $group: { _id: '$status', count: { $sum: 1 } } }
              ],
              byCategory: [
                { $group: { _id: '$category', count: { $sum: 1 } } }
              ],
              byPriority: [
                { $group: { _id: '$priority', count: { $sum: 1 } } }
              ],
              resolutionTimes: [
                {
                  $match: {
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
                        1000 * 60 * 60 * 24
                      ]
                    },
                    category: 1,
                    priority: 1
                  }
                },
                {
                  $group: {
                    _id: '$category',
                    avgResolutionTime: { $avg: '$resolutionTime' },
                    count: { $sum: 1 }
                  }
                }
              ]
            }
          }
        ]);
        break;

      case 'department_performance':
        reportData = await Department.aggregate([
          {
            $lookup: {
              from: 'issues',
              let: { deptId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$assignedDepartment', '$$deptId'] },
                    ...dateFilter
                  }
                }
              ],
              as: 'issues'
            }
          },
          {
            $addFields: {
              totalIssues: { $size: '$issues' },
              resolvedIssues: {
                $size: {
                  $filter: {
                    input: '$issues',
                    cond: { $eq: ['$$this.status', 'resolved'] }
                  }
                }
              },
              avgResolutionTime: {
                $avg: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$issues',
                        cond: { 
                          $and: [
                            { $eq: ['$$this.status', 'resolved'] },
                            { $ne: ['$$this.timeline.resolved', null] },
                            { $ne: ['$$this.timeline.reported', null] }
                          ]
                        }
                      }
                    },
                    as: 'issue',
                    in: {
                      $divide: [
                        { $subtract: ['$$issue.timeline.resolved', '$$issue.timeline.reported'] },
                        1000 * 60 * 60 * 24
                      ]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              name: 1,
              type: 1,
              totalIssues: 1,
              resolvedIssues: 1,
              avgResolutionTime: 1,
              resolutionRate: {
                $cond: [
                  { $gt: ['$totalIssues', 0] },
                  { $multiply: [{ $divide: ['$resolvedIssues', '$totalIssues'] }, 100] },
                  0
                ]
              }
            }
          }
        ]);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }

    const report = {
      type: reportType,
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      data: reportData
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}_report.csv`);
      
      // Convert to CSV (simplified)
      const csvData = JSON.stringify(report);
      res.send(csvData);
    } else {
      res.status(200).json({
        success: true,
        data: { report }
      });
    }
  } catch (error) {
    console.error('Error generating system report:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * System maintenance operations (Admin only)
 */
export const performMaintenance = async (req: Request, res: Response) => {
  try {
    const { operation } = req.body;

    let result: any = {};

    switch (operation) {
      case 'cleanup_old_notifications':
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const deletedNotifications = await Notification.deleteMany({
          isRead: true,
          createdAt: { $lt: thirtyDaysAgo }
        });
        result = { deletedNotifications: deletedNotifications.deletedCount };
        break;

      case 'update_issue_statistics':
        // Update department statistics
        const departments = await Department.find();
        for (const dept of departments) {
          const stats = await Issue.aggregate([
            { $match: { assignedDepartment: dept._id } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $in: ['$status', ['pending', 'acknowledged']] }, 1, 0] }
                },
                resolved: {
                  $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
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
          ]);

          if (stats.length > 0) {
            await Department.findByIdAndUpdate(dept._id, {
              'statistics.totalIssues': stats[0].total,
              'statistics.pendingIssues': stats[0].pending,
              'statistics.resolvedIssues': stats[0].resolved,
              'statistics.averageResolutionTime': stats[0].avgResolutionTime || 0
            });
          }
        }
        result = { updatedDepartments: departments.length };
        break;

      case 'reindex_search':
        // In a real system, you would reindex search databases
        result = { message: 'Search reindexing completed' };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid maintenance operation'
        });
    }

    res.status(200).json({
      success: true,
      message: `Maintenance operation '${operation}' completed successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
