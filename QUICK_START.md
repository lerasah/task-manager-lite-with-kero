# Quick Start Guide

Get the Task Manager running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- OR Node.js 18+ and MySQL 8.0+

## Option 1: Docker (Easiest - Recommended)

### Step 1: Start the Application

```bash
docker-compose up -d
```

That's it! The application is now running:
- **Backend API**: http://localhost:3000
- **Database**: localhost:3306
- **Frontend**: http://localhost (when implemented)

### Step 2: Test the API

```bash
# Login as admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Copy the token from the response and use it in subsequent requests
```

### Step 3: View Logs

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend
```

### Step 4: Stop the Application

```bash
docker-compose down
```

## Option 2: Local Development

### Step 1: Set Up Database

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE taskmanager;
CREATE USER 'taskmanager'@'localhost' IDENTIFIED BY 'taskmanager123';
GRANT ALL PRIVILEGES ON taskmanager.* TO 'taskmanager'@'localhost';
exit;
```

### Step 2: Set Up Backend

```bash
cd backend
npm install
cp .env.example .env

# Edit .env file with your database credentials
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=taskmanager
# DB_PASSWORD=taskmanager123
# DB_NAME=taskmanager
# JWT_SECRET=your_secret_key_minimum_32_characters

# Run migrations and seed data
npm run migrate
npm run seed

# Start the server
npm start
```

The backend will run on http://localhost:3000

### Step 3: Test the API

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## Default User Accounts

After setup, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Project Manager | pm@example.com | pm123 |
| User | user1@example.com | user123 |
| User | user2@example.com | user123 |

## Common API Endpoints

### Authentication
```bash
# Login
POST /auth/login
Body: {"email": "admin@example.com", "password": "admin123"}

# Register
POST /auth/register
Body: {"name": "John Doe", "email": "john@example.com", "password": "password123", "role_id": 3}
```

### Projects
```bash
# List projects
GET /projects
Headers: Authorization: Bearer <token>

# Create project
POST /projects
Headers: Authorization: Bearer <token>
Body: {"name": "My Project", "description": "Description"}

# Get project details
GET /projects/:id
Headers: Authorization: Bearer <token>
```

### Tasks
```bash
# List tasks for a project
GET /projects/:projectId/tasks
Headers: Authorization: Bearer <token>

# Create task
POST /projects/:projectId/tasks
Headers: Authorization: Bearer <token>
Body: {"title": "Task Title", "description": "Description", "assigned_to": 5}

# Update task
PUT /tasks/:id
Headers: Authorization: Bearer <token>
Body: {"status": "in_progress"}
```

### Users (Admin only)
```bash
# List users
GET /users
Headers: Authorization: Bearer <token>

# Create user
POST /users
Headers: Authorization: Bearer <token>
Body: {"name": "New User", "email": "user@example.com", "password": "password123", "role_id": 3}
```

## Testing with Postman

1. Import the API endpoints from `API_DOCUMENTATION.md`
2. Create an environment variable for the token
3. Login to get a token
4. Use the token in the Authorization header for protected endpoints

## Troubleshooting

### Docker Issues

**Problem**: Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# Change the port in docker-compose.yml
```

**Problem**: Database connection failed
```bash
# Check database logs
docker-compose logs database

# Restart the database
docker-compose restart database
```

### Local Development Issues

**Problem**: Cannot connect to database
- Check MySQL is running
- Verify credentials in .env file
- Check database exists: `SHOW DATABASES;`

**Problem**: Module not found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem**: Migration fails
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE taskmanager;
CREATE DATABASE taskmanager;
exit;

# Run migration again
npm run migrate
```

## Next Steps

1. **Explore the API**: Check `API_DOCUMENTATION.md` for all endpoints
2. **Test Features**: Try creating projects, tasks, and comments
3. **Admin Features**: Test impersonation and user management
4. **Build Frontend**: Use the API to build a React frontend

## Need Help?

- Check `API_DOCUMENTATION.md` for complete API reference
- Check `README.md` for detailed setup instructions
- Check `FINAL_SUMMARY.md` for project overview
- Review the code comments in source files

## Quick Commands Reference

```bash
# Docker
docker-compose up -d          # Start all services
docker-compose down           # Stop all services
docker-compose logs -f        # View logs
docker-compose restart        # Restart all services

# Backend (local)
npm install                   # Install dependencies
npm run migrate              # Run database migrations
npm run seed                 # Seed initial data
npm start                    # Start server
npm run dev                  # Start with nodemon (auto-reload)

# Database
mysql -u root -p             # Connect to MySQL
SHOW DATABASES;              # List databases
USE taskmanager;             # Select database
SHOW TABLES;                 # List tables
```

## Success Indicators

You'll know everything is working when:
- ✅ `docker-compose ps` shows all services as "Up"
- ✅ `curl http://localhost:3000/health` returns `{"success":true}`
- ✅ Login request returns a JWT token
- ✅ Protected endpoints work with the token

Happy coding! 🚀
