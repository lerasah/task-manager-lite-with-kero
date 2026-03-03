# Requirements Document

## Introduction

This document specifies the requirements for a multi-user task management system (Jira-lite) that enables teams to manage projects, tasks, and user permissions. The system provides role-based access control, admin impersonation capabilities, and a web-based interface for task tracking and collaboration.

## Glossary

- **System**: The complete task management application including backend API and frontend UI
- **Auth_Service**: The authentication and authorization service handling JWT tokens
- **User_Service**: The service managing user accounts and profiles
- **Project_Service**: The service managing projects and project membership
- **Task_Service**: The service managing tasks within projects
- **Permission_Service**: The service evaluating user permissions
- **Audit_Service**: The service logging administrative actions
- **Database**: The MySQL database storing all application data
- **Admin**: A user with the admin role having full system access
- **Project_Manager**: A user with the project manager role who can create and manage projects
- **Regular_User**: A user with the user role having limited access to assigned projects
- **JWT_Token**: JSON Web Token used for authentication
- **Impersonation_Session**: A session where an Admin acts as another user
- **Project_Owner**: The user who created a project
- **Assigned_User**: A user who has been granted access to a specific project
- **Task_Assignee**: The user assigned to complete a specific task

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to log in with my email and password, so that I can access the system securely.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THE Auth_Service SHALL generate a JWT_Token containing user_id and role_id
2. WHEN a user submits invalid credentials, THE Auth_Service SHALL return an authentication error within 200ms
3. THE Auth_Service SHALL hash all passwords using bcrypt with a cost factor of 10 before storing in the Database
4. THE JWT_Token SHALL expire after 24 hours from issuance
5. WHEN a JWT_Token is expired, THE Auth_Service SHALL reject authentication requests with an expired token error

### Requirement 2: Role-Based Access Control

**User Story:** As a system administrator, I want users to have different roles with specific permissions, so that access is properly controlled.

#### Acceptance Criteria

1. THE System SHALL support exactly three roles: admin, project_manager, and user
2. WHEN a user is created, THE User_Service SHALL assign exactly one role to that user
3. THE Permission_Service SHALL load all role permissions into memory at application startup
4. WHEN evaluating access, THE Permission_Service SHALL check permissions rather than role names
5. THE Database SHALL store the mapping between roles and permissions in the Role_Permissions table

### Requirement 3: Admin Impersonation

**User Story:** As an admin, I want to impersonate other users, so that I can troubleshoot issues from their perspective.

#### Acceptance Criteria

1. WHERE the requesting user has admin role, WHEN an impersonation request is submitted, THE Auth_Service SHALL generate a JWT_Token containing both original_admin_id and impersonated_user_id
2. WHEN an Admin initiates impersonation, THE Audit_Service SHALL log the action with admin_id, impersonated_user_id, and timestamp
3. WHILE an Impersonation_Session is active, THE System SHALL apply the permissions of the impersonated user
4. WHEN an Admin exits impersonation, THE Auth_Service SHALL generate a new JWT_Token containing only the admin's user_id
5. IF a non-admin user attempts impersonation, THEN THE Auth_Service SHALL return a permission denied error

### Requirement 4: User Management

**User Story:** As an admin, I want to create and manage user accounts, so that I can control who has access to the system.

#### Acceptance Criteria

1. WHERE the requesting user has create_user permission, THE User_Service SHALL create a new user with name, email, password_hash, and role_id
2. THE User_Service SHALL enforce unique email addresses across all users
3. WHERE the requesting user has update_user permission, THE User_Service SHALL allow updating user name, email, role_id, and is_active status
4. WHERE the requesting user has delete_user permission, THE User_Service SHALL mark users as inactive rather than deleting records
5. WHEN a user is marked inactive, THE Auth_Service SHALL reject login attempts for that user

### Requirement 5: Project Creation and Ownership

**User Story:** As a project manager, I want to create projects, so that I can organize tasks for my team.

#### Acceptance Criteria

