# UpJob Admin Credentials

## Test Credentials

### Super Admin
- **Email**: `superadmin@upjob.com`
- **Password**: `Admin123!`
- **Role**: Super Administrator
- **Access**: Full system access, workspace management, user management

### Admin
- **Email**: `admin@upjob.com`
- **Password**: `Admin123!`
- **Role**: Administrator
- **Access**: Workspace-level management, job posting oversight

### Recruiter
- **Email**: `recruiter@upjob.com`
- **Password**: `Recruiter123!`
- **Role**: Recruiter
- **Access**: Job posting, candidate management, workspace access
- **Company**: TechCorp Inc.
- **Department**: HR
- **Designation**: Senior Recruiter

### Candidate
- **Email**: `candidate@upjob.com`
- **Password**: `Candidate123!`
- **Role**: Job Seeker
- **Access**: Profile management, job search, applications
- **Skills**: JavaScript, React, Node.js, TypeScript
- **Current CTC**: $75,000
- **Expected CTC**: $90,000
- **Location**: San Francisco, CA
- **Notice Period**: 30 days

## Sample Data

### Workspace
- **Name**: Default Workspace
- **Description**: Default workspace for demo purposes
- **Settings**: Max 100 users, features include job posting, candidate management, and analytics

### Sample Job Project
- **Title**: Senior Software Engineer
- **Company**: TechCorp Inc.
- **Status**: Active
- **Experience Required**: 3-7 years
- **Salary Range**: $80,000 - $120,000
- **Location**: San Francisco, CA (Remote available)
- **Employment Type**: Full-time
- **Skills Required**: React, Node.js, TypeScript, MongoDB, AWS
- **Custom Questions**:
  1. Why are you interested in this position? (Required)
  2. What is your expected salary range? (Required)
  3. When can you start? (Optional)

## Access Instructions

### 1. Local Development
1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application:
   - URL: http://localhost:3000
   - Use any of the credentials above to log in

### 2. Testing Different Roles

#### Super Admin Testing
1. Log in as `superadmin@upjob.com`
2. Verify access to all system features
3. Test user management capabilities
4. Check workspace management

#### Admin Testing
1. Log in as `admin@upjob.com`
2. Verify workspace-level access
3. Test job posting oversight
4. Check limited admin features

#### Recruiter Testing
1. Log in as `recruiter@upjob.com`
2. Verify job posting capabilities
3. Test candidate management
4. Check workspace features

#### Candidate Testing
1. Log in as `candidate@upjob.com`
2. Verify profile management
3. Test job search and application
4. Check application status tracking

### 3. Database Verification

To verify the data was seeded correctly:

```bash
# Access the database
sqlite3 db/custom.db

# Check users table
SELECT email, role, name FROM users;

# Check recruiter profile
SELECT * FROM recruiters;

# Check candidate profile
SELECT * FROM candidates;

# Check sample project
SELECT * FROM projects;
```

## Security Notes

⚠️ **Important**: These credentials are for development and testing purposes only.

### Password Security
- All passwords use the same pattern for easy testing
- In production, use strong, unique passwords
- Implement password complexity requirements
- Enable two-factor authentication

### Environment Variables
- Never commit actual credentials to version control
- Use environment variables for sensitive data
- Rotate credentials regularly in production
- Use different credentials for each environment

### Production Deployment
Before deploying to production:
1. Change all default passwords
2. Remove or secure test accounts
3. Implement proper user registration
4. Add email verification
5. Set up proper authentication flows

## Common Testing Scenarios

### 1. Authentication Flow
- Test sign-in with correct/incorrect credentials
- Verify role-based redirects
- Test session persistence
- Check sign-out functionality

### 2. Role-Based Access
- Verify each role can only access intended features
- Test unauthorized access attempts
- Check proper error handling
- Verify navigation options per role

### 3. Data Management
- Test CRUD operations for each role
- Verify data isolation between users
- Check proper error handling
- Test data validation

### 4. Integration Testing
- Test complete user workflows
- Verify data consistency
- Check error recovery
- Test performance under load

## Troubleshooting

### Common Issues

#### 1. Login Failures
- Verify email and password are correct
- Check if user exists in database
- Verify user status is ACTIVE
- Check for authentication system errors

#### 2. Role Access Issues
- Verify user role in database
- Check role-based access control logic
- Verify navigation configuration
- Check for permission errors

#### 3. Data Not Found
- Verify database seeding completed successfully
- Check database connection
- Verify data relationships
- Check for foreign key constraints

### Debug Commands

```bash
# Check database contents
sqlite3 db/custom.db ".tables"
sqlite3 db/custom.db "SELECT * FROM users;"

# Reseed database
npm run db:seed

# Reset database completely
npm run db:reset
npm run db:setup

# Check authentication logs
tail -f dev.log | grep -i auth
```

## Support

For issues with credentials or access:
1. Check the troubleshooting section above
2. Verify the development server is running
3. Check database connectivity
4. Review authentication configuration
5. Contact development team if issues persist

---

**Remember**: These are test credentials only. Never use these in production environments.