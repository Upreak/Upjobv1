# UpJob Developer Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Authentication System](#authentication-system)
6. [API Endpoints](#api-endpoints)
7. [Component Library](#component-library)
8. [AI Integration](#ai-integration)
9. [Development Workflow](#development-workflow)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)

## Project Overview

UpJob is an AI-powered job board platform that connects recruiters with candidates through intelligent automation and human oversight. The platform features role-based access control, real-time chat, AI-powered resume parsing, and comprehensive analytics.

### Key Features
- **Role-based Authentication**: Super Admin, Admin, Recruiter, Jobseeker
- **AI-powered Matching**: Intelligent job-candidate matching
- **Real-time Chat**: AI co-pilot with human intervention
- **Resume Parsing**: Automated resume analysis and structuring
- **Job Aggregation**: Meta-search across multiple job sources
- **Analytics Dashboard**: Comprehensive insights and reporting

### Technology Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **Authentication**: NextAuth.js
- **Real-time**: Socket.io
- **AI Services**: z-ai-web-dev-sdk
- **State Management**: Zustand, TanStack Query

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- SQLite (included with project)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd upjob
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up database**
   ```bash
   npm run db:push
   npm run db:generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── jobs/              # Job-related pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard components
│   ├── jobs/             # Job-related components
│   └── auth/             # Authentication components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── auth-utils.ts     # Authentication utilities
│   ├── db.ts             # Database connection
│   ├── utils.ts          # General utilities
│   └── socket.ts         # Socket.io configuration
├── types/                # TypeScript type definitions
│   └── auth.ts           # Authentication types
└── hooks/                # Custom React hooks
    ├── use-mobile.ts     # Mobile detection hook
    └── use-toast.ts      # Toast notification hook
```

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (SQLite)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   AI Services   │◄─────────────┘
                        │   (z-ai-sdk)    │
                        └─────────────────┘
```

### Component Architecture

1. **Pages**: Route-based components in `src/app/`
2. **Layout Components**: Reusable layout structures
3. **UI Components**: Atomic design components from shadcn/ui
4. **Business Logic Components**: Feature-specific components
5. **Hooks**: Custom React hooks for state and side effects

### State Management

- **Client State**: Zustand for global client state
- **Server State**: TanStack Query for server state and caching
- **Form State**: React Hook Form with Zod validation
- **Authentication**: NextAuth.js session management

## Database Schema

### Core Models

#### User Management
```sql
-- Users with role-based access
User {
  id, email, password, name, phone, role, status, avatar, workspaceId
  createdAt, updatedAt
}

-- Workspace for multi-tenancy
Workspace {
  id, name, description, settings
  createdAt, updatedAt
}
```

#### Authentication
```sql
-- NextAuth.js support tables
Account, Session, VerificationToken
```

#### Profiles
```sql
-- Candidate profile
Candidate {
  id, userId, resumeUrl, parsedResume, skills, experience, education
  preferences, currentCtc, expectedCtc, noticePeriod, location
  relocate, summary, createdAt, updatedAt
}

-- Recruiter profile
Recruiter {
  id, userId, company, department, designation
  createdAt, updatedAt
}
```

#### Job Management
```sql
-- Job postings/projects
Project {
  id, title, company, description, skills, minExperience, maxExperience
  minSalary, maxSalary, currency, location, remote, employmentType
  noticePeriod, status, criteria, customQuestions, recruiterId
  createdAt, updatedAt
}

-- Job applications
Application {
  id, projectId, candidateId, userId, status, answers, remarks
  createdAt, updatedAt
}

-- Project-candidate relationships
ProjectCandidate {
  id, projectId, candidateId, status, matchScore, aiNotes
  recruiterNotes, nextFollowUp, createdAt, updatedAt
}
```

#### Communication
```sql
-- Chat messages
ChatMessage {
  id, projectId, candidateId, recruiterId, userId, role, message
  status, metadata, createdAt
}

-- Action queue for manual intervention
ActionQueue {
  id, projectId, candidateId, type, title, description, status
  assignedTo, dueDate, completedAt, metadata, createdAt, updatedAt
}
```

#### AI & Analytics
```sql
-- External AI providers
Provider {
  id, name, type, endpoint, auth, model, weight, dailyLimit
  costPerCall, costPerToken, isActive, settings, createdAt, updatedAt
}

-- Provider metrics
ProviderMetric {
  id, providerId, callCount, tokenCount, successRate, avgLatency
  cost, date
}

-- Search logs
SearchLog {
  id, userId, query, filters, results, sources, providers
  latency, createdAt
}
```

### Database Relationships

- **User** → **Workspace** (Many-to-One)
- **User** → **Candidate** (One-to-One)
- **User** → **Recruiter** (One-to-One)
- **Recruiter** → **Project** (One-to-Many)
- **Project** → **Application** (One-to-Many)
- **Candidate** → **Application** (One-to-Many)
- **Project** → **ProjectCandidate** (One-to-Many)
- **Candidate** → **ProjectCandidate** (One-to-Many)

## Authentication System

### NextAuth.js Configuration

The authentication system uses NextAuth.js with multiple providers:

```typescript
// src/lib/auth.ts
export const authOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      // Credentials-based authentication
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
}
```

### Role-Based Access Control

```typescript
// src/lib/auth-utils.ts
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/auth/signin")
  }
  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth()
  if (user.role !== role) {
    redirect("/unauthorized")
  }
  return user
}

export async function requireAnyRole(roles: UserRole[]) {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}
```

### User Roles

1. **SUPER_ADMIN**: Global system access
2. **ADMIN**: Workspace-level access
3. **RECRUITER**: Job posting and candidate management
4. **JOBSEEKER**: Profile management and job applications

## API Endpoints

### Authentication Endpoints

```typescript
// GET /api/auth/session
// Get current session

// POST /api/auth/signin
// Sign in with credentials

// POST /api/auth/signout
// Sign out

// POST /api/auth/register
// Register new user
```

### User Management

```typescript
// GET /api/users/me
// Get current user profile

// PUT /api/users/me
// Update user profile

// GET /api/users/candidates
// Get candidate profile

// PUT /api/users/candidates
// Update candidate profile

// GET /api/users/recruiters
// Get recruiter profile

// PUT /api/users/recruiters
// Update recruiter profile
```

### Job Management

```typescript
// GET /api/jobs
// List jobs with filters

// POST /api/jobs
// Create new job

// GET /api/jobs/[id]
// Get job details

// PUT /api/jobs/[id]
// Update job

// DELETE /api/jobs/[id]
// Delete job

// POST /api/jobs/[id]/apply
// Apply to job
```

### Application Management

```typescript
// GET /api/applications
// List applications

// GET /api/applications/[id]
// Get application details

// PUT /api/applications/[id]/status
// Update application status
```

### Chat System

```typescript
// GET /api/chat/messages
// Get chat messages

// POST /api/chat/messages
// Send chat message

// GET /api/chat/projects/[id]/messages
// Get project chat messages
```

### AI Services

```typescript
// POST /api/ai/parse-resume
// Parse resume with AI

// POST /api/ai/match-candidates
// Match candidates to job

// POST /api/ai/generate-description
// Generate job description
```

## Component Library

### shadcn/ui Components

The project uses shadcn/ui components with the following structure:

```
src/components/ui/
├── accordion.tsx
├── alert.tsx
├── alert-dialog.tsx
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── calendar.tsx
├── card.tsx
├── checkbox.tsx
├── command.tsx
├── context-menu.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx
├── hover-card.tsx
├── input.tsx
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx
├── skeleton.tsx
├── slider.tsx
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toast.tsx
├── toggle.tsx
├── toggle-group.tsx
├── tooltip.tsx
└── ...
```

### Custom Components

#### Authentication Components
```typescript
// src/components/auth/SignInForm.tsx
// Sign-in form with multiple providers

// src/components/auth/SignUpForm.tsx
// Sign-up form with role selection

// src/components/auth/AuthWrapper.tsx
// Authentication wrapper component
```

#### Dashboard Components
```typescript
// src/components/dashboard/DashboardLayout.tsx
// Main dashboard layout with sidebar

// src/components/dashboard/StatsCard.tsx
// Statistics display card

// src/components/dashboard/ActivityFeed.tsx
// Recent activity feed
```

#### Job Components
```typescript
// src/components/jobs/JobCard.tsx
// Job listing card

// src/components/jobs/JobForm.tsx
// Job creation/editing form

// src/components/jobs/JobFilters.tsx
// Job search filters
```

#### Candidate Components
```typescript
// src/components/candidate/ProfileCard.tsx
// Candidate profile display

// src/components/candidate/ResumeUpload.tsx
// Resume upload component

// src/components/candidate/SkillsInput.tsx
// Skills input with autocomplete
```

### Component Patterns

#### 1. Compound Components
```typescript
// Example: JobCard with sub-components
const JobCard = ({ job }) => (
  <Card>
    <JobCard.Header job={job} />
    <JobCard.Body job={job} />
    <JobCard.Footer job={job} />
  </Card>
)
```

#### 2. Render Props
```typescript
// Example: Data fetching with render props
const DataFetcher = ({ url, children }) => {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetchData(url).then(setData)
  }, [url])
  
  return children(data)
}
```

#### 3. Higher-Order Components
```typescript
// Example: With authentication
const withAuth = (Component) => {
  return (props) => {
    const { data: session } = useSession()
    
    if (!session) {
      return <SignInForm />
    }
    
    return <Component {...props} session={session} />
  }
}
```

## AI Integration

### z-ai-web-dev-sdk Integration

The project uses the z-ai-web-dev-sdk for AI-powered features:

#### Resume Parsing
```typescript
// src/lib/resume-parser.ts
import ZAI from 'z-ai-web-dev-sdk'

