require('dotenv').config();
const bcrypt = require('bcrypt');
const { getPool, closePool } = require('../config/database');

const seedDatabase = async () => {
  const pool = getPool();
  
  try {
    console.log('Starting database seeding...');

    // Insert roles (idempotent)
    const roles = [
      { name: 'admin', description: 'Full system access including user management and impersonation' },
      { name: 'project_manager', description: 'Can create and manage projects' },
      { name: 'user', description: 'Can participate in assigned projects' }
    ];

    for (const role of roles) {
      await pool.execute(
        'INSERT IGNORE INTO roles (name, description) VALUES (?, ?)',
        [role.name, role.description]
      );
    }
    console.log('✓ Seeded roles');

    // Get role IDs
    const [roleRows] = await pool.execute('SELECT id, name FROM roles');
    const roleMap = {};
    roleRows.forEach(row => roleMap[row.name] = row.id);

    // Insert permissions (idempotent)
    const permissions = [
      { name: 'create_user', description: 'Create new user accounts' },
      { name: 'update_user', description: 'Update user information' },
      { name: 'delete_user', description: 'Delete user accounts' },
      { name: 'view_all_users', description: 'View all users in the system' },
      { name: 'create_project', description: 'Create new projects' },
      { name: 'update_any_project', description: 'Update any project' },
      { name: 'delete_any_project', description: 'Delete any project' },
      { name: 'view_all_projects', description: 'View all projects' },
      { name: 'assign_task', description: 'Assign tasks to users' },
      { name: 'update_any_task', description: 'Update any task' },
      { name: 'impersonate_user', description: 'Impersonate other users' },
      { name: 'view_audit_logs', description: 'View audit logs' },
      { name: 'view_deleted_records', description: 'View soft-deleted records' },
      { name: 'restore_deleted_records', description: 'Restore soft-deleted records' }
    ];

    for (const permission of permissions) {
      await pool.execute(
        'INSERT IGNORE INTO permissions (name, description) VALUES (?, ?)',
        [permission.name, permission.description]
      );
    }
    console.log('✓ Seeded permissions');

    // Get permission IDs
    const [permissionRows] = await pool.execute('SELECT id, name FROM permissions');
    const permissionMap = {};
    permissionRows.forEach(row => permissionMap[row.name] = row.id);

    // Create role-permission mappings (idempotent)
    const rolePermissions = [
      // Admin has all permissions
      { role: 'admin', permissions: Object.keys(permissionMap) },
      // Project Manager permissions
      { role: 'project_manager', permissions: [
        'create_project', 'view_all_projects', 'assign_task'
      ]},
      // User permissions (minimal)
      { role: 'user', permissions: [] }
    ];

    for (const rp of rolePermissions) {
      const roleId = roleMap[rp.role];
      for (const permName of rp.permissions) {
        const permId = permissionMap[permName];
        await pool.execute(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]
        );
      }
    }
    console.log('✓ Seeded role-permission mappings');

    // Create default users (idempotent)
    const costFactor = parseInt(process.env.BCRYPT_COST_FACTOR) || 10;
    const users = [
      { name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin' },
      { name: 'Project Manager', email: 'pm@example.com', password: 'pm123', role: 'project_manager' },
      { name: 'User One', email: 'user1@example.com', password: 'user123', role: 'user' },
      { name: 'User Two', email: 'user2@example.com', password: 'user123', role: 'user' }
    ];

    for (const user of users) {
      // Check if user already exists
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [user.email]);
      
      if (existing.length === 0) {
        const passwordHash = await bcrypt.hash(user.password, costFactor);
        await pool.execute(
          'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
          [user.name, user.email, passwordHash, roleMap[user.role]]
        );
      }
    }
    console.log('✓ Seeded default users');

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nDefault user credentials:');
    console.log('  Admin: admin@example.com / admin123');
    console.log('  Project Manager: pm@example.com / pm123');
    console.log('  User 1: user1@example.com / user123');
    console.log('  User 2: user2@example.com / user123');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await closePool();
  }
};

seedDatabase();