1. WHERE the requesting user has create_project permission, THE Project_Service SHALL create a new project with name, description, and created_by fields
2. WHEN a project is created, THE Project_Service SHALL set the creator as the Project_Owner
3. THE Project_Service SHALL record created_at and updated_at timestamps for all projects
4. WHERE the requesting user has view_all_projects permission, THE Project_Service SHALL return all projects in the Database
5. WHERE the requesting user does not have view_all_projects permission, THE Project_Service SHALL return only projects where the user is an Assigned_User

### Requirement 6: Project Access Control

**User Story:** As a project manager, I want to assign users to my projects, so that they can view and work on tasks.

#### Acceptance Criteria

1. WHERE the requesting user is the Project_Owner, THE Project_Service SHALL allow adding Assigned_Users to the project
2. WHERE the requesting user is the Project_Owner, THE Project_Service SHALL allow removing Assigned_Users from the project
3. THE Database SHALL store project membership in the Project_Users table with project_id, user_id, and role_in_project
4. WHEN a user requests project details, THE Project_Service SHALL verify the user is either an Assigned_User or has view_all_projects permission
5. IF a user is not an Assigned_User and lacks view_all_projects permission, THEN THE Project_Service SHALL return a permission denied error

### Requirement 7: Project Modification

**User Story:** As a project owner, I want to update and delete my projects, so that I can maintain accurate project information.

#### Acceptance Criteria

1. WHERE the requesting user is the Project_Owner or has update_any_project permission, THE Project_Service SHALL allow updating project name and description
2. WHERE the requesting user is the Project_Owner or has delete_any_project permission, THE Project_Service SHALL allow deleting the project
3. WHEN a project is updated, THE Project_Service SHALL update the updated_at timestamp
4. WHEN a project is deleted, THE Project_Service SHALL also delete all associated tasks and comments
5. IF the requesting user is not the Project_Owner and lacks the required permission, THEN THE Project_Service SHALL return a permission denied error

### Requirement 8: Task Creation and Assignment

**User Story:** As a project member, I want to create and assign tasks, so that work can be tracked and distributed.

#### Acceptance Criteria

1. WHERE the requesting user is an Assigned_User of the project, THE Task_Service SHALL allow creating tasks with title, description, and status
2. WHEN a task is created, THE Task_Service SHALL set status to "todo" by default
3. THE Task_Service SHALL support exactly three status values: "todo", "in_progress", and "done"
4. WHERE the requesting user has assign_task permission, THE Task_Service SHALL allow setting the assigned_to field to any Assigned_User of the project
5. WHEN a task is created, THE Task_Service SHALL record created_by, created_at, and updated_at fields

### Requirement 9: Task Status Management

**User Story:** As a user, I want to update the status of my assigned tasks, so that I can track my progress.

#### Acceptance Criteria

1. WHERE the requesting user is the Task_Assignee, THE Task_Service SHALL allow updating the task status
2. WHERE the requesting user has update_any_task permission, THE Task_Service SHALL allow updating any task status
3. WHEN a task status is updated, THE Task_Service SHALL update the updated_at timestamp
4. THE Task_Service SHALL validate that status transitions are to one of the three allowed values: "todo", "in_progress", or "done"
5. IF the requesting user is not the Task_Assignee and lacks update_any_task permission, THEN THE Task_Service SHALL return a permission denied error

### Requirement 10: Task Comments

**User Story:** As a project member, I want to comment on tasks, so that I can collaborate with my team.

#### Acceptance Criteria

1. WHERE the requesting user is an Assigned_User of the project containing the task, THE Task_Service SHALL allow creating comments with content
2. WHEN a comment is created, THE Task_Service SHALL record user_id, task_id, content, and created_at
3. THE Task_Service SHALL return all comments for a task in chronological order by created_at
4. THE Task_Service SHALL include the commenter's name with each comment
5. IF the requesting user is not an Assigned_User of the project, THEN THE Task_Service SHALL return a permission denied error

### Requirement 11: Permission Evaluation

**User Story:** As a developer, I want a consistent permission checking mechanism, so that access control is enforced uniformly.

#### Acceptance Criteria

