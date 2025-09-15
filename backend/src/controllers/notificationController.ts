import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { Issue } from '../models/Issue';

/**
 * Get user notifications with pagination
 */
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isRead = req.query.isRead as string;
    const type = req.query.type as string;
    const userId = req.user?.id;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { recipient: userId };
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }

    if (type) {
      filter.type = type;
    }

    const notifications = await Notification.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('relatedIssue', 'title category status')
      .populate('relatedDepartment', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      isRead: false 
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting user notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Mark notifications as read
 */
export const markNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { notificationIds } = req.body;
    const userId = req.user?.id;

    // Validate notification IDs
    const validIds = notificationIds.filter((id: string) => 
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid notification IDs provided'
      });
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: validIds }, 
        recipient: userId,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { markedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const result = await Notification.updateMany(
      { 
        recipient: userId,
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: { markedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get notification statistics
 */
export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const stats = await Notification.aggregate([
      { $match: { recipient: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 },
                unread: {
                  $sum: {
                    $cond: [{ $eq: ['$isRead', false] }, 1, 0]
                  }
                }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 },
                unread: {
                  $sum: {
                    $cond: [{ $eq: ['$isRead', false] }, 1, 0]
                  }
                }
              }
            }
          ],
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                unread: {
                  $sum: {
                    $cond: [{ $eq: ['$isRead', false] }, 1, 0]
                  }
                },
                read: {
                  $sum: {
                    $cond: [{ $eq: ['$isRead', true] }, 1, 0]
                  }
                }
              }
            }
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy'
              }
            },
            {
              $project: {
                title: 1,
                type: 1,
                isRead: 1,
                createdAt: 1,
                'createdBy.firstName': 1,
                'createdBy.lastName': 1
              }
            }
          ]
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: { 
        statistics: stats[0] 
      }
    });
  } catch (error) {
    console.error('Error getting notification statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create system announcement (Admin only)
 */
export const createSystemAnnouncement = async (req: AuthRequest, res: Response) => {
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
      title,
      message,
      priority,
      channels,
      targetRoles,
      targetDepartments,
      scheduledFor,
      expiresAt
    } = req.body;

    const createdBy = req.user?.id;

    // Build recipient filter
    const recipientFilter: any = {};
    
    if (targetRoles && targetRoles.length > 0) {
      recipientFilter.role = { $in: targetRoles };
    }

    if (targetDepartments && targetDepartments.length > 0) {
      recipientFilter.department = { $in: targetDepartments };
    }

    // Get target users
    const targetUsers = await User.find(recipientFilter).select('_id');

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users found matching the target criteria'
      });
    }

    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      recipient: user._id,
      type: 'system_announcement',
      title,
      message,
      priority: priority || 'medium',
      channels: channels || ['app'],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isSystemWide: true,
      createdBy
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `System announcement sent to ${createdNotifications.length} users`,
      data: { 
        sentCount: createdNotifications.length,
        targetUsers: targetUsers.length
      }
    });
  } catch (error) {
    console.error('Error creating system announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create custom notification (Admin/Department Head only)
 */
export const createCustomNotification = async (req: AuthRequest, res: Response) => {
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
      recipients,
      title,
      message,
      type,
      priority,
      channels,
      relatedIssue,
      relatedDepartment,
      data,
      scheduledFor,
      expiresAt
    } = req.body;

    const createdBy = req.user?.id;

    // Validate recipients
    const validRecipients = recipients.filter((id: string) => 
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid recipient IDs provided'
      });
    }

    // Verify recipients exist
    const existingUsers = await User.find({ 
      _id: { $in: validRecipients } 
    }).select('_id');

    if (existingUsers.length !== validRecipients.length) {
      return res.status(400).json({
        success: false,
        message: 'Some recipient users not found'
      });
    }

    // Create notifications
    const notifications = validRecipients.map((recipient: string) => ({
      recipient,
      type: type || 'system_announcement',
      title,
      message,
      priority: priority || 'medium',
      channels: channels || ['app'],
      relatedIssue: relatedIssue || undefined,
      relatedDepartment: relatedDepartment || undefined,
      data: data || undefined,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      message: `Custom notification sent to ${createdNotifications.length} users`,
      data: { 
        sentCount: createdNotifications.length 
      }
    });
  } catch (error) {
    console.error('Error creating custom notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get system announcements (Admin only)
 */
export const getSystemAnnouncements = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const announcements = await Notification.find({ 
      isSystemWide: true 
    })
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Notification.countDocuments({ isSystemWide: true });
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: page,
          totalPages,
          totalAnnouncements: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting system announcements:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete system announcement (Admin only)
 */
export const deleteSystemAnnouncement = async (req: Request, res: Response) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid announcement ID'
      });
    }

    const result = await Notification.deleteMany({
      _id: announcementId,
      isSystemWide: true
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'System announcement not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'System announcement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting system announcement:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
