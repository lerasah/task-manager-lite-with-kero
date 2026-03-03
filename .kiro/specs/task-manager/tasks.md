# Implementation Plan: Task Manager

## Overview

This implementation plan covers the complete development of a multi-user task management system (Jira-lite) with role-based access control, admin impersonation, and Docker deployment. The system uses Node.js/Express for the backend, React for the frontend, and MySQL for the database.

## Tasks

- [ ] 1. Project setup and configuration
  - [x] 1.1 Initialize backend Node.js project with Express
    - Create package.json with dependencies: express, mysql2, bcrypt, jsonwebtoken, dotenv, express-validator, cors
    - Set up project structure: src/services, src/middleware, src/routes, src/utils, src/config
    - Create .env.example file with all required environment variables
    - _Requirements: 29.1, 29.2, 29.3_

  - [x] 1.2 Initialize frontend React project
    - Create React app with dependencies: react-router-dom, axios
    - Set up project structure: src/components, src/contexts, src/services, src/hooks, src/utils
    - Configure proxy for API requests in development
    - _Requirements: 16.1, 16.2_

  - [x] 1.3 Create database connection module
    - Implement database connection pool with mysql2
    - Add connection error handling and retry logic
    - Load database configuration from environment variables
    - _Requirements: 29.1, 25.1_

  - [ ]* 1.4 Write property test for database configuration
    - **Property: Missing required environment variable causes application exit**
    - **Validates: Requirements 29.4**

- [ ] 2. Database schema implementation
  - [x] 2.1 Create database migration script
    - Write SQL script to create all tables: users, roles, permissions, role_permissions, projects, project_users, tasks, comments, audit_logs, password_reset_tokens
    - Add all foreign key constraints as specified in design
    - Add all indexes for performance optimization
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_


  - [x] 2.2 Create database seed script
    - Insert three roles: admin, project_manager, user
    - Insert all permissions as specified in design
    - Create role_permissions mappings for each role
    - Create default users: admin@example.com, pm@example.com, user1@example.com, user2@example.com
    - Make seed script idempotent to allow multiple executions
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ]* 2.3 Write property test for email uniqueness constraint
    - **Property 10: Email uniqueness constraint**
    - **Validates: Requirements 4.2**

  - [ ]* 2.4 Write property test for foreign key constraints
    - **Property: Foreign key constraints prevent orphaned records**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9**

- [ ] 3. Authentication service implementation
  - [x] 3.1 Implement password hashing utilities
    - Create bcrypt wrapper functions for hashing and comparing passwords
    - Use cost factor 10 from environment configuration
    - _Requirements: 1.3, 13.4_

  - [ ]* 3.2 Write property test for password hashing
    - **Property 2: Password hashing is non-deterministic**
    - **Validates: Requirements 1.3**

  - [x] 3.3 Implement JWT token generation and verification
    - Create functions to sign JWT tokens with user_id and role_id
    - Set token expiration to 24 hours from environment configuration
    - Create function to verify and decode JWT tokens
    - _Requirements: 1.1, 1.4_


  - [ ]* 3.4 Write property test for JWT round-trip
    - **Property 1: JWT round-trip preserves identity**
    - **Validates: Requirements 1.1**

  - [x] 3.5 Implement login endpoint with rate limiting
    - Create POST /auth/login endpoint
    - Validate email and password format
    - Implement rate limiting: 5 attempts per 15 minutes per email
    - Return JWT token and user data on success
    - _Requirements: 1.1, 1.2, 13.1, 13.2, 13.3, 13.4_

  - [ ]* 3.6 Write property test for invalid credentials
    - **Property 45: Invalid email format rejected**
    - **Property 46: Short passwords rejected**
    - **Validates: Requirements 13.3, 13.4**

  - [x] 3.7 Implement registration endpoint
    - Create POST /auth/register endpoint
    - Hash password before storing
    - Validate email uniqueness and format
    - Assign role to new user
    - _Requirements: 4.1, 4.2, 2.2_

  - [ ]* 3.8 Write property test for user creation
    - **Property 3: User creation assigns exactly one role**
    - **Property 9: User creation includes required fields**
    - **Validates: Requirements 2.2, 4.1**

