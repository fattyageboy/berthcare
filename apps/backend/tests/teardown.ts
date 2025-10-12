/**
 * Global Test Teardown
 *
 * Ensures all connections are properly closed after all tests complete
 * Uses a cleanup registry to deterministically close resources
 */

declare global {
  // eslint-disable-next-line no-var
  var __TEST_CLEANUPS__: Array<() => Promise<void>>;
}

export default async function globalTeardown() {
  // Execute all registered cleanup functions
  if (global.__TEST_CLEANUPS__ && global.__TEST_CLEANUPS__.length > 0) {
    await Promise.all(global.__TEST_CLEANUPS__.map((cleanup) => cleanup()));
    global.__TEST_CLEANUPS__ = [];
  }
}
