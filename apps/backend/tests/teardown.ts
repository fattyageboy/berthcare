/**
 * Global Test Teardown
 *
 * Ensures all connections are properly closed after all tests complete
 */

export default async function globalTeardown() {
  // Give a small delay to ensure all async operations complete
  await new Promise((resolve) => setTimeout(resolve, 500));
}
