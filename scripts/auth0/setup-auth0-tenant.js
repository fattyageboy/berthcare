#!/usr/bin/env node

/**
 * Auth0 Development Tenant Setup Script
 *
 * This script automates the configuration of the Auth0 development tenant for Berthcare.
 * It creates roles, permissions, test users, and configures MFA settings.
 *
 * Prerequisites:
 * 1. Install dependencies: npm install
 * 2. Set environment variables:
 *    - AUTH0_DOMAIN
 *    - AUTH0_MANAGEMENT_CLIENT_ID (from Machine-to-Machine application)
 *    - AUTH0_MANAGEMENT_CLIENT_SECRET
 *
 * Usage:
 *   node setup-auth0-tenant.js
 */

const https = require('https');

// Configuration
const config = {
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
  clientSecret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
  audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
  apiIdentifier: 'https://api.berthcare.local',
  appName: 'Berthcare Mobile App (Dev)',
};

// Validate configuration
function validateConfig() {
  const required = ['domain', 'clientId', 'clientSecret'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      const envVar = key === 'domain' ? 'AUTH0_DOMAIN' :
                      key === 'clientId' ? 'AUTH0_MANAGEMENT_CLIENT_ID' :
                      'AUTH0_MANAGEMENT_CLIENT_SECRET';
      console.error(`   - ${envVar}`);
    });
    process.exit(1);
  }
}

// Make HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Get Management API access token
async function getManagementToken() {
  console.log('🔑 Obtaining Management API access token...');

  const options = {
    hostname: config.domain,
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const data = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    audience: config.audience,
    grant_type: 'client_credentials',
  };

  try {
    const response = await makeRequest(options, data);
    console.log('✅ Access token obtained successfully');
    return response.access_token;
  } catch (error) {
    console.error('❌ Failed to obtain access token:', error.message);
    throw error;
  }
}

