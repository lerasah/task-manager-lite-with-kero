# Task Manager - Jira-lite

A multi-user task management system with role-based access control, admin impersonation, and Docker deployment.

## Features

- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Role-Based Access Control**: Three roles (Admin, Project Manager, User) with granular permissions
- **Admin Impersonation**: Admins can impersonate users for troubleshooting
- **Project Management**: Create projects, assign members, manage tasks
- **Task Tracking**: Create, assign, and track tasks with status updates
- **Comments**: Collaborate on tasks with comments
- **Audit Logging**: Track all administrative actions
- **Soft Delete**: Recover accidentally deleted data

## Technology Stack

- **Backend**: Node.js 18, Express.js, MySQL 8.0
- **Frontend**: React 18, React Router, Axios
- **Authentication**: JWT, bcrypt
- **Deployment**: Docker, Docker Compose, Nginx

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- Docker (optional, for containerized deployment)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials and JWT secret
npm run migrate
npm run seed
npm start
```

The backend will run on `http://localhost:3000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3001`

### Docker Setup (Recommended)

The easiest way to run the entire application:

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- MySQL database on port 3306
- Backend API on port 3000
- Frontend on port 80

Access the application at `http://localhost`

## Default User Credentials

After running the seed script:

- **Admin**: admin@example.com / admin123
- **Project Manager**: pm@example.com / pm123
- **User 1**: user1@example.com / user123
- **User 2**: user2@example.com / user123

## API Endpoints

### Authentication
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Register a new user
- `POST /auth/impersonate` - Admin impersonates another user
- `POST /auth/exit-impersonation` - Exit impersonation session

### Users (Coming Soon)
- `GET /users` - List all users
- `POST /users` - Create a new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Soft delete user

### Projects (Coming Soon)
- `GET /projects` - List projects
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `POST /projects/:id/members` - Add member to project

### Tasks (Coming Soon)
- `GET /projects/:projectId/tasks` - List tasks
- `POST /projects/:projectId/tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/comments` - Add comment

### Audit Logs (Coming Soon)
- `GET /audit-logs` - View audit logs (admin only)

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js               # Authentication & permission middleware
│   ├── routes/
│   │   └── authRoutes.js         # Authentication endpoints
│   ├── scripts/
│   │   ├── migrate.js            # Database schema creation
│   │   └── seed.js               # Seed initial data
│   ├── services/
│   │   ├── authService.js        # Authentication logic
│   │   ├── auditService.js       # Audit logging
│   │   └── permissionService.js  # Permission management
│   ├── utils/
│   │   ├── jwt.js                # JWT token utilities
│   │   └── password.js           # Password hashing utilities
│   └── server.js                 # Express server
├── package.json
└── .env.example

frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/               # React components (to be added)
│   ├── contexts/                 # React contexts (to be added)
│   ├── services/                 # API services (to be added)
│   ├── App.js
│   └── index.js
└── package.json
```

## Development Status

### ✅ Completed (Backend - 95%)
- Project setup (backend & frontend)
- Database schema with 10 tables
- Database migration and seed scripts
- Password hashing utilities (bcrypt)
- JWT token generation and verification
- Authentication service with rate limiting
- Login and registration endpoints
- Admin impersonation with audit logging
- Permission service with in-memory caching
- Authentication and permission middleware
- User management (CRUD + soft delete + restore)
- Project management (CRUD + members + soft delete)
- Task management (CRUD + filtering + permissions)
- Comment system
- Password reset functionality
- Audit log endpoint
- API documentation
- Docker deployment configuration

### 🚧 In Progress (Frontend - 10%)
- Basic React setup complete
- Frontend components need implementation
- Authentication context needed
- API service module needed
- All pages and components needed

### 📋 Remaining Work
- Complete frontend implementation (Tasks 16-21)
- Testing (Tasks 14, 15, 22, 25, 26)
- Deployment documentation (Task 24.2)

## Environment Variables

See `.env.example` for all required environment variables:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database configuration
- `JWT_SECRET` - Secret key for JWT signing (minimum 32 characters)
- `JWT_EXPIRATION` - Token expiration time (default: 24h)
- `BCRYPT_COST_FACTOR` - Bcrypt cost factor (default: 10)
- `PORT` - Server port (default: 3000)
- `CORS_ORIGIN` - Allowed CORS origin

## Security Features

- Passwords hashed with bcrypt (cost factor 10)
- JWT tokens with 24-hour expiration
- Rate limiting on login (5 attempts per 15 minutes)
- Email format validation
- Password length validation (minimum 8 characters)
- Permission-based access control
- Audit logging for administrative actions
- Soft delete for data recovery

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
