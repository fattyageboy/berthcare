/**
 * Authentication Utilities Demo
 *
 * Demonstrates the usage of password hashing and verification functions.
 * Run with: npx ts-node libs/shared/examples/auth-utils-demo.ts
 */

import {
  hashPassword,
  verifyPassword,
  getBcryptCostFactor,
  getEstimatedHashingTime,
} from '../src/auth-utils';

async function demonstrateAuthUtils() {
  console.log('🔐 BerthCare Authentication Utilities Demo\n');
  console.log('='.repeat(60));

  // Configuration
  console.log('\n📋 Configuration:');
  console.log(`   Cost Factor: ${getBcryptCostFactor()}`);
  console.log(`   Estimated Hashing Time: ${getEstimatedHashingTime()}ms`);

  // Example 1: User Registration
  console.log('\n' + '='.repeat(60));
  console.log('Example 1: User Registration Flow');
  console.log('='.repeat(60));

  const userPassword = 'SecurePassword123!';
  console.log(`\n1. User provides password: "${userPassword}"`);

  const startHash = Date.now();
  const hashedPassword = await hashPassword(userPassword);
  const hashDuration = Date.now() - startHash;

  console.log(`2. Password hashed in ${hashDuration}ms`);
  console.log(`3. Hash stored in database: ${hashedPassword}`);
  console.log(`   - Algorithm: $2b$ (bcrypt)`);
  console.log(`   - Cost Factor: 12`);
  console.log(`   - Salt: ${hashedPassword.substring(7, 29)} (22 chars)`);
  console.log(`   - Hash: ${hashedPassword.substring(29)} (31 chars)`);

  // Example 2: Successful Login
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: Successful Login');
  console.log('='.repeat(60));

  const loginPassword = 'SecurePassword123!';
  console.log(`\n1. User attempts login with: "${loginPassword}"`);

  const startVerify = Date.now();
  const isValid = await verifyPassword(loginPassword, hashedPassword);
  const verifyDuration = Date.now() - startVerify;

  console.log(`2. Password verified in ${verifyDuration}ms`);
  console.log(`3. Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`4. Action: ${isValid ? 'Grant access, generate JWT' : 'Deny access'}`);

  // Example 3: Failed Login
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Failed Login Attempt');
  console.log('='.repeat(60));

  const wrongPassword = 'WrongPassword456!';
  console.log(`\n1. Attacker attempts login with: "${wrongPassword}"`);

  const startWrong = Date.now();
  const isInvalid = await verifyPassword(wrongPassword, hashedPassword);
  const wrongDuration = Date.now() - startWrong;

  console.log(`2. Password verified in ${wrongDuration}ms`);
  console.log(`3. Result: ${isInvalid ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`4. Action: ${isInvalid ? 'Grant access' : 'Deny access, log attempt'}`);

  // Timing Attack Resistance
  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Timing Attack Resistance');
  console.log('='.repeat(60));

  const timeDifference = Math.abs(verifyDuration - wrongDuration);
  console.log(`\n1. Correct password verification: ${verifyDuration}ms`);
  console.log(`2. Incorrect password verification: ${wrongDuration}ms`);
  console.log(`3. Time difference: ${timeDifference}ms`);
  console.log(
    `4. Security: ${timeDifference < 50 ? '✅ Timing attack resistant' : '⚠️  May be vulnerable'}`
  );
  console.log(`   (Constant-time comparison prevents timing attacks)`);

  // Example 5: Salt Uniqueness
  console.log('\n' + '='.repeat(60));
  console.log('Example 5: Salt Uniqueness (Multiple Users, Same Password)');
  console.log('='.repeat(60));

  const sharedPassword = 'CommonPassword123';
  console.log(`\n1. Two users choose the same password: "${sharedPassword}"`);

  const user1Hash = await hashPassword(sharedPassword);
  const user2Hash = await hashPassword(sharedPassword);

  console.log(`2. User 1 hash: ${user1Hash}`);
  console.log(`3. User 2 hash: ${user2Hash}`);
  console.log(`4. Hashes are different: ${user1Hash !== user2Hash ? '✅ Yes' : '❌ No'}`);
  console.log(`   (Different salts prevent rainbow table attacks)`);

  // Example 6: Password Change
  console.log('\n' + '='.repeat(60));
  console.log('Example 6: Password Change Flow');
  console.log('='.repeat(60));

  const oldPassword = 'OldPassword123';
  const newPassword = 'NewPassword456';

  console.log(`\n1. User has old password: "${oldPassword}"`);
  const oldHash = await hashPassword(oldPassword);
  console.log(`2. Old hash stored: ${oldHash.substring(0, 30)}...`);

  console.log(`3. User changes to new password: "${newPassword}"`);
  const newHash = await hashPassword(newPassword);
  console.log(`4. New hash stored: ${newHash.substring(0, 30)}...`);

  const oldStillWorks = await verifyPassword(oldPassword, newHash);
  const newWorks = await verifyPassword(newPassword, newHash);

  console.log(`5. Old password with new hash: ${oldStillWorks ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`6. New password with new hash: ${newWorks ? '✅ Valid' : '❌ Invalid'}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo Complete - Key Takeaways');
  console.log('='.repeat(60));
  console.log('\n1. Hashing takes ~200ms (secure but not too slow)');
  console.log('2. Verification is constant-time (timing attack resistant)');
  console.log('3. Same password produces different hashes (salt uniqueness)');
  console.log('4. Never store plaintext passwords');
  console.log('5. Always use bcrypt with cost factor 12+');
  console.log('6. Comprehensive error handling for production use');
  console.log('\n' + '='.repeat(60));
}

// Run the demo
demonstrateAuthUtils().catch((error) => {
  console.error('❌ Demo failed:', error);
  process.exit(1);
});