1. THE Permission_Service SHALL provide a middleware function that accepts a permission name as input
2. WHEN the middleware is invoked, THE Permission_Service SHALL extract the user_id from the JWT_Token
3. THE Permission_Service SHALL verify the user's role has the requested permission
4. IF the user's role lacks the requested permission, THEN THE Permission_Service SHALL return a 403 Forbidden response
5. WHILE an Impersonation_Session is active, THE Permission_Service SHALL evaluate permissions based on the impersonated user's role

### Requirement 12: Audit Logging

**User Story:** As an admin, I want to view audit logs of administrative actions, so that I can track system changes.

#### Acceptance Criteria

1. WHEN an Admin performs impersonation, THE Audit_Service SHALL log the action with performed_by, impersonated_user_id, and created_at
2. WHEN an Admin creates, updates, or deletes a user, THE Audit_Service SHALL log the action with performed_by, action description, and created_at
3. WHEN an Admin modifies role permissions, THE Audit_Service SHALL log the action with performed_by, action description, and created_at
4. WHERE the requesting user has view_audit_logs permission, THE Audit_Service SHALL return audit logs ordered by created_at descending
5. THE Audit_Service SHALL retain all audit logs indefinitely

### Requirement 13: Authentication Security

**User Story:** As a security-conscious user, I want the system to protect against brute force attacks, so that accounts remain secure.

#### Acceptance Criteria

1. THE Auth_Service SHALL implement rate limiting allowing a maximum of 5 login attempts per email address per 15-minute window
2. WHEN the rate limit is exceeded, THE Auth_Service SHALL return a rate limit error and reject further attempts for the remainder of the window
3. THE Auth_Service SHALL validate that email addresses conform to standard email format before processing
4. THE Auth_Service SHALL validate that passwords are at least 8 characters in length
5. THE System SHALL transmit all authentication requests over HTTPS only

### Requirement 14: Database Schema Integrity

**User Story:** As a developer, I want a well-structured database schema, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Database SHALL enforce a unique constraint on the Users.email field
2. THE Database SHALL enforce foreign key constraints between Project_Users.project_id and Projects.id
3. THE Database SHALL enforce foreign key constraints between Project_Users.user_id and Users.id
4. THE Database SHALL enforce foreign key constraints between Tasks.project_id and Projects.id
5. THE Database SHALL enforce foreign key constraints between Tasks.assigned_to and Users.id
6. THE Database SHALL enforce foreign key constraints between Comments.task_id and Tasks.id
7. THE Database SHALL enforce foreign key constraints between Comments.user_id and Users.id
8. THE Database SHALL enforce foreign key constraints between Role_Permissions.role_id and Roles.id
9. THE Database SHALL enforce foreign key constraints between Role_Permissions.permission_id and Permissions.id

### Requirement 15: API Input Validation

**User Story:** As a developer, I want all API inputs validated, so that invalid data is rejected before processing.

#### Acceptance Criteria

1. WHEN an API endpoint receives a request, THE System SHALL validate all required fields are present
2. WHEN an API endpoint receives a request, THE System SHALL validate field types match expected types
3. WHEN an API endpoint receives a request with string fields, THE System SHALL validate maximum length constraints
4. IF validation fails, THEN THE System SHALL return a 400 Bad Request response with descriptive error messages
5. THE System SHALL sanitize all string inputs to prevent SQL injection attacks

### Requirement 16: Frontend Authentication State

**User Story:** As a frontend developer, I want to manage authentication state, so that the UI reflects the user's login status.

#### Acceptance Criteria

1. WHEN a user successfully logs in, THE System SHALL store the JWT_Token in browser local storage
2. WHEN the application loads, THE System SHALL check for a valid JWT_Token in local storage
3. IF a valid JWT_Token exists, THEN THE System SHALL extract user_id and role_id and populate the authentication context
4. WHEN a user logs out, THE System SHALL remove the JWT_Token from local storage
5. WHEN an API request returns a 401 Unauthorized response, THE System SHALL clear the authentication context and redirect to the login page

### Requirement 17: Role-Based UI Rendering

**User Story:** As a user, I want to see only the UI controls I have permission to use, so that the interface is not confusing.

#### Acceptance Criteria

