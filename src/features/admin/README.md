# Admin Dashboard - Feature Documentation

## Overview
The Admin Dashboard is a comprehensive management interface for system administrators to oversee and manage the entire Talent Finder platform. It provides statistics, user management, source run configuration, and job/candidate visibility.

## Features

### 1. **Home Page** (Statistics Dashboard)
Displays key metrics and quick access to all admin functions:
- **Total Jobs**: Count of all published job posts
- **Total Users**: Count of all recruiters and system users
- **Total Sourced Candidates**: Count of all candidates sourced from LinkedIn
- **Next Source Run**: Scheduled time for the next source run (if configured)
- **Quick Actions**: Shortcuts to frequently used admin functions

### 2. **User Management Tab**
Manage all recruiters and platform users:
- **Add New Recruiter**: Create new user accounts with form validation
  - Full name, email, password (min 6 characters)
  - Automatic credential email sending
  - Email format validation
  - Password confirmation
- **View All Recruiters**: Table view of all active users with:
  - User avatars with initials
  - Role badges
  - Account creation date
  - View profile action button

### 3. **Source Run Configuration Tab**
Schedule automated candidate sourcing from LinkedIn:

#### Configuration Options:
- **Basic Settings**
  - Frequency: Daily, Weekly, or Monthly
  - Platform: LinkedIn (currently the only supported platform)
  - Department/Service: For filtering candidates
  - Experience Range: Min and max years of experience

- **Keywords**
  - Technical/Skill Keywords: Primary skills to search for
  - Additional Keywords: Secondary keywords (agile, microservices, etc.)
  - Support for multiple keyword tags

- **Location Preferences**
  - Multiple location selection
  - Tag-based interface

- **Education Requirements**
  - Specify minimum education levels (Bachelor's, Master's, PhD)
  - Tag-based interface

- **Status**
  - Enable/disable automated source runs

#### Actions:
- **Save Configuration**: Store the configuration for scheduled runs
- **Manual Trigger**: Immediately trigger a source run with current settings
- **Edit Configuration**: Modify existing configuration at any time

### 4. **All Posts & Candidates Tab**
View-only access to all system data:

#### Job Posts View
- Grid display of all job postings
- Shows:
  - Job title
  - Status (Active, Closed, Draft, etc.)
  - Job description (truncated)
  - Location and experience requirements
  - Number of candidates needed
  - Required skills (with "more" indicator)
  - Quick view button

#### Sourced Candidates View
- List display of all sourced candidates
- Shows:
  - Candidate name and avatar
  - Job title/role
  - Email and location
  - LinkedIn profile link
  - Technical skills (with "more" indicator)
  - Overall score
  - View profile action button

## API Integration

### Endpoints Used:
- `GET /api/v1/jobpost/` - Fetch all job posts
- `GET /api/v1/sourced-candidates/` - Fetch all sourced candidates
- `GET /api/v1/users/` - Fetch all users
- `POST /api/v1/users/` - Create new user
- `GET /api/v1/source-run/config/` - Get source run configuration
- `POST /api/v1/source-run/config/` - Create source run configuration
- `PUT /api/v1/source-run/config/{id}` - Update configuration
- `POST /api/v1/source-run/trigger/{id}` - Manually trigger source run

## Design & Styling

### Color Scheme:
- **Primary Blue**: #2563eb (buttons, active states)
- **Success Green**: #16a34a (active status, confirmations)
- **Warning Orange**: #d97706 (warnings)
- **Error Red**: #dc2626 (errors)
- **Neutral Gray**: #64748b (secondary text)

### Component Styling:
- Follows the same design patterns as Talent_Finder_Candidatedrawer.tsx
- Responsive grid layout
- Cards with subtle shadows and hover effects
- Tag-based UI for list inputs
- Modal alert system for success/error messages

### Responsive Design:
- Desktop-first design with mobile fallbacks
- Breakpoints: 768px (tablet), 640px (mobile)
- Mobile-optimized forms and tables

## Usage Examples

### Create a New Recruiter
1. Navigate to "User Management" tab
2. Click "+ Add New Recruiter"
3. Fill in:
   - Full Name: "John Smith"
   - Email: "john.smith@company.com"
   - Password: "SecurePass123"
   - Confirm Password: "SecurePass123"
4. Click "Create User & Send Credentials"
5. Email with login credentials is automatically sent

### Configure a Source Run
1. Navigate to "Source Configuration" tab
2. Click "Create Configuration" (or "Edit Configuration" if exists)
3. Set frequency to "Weekly"
4. Add keywords: Python, React, AWS
5. Add locations: Bangalore, Pune
6. Set experience range: 3-8 years
7. Save configuration
8. Click "Trigger Source Run Manually" to start immediately or wait for schedule

### Monitor Platform Activity
1. Go to "Home" tab to see statistics
2. Click "View All Posts" in quick actions
3. Browse job posts and candidates
4. View detailed candidate profiles by clicking "View Profile"

## Technical Details

### State Management:
- Components use React hooks (useState, useEffect)
- API calls with error handling
- Loading states for async operations
- Success/error toast notifications

### Form Validation:
- Email format validation
- Password confirmation matching
- Minimum length requirements
- Required field validation

### Error Handling:
- Network error messages
- User-friendly error toasts
- Fallback loading states
- Graceful error recovery

## Future Enhancements

1. **Advanced Filtering**: Add filters for job posts and candidates
2. **Bulk Actions**: Bulk user management and candidate operations
3. **Export Data**: CSV export for reports
4. **Analytics Dashboard**: Detailed charts and metrics
5. **Activity Log**: Track admin actions and system events
6. **Email Templates**: Customize credential emails
7. **Multi-Platform Support**: Extend source run to Indeed, Glassdoor, etc.
8. **User Roles**: Granular permission management
9. **Audit Trail**: Complete audit of all admin actions
10. **Bulk Sourcing**: Configure multiple concurrent source runs

## File Structure
```
src/features/admin/
├── pages/
│   ├── Admindashboard.tsx       # Main admin dashboard component
│   ├── Admindashboard.css       # Dashboard styling
│   ├── AdminHome.tsx            # Statistics home page
│   ├── UserManagement.tsx       # User management tab
│   ├── SourceRunConfig.tsx      # Source run configuration tab
│   └── AdminJobPosts.tsx        # Job posts & candidates view
└── services/
    └── adminApi.ts             # Admin API service functions
```

## Notes for Developers

1. **Authentication**: Admin users are identified by `role === 'admin'` in the user object
2. **Organization ID**: Currently uses a placeholder for `org_id`. Update with actual admin's organization ID from auth context
3. **Email Sending**: Backend handles automatic credential email sending on user creation
4. **API Endpoints**: If endpoints differ from documentation, update API calls in `adminApi.ts`
5. **Styling**: All styles use CSS modules approach without external UI libraries for consistency

## Support
For issues or questions about the admin dashboard, refer to the API documentation or contact the development team.
