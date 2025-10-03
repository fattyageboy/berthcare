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
  // Create photos table
  pgm.createTable('photos', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    visit_id: {
      type: 'uuid',
      notNull: true,
      references: 'visits',
      onDelete: 'CASCADE',
    },
    s3_key: {
      type: 'varchar(500)',
      notNull: true,
      comment: 'S3 object key for the original photo',
    },
    s3_thumbnail_key: {
      type: 'varchar(500)',
      notNull: false,
      comment: 'S3 object key for the thumbnail',
    },
    url: {
      type: 'text',
      notNull: true,
      comment: 'Public URL or presigned URL for the photo',
    },
    thumbnail_url: {
      type: 'text',
      notNull: false,
      comment: 'Public URL or presigned URL for the thumbnail',
    },
    file_size: {
      type: 'integer',
      notNull: true,
      comment: 'File size in bytes',
    },
    mime_type: {
      type: 'varchar(100)',
      notNull: true,
      comment: 'MIME type of the uploaded file',
    },
    caption: {
      type: 'text',
      notNull: false,
      comment: 'Optional caption for the photo',
    },
    taken_at: {
      type: 'timestamp with time zone',
      notNull: false,
      comment: 'When the photo was taken (from EXIF or user input)',
    },
    uploaded_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'RESTRICT',
    },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  // Create indexes for common queries
  pgm.createIndex('photos', 'visit_id');
  pgm.createIndex('photos', 'uploaded_by');
  pgm.createIndex('photos', 'created_at');

  // Add trigger to update updated_at timestamp
  pgm.createTrigger('photos', 'update_photos_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('photos', { cascade: true });
};
