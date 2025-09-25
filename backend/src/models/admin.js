const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 100 },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Invalid email'],
      index: true,
    },

    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9._-]{3,30}$/, 'Invalid username'],
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never select by default
    },

    role: {
      type: String,
      enum: ['admin', 'super_admin'],
      default: 'admin',
      index: true,
    },

    permissions: [{ type: String }], // e.g., ['issues.read', 'issues.update', '*']

    status: {
      type: String,
      enum: ['active', 'suspended', 'invited'],
      default: 'active',
      index: true,
    },

    mfa: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: false },
      backupCodes: [{ type: String, select: false }],
    },

    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },

    passwordUpdatedAt: { type: Date },

    audit: {
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.password;
        if (ret.mfa) {
          delete ret.mfa.secret;
          delete ret.mfa.backupCodes;
        }
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Hash password if modified
AdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordUpdatedAt = new Date();
  next();
});

// Compare password helper
AdminSchema.methods.comparePassword = async function (plain) {
  // password field is select:false; ensure doc has it selected when calling compare
  return bcrypt.compare(plain, this.password);
};

// Permission helper (supports '*' wildcard)
AdminSchema.methods.hasPermission = function (perm) {
  if (this.role === 'super_admin') return true;
  if (!Array.isArray(this.permissions)) return false;
  return this.permissions.includes('*') || this.permissions.includes(perm);
};

module.exports = mongoose.model('Admin', AdminSchema);