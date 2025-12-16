import mongoose, { Schema, Document } from 'mongoose';

export interface IJob extends Document {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: {
    min: number;
    max: number;
  };
  location: string;
  salary: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'draft' | 'active' | 'closed' | 'archived';
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 20,
      },
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    salary: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed', 'archived'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Job = mongoose.model<IJob>('Job', JobSchema);

