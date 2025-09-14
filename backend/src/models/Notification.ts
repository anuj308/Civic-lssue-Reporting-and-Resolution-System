import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  recipient: mongoose.Types.ObjectId;
  type: 'issue_created' | 'issue_assigned' | 'issue_updated' | 'issue_resolved' | 'comment_added' | 'system_announcement' | 'reminder';
  title: string;
  message: string;
  relatedIssue?: mongoose.Types.ObjectId;
  relatedDepartment?: mongoose.Types.ObjectId;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('app' | 'email' | 'sms' | 'push')[];
  scheduledFor?: Date;
  expiresAt?: Date;
  isSystemWide: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  type: {
    type: String,
    enum: {
      values: ['issue_created', 'issue_assigned', 'issue_updated', 'issue_resolved', 'comment_added', 'system_announcement', 'reminder'],
      message: 'Invalid notification type'
    },
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  relatedIssue: {
    type: Schema.Types.ObjectId,
    ref: 'Issue'
  },
  relatedDepartment: {
    type: Schema.Types.ObjectId,
    ref: 'Department'
  },
  data: {
    type: Schema.Types.Mixed
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Invalid priority level'
    },
    default: 'medium'
  },
  channels: [{
    type: String,
    enum: ['app', 'email', 'sms', 'push']
  }],
  scheduledFor: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  isSystemWide: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ relatedIssue: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ isSystemWide: 1, createdAt: -1 });

// Virtual for time since created
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Static method to create notification for issue events
NotificationSchema.statics.createIssueNotification = async function(
  type: string,
  issue: any,
  recipient: string,
  additionalData?: any
) {
  const notificationData: any = {
    recipient,
    type,
    relatedIssue: issue._id,
    relatedDepartment: issue.assignedDepartment,
    channels: ['app', 'email'],
    createdBy: issue.reportedBy,
    priority: issue.priority === 'urgent' ? 'high' : 'medium'
  };

  switch (type) {
    case 'issue_created':
      notificationData.title = 'New Issue Reported';
      notificationData.message = `A new ${issue.category} issue has been reported: ${issue.title}`;
      break;
    case 'issue_assigned':
      notificationData.title = 'Issue Assigned to You';
      notificationData.message = `You have been assigned to handle: ${issue.title}`;
      break;
    case 'issue_updated':
      notificationData.title = 'Issue Status Updated';
      notificationData.message = `Issue "${issue.title}" status changed to ${issue.status}`;
      break;
    case 'issue_resolved':
      notificationData.title = 'Issue Resolved';
      notificationData.message = `Your reported issue "${issue.title}" has been resolved`;
      break;
    case 'comment_added':
      notificationData.title = 'New Comment on Issue';
      notificationData.message = `A new comment was added to issue: ${issue.title}`;
      break;
  }

  if (additionalData) {
    notificationData.data = additionalData;
  }

  return this.create(notificationData);
};

// Static method to mark notifications as read
NotificationSchema.statics.markAsRead = async function(notificationIds: string[], userId: string) {
  return this.updateMany(
    { _id: { $in: notificationIds }, recipient: userId },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId: string) {
  return this.countDocuments({ recipient: userId, isRead: false });
};

export default mongoose.model<INotification>('Notification', NotificationSchema);
