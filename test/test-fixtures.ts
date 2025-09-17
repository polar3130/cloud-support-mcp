/**
 * Test fixtures and mock setup utilities
 * Provides common mocks and test data for integration tests
 */

import { vi } from 'vitest';

/**
 * Setup common mocks for all tests
 */
export function setupCommonMocks() {
  // Mock Google Auth
  vi.mock('google-auth-library', () => ({
    GoogleAuth: vi.fn().mockImplementation(() => ({
      getAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
      getProjectId: vi.fn().mockResolvedValue('example-project-id'),
    })),
  }));

  // Mock Node.js fetch
  global.fetch = vi.fn();
}

/**
 * Mock successful fetch response
 */
export function mockSuccessfulFetch(data: unknown) {
  (global.fetch as any).mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
  });
}

/**
 * Common API response mocks
 */
export const mockApiResponses = {
  supportCase: {
    name: 'projects/example-project/cases/12345',
    displayName: 'Test Support Case',
    description: 'Test case description',
    createTime: '2024-01-01T00:00:00Z',
    state: 'OPEN',
    priority: 'P2',
  },
  supportCasesList: {
    cases: [
      {
        name: 'projects/example-project/cases/12345',
        displayName: 'Test Case 1',
        state: 'OPEN',
        priority: 'P2',
      },
      {
        name: 'projects/example-project/cases/67890',
        displayName: 'Test Case 2',
        state: 'CLOSED',
        priority: 'P3',
      },
    ],
    nextPageToken: 'next-page-token',
  },
  listSupportCases: {
    success: {
      cases: [
        {
          name: 'projects/example-project/cases/12345',
          displayName: 'Test Case 1',
          state: 'OPEN',
          priority: 'P2',
        },
      ],
    },
  },
  comment: {
    name: 'projects/example-project/cases/12345/comments/1',
    createTime: '2024-01-01T00:00:00Z',
    body: 'Test comment',
    creator: {
      displayName: 'Test User',
      email: 'test@example.com',
    },
  },
  commentsList: {
    comments: [
      {
        name: 'projects/example-project/cases/12345/comments/1',
        createTime: '2024-01-01T00:00:00Z',
        body: 'Test comment 1',
      },
      {
        name: 'projects/example-project/cases/12345/comments/2',
        createTime: '2024-01-01T00:00:01Z',
        body: 'Test comment 2',
      },
    ],
  },
  attachments: {
    attachments: [
      {
        name: 'projects/example-project/cases/12345/attachments/1',
        displayName: 'test-file.txt',
        createTime: '2024-01-01T00:00:00Z',
      },
    ],
  },
  classifications: {
    caseClassifications: [
      {
        id: 'technical-issue',
        displayName: 'Technical Issue',
      },
      {
        id: 'billing-issue',
        displayName: 'Billing Issue',
      },
    ],
  },
};
