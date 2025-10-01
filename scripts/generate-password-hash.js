#!/usr/bin/env node
/**
 * Generate bcrypt password hash for seed data
 * Usage: node scripts/generate-password-hash.js [password]
 */

const path = require('path');
const bcrypt = require(path.join(__dirname, '../backend/node_modules/bcrypt'));

const password = process.argv[2] || 'BerthCare2024!';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in your SQL seed files.');
});
