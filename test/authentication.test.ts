/**
 * Authentication Integration Tests
 *
 * Basic integration test to ensure auth system works
 * Focus: Our auth integration, not Google's auth implementation
 */

import { describe, test, expect } from 'vitest';

describe('Authentication Integration', () => {
  test('provides working authentication context', async () => {
    const { getCurrentProjectId, getAuthHeaders } = await import('../src/api/auth.js');

    // Test that auth system works end-to-end
    const projectId = await getCurrentProjectId();
    const headers = await getAuthHeaders();

    // Verify we get valid responses (format doesn't matter)
    expect(projectId).toBeTruthy();
    expect(typeof projectId).toBe('string');
    expect(headers.Authorization).toBeTruthy();
    expect(headers['Content-Type']).toBe('application/json');
  });
});
