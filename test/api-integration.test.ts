/**
 * API Client Integration Tests
 *
 * Tests for our API client wrapper functionality
 * Focus: Our client's behavior, not Google's API responses
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupCommonMocks } from './test-fixtures.js';

describe('API Client Integration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('makes HTTP requests with proper headers', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ data: 'test' }),
    });

    const { apiClient } = await import('../src/api/index.js');
    const result = await apiClient.get('/v2beta/projects/example-project/cases');

    expect(result.status).toBe(200);
    expect(result.data).toEqual({ data: 'test' });

    // Verify our client adds required headers
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://cloudsupport.googleapis.com'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: expect.any(String),
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  test('handles HTTP errors appropriately', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers(),
      text: async () => '{"error": "Invalid request"}',
    });

    const { apiClient } = await import('../src/api/index.js');

    await expect(apiClient.get('/v2beta/projects/invalid/cases')).rejects.toThrow(
      'HTTP 400: Bad Request'
    );
  });

  test('validates request body serialization', async () => {
    const { apiClient } = await import('../src/api/index.js');

    // Should reject non-serializable data
    await expect(
      apiClient.post('/v2beta/projects/test/cases', {
        callback: () => {},
      } as any)
    ).rejects.toThrow('Invalid request body');

    // Should accept valid JSON data
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers(),
      json: async () => ({ created: true }),
    });

    const result = await apiClient.post('/v2beta/projects/test/cases', {
      displayName: 'Test Case',
      description: 'Valid JSON data',
    });

    expect(result.status).toBe(201);
  });
});
