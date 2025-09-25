const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Admin = require('../models/admin');

const ACCESS_EXPIRES_IN = process.env.ADMIN_JWT_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.ADMIN_REFRESH_EXPIRES_IN || '7d';
// Prefer admin-specific secrets, else fall back to app secrets you already have
const ACCESS_SECRET =
  process.env.ADMIN_JWT_SECRET || process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET =
  process.env.ADMIN_REFRESH_JWT_SECRET || process.env.JWT_REFRESH_SECRET || ACCESS_SECRET;

function signToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

function generateTokens(admin) {
  const base = { sub: admin._id.toString(), role: admin.role || 'admin', typ: 'admin' };
  const accessToken = signToken(base, ACCESS_SECRET, ACCESS_EXPIRES_IN);
  const refreshToken = signToken({ ...base, tok: 'refresh' }, REFRESH_SECRET, REFRESH_EXPIRES_IN);
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('admin_refresh_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/api/admin/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
}

exports.signup = async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const { name, email, username, password } = req.body;

    const existing = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username?.toLowerCase() }],
    }).lean();

    if (existing) {
      return res.status(409).json({ success: false, message: 'Email or username already in use' });
    }

    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      username: username?.toLowerCase(),
      password,
      role: 'admin',
      status: 'active',
      audit: { createdBy: null },
    });
    await admin.save();

    const { accessToken, refreshToken } = generateTokens(admin);
    setRefreshCookie(res, refreshToken);

    const safe = admin.toJSON();
    return res.status(201).json({
      success: true,
      message: 'Admin account created',
      data: { admin: safe, accessToken },
    });
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const err = handleValidation(req, res);
    if (err) return;

    const { identifier, password } = req.body;
    const id = identifier.toLowerCase();

    const admin = await Admin.findOne({
      $or: [{ email: id }, { username: id }],
    }).select('+password');

    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (admin.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Account suspended' });
    }

    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    admin.lastLoginAt = new Date();
    admin.lastLoginIp = req.ip;
    await admin.save();

    const { accessToken, refreshToken } = generateTokens(admin);
    setRefreshCookie(res, refreshToken);

    const safe = admin.toObject();
    delete safe.password;

    return res.json({
      success: true,
      message: 'Login successful',
      data: { admin: safe, accessToken },
    });
  } catch (e) {
    next(e);
  }
};

exports.me = async (req, res) => {
  return res.json({ success: true, data: { admin: req.admin } });
};

// Optional refresh endpoint (if you want refresh flow now)
exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.admin_refresh_token || req.body?.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.typ !== 'admin' || decoded.tok !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = signToken({ sub: decoded.sub, role: decoded.role, typ: 'admin' }, ACCESS_SECRET, ACCESS_EXPIRES_IN);
    return res.json({ success: true, data: { accessToken } });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};