- [ ] 4. Checkpoint - Ensure authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 5. Admin impersonation implementation
  - [x] 5.1 Implement impersonation token generation
    - Create function to generate JWT with both original_admin_id and impersonated_user_id
    - Create POST /auth/impersonate endpoint with permission check
    - _Requirements: 3.1_

  - [ ]* 5.2 Write property test for impersonation token
    - **Property 4: Impersonation token contains both user IDs**
    - **Validates: Requirements 3.1**

  - [x] 5.3 Implement impersonation audit logging
    - Log impersonation action to audit_logs table
    - Include admin_id, impersonated_user_id, and timestamp
    - _Requirements: 3.2_

  - [ ]* 5.4 Write property test for impersonation audit
    - **Property 5: Impersonation creates audit log**
    - **Validates: Requirements 3.2**

  - [x] 5.5 Implement exit impersonation endpoint
    - Create POST /auth/exit-impersonation endpoint
    - Generate new token with only admin's user_id
    - _Requirements: 3.4_

  - [ ]* 5.6 Write property test for exit impersonation
    - **Property 7: Exit impersonation round-trip**
    - **Validates: Requirements 3.4**

  - [ ]* 5.7 Write property test for non-admin impersonation
    - **Property 8: Non-admin cannot impersonate**
    - **Validates: Requirements 3.5**


- [ ] 6. Permission service implementation
  - [x] 6.1 Implement permission loading at startup
    - Load role-permission mappings from database into memory
    - Create in-memory cache for fast permission lookups
    - _Requirements: 2.3, 11.3_

  - [x] 6.2 Implement permission checking middleware
    - Create requirePermission(permission) middleware function
    - Extract user_id from JWT token
    - Check if user's role has required permission
    - Return 403 Forbidden if permission denied
    - Handle impersonation by using impersonated user's role
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 3.3_

  - [ ]* 6.3 Write property test for permission checking
    - **Property 6: Impersonation uses target user permissions**
    - **Property 41: Permission check returns correct boolean**
    - **Property 42: Missing permission returns 403**
    - **Validates: Requirements 3.3, 11.3, 11.4**

  - [x] 6.4 Implement authentication middleware
    - Create authenticate middleware to verify JWT token
    - Attach user data to request object
    - Handle expired tokens with 401 response
    - _Requirements: 1.4, 1.5_

  - [ ]* 6.5 Write property test for token expiration
    - **Property 50: Valid token populates auth context**
    - **Validates: Requirements 1.4, 16.3**


- [ ] 7. User service and endpoints
  - [x] 7.1 Implement user CRUD service functions
    - Create functions: createUser, getUserById, getUserByEmail, updateUser, deleteUser, listUsers, restoreUser
    - Implement soft delete by setting is_active to false
    - Enforce email uniqueness constraint
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 28.1_

  - [ ]* 7.2 Write property tests for user operations
    - **Property 11: User update reflects changes**
    - **Property 12: User deletion is soft delete**
    - **Property 13: Inactive users cannot login**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [x] 7.3 Implement user management endpoints
    - Create GET /users endpoint with view_all_users permission
    - Create GET /users/:id endpoint
    - Create POST /users endpoint with create_user permission
    - Create PUT /users/:id endpoint with update_user permission
    - Create DELETE /users/:id endpoint with delete_user permission
    - Create POST /users/:id/restore endpoint with restore_deleted_records permission
    - _Requirements: 4.1, 4.3, 4.4, 28.5_

  - [ ]* 7.4 Write property test for soft delete behavior
    - **Property 79: Soft deleted records excluded by default**
    - **Property 80: View deleted permission includes soft deleted**
    - **Property 81: Restore permission allows undelete**
    - **Validates: Requirements 28.3, 28.4, 28.5**


