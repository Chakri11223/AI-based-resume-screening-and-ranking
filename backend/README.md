# Talent Aura Backend API

A comprehensive Node.js/Express backend API for the Talent Aura AI-powered talent ranking and screening system.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **AI-Powered Resume Analysis**: Integration with OpenAI for intelligent resume parsing and scoring
- **File Upload & Management**: Secure file upload with support for PDF, DOC, DOCX formats
- **Candidate Management**: Complete CRUD operations for candidate profiles and status tracking
- **Job Management**: Create and manage job postings with AI-enhanced descriptions
- **Analytics & Reporting**: Comprehensive analytics dashboard with trends and insights
- **Email Integration**: Automated interview invitations and rejection notifications
- **RESTful API**: Well-structured REST endpoints with proper error handling

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with GridFS support
- **AI Integration**: OpenAI GPT-4 API
- **Email Service**: Nodemailer
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create new job
- `GET /api/jobs/:id` - Get single job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/improve` - AI improve job description
- `PUT /api/jobs/:id/status` - Update job status

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/shortlisted` - Get shortlisted candidates
- `GET /api/candidates/:id` - Get single candidate
- `PUT /api/candidates/:id/shortlist` - Shortlist candidate
- `PUT /api/candidates/:id/reject` - Reject candidate
- `POST /api/candidates/:id/interview-questions` - Generate interview questions
- `POST /api/candidates/bulk-action` - Bulk actions

### Resumes
- `POST /api/resumes/analyze` - Analyze uploaded resume
- `GET /api/resumes` - Get all resumes
- `GET /api/resumes/:id` - Get single resume
- `PUT /api/resumes/:id/status` - Update resume status
- `DELETE /api/resumes/:id` - Delete resume
- `POST /api/resumes/bulk-analyze` - Analyze multiple resumes

### Upload
- `POST /api/upload/resume` - Upload single resume
- `POST /api/upload/resumes` - Upload multiple resumes
- `GET /api/upload/:filename` - Download file

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/job/:jobId` - Job-specific analytics
- `GET /api/analytics/trends` - Trends over time
- `POST /api/analytics/export` - Export analytics data

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get single user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/activate` - Activate/deactivate user
- `GET /api/users/stats/overview` - User statistics

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd talent-aura-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/talent-aura
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   FRONTEND_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or install MongoDB locally
   # Follow MongoDB installation guide for your OS
   ```

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | `7d` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `EMAIL_HOST` | SMTP host | No | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | No | `587` |
| `EMAIL_USER` | SMTP username | Yes | - |
| `EMAIL_PASS` | SMTP password | Yes | - |
| `FRONTEND_URL` | Frontend URL for CORS | No | `http://localhost:5173` |
| `MAX_FILE_SIZE` | Max file upload size | No | `10485760` (10MB) |

## Database Models

### User
- Authentication and user management
- Role-based access control (admin, hr, recruiter)
- Profile information and preferences

### Job
- Job postings and requirements
- Skills and experience requirements
- Salary and location information
- Status tracking

### Candidate
- Candidate profiles and contact information
- Resume file storage and analysis results
- AI-generated scores and recommendations
- Status tracking through hiring pipeline

### Analytics
- Performance metrics and insights
- Score distributions and trends
- User activity tracking

## AI Integration

The backend integrates with OpenAI's GPT-4 API for:

- **Resume Analysis**: Extract and analyze resume content
- **Candidate Scoring**: Generate match scores based on job requirements
- **Job Description Enhancement**: Improve job postings using AI
- **Interview Question Generation**: Create relevant interview questions
- **Skills Extraction**: Identify and categorize candidate skills

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent API abuse
- **CORS Protection**: Configured for frontend communication
- **Input Validation**: Comprehensive request validation
- **File Type Validation**: Secure file upload restrictions
- **Role-Based Access**: Granular permission system

## Error Handling

- Centralized error handling middleware
- Detailed error logging
- User-friendly error messages
- Proper HTTP status codes
- Development vs production error responses

## API Documentation

The API follows RESTful conventions with:

- Consistent response formats
- Proper HTTP status codes
- Comprehensive error handling
- Request/response validation
- Pagination support
- Search and filtering capabilities

## Development

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm test` - Run tests

### Project Structure
```
src/
├── index.ts              # Main server file
├── models/               # Database models
├── routes/               # API route handlers
├── middleware/           # Custom middleware
├── services/             # Business logic services
└── types/                # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions, please contact the development team or create an issue in the repository.
