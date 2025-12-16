# 🤖 AI Based Resume Screening and Ranking

A comprehensive full-stack application for AI-powered resume screening and candidate ranking, built with React, Node.js, and powered by Google Gemini AI.

## 📁 Project Structure

```
ai-based-resume-screening-ranking/
├── backend/                 # Node.js/Express API server
│   ├── src/                # TypeScript source code
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── services/       # Business logic services
│   ├── dist/               # Compiled JavaScript
│   ├── uploads/            # File upload directory
│   ├── .env                # Environment variables
│   └── package.json        # Backend dependencies
├── frontend/               # React/Vite frontend
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json with scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Option 1: Easy Startup (Recommended)
```bash
# Run the startup script
./start.bat
```

### Option 2: Manual Setup
```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev
```

### Option 3: Individual Servers
```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## 🛠️ Available Scripts

### Root Level Commands
- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only
- `npm run install:all` - Install dependencies for all projects
- `npm run build` - Build both projects
- `npm run lint` - Lint both projects

### Backend Commands
- `npm run dev` - Start development server
- `npm run dev-simple` - Start with simple features
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled JavaScript

### Frontend Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🌐 Access Points

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health
- **Test Upload**: Open `test-upload.html` in browser

## 🤖 AI Configuration

The project uses Google Gemini AI for resume analysis. Add your API key to `backend/.env`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

## 🔧 Environment Setup

### Backend (.env)
```env
NODE_ENV=development
PORT=5001
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (for OTP verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
FRONTEND_URL=http://localhost:8080
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Features

### 🤖 AI-Powered Features
- ✅ **Resume Analysis** - AI-powered candidate assessment using Gemini AI
- ✅ **Smart Ranking** - Intelligent candidate ranking based on job requirements
- ✅ **Job Description Enhancement** - AI-improved job postings
- ✅ **Interview Questions** - AI-generated interview questions
- ✅ **Voice Interviewing** - Real-time AI voice interviews with candidates
- ✅ **Response Analysis** - AI analysis of interview responses
- ✅ **Auto-Shortlisting** - Automatically shortlists top candidates (>60%)
- ✅ **Interactve Resume Builder** - Create professional resumes with templates

### 🔧 Backend Features
- ✅ RESTful API with Express.js
- ✅ In-memory data storage (no database required)
- ✅ JWT authentication
- ✅ Email OTP verification with SMTP
- ✅ File upload handling with Multer
- ✅ AI-powered resume analysis with Gemini AI
- ✅ Rate limiting and security
- ✅ Comprehensive error handling
- ✅ CORS support

### 🎨 Frontend Features
- ✅ Modern React with TypeScript
- ✅ Beautiful UI with Tailwind CSS
- ✅ Responsive design
- ✅ Multi-step signup with email verification
- ✅ Real-time data updates
- ✅ File upload interface with drag & drop
- ✅ Analytics dashboard
- ✅ Candidate management
- ✅ AI interview simulation
- ✅ Profile & Settings management

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run start
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Candidates
- `GET /api/candidates` - Get all candidates
- `POST /api/candidates` - Create candidate
- `GET /api/candidates/:id` - Get candidate by ID
- `POST /api/candidates/screen` - Screen candidates with AI

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs/improve` - Improve job description with AI

### File Upload
- `POST /api/upload/resumes` - Upload and analyze resumes

### AI Features
- `POST /api/interview/questions` - Generate AI interview questions
- `POST /api/interview/analyze` - Analyze interview responses

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/dashboard` - Get dashboard data

## 🛠️ Technology Stack

### Backend
- Node.js + Express.js
- TypeScript
- Google Gemini AI
- Multer (file uploads)
- JWT Authentication
- In-memory storage

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Radix UI components
- React Router
- React Query

## 🎯 Key Capabilities

1. **Resume Upload & Analysis** - Upload resumes and get AI-powered analysis
2. **Smart Candidate Ranking** - Rank candidates based on job requirements
3. **Job Description Enhancement** - Improve job postings with AI
4. **AI Interview Simulation** - Practice interviews with AI-generated questions
5. **Real-time Analytics** - Track screening progress and candidate metrics
6. **File Management** - Secure file upload and storage
7. **Auto-Shortlisting** - Automatically advance high-scoring candidates
8. **Resume Builder** - Create professional resumes instantly

## 📞 Support

For issues and questions, please check the documentation or create an issue in the repository.

---

**Happy screening! 🎉**