/**
 * Migration: Create ENUM types
 * Creates all custom ENUM types used in the BerthCare database schema
 */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // User role ENUM
  pgm.createType('user_role', [
    'nurse',
    'psw',
    'coordinator',
    'supervisor',
    'admin',
    'family_member',
  ]);

  // User status ENUM
  pgm.createType('user_status', ['active', 'inactive', 'suspended']);

  // Care level ENUM
  pgm.createType('care_level_enum', [
    'level_1',
    'level_2',
    'level_3',
    'level_4',
    'palliative',
  ]);

  // Client status ENUM
  pgm.createType('client_status', ['active', 'discharged', 'deceased']);

  // Visit type ENUM
  pgm.createType('visit_type_enum', [
    'personal_care',
    'medication',
    'assessment',
    'companionship',
    'respite',
    'palliative',
  ]);

  // Visit status ENUM
  pgm.createType('visit_status', [
    'scheduled',
    'in_progress',
    'completed',
    'missed',
    'cancelled',
  ]);

  // Care plan status ENUM
  pgm.createType('care_plan_status', ['draft', 'active', 'completed', 'cancelled']);

  // Family access level ENUM
  pgm.createType('family_access_level', ['basic', 'detailed', 'emergency_only']);

  // Sync operation ENUM
  pgm.createType('sync_operation', ['create', 'update', 'delete']);

  // Create trigger function for updating updated_at timestamp
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
};

exports.down = (pgm) => {
  // Drop trigger function
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;');
  
  // Drop ENUMs in reverse order to avoid dependency issues
  pgm.dropType('sync_operation');
  pgm.dropType('family_access_level');
  pgm.dropType('care_plan_status');
  pgm.dropType('visit_status');
  pgm.dropType('visit_type_enum');
  pgm.dropType('client_status');
  pgm.dropType('care_level_enum');
  pgm.dropType('user_status');
  pgm.dropType('user_role');
};
