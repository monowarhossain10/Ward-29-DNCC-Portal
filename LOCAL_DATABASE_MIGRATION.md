# Local Database Migration Guide

## Overview
This guide helps you migrate from Firebase to a local SQLite database to avoid Firebase permission issues and dependencies.

## Benefits of Local Database
- ✅ **No Firebase permissions** - No more "Missing or insufficient permissions" errors
- ✅ **Full control** - Complete control over your data and database
- ✅ **Offline development** - Works without internet connection
- ✅ **Fast performance** - Local queries are much faster than network requests
- ✅ **Easy backup** - Simple file-based database (ward29.db)

## Quick Start

### 1. Start the Local Database Server
```bash
npm run dev-local
```

### 2. Access Your Application
Open: http://localhost:3000

### 3. Login with Default Admin
- **Email**: admin@ward29.com
- **Password**: Admin123!

## What's Included

### Database Tables Created Automatically:
- `admins` - Admin user management
- `news` - News articles
- `volunteers` - Volunteer registrations
- `complaints` - Citizen complaints
- `events` - Community events
- `gallery` - Photo gallery
- `voters` - Voter information
- `council_members` - Council team members
- `councilor_profile` - Councilor profile

### API Endpoints:
- `POST /api/auth/login` - Admin authentication
- `GET/POST/PUT/DELETE /api/news` - News management
- `GET/POST/PUT /api/volunteers` - Volunteer management
- `GET/POST/PUT /api/complaints` - Complaint management
- `GET/POST/PUT/DELETE /api/events` - Event management
- `GET/POST/DELETE /api/gallery` - Gallery management
- `GET/POST/PUT/DELETE /api/voters` - Voter management
- `GET/POST/DELETE /api/council-members` - Council members
- `GET /api/councilor` - Councilor profile
- `POST /api/voter/verify` - Voter verification

## File Upload Support
- Images are stored in `public/uploads/` directory
- Automatic thumbnail generation support
- File size and type validation

## Authentication
- JWT-based authentication
- Session management via localStorage
- Role-based access control (SuperAdmin, Editor, Viewer)

## Data Migration (Optional)
If you have existing Firebase data, you can:
1. Export data from Firebase Console
2. Convert to SQLite format
3. Import using SQLite browser or custom scripts

## Switching Back to Firebase
If needed, you can switch back:
```bash
npm run dev  # Uses Firebase (original server.ts)
```

## Production Considerations
- Set up proper database backups
- Configure production database path
- Add database encryption if needed
- Set up proper CORS policies

## Troubleshooting

### Database Not Found
The database (`ward29.db`) is created automatically on first run.

### Permission Denied
Make sure the `public/uploads/` directory exists and is writable.

### Server Won't Start
Check if port 3000 is available, or modify the PORT in `server-local.ts`.

### Login Issues
Default admin user is created automatically. Use:
- Email: admin@ward29.com
- Password: Admin123!

## Next Steps
1. Test all CRUD operations
2. Verify file uploads work
3. Test admin permissions
4. Backup your database regularly

Your local database is now ready! 🚀
