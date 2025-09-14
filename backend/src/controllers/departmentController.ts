import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Department from '../models/Department';
import User from '../models/User';
import Issue from '../models/Issue';
import { AuthRequest } from '../middleware/auth';

/**
 * Create a new department (Admin only)
 */
export const createDepartment = async (req: AuthRequest, res: Response) => {
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
      name,
      type,
      description,
      head,
      contactInfo,
      categories,
      isActive
    } = req.body;

    // Check if department name already exists
    const existingDepartment = await Department.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        message: 'Department with this name already exists'
      });
    }

    // Verify head exists and is eligible
    if (head) {
      const headUser = await User.findById(head);
      if (!headUser) {
        return res.status(400).json({
          success: false,
          message: 'Department head user not found'
        });
      }

      if (headUser.role !== 'department_head' && headUser.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not eligible to be department head'
        });
      }
    }

    const department = new Department({
      name,
      type,
      description,
      head,
      contactInfo,
      categories: categories || [],
      isActive: isActive !== undefined ? isActive : true,
      staff: [],
      statistics: {
        totalIssues: 0,
        pendingIssues: 0,
        resolvedIssues: 0,
        averageResolutionTime: 0
      }
    });

    await department.save();

    // Update head user's department if specified
    if (head) {
      await User.findByIdAndUpdate(head, { department: department._id });
    }

    const populatedDepartment = await Department.findById(department._id)
      .populate('head', 'firstName lastName email')
      .populate('staff', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: { department: populatedDepartment }
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all departments
 */
export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const type = req.query.type as string || '';
    const isActive = req.query.isActive as string;

    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const departments = await Department.find(filter)
      .populate('head', 'firstName lastName email phone')
      .populate('staff', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Department.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        departments,
        pagination: {
          currentPage: page,
          totalPages,
          totalDepartments: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error getting all departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(departmentId)
      .populate('head', 'firstName lastName email phone')
      .populate('staff', 'firstName lastName email role phone');

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get recent issues for this department
    const recentIssues = await Issue.find({ 
      assignedDepartment: departmentId 
    })
    .populate('reportedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      data: { 
        department,
        recentIssues
      }
    });
  } catch (error) {
    console.error('Error getting department by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update department (Admin/Department Head only)
 */
export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { departmentId } = req.params;
    const {
      name,
      type,
      description,
      head,
      contactInfo,
      categories,
      isActive
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if name already exists (exclude current department)
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: departmentId }
      });

      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          message: 'Department with this name already exists'
        });
      }
    }

    // Verify new head if specified
    if (head && head !== department.head?.toString()) {
      const headUser = await User.findById(head);
      if (!headUser) {
        return res.status(400).json({
          success: false,
          message: 'Department head user not found'
        });
      }

      if (headUser.role !== 'department_head' && headUser.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not eligible to be department head'
        });
      }

      // Update old head's department reference
      if (department.head) {
        await User.findByIdAndUpdate(department.head, { department: null });
      }

      // Update new head's department reference
      await User.findByIdAndUpdate(head, { department: departmentId });
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (description) updateData.description = description;
    if (head) updateData.head = head;
    if (contactInfo) updateData.contactInfo = contactInfo;
    if (categories) updateData.categories = categories;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedDepartment = await Department.findByIdAndUpdate(
      departmentId,
      updateData,
      { new: true }
    )
    .populate('head', 'firstName lastName email')
    .populate('staff', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: { department: updatedDepartment }
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Add staff to department (Admin/Department Head only)
 */
export const addStaff = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { departmentId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(departmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department or user ID'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is eligible
    if (user.role !== 'department_staff' && user.role !== 'department_head') {
      return res.status(400).json({
        success: false,
        message: 'User is not eligible to be department staff'
      });
    }

    // Check if user is already in this department
    if (department.staff.includes(userId as any)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a staff member of this department'
      });
    }

    // Add user to department staff
    department.staff.push(userId as any);
    await department.save();

    // Update user's department reference
    await User.findByIdAndUpdate(userId, { department: departmentId });

    const populatedDepartment = await Department.findById(departmentId)
      .populate('head', 'firstName lastName email')
      .populate('staff', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Staff member added successfully',
      data: { department: populatedDepartment }
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Remove staff from department (Admin/Department Head only)
 */
export const removeStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department or user ID'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if user is in department staff
    const staffIndex = department.staff.findIndex(id => id.toString() === userId);
    if (staffIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'User is not a staff member of this department'
      });
    }

    // Remove user from department staff
    department.staff.splice(staffIndex, 1);
    await department.save();

    // Update user's department reference
    await User.findByIdAndUpdate(userId, { department: null });

    const populatedDepartment = await Department.findById(departmentId)
      .populate('head', 'firstName lastName email')
      .populate('staff', 'firstName lastName email role');

    res.status(200).json({
      success: true,
      message: 'Staff member removed successfully',
      data: { department: populatedDepartment }
    });
  } catch (error) {
    console.error('Error removing staff:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get department statistics
 */
export const getDepartmentStatistics = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Get issue statistics
    const totalIssues = await Issue.countDocuments({ assignedDepartment: departmentId });
    const pendingIssues = await Issue.countDocuments({ 
      assignedDepartment: departmentId, 
      status: { $in: ['pending', 'acknowledged'] }
    });
    const inProgressIssues = await Issue.countDocuments({ 
      assignedDepartment: departmentId, 
      status: 'in_progress' 
    });
    const resolvedIssues = await Issue.countDocuments({ 
      assignedDepartment: departmentId, 
      status: 'resolved' 
    });

    // Calculate average resolution time
    const resolvedIssuesWithTime = await Issue.find({
      assignedDepartment: departmentId,
      status: 'resolved',
      'timeline.resolved': { $exists: true },
      'timeline.reported': { $exists: true }
    });

    let averageResolutionTime = 0;
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce((sum, issue) => {
        const resolutionTime = new Date(issue.timeline.resolved!).getTime() - 
                              new Date(issue.timeline.reported).getTime();
        return sum + resolutionTime;
      }, 0);
      averageResolutionTime = totalResolutionTime / resolvedIssuesWithTime.length / (1000 * 60 * 60 * 24); // in days
    }

    // Get category-wise breakdown
    const categoryStats = await Issue.aggregate([
      { $match: { assignedDepartment: new mongoose.Types.ObjectId(departmentId) } },
      { $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'acknowledged']] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      }
    ]);

    // Update department statistics
    await Department.findByIdAndUpdate(departmentId, {
      'statistics.totalIssues': totalIssues,
      'statistics.pendingIssues': pendingIssues,
      'statistics.resolvedIssues': resolvedIssues,
      'statistics.averageResolutionTime': averageResolutionTime
    });

    const statistics = {
      totalIssues,
      pendingIssues,
      inProgressIssues,
      resolvedIssues,
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100, // Round to 2 decimal places
      categoryBreakdown: categoryStats
    };

    res.status(200).json({
      success: true,
      data: { statistics }
    });
  } catch (error) {
    console.error('Error getting department statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get department issues
 */
export const getDepartmentIssues = async (req: AuthRequest, res: Response) => {
  try {
    const { departmentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const skip = (page - 1) * limit;

    const filter: any = { assignedDepartment: departmentId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
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
    console.error('Error getting department issues:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete department (Admin only)
 */
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department ID'
      });
    }

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check if department has assigned issues
    const assignedIssues = await Issue.countDocuments({ assignedDepartment: departmentId });
    if (assignedIssues > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete department with assigned issues'
      });
    }

    // Update users who belong to this department
    await User.updateMany(
      { department: departmentId },
      { $unset: { department: 1 } }
    );

    await Department.findByIdAndDelete(departmentId);

    res.status(200).json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
