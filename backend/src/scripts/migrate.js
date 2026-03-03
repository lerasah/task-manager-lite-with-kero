require('dotenv').config();
const { getPool, closePool } = require('../config/database');

const createTables = async () => {
  const pool = getPool();
  
  try {
    console.log('Starting database migration...');

    // Create roles table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created roles table');

    // Create permissions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created permissions table');

    // Create role_permissions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_permission (role_id, permission_id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id)`);
    console.log('✓ Created role_permissions table');

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_users_email ON users(email)`);
    await pool.execute(`CREATE INDEX idx_users_role_id ON users(role_id)`);
    await pool.execute(`CREATE INDEX idx_users_is_active ON users(is_active)`);
    console.log('✓ Created users table');

    // Create projects table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_projects_created_by ON projects(created_by)`);
    await pool.execute(`CREATE INDEX idx_projects_deleted_at ON projects(deleted_at)`);
    await pool.execute(`CREATE INDEX idx_projects_updated_at ON projects(updated_at)`);
    console.log('✓ Created projects table');

    // Create project_users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS project_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        user_id INT NOT NULL,
        role_in_project VARCHAR(50) DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_project_user (project_id, user_id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_project_users_project_id ON project_users(project_id)`);
    await pool.execute(`CREATE INDEX idx_project_users_user_id ON project_users(user_id)`);
    console.log('✓ Created project_users table');

    // Create tasks table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
        assigned_to INT,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_tasks_project_id ON tasks(project_id)`);
    await pool.execute(`CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to)`);
    await pool.execute(`CREATE INDEX idx_tasks_status ON tasks(status)`);
    await pool.execute(`CREATE INDEX idx_tasks_created_by ON tasks(created_by)`);
    console.log('✓ Created tasks table');

    // Create comments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_comments_task_id ON comments(task_id)`);
    await pool.execute(`CREATE INDEX idx_comments_user_id ON comments(user_id)`);
    await pool.execute(`CREATE INDEX idx_comments_created_at ON comments(created_at)`);
    console.log('✓ Created comments table');

    // Create audit_logs table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        performed_by INT NOT NULL,
        action VARCHAR(255) NOT NULL,
        impersonated_user_id INT,
        details JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (performed_by) REFERENCES users(id),
        FOREIGN KEY (impersonated_user_id) REFERENCES users(id)
      )
    `);
    await pool.execute(`CREATE INDEX idx_audit_logs_performed_by ON audit_logs(performed_by)`);
    await pool.execute(`CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at)`);
    await pool.execute(`CREATE INDEX idx_audit_logs_impersonated_user_id ON audit_logs(impersonated_user_id)`);
    console.log('✓ Created audit_logs table');

    // Create password_reset_tokens table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await pool.execute(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
    await pool.execute(`CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)`);
    console.log('✓ Created password_reset_tokens table');

    console.log('\n✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await closePool();
  }
};

createTables();
