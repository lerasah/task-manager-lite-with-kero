# Task Manager API Documentation

Base URL: `http://localhost:3000`

All endpoints return JSON responses with the following structure:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@example.com",
      "role_id": 1
    }
  },
  "message": "Login successful"
}
```

**Rate Limit:** 5 attempts per 15 minutes per email

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role_id": 3
}
```

**Response:** Returns created user (without password)

### POST /auth/impersonate
Admin impersonates another user.

**Permission Required:** `impersonate_user`

**Request:**
```json
{
  "target_user_id": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "impersonatedUser": {
      "id": 5,
      "name": "User Name",
      "email": "user@example.com",
      "role_id": 3
    }
  }
}
```

### POST /auth/exit-impersonation
Exit impersonation session.

**Response:** Returns new token for admin user

### POST /auth/request-reset
Request password reset.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:** Always returns success (prevents email enumeration)

### POST /auth/reset-password
Reset password using token.

**Request:**
```json
{
  "token": "reset_token_here",
  "new_password": "newpassword123"
}
```

## Users

### GET /users
List all users.

**Permission Required:** `view_all_users`

**Query Parameters:**
- `include_inactive` (boolean): Include inactive users

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Admin User",
        "email": "admin@example.com",
        "role_id": 1,
        "role_name": "admin",
        "is_active": true,
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### GET /users/:id
Get user by ID.

**Permission Required:** Own profile or `view_all_users`

### POST /users
Create a new user.

**Permission Required:** `create_user`

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role_id": 3
}
```

### PUT /users/:id
Update user.

**Permission Required:** `update_user`

**Request:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "role_id": 2,
  "is_active": true
}
```

### DELETE /users/:id
Soft delete user (sets is_active to false).

**Permission Required:** `delete_user`

### POST /users/:id/restore
Restore soft-deleted user.

**Permission Required:** `restore_deleted_records`

## Projects

### GET /projects
List projects.

**Returns:**
- All projects if user has `view_all_projects` permission
- Only assigned projects otherwise

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "Project Alpha",
        "description": "Project description",
        "created_by": 1,
        "creator_name": "Admin User",
        "task_count": 5,
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

### GET /projects/:id
Get project by ID with members.

**Access:** Assigned users or users with `view_all_projects` permission

**Response:** Includes project details and members list

### POST /projects
Create a new project.

**Permission Required:** `create_project`

**Request:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

### PUT /projects/:id
Update project.

**Access:** Project owner or users with `update_any_project` permission

**Request:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

### DELETE /projects/:id
Soft delete project.

**Access:** Project owner or users with `delete_any_project` permission

### POST /projects/:id/members
Add member to project.

**Access:** Project owner only

**Request:**
```json
{
  "user_id": 5,
  "role_in_project": "member"
}
```

### DELETE /projects/:id/members/:user_id
Remove member from project.

**Access:** Project owner only

## Tasks

### GET /projects/:projectId/tasks
List tasks for a project.

**Access:** Assigned to project or `view_all_projects` permission

**Query Parameters:**
- `status` (string or comma-separated): Filter by status (todo, in_progress, done)
- `assigned_to` (number): Filter by assignee user ID

**Example:** `/projects/1/tasks?status=todo,in_progress&assigned_to=5`

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": 1,
        "project_id": 1,
        "title": "Task Title",
        "description": "Task description",
        "status": "todo",
        "assigned_to": 5,
        "assignee_name": "User Name",
        "created_by": 1,
        "creator_name": "Admin User",
        "created_at": "2024-01-15T10:00:00.000Z",
        "updated_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

### GET /tasks/:id
Get task by ID.

**Access:** Assigned to project or `view_all_projects` permission

### POST /projects/:projectId/tasks
Create a new task.

**Access:** Assigned to project

**Request:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "assigned_to": 5
}
```

**Note:** Assigning to a user requires `assign_task` permission

### PUT /tasks/:id
Update task.

**Access:**
- Task assignee: Can update status only
- Project owner: Can update all fields
- Users with `update_any_task` permission: Can update all fields

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "in_progress",
  "assigned_to": 6
}
```

### DELETE /tasks/:id
Delete task.

**Access:** Project owner or users with `update_any_task` permission

### POST /tasks/:id/comments
Add a comment to a task.

**Access:** Assigned to project

**Request:**
```json
{
  "content": "This is a comment"
}
```

### GET /tasks/:id/comments
Get comments for a task.

**Access:** Assigned to project or `view_all_projects` permission

**Response:**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "task_id": 1,
        "user_id": 5,
        "commenter_name": "User Name",
        "content": "This is a comment",
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ]
  }
}
```

## Audit Logs

### GET /audit-logs
Get audit logs with pagination.

**Permission Required:** `view_audit_logs`

**Query Parameters:**
- `limit` (number, default: 50): Number of logs to return
- `offset` (number, default: 0): Offset for pagination

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 1,
        "performed_by": 1,
        "performed_by_name": "Admin User",
        "action": "impersonate_user",
        "impersonated_user_id": 5,
        "impersonated_user_name": "User Name",
        "details": { "target_user_id": 5 },
        "created_at": "2024-01-15T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

## HTTP Status Codes

- `200 OK`: Successful GET, PUT, DELETE operations
- `201 Created`: Successful POST operations
- `400 Bad Request`: Validation errors, malformed requests
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server errors

## Permissions

### Admin Permissions
- create_user
- update_user
- delete_user
- view_all_users
- create_project
- update_any_project
- delete_any_project
- view_all_projects
- assign_task
- update_any_task
- impersonate_user
- view_audit_logs
- view_deleted_records
- restore_deleted_records

### Project Manager Permissions
- create_project
- view_all_projects
- assign_task

### User Permissions
- None (basic access only)

## JWT Token Format

Tokens contain the following claims:
```json
{
  "user_id": 1,
  "role_id": 1,
  "iat": 1705315200,
  "exp": 1705401600
}
```

For impersonation tokens:
```json
{
  "original_admin_id": 1,
  "impersonated_user_id": 5,
  "user_id": 5,
  "role_id": 3,
  "iat": 1705315200,
  "exp": 1705401600
}
```

## Error Messages

Common error messages:
- `"Authentication required"`: Missing or invalid token
- `"Token expired"`: JWT token has expired
- `"Permission denied: <permission> required"`: Insufficient permissions
- `"Invalid email format"`: Email validation failed
- `"Password must be at least 8 characters"`: Password too short
- `"Email already exists"`: Duplicate email
- `"User not found"`: User ID doesn't exist
- `"Project not found"`: Project ID doesn't exist
- `"Task not found"`: Task ID doesn't exist
- `"You are not assigned to this project"`: Access denied to project
- `"Too many login attempts. Please try again in 15 minutes"`: Rate limit exceeded