export async function parseResume(resumeText: string) {
  try {
    const zai = await ZAI.create()
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a resume parsing expert. Extract structured information from the resume text.'
        },
        {
          role: 'user',
          content: `Parse this resume and return JSON with fields: name, email, phone, skills, experience, education, summary.\n\n${resumeText}`
        }
      ],
    })

    return JSON.parse(completion.choices[0]?.message?.content || '{}')
  } catch (error) {
    console.error('Resume parsing failed:', error)
    throw error
  }
}
```

#### Job Matching
```typescript
// src/lib/job-matcher.ts
export async function matchCandidates(jobId: string) {
  try {
    const zai = await ZAI.create()
    
    const job = await db.project.findUnique({ where: { id: jobId } })
    const candidates = await db.candidate.findMany()
    
    const matches = await Promise.all(
      candidates.map(async (candidate) => {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a job matching expert. Calculate match score between job requirements and candidate profile.'
            },
            {
              role: 'user',
              content: `Job: ${JSON.stringify(job)}\nCandidate: ${JSON.stringify(candidate)}\n\nReturn match score (0-100) and reasoning.`
            }
          ],
        })
        
        const result = JSON.parse(completion.choices[0]?.message?.content || '{}')
        return { candidate, score: result.score, reasoning: result.reasoning }
      })
    )
    
    return matches.sort((a, b) => b.score - a.score)
  } catch (error) {
    console.error('Job matching failed:', error)
    throw error
  }
}
```

#### Chat Co-Pilot
```typescript
// src/lib/chat-service.ts
export async function generateChatResponse(
  message: string,
  context: ChatContext
) {
  try {
    const zai = await ZAI.create()
    
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional recruitment assistant. Help candidates and recruiters communicate effectively.'
        },
        {
          role: 'user',
          content: `Context: ${JSON.stringify(context)}\n\nMessage: ${message}`
        }
      ],
    })
    
    return completion.choices[0]?.message?.content || ''
  } catch (error) {
    console.error('Chat response generation failed:', error)
    throw error
  }
}
```

### AI Service Configuration

Create AI service configuration:

```typescript
// src/lib/ai-config.ts
export const AI_CONFIG = {
  resumeParsing: {
    model: 'gpt-4',
    temperature: 0.1,
    maxTokens: 1000,
  },
  jobMatching: {
    model: 'gpt-4',
    temperature: 0.2,
    maxTokens: 500,
  },
  chatGeneration: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 300,
  },
}
```

## Development Workflow

### Git Workflow

1. **Branch Strategy**
   - `main`: Production-ready code
   - `develop`: Integration branch
   - `feature/*`: Feature branches
   - `hotfix/*`: Critical fixes

2. **Commit Convention**
   ```
   feat: add user authentication
   fix: resolve login bug
   docs: update README
   style: format code
   refactor: improve database queries
   test: add unit tests
   chore: update dependencies
   ```

3. **Pull Request Process**
   - Create feature branch from `develop`
   - Make changes with small, logical commits
   - Create PR with detailed description
   - Request code review
   - Merge to `develop` after approval

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:reset     # Reset database

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run test coverage
```

### Code Style and Quality

#### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### ESLint Configuration
```javascript
// eslint.config.mjs
import { createConfig } from 'eslint-config-next'

export default createConfig({
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
})
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": false,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## Testing

### Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints and database interactions
3. **E2E Tests**: Test complete user workflows
4. **Visual Tests**: Test UI components and styling

### Testing Tools

- **Jest**: Testing framework
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

### Test Structure

```
src/
├── __tests__/
│   ├── components/        # Component tests
│   ├── lib/              # Utility function tests
│   ├── api/              # API endpoint tests
│   └── e2e/              # End-to-end tests
├── mocks/
│   ├── handlers.ts       # MSW handlers
│   └── data.ts           # Test data
└── setup/
    ├── jest.setup.ts     # Jest configuration
    └── tests-setup.ts     # Test setup
```

### Example Tests

#### Component Test
```typescript
// src/__tests__/components/JobCard.test.tsx
import { render, screen } from '@testing-library/react'
import { JobCard } from '@/components/jobs/JobCard'

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: ['San Francisco'],
    description: 'Awesome job',
    minSalary: 100000,
    maxSalary: 150000,
  }

  it('renders job information', () => {
    render(<JobCard job={mockJob} />)
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('San Francisco')).toBeInTheDocument()
  })
})
```

#### API Test
```typescript
// src/__tests__/api/jobs.test.ts
import { createMocks } from 'node-mocks-http'
import { GET, POST } from '@/app/api/jobs/route'

describe('Jobs API', () => {
  it('returns jobs list', async () => {
    const { req } = createMocks({
      method: 'GET',
      query: { page: '1', limit: '10' },
    })

    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.jobs)).toBe(true)
  })

  it('creates new job', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {
        title: 'New Job',
        company: 'Test Company',
        description: 'Test description',
      },
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.job.title).toBe('New Job')
  })
})
```

#### Utility Test
```typescript
// src/__tests__/lib/auth-utils.test.ts
import { requireAuth, requireRole } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'

// Mock the database and auth functions
jest.mock('@/lib/db')
jest.mock('next-auth')

describe('Auth Utils', () => {
  it('requires authentication', async () => {
    // Mock unauthenticated user
    mocked(getCurrentUser).mockResolvedValue(null)
    
    await expect(requireAuth()).rejects.toThrow()
  })

  it('requires specific role', async () => {
    // Mock user with wrong role
    const mockUser = { role: UserRole.JOBSEEKER }
    mocked(getCurrentUser).mockResolvedValue(mockUser)
    
    await expect(requireRole(UserRole.RECRUITER)).rejects.toThrow()
  })
})
```

## Deployment

### Environment Setup

#### Development Environment
```bash
# Development
npm run dev
# Access: http://localhost:3000
```

#### Production Environment
```bash
# Build
npm run build

# Start production server
npm start
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main

#### Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Railway/Render
1. Connect repository
2. Configure build command and start command
3. Set environment variables
4. Deploy

### Environment Variables

#### Required Variables
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Services
ZAI_API_KEY="your-zai-api-key"

# File Upload (if using external service)
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_BUCKET_NAME="your-bucket"
AWS_REGION="your-region"
```

### CI/CD Pipeline

#### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Troubleshooting

### Common Issues

#### 1. NextAuth Configuration Error
```
Error: options.providers is not iterable
```

**Solution**: Check your auth configuration in `src/lib/auth.ts`. Ensure providers are properly configured:

```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // Add other providers
]
```

#### 2. Database Connection Issues
```
Error: Can't reach database server
```

**Solution**: 
- Check DATABASE_URL in `.env`
- Ensure SQLite file exists
- Run `npm run db:push` to create tables

#### 3. TypeScript Errors
```
Type 'string' is not assignable to type 'UserRole'
```

**Solution**: Import UserRole from Prisma and use proper typing:

```typescript
import { UserRole } from '@prisma/client'

const role: UserRole = UserRole.RECRUITER
```

#### 4. Build Errors
```
Module not found: Can't resolve 'z-ai-web-dev-sdk'
```

**Solution**: 
- Install the package: `npm install z-ai-web-dev-sdk`
- Check if it's properly imported
- Restart development server

#### 5. Socket.io Connection Issues
```
WebSocket connection failed
```

**Solution**: 
- Check Socket.io server configuration
- Ensure CORS is properly configured
- Verify client-side Socket.io setup

### Debugging Tips

#### 1. Enable Debug Logging
```typescript
// Add to development
console.log('Debug:', { data })
```

#### 2. Use Browser DevTools
- Network tab for API calls
- Console for errors
- React DevTools for component state

#### 3. Database Debugging
```bash
# View database content
sqlite3 dev.db
.tables
SELECT * FROM users;
```

#### 4. Test API Endpoints
```bash
# Using curl
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Performance Optimization

#### 1. Database Optimization
```typescript
// Add indexes to frequently queried fields
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // ... other fields
  
  @@index([email])
  @@index([role])
}
```

#### 2. API Response Caching
```typescript
// Add caching to API routes
export async function GET(request: Request) {
  const cacheKey = `jobs:${request.url}`
  const cached = await cache.get(cacheKey)
  
  if (cached) {
    return Response.json(cached)
  }
  
  const jobs = await getJobs()
  await cache.set(cacheKey, jobs, { ttl: 300 }) // 5 minutes
  
  return Response.json(jobs)
}
```

#### 3. Component Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering
})

// Use useMemo for expensive calculations
const filteredData = useMemo(() => {
  return data.filter(item => item.active)
}, [data])
```

### Security Best Practices

#### 1. Input Validation
```typescript
import { z } from 'zod'

const jobSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(10),
  minSalary: z.number().min(0),
  maxSalary: z.number().min(0),
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = jobSchema.parse(body)
  
  // Process validated data
}
```

#### 2. Rate Limiting
```typescript
// Add rate limiting to API routes
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
```

#### 3. Environment Variables
```typescript
// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
]

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`)
  }
})
```

## Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [NextAuth.js GitHub](https://github.com/nextauthjs/next-auth)
- [z-ai-web-dev-sdk Documentation](https://z-ai-docs.example.com)

### Tools
- [VS Code](https://code.visualstudio.com/) - Recommended IDE
- [Git](https://git-scm.com/) - Version control
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [SQLite Browser](https://sqlitebrowser.org/) - Database management

---

This documentation provides a comprehensive guide for developers working on the UpJob project. For specific questions or issues, please refer to the project's GitHub repository or contact the development team.