- [ ] 8. Project service and endpoints
  - [x] 8.1 Implement project CRUD service functions
    - Create functions: createProject, getProjectById, listProjects, updateProject, deleteProject
    - Set creator as project owner (created_by field)
    - Implement soft delete with deleted_at timestamp
    - Track created_at and updated_at timestamps
    - _Requirements: 5.1, 5.2, 5.3, 28.2_

  - [ ]* 8.2 Write property tests for project creation
    - **Property 14: Project creation includes required fields**
    - **Property 15: Project creator is owner**
    - **Property 78: Project soft delete sets timestamp**
    - **Validates: Requirements 5.1, 5.2, 5.3, 28.2**

  - [x] 8.3 Implement project membership functions
    - Create functions: addUserToProject, removeUserFromProject, getProjectMembers, isUserAssigned
    - Store membership in project_users table
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 8.4 Write property tests for project membership
    - **Property 18: Project owner can add members**
    - **Property 19: Project owner can remove members**
    - **Property 20: Adding user creates project membership record**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 8.5 Implement project access control logic
    - Verify user is assigned to project or has view_all_projects permission
    - Return 403 if user lacks access
    - _Requirements: 6.4, 6.5_


  - [ ]* 8.6 Write property tests for project access control
    - **Property 16: View all projects permission returns all**
    - **Property 17: Without view all, only assigned projects returned**
    - **Property 21: Project access requires assignment or permission**
    - **Validates: Requirements 5.4, 5.5, 6.4, 6.5**

  - [x] 8.7 Implement project endpoints
    - Create GET /projects endpoint (returns assigned or all based on permission)
    - Create GET /projects/:id endpoint with access control
    - Create POST /projects endpoint with create_project permission
    - Create PUT /projects/:id endpoint (owner or update_any_project permission)
    - Create DELETE /projects/:id endpoint (owner or delete_any_project permission)
    - Create POST /projects/:id/members endpoint (owner only)
    - Create DELETE /projects/:id/members/:user_id endpoint (owner only)
    - _Requirements: 5.1, 5.4, 5.5, 6.1, 6.2, 7.1, 7.2_

  - [ ]* 8.8 Write property tests for project modification
    - **Property 22: Authorized users can update projects**
    - **Property 23: Authorized users can delete projects**
    - **Property 24: Project update advances timestamp**
    - **Property 25: Project deletion cascades to tasks and comments**
    - **Property 26: Unauthorized users cannot modify projects**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [ ] 9. Checkpoint - Ensure project tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 10. Task service and endpoints
  - [x] 10.1 Implement task CRUD service functions
    - Create functions: createTask, getTaskById, listTasks, updateTask, deleteTask
    - Default status to "todo" on creation
    - Validate status is one of: "todo", "in_progress", "done"
    - Track created_by, created_at, and updated_at
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [ ]* 10.2 Write property tests for task creation
    - **Property 27: Assigned users can create tasks**
    - **Property 28: Task creation defaults status to todo**
    - **Property 29: Task status must be valid enum value**
    - **Property 31: Task creation includes required fields**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

  - [x] 10.3 Implement task assignment logic
    - Allow setting assigned_to field for users with assign_task permission
    - Verify assigned user is a project member
    - _Requirements: 8.4_

  - [ ]* 10.4 Write property test for task assignment
    - **Property 30: Authorized users can assign tasks**
    - **Validates: Requirements 8.4**

  - [x] 10.5 Implement task update permissions
    - Task assignee can update status only
    - Project owner can update all fields
    - Users with update_any_task permission can update all fields
    - _Requirements: 9.1, 9.2, 22.1, 22.3_


  - [ ]* 10.6 Write property tests for task updates
    - **Property 32: Task assignee can update status**
    - **Property 33: Update any task permission allows all updates**
    - **Property 34: Task update advances timestamp**
    - **Property 35: Unauthorized users cannot update tasks**
    - **Property 65: Project owner can update all task fields**
    - **Property 66: Task assignee can only update status**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5, 22.1, 22.3**

  - [x] 10.7 Implement task filtering
    - Support filtering by status (single or multiple values)
    - Support filtering by assignee (user_id)
    - Support combining multiple filters with AND logic
    - Return all tasks when no filters provided
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5_

  - [ ]* 10.8 Write property tests for task filtering
    - **Property 73: Status filter returns matching tasks**
    - **Property 74: Assignee filter returns matching tasks**
    - **Property 75: Multiple filters use AND logic**
    - **Property 76: No filters returns all tasks**
    - **Property 77: Multiple status values use OR logic**
    - **Validates: Requirements 27.1, 27.2, 27.3, 27.4, 27.5**

  - [x] 10.9 Implement task endpoints
    - Create GET /projects/:project_id/tasks endpoint with filtering
    - Create GET /tasks/:id endpoint
    - Create POST /projects/:project_id/tasks endpoint
    - Create PUT /tasks/:id endpoint with permission checks
    - Create DELETE /tasks/:id endpoint
    - _Requirements: 8.1, 9.1, 9.2, 27.1_


