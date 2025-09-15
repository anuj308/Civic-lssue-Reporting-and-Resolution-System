import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDepartment extends Document {
  _id: string;
  name: string;
  code: string;
  description?: string;
  head?: Types.ObjectId; // User ID of department head
  staff: Types.ObjectId[]; // Array of User IDs for department staff
  contactEmail: string;
  contactPhone?: string;
  isActive: boolean;
  categories: string[]; // Issue categories this department handles
  priority: number; // Default priority level (1-5)
  responseTime: {
    acknowledge: number; // Hours to acknowledge
    resolve: number; // Hours to resolve
  };
  workingHours: {
    start: string; // 24-hour format (e.g., "09:00")
    end: string; // 24-hour format (e.g., "18:00")
    workingDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  };
  location?: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  stats: {
    totalAssigned: number;
    totalResolved: number;
    averageResponseTime: number; // in hours
    averageResolutionTime: number; // in hours
    currentBacklog: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxLength: [100, 'Department name cannot exceed 100 characters'],
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    uppercase: true,
    trim: true,
    unique: true,
    match: [/^[A-Z0-9_]{2,10}$/, 'Department code must be 2-10 characters, uppercase letters, numbers, and underscores only']
  },
  description: {
    type: String,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  head: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  staff: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  categories: [{
    type: String,
    enum: [
      'pothole',
      'streetlight',
      'garbage',
      'water_supply',
      'sewerage',
      'traffic',
      'park_maintenance',
      'road_maintenance',
      'electrical',
      'construction',
      'noise_pollution',
      'air_pollution',
      'water_pollution',
      'stray_animals',
      'illegal_parking',
      'illegal_construction',
      'public_transport',
      'healthcare',
      'education',
      'other'
    ]
  }],
  priority: {
    type: Number,
    min: [1, 'Priority must be between 1 and 5'],
    max: [5, 'Priority must be between 1 and 5'],
    default: 3
  },
  responseTime: {
    acknowledge: {
      type: Number,
      required: [true, 'Acknowledgment time is required'],
      min: [1, 'Acknowledgment time must be at least 1 hour'],
      max: [168, 'Acknowledgment time cannot exceed 168 hours (7 days)'],
      default: 24
    },
    resolve: {
      type: Number,
      required: [true, 'Resolution time is required'],
      min: [1, 'Resolution time must be at least 1 hour'],
      max: [720, 'Resolution time cannot exceed 720 hours (30 days)'],
      default: 72
    }
  },
  workingHours: {
    start: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'],
      default: '09:00'
    },
    end: {
      type: String,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'],
      default: '18:00'
    },
    workingDays: [{
      type: Number,
      min: [0, 'Working day must be between 0 (Sunday) and 6 (Saturday)'],
      max: [6, 'Working day must be between 0 (Sunday) and 6 (Saturday)']
    }]
  },
  location: {
    address: {
      type: String,
      maxLength: [200, 'Address cannot exceed 200 characters']
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
  stats: {
    totalAssigned: { type: Number, default: 0 },
    totalResolved: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 },
    averageResolutionTime: { type: Number, default: 0 },
    currentBacklog: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ categories: 1 });
departmentSchema.index({ head: 1 });

// Virtual for efficiency rate
departmentSchema.virtual('efficiencyRate').get(function(this: IDepartment) {
  if (this.stats.totalAssigned === 0) return 0;
  return Math.round((this.stats.totalResolved / this.stats.totalAssigned) * 100);
});

// Virtual for current workload status
departmentSchema.virtual('workloadStatus').get(function(this: IDepartment) {
  const backlogRatio = this.stats.currentBacklog / (this.stats.totalAssigned || 1);
  if (backlogRatio > 0.5) return 'high';
  if (backlogRatio > 0.2) return 'medium';
  return 'low';
});

export const Department = mongoose.model<IDepartment>('Department', departmentSchema);