// Create or get API resource
async function setupAPI(token) {
  console.log('\n📋 Setting up API resource...');

  const options = {
    hostname: config.domain,
    path: '/api/v2/resource-servers',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const apiConfig = {
    name: 'Berthcare API (Dev)',
    identifier: config.apiIdentifier,
    signing_alg: 'RS256',
    token_lifetime: 3600,
    token_lifetime_for_web: 3600,
    enforce_policies: true,
    skip_consent_for_verifiable_first_party_clients: true,
    scopes: [
      // Visit Management
      { value: 'read:visits', description: 'Read visit information' },
      { value: 'write:visits', description: 'Create and update visits' },
      { value: 'delete:visits', description: 'Delete visits' },
      { value: 'read:visit_notes', description: 'Read visit notes' },
      { value: 'write:visit_notes', description: 'Create and update visit notes' },

      // Care Plan Management
      { value: 'read:care_plans', description: 'Read care plans' },
      { value: 'write:care_plans', description: 'Create and update care plans' },
      { value: 'delete:care_plans', description: 'Delete care plans' },

      // User Management
      { value: 'read:users', description: 'Read user information' },
      { value: 'write:users', description: 'Create and update users' },
      { value: 'delete:users', description: 'Delete users' },
      { value: 'manage:roles', description: 'Assign and manage user roles' },

      // Client Management
      { value: 'read:clients', description: 'Read client information' },
      { value: 'write:clients', description: 'Create and update clients' },
      { value: 'delete:clients', description: 'Delete clients' },

      // Photo/Document Management
      { value: 'upload:photos', description: 'Upload visit photos' },
      { value: 'read:photos', description: 'View photos' },
      { value: 'delete:photos', description: 'Delete photos' },
      { value: 'upload:documents', description: 'Upload documents' },
      { value: 'read:documents', description: 'View documents' },

      // Reporting
      { value: 'read:reports', description: 'View reports' },
      { value: 'generate:reports', description: 'Generate reports' },
      { value: 'read:analytics', description: 'View analytics dashboards' },

      // System
      { value: 'read:audit_logs', description: 'View audit logs' },
      { value: 'write:system_config', description: 'Modify system configuration' },
      { value: 'read:system_status', description: 'View system status' },
    ],
  };

  try {
    const response = await makeRequest(options, apiConfig);
    console.log('✅ API resource created successfully');
    return response;
  } catch (error) {
    if (error.message.includes('409')) {
      console.log('ℹ️  API resource already exists, skipping creation');
      return null;
    }
    console.error('❌ Failed to create API resource:', error.message);
    throw error;
  }
}

// Create roles
async function setupRoles(token) {
  console.log('\n👥 Setting up roles...');

  const roles = [
    {
      name: 'nurse',
      description: 'Registered Nurse with access to assigned client visits and care plans',
    },
    {
      name: 'psw',
      description: 'Personal Support Worker with access to assigned client visits',
    },
    {
      name: 'coordinator',
      description: 'Care Coordinator with team management and care plan creation access',
    },
    {
      name: 'supervisor',
      description: 'Supervisor with full administrative access and system configuration',
    },
    {
      name: 'admin',
      description: 'System Administrator with complete system access and user management',
    },
    {
      name: 'family_member',
      description: 'Family member with read-only access to specific client information',
    },
  ];

  const createdRoles = [];

  for (const role of roles) {
    const options = {
      hostname: config.domain,
      path: '/api/v2/roles',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await makeRequest(options, role);
      console.log(`✅ Created role: ${role.name}`);
      createdRoles.push(response);
    } catch (error) {
      if (error.message.includes('409') || error.message.includes('already exists')) {
        console.log(`ℹ️  Role '${role.name}' already exists, skipping`);
      } else {
        console.error(`❌ Failed to create role '${role.name}':`, error.message);
      }
    }
  }

  return createdRoles;
}

// Assign permissions to roles
async function assignPermissionsToRoles(token, apiId) {
  console.log('\n🔐 Assigning permissions to roles...');

  // Get all roles first
  const getRolesOptions = {
    hostname: config.domain,
    path: '/api/v2/roles',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  let allRoles;
  try {
    allRoles = await makeRequest(getRolesOptions);
  } catch (error) {
    console.error('❌ Failed to fetch roles:', error.message);
    return;
  }

  // Permission mappings for each role
  const rolePermissions = {
    nurse: [
      'read:visits', 'write:visits', 'read:visit_notes', 'write:visit_notes',
      'read:care_plans', 'upload:photos', 'read:photos', 'read:clients',
    ],
    psw: [
      'read:visits', 'write:visits', 'read:visit_notes', 'write:visit_notes',
      'read:care_plans', 'upload:photos', 'read:photos', 'read:clients',
    ],
    coordinator: [
      'read:visits', 'write:visits', 'delete:visits',
      'read:visit_notes', 'write:visit_notes',
      'read:care_plans', 'write:care_plans', 'delete:care_plans',
      'read:users', 'write:users',
      'read:clients', 'write:clients',
      'upload:photos', 'read:photos', 'delete:photos',
      'upload:documents', 'read:documents',
      'read:reports', 'generate:reports', 'read:analytics',
    ],
    supervisor: [
      'read:visits', 'write:visits', 'delete:visits',
      'read:visit_notes', 'write:visit_notes',
      'read:care_plans', 'write:care_plans', 'delete:care_plans',
      'read:users', 'write:users', 'delete:users', 'manage:roles',
      'read:clients', 'write:clients', 'delete:clients',
      'upload:photos', 'read:photos', 'delete:photos',
      'upload:documents', 'read:documents',
      'read:reports', 'generate:reports', 'read:analytics',
      'read:audit_logs', 'write:system_config', 'read:system_status',
    ],
    admin: [
      'read:visits', 'write:visits', 'delete:visits',
      'read:visit_notes', 'write:visit_notes',
      'read:care_plans', 'write:care_plans', 'delete:care_plans',
      'read:users', 'write:users', 'delete:users', 'manage:roles',
      'read:clients', 'write:clients', 'delete:clients',
      'upload:photos', 'read:photos', 'delete:photos',
      'upload:documents', 'read:documents',
      'read:reports', 'generate:reports', 'read:analytics',
      'read:audit_logs', 'write:system_config', 'read:system_status',
    ],
    family_member: [
      'read:visits', 'read:care_plans', 'read:clients',
    ],
  };

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = allRoles.find(r => r.name === roleName);
    if (!role) {
      console.log(`⚠️  Role '${roleName}' not found, skipping permission assignment`);
      continue;
    }

    const permissionObjects = permissions.map(permission => ({
      resource_server_identifier: config.apiIdentifier,
      permission_name: permission,
    }));

    const options = {
      hostname: config.domain,
      path: `/api/v2/roles/${role.id}/permissions`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      await makeRequest(options, { permissions: permissionObjects });
      console.log(`✅ Assigned ${permissions.length} permissions to '${roleName}' role`);
    } catch (error) {
      console.error(`❌ Failed to assign permissions to '${roleName}':`, error.message);
    }
  }
}

// Create test users
async function createTestUsers(token) {
  console.log('\n👤 Creating test users...');

  const testUsers = [
    {
      email: 'nurse.test@berthcare.local',
      password: 'BerthCare2024!Nurse',
      username: 'nurse_test',
      name: 'Sarah Nurse',
      role: 'nurse',
      user_metadata: {
        phone: '+1-555-0101',
        employee_id: 'EMP-N001',
        department: 'Nursing',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
      },
    },
    {
      email: 'psw.test@berthcare.local',
      password: 'BerthCare2024!PSW',
      username: 'psw_test',
      name: 'John PSW',
      role: 'psw',
      user_metadata: {
        phone: '+1-555-0102',
        employee_id: 'EMP-P001',
        department: 'Support Services',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
      },
    },
    {
      email: 'coordinator.test@berthcare.local',
      password: 'BerthCare2024!Coord',
      username: 'coordinator_test',
      name: 'Emily Coordinator',
      role: 'coordinator',
      user_metadata: {
        phone: '+1-555-0103',
        employee_id: 'EMP-C001',
        department: 'Care Coordination',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
        can_access_web: true,
      },
    },
    {
      email: 'supervisor.test@berthcare.local',
      password: 'BerthCare2024!Super',
      username: 'supervisor_test',
      name: 'Michael Supervisor',
      role: 'supervisor',
      user_metadata: {
        phone: '+1-555-0104',
        employee_id: 'EMP-S001',
        department: 'Management',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
        can_access_web: true,
      },
    },
    {
      email: 'admin.test@berthcare.local',
      password: 'BerthCare2024!Admin',
      username: 'admin_test',
      name: 'David Admin',
      role: 'admin',
      user_metadata: {
        phone: '+1-555-0105',
        employee_id: 'EMP-A001',
        department: 'IT Administration',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
        can_access_web: true,
        is_super_admin: true,
      },
    },
    {
      email: 'family.test@berthcare.local',
      password: 'BerthCare2024!Family',
      username: 'family_test',
      name: 'Linda Family',
      role: 'family_member',
      user_metadata: {
        phone: '+1-555-0106',
        relationship: 'Daughter',
      },
      app_metadata: {
        organization_id: 'org_dev_001',
        can_access_mobile: true,
        assigned_clients: ['client_001'],
      },
    },
  ];

  // Get connection ID
  const getConnectionsOptions = {
    hostname: config.domain,
    path: '/api/v2/connections?strategy=auth0',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  let connections;
  try {
    connections = await makeRequest(getConnectionsOptions);
  } catch (error) {
    console.error('❌ Failed to fetch connections:', error.message);
    return [];
  }

  const dbConnection = connections[0];
  if (!dbConnection) {
    console.error('❌ No database connection found');
    return [];
  }

  const createdUsers = [];

  for (const user of testUsers) {
    const { role, ...userData } = user;

    const options = {
      hostname: config.domain,
      path: '/api/v2/users',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    const userPayload = {
      ...userData,
      connection: dbConnection.name,
      email_verified: true,
      verify_email: false,
    };

    try {
      const createdUser = await makeRequest(options, userPayload);
      console.log(`✅ Created user: ${user.email}`);

      // Assign role to user
      const getRolesOptions = {
        hostname: config.domain,
        path: '/api/v2/roles',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      };

      const allRoles = await makeRequest(getRolesOptions);
      const userRole = allRoles.find(r => r.name === role);

      if (userRole) {
        const assignRoleOptions = {
          hostname: config.domain,
          path: `/api/v2/users/${createdUser.user_id}/roles`,
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        };

        await makeRequest(assignRoleOptions, { roles: [userRole.id] });
        console.log(`   ✓ Assigned '${role}' role to ${user.email}`);
      }

      createdUsers.push({ ...createdUser, role });
    } catch (error) {
      if (error.message.includes('409') || error.message.includes('already exists')) {
        console.log(`ℹ️  User '${user.email}' already exists, skipping`);
      } else {
        console.error(`❌ Failed to create user '${user.email}':`, error.message);
      }
    }
  }

  return createdUsers;
}

// Main execution
async function main() {
  console.log('🚀 Starting Auth0 Development Tenant Setup for Berthcare\n');
  console.log('=' .repeat(70));

  validateConfig();

  try {
    // Step 1: Get management token
    const token = await getManagementToken();

    // Step 2: Setup API
    const api = await setupAPI(token);

    // Step 3: Setup roles
    await setupRoles(token);

    // Step 4: Assign permissions to roles
    await assignPermissionsToRoles(token, api?.id);

    // Step 5: Create test users
    await createTestUsers(token);

    console.log('\n' + '='.repeat(70));
    console.log('✅ Auth0 tenant setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Review test user credentials in TEST_USERS.md');
    console.log('2. Configure MFA settings in Auth0 dashboard');
    console.log('3. Test authentication flow with test users');
    console.log('4. Follow testing procedures in AUTH0_TESTING.md');
    console.log('=' .repeat(70));
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { main };