- [ ] 11. Comment service and endpoints
  - [x] 11.1 Implement comment service functions
    - Create functions: addComment, getComments
    - Verify user is assigned to project before allowing comment
    - Return comments in chronological order (created_at ASC)
    - Include commenter name in response (join with users table)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 11.2 Write property tests for comments
    - **Property 36: Assigned users can create comments**
    - **Property 37: Comment creation includes required fields**
    - **Property 38: Comments returned in chronological order**
    - **Property 39: Comments include commenter name**
    - **Property 40: Non-assigned users cannot comment**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

  - [x] 11.2 Implement comment endpoints
    - Create POST /tasks/:id/comments endpoint
    - Create GET /tasks/:id/comments endpoint (included in task detail)
    - _Requirements: 10.1, 10.3_

- [ ] 12. Audit service and endpoints
  - [ ] 12.1 Implement audit logging service
    - Create functions: logImpersonation, logUserAction, logPermissionChange, getAuditLogs
    - Store logs with performed_by, action, details, and created_at
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 12.2 Write property test for audit logging
    - **Property 43: Admin actions create audit logs**
    - **Property 44: Audit logs returned in reverse chronological order**
    - **Validates: Requirements 12.2, 12.3, 12.4**


  - [x] 12.3 Implement audit log endpoint
    - Create GET /audit-logs endpoint with view_audit_logs permission
    - Support pagination with limit and offset
    - Return logs in descending chronological order
    - _Requirements: 12.4_

- [ ] 13. Password reset implementation
  - [x] 13.1 Implement password reset token generation
    - Create POST /auth/request-reset endpoint
    - Generate unique reset token with 1-hour expiration
    - Store token hash in password_reset_tokens table
    - _Requirements: 26.1, 26.2_

  - [ ]* 13.2 Write property tests for password reset tokens
    - **Property 68: Password reset token has one hour expiration**
    - **Property 69: Password reset creates database record**
    - **Validates: Requirements 26.1, 26.2**

  - [x] 13.3 Implement password reset endpoint
    - Create POST /auth/reset-password endpoint
    - Verify token is valid and not expired
    - Update user password with bcrypt hash
    - Mark token as used to prevent reuse
    - _Requirements: 26.3, 26.4, 26.5_

  - [ ]* 13.4 Write property tests for password reset
    - **Property 70: Expired reset tokens rejected**
    - **Property 71: Valid reset updates password**
    - **Property 72: Reset token single use**
    - **Validates: Requirements 26.3, 26.4, 26.5**


