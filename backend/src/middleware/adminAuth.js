const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');

const ACCESS_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

module.exports = async function adminAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Missing token' });

    const decoded = jwt.verify(token, ACCESS_SECRET);
    if (decoded.typ !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not an admin token' });
    }

    const admin = await Admin.findById(decoded.sub).lean();
    if (!admin) return res.status(401).json({ success: false, message: 'Admin not found' });
    if (admin.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    // Attach minimal admin context
    req.admin = {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      status: admin.status,
    };
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};