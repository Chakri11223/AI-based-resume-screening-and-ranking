import mongoose, { Schema, Document } from 'mongoose';

export interface IResumeFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
}

export interface IAnalysis {
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  aiSummary: string;
  skillsAnalysis?: string;
  experienceRelevance?: string;
  extractedInfo?: {
    name: string;
    email: string;
    phone: string;
    experience: number;
    skills: string[];
    education: string;
    location: string;
  };
}

export interface IEducation {
  degree: string;
  institution: string;
  year: number;
}

export interface ICandidate extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  experience: number;
  skills: string[];
  education: IEducation[];
  resumeFile?: IResumeFile;
  analysis?: IAnalysis;
  status: 'uploaded' | 'analyzed' | 'shortlisted' | 'rejected' | 'hired' | 'Phone Screened';
  jobId?: mongoose.Types.ObjectId;
  jobRole?: string;
  interviewScore?: number;
  interviewSummary?: string;
  interviewDate?: Date;
  atsScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeFileSchema = new Schema<IResumeFile>({
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String,
}, { _id: false });

const AnalysisSchema = new Schema<IAnalysis>({
  score: Number,
  strengths: [String],
  weaknesses: [String],
  recommendations: [String],
  aiSummary: String,
  skillsAnalysis: String,
  experienceRelevance: String,
  extractedInfo: {
    name: String,
    email: String,
    phone: String,
    experience: Number,
    skills: [String],
    education: String,
    location: String,
  },
}, { _id: false });

const EducationSchema = new Schema<IEducation>({
  degree: String,
  institution: String,
  year: Number,
}, { _id: false });

const CandidateSchema = new Schema<ICandidate>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    education: {
      type: [EducationSchema],
      default: [],
    },
    resumeFile: {
      type: ResumeFileSchema,
      required: false, // Changed to false for phone screen candidates
    },
    analysis: {
      type: AnalysisSchema,
      required: false, // Changed to false for phone screen candidates
    },
    status: {
      type: String,
      enum: ['uploaded', 'analyzed', 'shortlisted', 'rejected', 'hired', 'Phone Screened'],
      default: 'uploaded',
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
    },
    jobRole: {
      type: String, // Added for phone screen context
      trim: true
    },
    interviewScore: Number,
    interviewSummary: String,
    interviewDate: Date,
    atsScore: Number,
  },
  {
    timestamps: true,
  }
);

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);