- [ ] 14. API validation and error handling
  - [ ] 14.1 Implement request validation middleware
    - Create validation schemas for all endpoints using express-validator
    - Validate required fields are present
    - Validate field types match expected types
    - Validate string length constraints
    - Return 400 Bad Request with descriptive errors on validation failure
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ]* 14.2 Write property tests for validation
    - **Property 47: Missing required fields return 400**
    - **Property 48: Wrong field types return 400**
    - **Property 49: Excessive string length rejected**
    - **Validates: Requirements 15.1, 15.2, 15.3**

  - [ ] 14.3 Implement standardized error handling middleware
    - Create global error handler middleware
    - Return consistent JSON error format with success, error, and timestamp fields
    - Map error types to appropriate HTTP status codes
    - Log all errors with timestamp, message, and stack trace
    - _Requirements: 21.2, 21.3, 25.1, 25.2, 25.3, 25.4, 25.5_

  - [ ]* 14.4 Write property tests for error responses
    - **Property 62: Error response has standard structure**
    - **Property 63: HTTP status codes match outcomes**
    - **Property 67: Not found returns 404**
    - **Validates: Requirements 21.2, 21.3, 25.3**


  - [ ] 14.5 Implement standardized success response format
    - Create response helper functions
    - Return JSON with success, data, message, and timestamp fields
    - Set appropriate HTTP status codes (200, 201)
    - Set Content-Type header to "application/json"
    - _Requirements: 21.1, 21.4, 21.5_

  - [ ]* 14.6 Write property tests for success responses
    - **Property 61: Success response has standard structure**
    - **Property 64: All responses include ISO 8601 timestamp**
    - **Property 86: JSON responses have correct Content-Type**
    - **Validates: Requirements 21.1, 21.4, 21.5, 30.5**

  - [ ] 14.7 Implement JSON parsing and validation
    - Use express.json() middleware for parsing
    - Handle malformed JSON with 400 error
    - _Requirements: 30.1, 30.2_

  - [ ]* 14.8 Write property tests for JSON handling
    - **Property 82: Valid JSON parses successfully**
    - **Property 83: Malformed JSON returns 400**
    - **Property 84: Response objects serialized to JSON**
    - **Property 85: JSON round-trip preserves structure**
    - **Validates: Requirements 30.1, 30.2, 30.3, 30.4**

- [ ] 15. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 16. Frontend authentication implementation
  - [x] 16.1 Create authentication context
    - Implement AuthContext with user, token, isAuthenticated, isImpersonating state
    - Provide login, logout, impersonate, exitImpersonation functions
    - Store JWT token in localStorage
    - Load token from localStorage on app initialization
    - _Requirements: 16.1, 16.2, 16.3_

  - [x] 16.2 Create API service module
    - Implement axios wrapper with base URL configuration
    - Attach JWT token to all requests via Authorization header
    - Handle 401 responses by clearing auth state and redirecting to login
    - Parse and return standardized API responses
    - _Requirements: 16.5_

  - [x] 16.3 Implement login page and form
    - Create LoginForm component with email and password inputs
    - Validate inputs before submission
    - Display error messages from API
    - Redirect to dashboard on successful login
    - _Requirements: 1.1, 1.2_

  - [x] 16.4 Implement logout functionality
    - Clear JWT token from localStorage
    - Clear authentication context
    - Redirect to login page
    - _Requirements: 16.4_

  - [x] 16.5 Implement password reset flow
    - Create PasswordResetForm component for requesting reset
    - Create ResetPasswordForm component for setting new password
    - _Requirements: 26.1, 26.3_


- [ ] 17. Frontend routing and navigation
  - [x] 17.1 Set up React Router
    - Configure routes for all pages: login, dashboard, project list, project detail, task detail, admin panel
    - Implement ProtectedRoute component that requires authentication
    - Implement AdminRoute component that requires admin role
    - _Requirements: 17.1, 17.2_

  - [x] 17.2 Create navigation header component
    - Display user name and role
    - Show navigation links based on permissions
    - Hide "Admin Panel" link if user lacks create_user permission
    - Include logout button
    - _Requirements: 17.2_

  - [x] 17.3 Implement impersonation banner
    - Display banner when in impersonation session
    - Show "You are impersonating [user_name]" message
    - Include exit impersonation button
    - _Requirements: 17.5_

  - [ ]* 17.4 Write unit tests for role-based UI rendering
    - **Property 51: UI hides actions without permission**
    - **Property 52: Impersonation banner displays during session**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**