1. WHERE the user lacks create_project permission, THE System SHALL hide the "Create Project" button
2. WHERE the user lacks create_user permission, THE System SHALL hide the "Admin Panel" navigation item
3. WHERE the user is not the Project_Owner and lacks delete_any_project permission, THE System SHALL hide the "Delete Project" button
4. WHERE the user lacks impersonate_user permission, THE System SHALL hide the "Impersonate" action in the user list
5. WHILE an Impersonation_Session is active, THE System SHALL display a banner showing "You are impersonating [user_name]" with an exit button

### Requirement 18: Project Dashboard

**User Story:** As a user, I want to see a dashboard of my projects, so that I can quickly access my work.

#### Acceptance Criteria

1. WHEN a user navigates to the dashboard, THE System SHALL display all projects where the user is an Assigned_User
2. WHERE the user has view_all_projects permission, THE System SHALL display all projects in the Database
3. THE System SHALL display project name, description, and task count for each project
4. WHEN a user clicks on a project, THE System SHALL navigate to the project detail page
5. THE System SHALL sort projects by updated_at descending

### Requirement 19: Project Detail View

**User Story:** As a project member, I want to view project details and tasks, so that I can see the current state of work.

#### Acceptance Criteria

1. WHEN a user navigates to a project detail page, THE System SHALL display project name, description, and created_by information
2. THE System SHALL display all tasks for the project grouped by status: "todo", "in_progress", and "done"
3. THE System SHALL display task title, description, assigned_to name, and created_at for each task
4. WHERE the user has assign_task permission, THE System SHALL display an "Assign" button for each task
5. WHERE the user is an Assigned_User, THE System SHALL display a "Create Task" button

### Requirement 20: Database Seeding

**User Story:** As a developer, I want a seed script to populate initial data, so that I can quickly set up a development environment.

#### Acceptance Criteria

1. THE System SHALL provide a seed script that creates the three required roles: admin, project_manager, and user
2. THE seed script SHALL create default permissions and associate them with appropriate roles
3. THE seed script SHALL create 1 Admin user with email "admin@example.com" and password "admin123"
4. THE seed script SHALL create 1 Project_Manager user with email "pm@example.com" and password "pm123"
5. THE seed script SHALL create 2 Regular_User accounts with emails "user1@example.com" and "user2@example.com" and password "user123"
6. THE seed script SHALL be idempotent, allowing multiple executions without creating duplicate data

### Requirement 21: API Response Format

**User Story:** As a frontend developer, I want consistent API response formats, so that I can handle responses uniformly.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE System SHALL return a JSON response with a "success" field set to true and a "data" field containing the result
2. WHEN an API request fails, THE System SHALL return a JSON response with a "success" field set to false and an "error" field containing the error message
3. THE System SHALL return appropriate HTTP status codes: 200 for success, 201 for creation, 400 for validation errors, 401 for authentication errors, 403 for permission errors, 404 for not found, 500 for server errors
4. THE System SHALL include a "message" field in success responses describing the operation performed
5. THE System SHALL include a "timestamp" field in all responses with ISO 8601 format

### Requirement 22: Task Update Permissions

**User Story:** As a project manager, I want to update any task in my projects, so that I can maintain accurate task information.

#### Acceptance Criteria

1. WHERE the requesting user is the Project_Owner, THE Task_Service SHALL allow updating task title, description, status, and assigned_to
2. WHERE the requesting user has update_any_task permission, THE Task_Service SHALL allow updating any task field
3. WHERE the requesting user is the Task_Assignee, THE Task_Service SHALL allow updating only the status field
4. WHEN a task is updated, THE Task_Service SHALL update the updated_at timestamp
5. IF the requesting user lacks the required permission, THEN THE Task_Service SHALL return a permission denied error

### Requirement 23: Docker Deployment

**User Story:** As a developer, I want Docker support, so that I can easily deploy the application.

#### Acceptance Criteria

1. THE System SHALL provide a Dockerfile for the backend service
2. THE System SHALL provide a docker-compose.yml file that orchestrates the backend service and MySQL database
3. WHEN docker-compose is executed, THE System SHALL start the MySQL database on port 3306
4. WHEN docker-compose is executed, THE System SHALL start the backend service on port 3000
5. THE docker-compose configuration SHALL include environment variables for database connection: host, port, username, password, and database name

