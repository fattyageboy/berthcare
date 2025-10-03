/**
 * Migration: Add encryption support to photos table
 * 
 * Purpose: Enable encryption for file metadata in the database
 * - Adds encryption key ID reference for KMS-managed keys
 * - Adds encrypted metadata fields for sensitive information
 * - Maintains backward compatibility with existing records
 * 
 * Security: Implements data-at-rest encryption per architecture spec
 * Reference: architecture-output.md lines 756-768
 */

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  // Add encryption-related columns to photos table
  pgm.addColumns('photos', {
    encryption_key_id: {
      type: 'varchar(255)',
      notNull: false,
      comment: 'KMS key ID used for server-side encryption of the S3 object',
    },
    encryption_algorithm: {
      type: 'varchar(50)',
      notNull: false,
      default: 'AES256',
      comment: 'Encryption algorithm used (e.g., AES256, aws:kms)',
    },
    metadata_encrypted: {
      type: 'boolean',
      notNull: true,
      default: false,
      comment: 'Flag indicating if sensitive metadata is encrypted',
    },
  });

  // Create index for encryption key lookups
  pgm.createIndex('photos', 'encryption_key_id');

  // Add comment to table documenting encryption strategy
  pgm.sql(`
    COMMENT ON TABLE photos IS 'Photo records with S3 SSE encryption and encrypted metadata. All files stored in S3 use server-side encryption with customer-managed keys (KMS).';
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  // Remove encryption-related columns
  pgm.dropColumns('photos', ['encryption_key_id', 'encryption_algorithm', 'metadata_encrypted']);
};