- [ ] 18. Frontend project management
  - [x] 18.1 Create project dashboard page
    - Display list of user's projects (assigned or all based on permission)
    - Show project name, description, and task count for each project
    - Sort projects by updated_at descending
    - Show "Create Project" button if user has create_project permission
    - _Requirements: 18.1, 18.2, 18.3, 18.5_

  - [ ]* 18.2 Write unit tests for dashboard
    - **Property 53: Dashboard shows only assigned projects**
    - **Property 54: Dashboard includes project metadata**
    - **Property 55: Projects sorted by updated time**
    - **Validates: Requirements 18.1, 18.3, 18.5**

  - [x] 18.3 Create project detail page
    - Display project name, description, and creator information
    - Show all tasks grouped by status: todo, in_progress, done
    - Display task title, description, assignee name, and created_at
    - Show "Create Task" button if user is assigned to project
    - Show "Assign" button for each task if user has assign_task permission
    - Show "Delete Project" button if user is owner or has delete_any_project permission
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

  - [ ]* 18.4 Write unit tests for project detail
    - **Property 56: Project detail shows required fields**
    - **Property 57: Tasks grouped by status**
    - **Property 58: Task display includes required fields**
    - **Property 59: Assign button visible with permission**
    - **Property 60: Create task button visible for assigned users**
    - **Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5**


  - [x] 18.5 Create project form component
    - Implement form for creating and editing projects
    - Include name and description fields
    - Validate required fields
    - Display validation errors
    - _Requirements: 5.1, 7.1_

  - [x] 18.6 Create project member management component
    - Display list of project members
    - Allow project owner to add members (user selection dropdown)
    - Allow project owner to remove members
    - _Requirements: 6.1, 6.2_

- [ ] 19. Frontend task management
  - [x] 19.1 Create task board component
    - Display tasks in three columns: Todo, In Progress, Done
    - Show task cards with title, description, and assignee
    - Allow clicking task to view details
    - _Requirements: 19.2, 19.3_

  - [x] 19.2 Create task detail page
    - Display task title, description, status, assignee, and creator
    - Show all comments in chronological order
    - Allow task assignee to update status
    - Allow project owner to update all fields
    - Show comment form for assigned users
    - _Requirements: 9.1, 10.1, 10.3, 22.1, 22.3_

  - [x] 19.3 Create task form component
    - Implement form for creating and editing tasks
    - Include title, description, status, and assignee fields
    - Validate required fields
    - Restrict field editing based on user permissions
    - _Requirements: 8.1, 9.1, 22.3_


  - [~] 19.4 Create task status selector component
    - Display dropdown with three status options: todo, in_progress, done
    - Update task status on selection
    - Disable if user lacks permission to update
    - _Requirements: 8.3, 9.1_

  - [~] 19.5 Create task comments component
    - Display all comments with commenter name and timestamp
    - Show comment form at bottom
    - Submit new comments via API
    - _Requirements: 10.1, 10.3, 10.4_

  - [~] 19.6 Implement task filtering UI
    - Add filter controls for status and assignee
    - Support multiple status selections
    - Update task list based on selected filters
    - _Requirements: 27.1, 27.2, 27.3_

- [ ] 20. Frontend admin panel
  - [~] 20.1 Create user management page
    - Display list of all users with name, email, role, and status
    - Show "Create User" button
    - Show "Impersonate" button for each user (admin only)
    - Show "Edit" and "Delete" buttons for each user
    - _Requirements: 4.1, 4.3, 4.4, 3.1_

  - [~] 20.2 Create user form component
    - Implement form for creating and editing users
    - Include name, email, password, and role fields
    - Validate email format and password length
    - _Requirements: 4.1, 4.3, 13.3, 13.4_


  - [~] 20.3 Create audit logs page
    - Display audit logs in table format
    - Show performed_by, action, impersonated_user, and timestamp
    - Implement pagination with limit and offset
    - Sort by timestamp descending
    - _Requirements: 12.4_

  - [~] 20.4 Implement impersonation UI flow
    - Add impersonate action to user list
    - Show confirmation dialog before impersonating
    - Display impersonation banner after successful impersonation
    - Provide exit impersonation button in banner
    - _Requirements: 3.1, 3.4, 17.5_

- [ ] 21. Frontend common components
  - [x] 21.1 Create reusable form components
    - Implement Input component with validation display
    - Implement Select component for dropdowns
    - Implement Button component with loading state
    - Implement ErrorMessage component for displaying errors

  - [x] 21.2 Create loading and error states
    - Implement LoadingSpinner component
    - Implement ErrorBoundary component
    - Display loading states during API calls
    - Display error messages from API failures

  - [x] 21.3 Implement toast notifications
    - Create toast notification system for success/error messages
    - Show toast on successful operations (create, update, delete)
    - Show toast on API errors

- [ ] 22. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.


