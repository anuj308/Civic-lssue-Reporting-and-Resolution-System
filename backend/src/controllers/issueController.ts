import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Issue } from '../models/Issue';
import { User } from '../models/User';
import { Department } from '../models/Department';

/**
 * Create a new issue
 */
export const createIssue = async (req: Request, res: Response) => {
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
      description,
      category,
      subcategory,
      priority,
      location,
      media,
      isAnonymous
    } = req.body;

    const reportedBy = req.user?.id;
    const user = await User.findById(reportedBy);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const issue = new Issue({
      title,
      description,
      category,
      subcategory,
      priority,
      reportedBy,
      location,
      media,
      timeline: {
        reported: new Date()
      },
      isAnonymous: isAnonymous || false,
      visibility: req.body.visibility || 'public',
      upvotes: [],
      comments: []
    });

    await issue.save();

    // Populate the issue with user details
    const populatedIssue = await Issue.findById(issue._id)
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedDepartment', 'name type');

    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: { issue: populatedIssue }
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all issues with filtering and pagination
 */
export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';
    const location = req.query.location as string;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { visibility: 'public' };

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    if (location) {
      filter['location.city'] = { $regex: location, $options: 'i' };
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedDepartment', 'name type')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Issue.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          currentPage: page,
          totalPages,
          totalIssues: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting all issues:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get issue by ID
 */
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { issueId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const issue = await Issue.findById(issueId)
      .populate('reportedBy', 'firstName lastName email phone')
      .populate('assignedTo', 'firstName lastName email')
      .populate('assignedDepartment', 'name type description')
      .populate('comments.user', 'firstName lastName');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { issue }
    });
  } catch (error) {
    console.error('Error getting issue by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update issue status (Department/Admin only)
 */
export const updateIssueStatus = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { issueId } = req.params;
    const { status, comment, estimatedResolution } = req.body;
    const updatedBy = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Update timeline based on status
    if (status === 'acknowledged') {
      updateData['timeline.acknowledged'] = new Date();
    } else if (status === 'in_progress') {
      updateData['timeline.started'] = new Date();
    } else if (status === 'resolved') {
      updateData['timeline.resolved'] = new Date();
      updateData.actualResolution = new Date();
    } else if (status === 'closed') {
      updateData['timeline.closed'] = new Date();
    }

    if (estimatedResolution) {
      updateData.estimatedResolution = new Date(estimatedResolution);
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      updateData,
      { new: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('assignedDepartment', 'name type');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Add comment if provided
    if (comment) {
      issue.comments = issue.comments || [];
      issue.comments.push({
        user: updatedBy,
        message: comment,
        timestamp: new Date(),
        isOfficial: true
      } as any);
      await issue.save();
    }

    res.status(200).json({
      success: true,
      message: 'Issue status updated successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Assign issue to department/officer
 */
export const assignIssue = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { issueId } = req.params;
    const { assignedDepartment, assignedTo } = req.body;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (assignedDepartment) {
      updateData.assignedDepartment = assignedDepartment;
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    const issue = await Issue.findByIdAndUpdate(
      issueId,
      updateData,
      { new: true }
    ).populate('reportedBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email')
     .populate('assignedDepartment', 'name type');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Issue assigned successfully',
      data: { issue }
    });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add comment to issue
 */
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { issueId } = req.params;
    const { message, isOfficial } = req.body;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    issue.comments = issue.comments || [];
    issue.comments.push({
      user: userId,
      message,
      timestamp: new Date(),
      isOfficial: isOfficial || false
    } as any);

    await issue.save();

    const populatedIssue = await Issue.findById(issueId)
      .populate('comments.user', 'firstName lastName')
      .select('comments');

    res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      data: { 
        comments: populatedIssue?.comments 
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Upvote/Downvote issue
 */
export const toggleUpvote = async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    issue.upvotes = issue.upvotes || [];
    const userIndex = issue.upvotes.findIndex(id => id.toString() === userId);

    let message: string;
    if (userIndex > -1) {
      // Remove upvote
      issue.upvotes.splice(userIndex, 1);
      message = 'Upvote removed';
    } else {
      // Add upvote
      issue.upvotes.push(userId as any);
      message = 'Issue upvoted';
    }

    await issue.save();

    res.status(200).json({
      success: true,
      message,
      data: { 
        upvoteCount: issue.upvotes.length,
        isUpvoted: userIndex === -1
      }
    });
  } catch (error) {
    console.error('Error toggling upvote:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's reported issues
 */
export const getUserIssues = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const userId = req.user?.id;

    const skip = (page - 1) * limit;

    const filter: any = { reportedBy: userId };
    if (status) {
      filter.status = status;
    }

    const issues = await Issue.find(filter)
      .populate('assignedTo', 'firstName lastName')
      .populate('assignedDepartment', 'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Issue.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          currentPage: page,
          totalPages,
          totalIssues: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting user issues:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Submit feedback for resolved issue
 */
export const submitFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { issueId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check if user is the reporter
    if (issue.reportedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the issue reporter can submit feedback'
      });
    }

    // Check if issue is resolved
    if (issue.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted for resolved issues'
      });
    }

    issue.feedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await issue.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { feedback: issue.feedback }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get issues by location
 */
export const getIssuesByLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const radiusInKm = parseFloat(radius as string) || 5;

    const issues = await Issue.find({
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[parseFloat(longitude as string), parseFloat(latitude as string)], radiusInKm / 6371]
        }
      },
      visibility: 'public'
    })
    .populate('reportedBy', 'firstName lastName')
    .populate('assignedDepartment', 'name type')
    .sort({ createdAt: -1 })
    .limit(50);

    res.status(200).json({
      success: true,
      data: { issues }
    });
  } catch (error) {
    console.error('Error getting issues by location:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete issue (Admin/Reporter only)
 */
export const deleteIssue = async (req: AuthRequest, res: Response) => {
  try {
    const { issueId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid issue ID'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check permissions
    if (userRole !== 'admin' && issue.reportedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own issues'
      });
    }

    await Issue.findByIdAndDelete(issueId);

    res.status(200).json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
