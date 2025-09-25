const { Department } = require('../models/Department');

/**
 * Requires general auth (authenticateToken) to have run before this middleware.
 * Ensures the user is a department account and attaches req.user.departmentId.
 */
module.exports = async function ensureDepartment(req, res, next) {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role !== 'department') {
      return res.status(403).json({ success: false, message: 'Department access only' });
    }
    if (!req.user.departmentId) {
      const dep = await Department.findOne({ accountUser: req.user._id }).select('_id').lean();
      if (!dep?._id) {
        return res.status(403).json({ success: false, message: 'Department not found for this account' });
      }
      req.user.departmentId = dep._id;
    }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};