- [ ] 23. Docker deployment setup
  - [x] 23.1 Create backend Dockerfile
    - Use node:18-alpine base image
    - Copy package files and install production dependencies
    - Copy application code
    - Expose port 3000
    - Set CMD to start server
    - _Requirements: 23.1_

  - [x] 23.2 Create frontend Dockerfile
    - Use multi-stage build with node:18-alpine for building
    - Build production React bundle
    - Use nginx:alpine for serving
    - Copy built files to nginx
    - Copy nginx configuration
    - Expose port 80
    - _Requirements: 23.1_

  - [x] 23.3 Create docker-compose.yml
    - Define three services: database, backend, frontend
    - Configure MySQL service on port 3306
    - Configure backend service on port 3000 with database dependency
    - Configure frontend service on port 80 with backend dependency
    - Set up environment variables for all services
    - Create shared network for services
    - Define volume for database persistence
    - _Requirements: 23.2, 23.3, 23.4, 23.5_

  - [x] 23.4 Create nginx configuration
    - Configure static file serving for React app
    - Set up proxy for /api requests to backend
    - Add security headers
    - Enable gzip compression
    - _Requirements: 23.1_


  - [x] 23.5 Create database initialization script
    - Write init.sql with complete schema creation
    - Include all seed data (roles, permissions, role_permissions, default users)
    - Configure script to run on database container startup
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [~] 23.6 Create environment configuration files
    - Create .env.example with all required variables documented
    - Document database, JWT, bcrypt, and server configuration
    - Add instructions for generating secure secrets
    - _Requirements: 29.2, 29.3_

- [ ] 24. Documentation
  - [x] 24.1 Create API documentation
    - Document all endpoints with method, path, headers, request body, and response
    - Document required permissions for each endpoint
    - Provide example requests and responses
    - Document JWT token format and usage
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5_

  - [~] 24.2 Create deployment documentation
    - Document Docker setup and deployment steps
    - Document environment variable configuration
    - Document database migration and seeding
    - Document development and production deployment
    - _Requirements: 23.2, 23.3, 23.4_

  - [~] 24.3 Create README.md
    - Provide project overview and features
    - Document technology stack
    - Include setup instructions for development
    - Include Docker deployment instructions
    - Document default user credentials
    - _Requirements: 24.1_


- [ ] 25. Integration and final testing
  - [~] 25.1 Set up integration test environment
    - Configure test database
    - Create test data fixtures
    - Set up test utilities for API requests

  - [ ]* 25.2 Write integration tests for authentication flow
    - Test complete login flow from request to token generation
    - Test impersonation flow with audit logging
    - Test password reset flow end-to-end

  - [ ]* 25.3 Write integration tests for project workflow
    - Test project creation, member assignment, and task creation
    - Test project access control across different user roles
    - Test cascade delete when project is deleted

  - [ ]* 25.4 Write integration tests for task workflow
    - Test task creation, assignment, and status updates
    - Test task filtering with multiple criteria
    - Test comment creation and retrieval

  - [ ]* 25.5 Write integration tests for permission system
    - Test permission checks across all endpoints
    - Test impersonation permission evaluation
    - Test role-based access control

  - [~] 25.6 Perform end-to-end testing
    - Test complete user workflows in browser
    - Verify all UI components render correctly
    - Test error handling and edge cases
    - Verify Docker deployment works correctly

- [ ] 26. Final checkpoint - Complete system verification
  - Ensure all tests pass, ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests verify components work together correctly
- The implementation follows a bottom-up approach: database → backend services → API endpoints → frontend components
- All property tests reference their corresponding property number from the design document
- Docker deployment enables consistent environments across development and production
- The seed script creates default users for immediate testing after deployment

## Default User Credentials (After Seeding)

- Admin: admin@example.com / admin123
- Project Manager: pm@example.com / pm123
- User 1: user1@example.com / user123
- User 2: user2@example.com / user123

## Technology Stack Summary

- Backend: Node.js 18, Express.js, mysql2, bcrypt, jsonwebtoken
- Frontend: React 18, React Router, Axios
- Database: MySQL 8.0
- Testing: Jest, fast-check (property-based testing)
- Deployment: Docker, Docker Compose, Nginx
