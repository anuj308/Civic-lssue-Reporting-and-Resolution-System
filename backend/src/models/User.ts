import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'citizen' | 'admin' | 'department_head' | 'field_worker';
  department?: string;
  profileImage?: string;
  isActive: boolean;
  isVerified: boolean;
  fcmToken?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  preferences?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
  };
  stats?: {
    totalReports: number;
    resolvedReports: number;
    averageRating: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
    sparse: true
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'department_head', 'field_worker'],
    default: 'citizen'
  },
  department: {
    type: String,
    ref: 'Department',
    required: function(this: IUser) {
      return this.role !== 'citizen' && this.role !== 'admin';
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  fcmToken: {
    type: String,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: { type: String, default: 'Jharkhand' },
    pincode: {
      type: String,
      match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
  },
  stats: {
    totalReports: { type: Number, default: 0 },
    resolvedReports: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 }
  },
  lastLoginAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ 'address.coordinates': '2dsphere' });

// Virtual for user's full name display
userSchema.virtual('displayName').get(function(this: IUser) {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to remove sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

export const User = mongoose.model<IUser>('User', userSchema);