### Requirement 24: API Documentation

**User Story:** As a developer, I want API documentation, so that I understand how to use the endpoints.

#### Acceptance Criteria

1. THE System SHALL provide a README.md file documenting all API endpoints
2. THE README SHALL document the request method, path, required headers, request body schema, and response schema for each endpoint
3. THE README SHALL document the required permissions for each endpoint
4. THE README SHALL provide example requests and responses for each endpoint
5. THE README SHALL document the JWT_Token format and how to include it in requests

### Requirement 25: Error Handling

**User Story:** As a user, I want clear error messages, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN a database connection fails, THE System SHALL return a 500 error with message "Database connection failed"
2. WHEN a required field is missing, THE System SHALL return a 400 error with message "Missing required field: [field_name]"
3. WHEN a resource is not found, THE System SHALL return a 404 error with message "[Resource_type] not found"
4. WHEN a permission check fails, THE System SHALL return a 403 error with message "Permission denied: [permission_name] required"
5. THE System SHALL log all errors to the console with timestamp, error message, and stack trace

### Requirement 26: Password Reset

**User Story:** As a user, I want to reset my password if I forget it, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user requests a password reset, THE Auth_Service SHALL generate a unique reset token valid for 1 hour
2. THE Auth_Service SHALL store the reset token hash in the Database associated with the user account
3. WHEN a user submits a reset token and new password, THE Auth_Service SHALL verify the token is valid and not expired
4. WHEN the token is valid, THE Auth_Service SHALL hash the new password with bcrypt and update the user record
5. WHEN the password is reset, THE Auth_Service SHALL invalidate the reset token

### Requirement 27: Task Filtering

**User Story:** As a user, I want to filter tasks by status and assignee, so that I can find relevant tasks quickly.

#### Acceptance Criteria

1. WHERE a status filter is provided, THE Task_Service SHALL return only tasks matching the specified status
2. WHERE an assignee filter is provided, THE Task_Service SHALL return only tasks assigned to the specified user
3. WHERE multiple filters are provided, THE Task_Service SHALL return tasks matching all filter criteria
4. WHERE no filters are provided, THE Task_Service SHALL return all tasks in the project
5. THE Task_Service SHALL support filtering by multiple status values simultaneously

### Requirement 28: Soft Delete Support

**User Story:** As an admin, I want deleted records to be soft deleted, so that data can be recovered if needed.

#### Acceptance Criteria

1. WHERE soft delete is implemented, THE User_Service SHALL set is_active to false instead of deleting user records
2. WHERE soft delete is implemented, THE Project_Service SHALL set a deleted_at timestamp instead of deleting project records
3. WHEN querying active records, THE System SHALL exclude records where is_active is false or deleted_at is not null
4. WHERE the requesting user has view_deleted_records permission, THE System SHALL include soft deleted records in query results
5. WHERE the requesting user has restore_deleted_records permission, THE System SHALL allow restoring soft deleted records

### Requirement 29: Configuration Management

**User Story:** As a developer, I want environment-based configuration, so that I can deploy to different environments.

#### Acceptance Criteria

1. THE System SHALL load configuration from environment variables
2. THE System SHALL support configuration for: database host, database port, database username, database password, database name, JWT secret, JWT expiration time, bcrypt cost factor, and server port
3. THE System SHALL provide a .env.example file documenting all required environment variables
4. IF a required environment variable is missing, THEN THE System SHALL log an error and exit with a non-zero status code
5. THE System SHALL not commit .env files to version control

### Requirement 30: JSON Parsing and Serialization

**User Story:** As a developer, I want reliable JSON handling, so that API requests and responses are processed correctly.

#### Acceptance Criteria

1. WHEN the System receives a JSON request body, THE System SHALL parse it into a JavaScript object
2. IF the JSON is malformed, THEN THE System SHALL return a 400 error with message "Invalid JSON format"
3. WHEN the System sends a response, THE System SHALL serialize JavaScript objects to JSON format
4. FOR ALL valid JavaScript objects, THE System SHALL ensure that parsing the serialized JSON produces an equivalent object (round-trip property)
5. THE System SHALL set Content-Type header to "application/json" for all JSON responses
