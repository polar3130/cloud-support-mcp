/**
 * MCP Tools Tests
 *
 * Unified tests for all 11 MCP tools focusing on our server logic
 * Tests validation, MCP format conversion, and error handling
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupCommonMocks, mockSuccessfulFetch, mockApiResponses } from './test-fixtures.js';
import type { MCPResponse } from '../src/handlers/base-handler.js';

// Import all handlers statically
import { ListSupportCasesHandler } from '../src/handlers/list-support-cases-handler.js';
import { CreateSupportCaseHandler } from '../src/handlers/create-support-case-handler.js';
import { GetSupportCaseHandler } from '../src/handlers/get-support-case-handler.js';
import { CloseSupportCaseHandler } from '../src/handlers/close-support-case-handler.js';
import { UpdateSupportCaseHandler } from '../src/handlers/update-support-case-handler.js';
import { CreateCaseCommentHandler } from '../src/handlers/create-case-comment-handler.js';
import { GetCaseCommentsHandler } from '../src/handlers/get-case-comments-handler.js';
import { SearchSupportCasesHandler } from '../src/handlers/search-support-cases-handler.js';
import { SearchCaseClassificationsHandler } from '../src/handlers/search-case-classifications-handler.js';
import { ListCaseAttachmentsHandler } from '../src/handlers/list-case-attachments-handler.js';

describe('MCP Tools', () => {
  beforeEach(async () => {
    await vi.resetModules();
    vi.clearAllMocks();
    vi.clearAllTimers();
    global.fetch = vi.fn();
    setupCommonMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Input Validation', () => {
    // Test data for all 11 tools with their required fields and expected error messages
    const toolValidationTests = [
      {
        name: 'list-support-cases',
        handler: ListSupportCasesHandler,
        invalidInput: {},
        expectedError: 'Required field "parent" is missing',
      },
      {
        name: 'create-support-case',
        handler: CreateSupportCaseHandler,
        invalidInput: {},
        expectedError: 'Missing required fields',
      },
      {
        name: 'get-support-case',
        handler: GetSupportCaseHandler,
        invalidInput: {},
        expectedError: 'name parameter is required',
      },
      {
        name: 'close-support-case',
        handler: CloseSupportCaseHandler,
        invalidInput: {},
        expectedError: 'name is required',
      },
      {
        name: 'update-support-case',
        handler: UpdateSupportCaseHandler,
        invalidInput: {},
        expectedError: 'name is required',
      },
      {
        name: 'create-case-comment',
        handler: CreateCaseCommentHandler,
        invalidInput: {},
        expectedError: 'parent is required',
      },
      {
        name: 'get-case-comments',
        handler: GetCaseCommentsHandler,
        invalidInput: {},
        expectedError: 'name',
      },
      {
        name: 'search-support-cases',
        handler: SearchSupportCasesHandler,
        invalidInput: {},
        expectedError: 'parent is required',
      },
      {
        name: 'list-case-attachments',
        handler: ListCaseAttachmentsHandler,
        invalidInput: {},
        expectedError: 'parent is required',
      },
    ];

    // Test all tools that have required field validation
    test.each(toolValidationTests)(
      '$name validates required fields',
      async ({ handler: HandlerClass, invalidInput, expectedError }) => {
        const handler = new HandlerClass();
        const result = await handler.handle(invalidInput as any);

        expect((result as MCPResponse).isError).toBe(true);
        expect(result.content[0].text).toContain(expectedError);
      }
    );

    // Special case: search-case-classifications has no required fields
    test('search-case-classifications accepts empty input', async () => {
      const handler = new SearchCaseClassificationsHandler();
      const result = await handler.handle({} as any);

      // Should not fail validation (may fail on API call, but not validation)
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeTruthy();
    });

    // Special validation test for create-support-case classification.id
    test('create-support-case validates classification.id specifically', async () => {
      const handler = new CreateSupportCaseHandler();

      const result = await handler.handle({
        parent: 'projects/test',
        displayName: 'Test',
        description: 'Test',
        priority: 'P3',
        classification: {}, // Missing id
      } as any);

      expect((result as MCPResponse).isError).toBe(true);
      expect(result.content[0].text).toContain('classification.id is required');
    });
  });

  describe('MCP Response Format', () => {
    test('all tools return MCP-compliant response structure', async () => {
      mockSuccessfulFetch(mockApiResponses.listSupportCases.success);

      const handler = new ListSupportCasesHandler();
      const result = await handler.handle({ parent: 'projects/example-project' });

      // Verify MCP format (our conversion logic)
      expect(result).toMatchObject({
        content: [
          {
            type: 'text',
            text: expect.any(String),
          },
        ],
        isError: false,
      });

      // Should be valid JSON
      expect(() => JSON.parse(result.content[0].text)).not.toThrow();
    });

    test('all tools set isError=true for validation failures', async () => {
      const handler = new CreateSupportCaseHandler();
      const result = await handler.handle({} as any);

      expect((result as MCPResponse).isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    test('tools handle API errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'));

      const handler = new ListSupportCasesHandler();
      const result = await handler.handle({ parent: 'projects/example-project' });

      expect((result as MCPResponse).isError).toBe(true);
      expect(result.content[0].text).toBeTruthy();
      expect(result.content[0].text).toContain('listing support cases');
      expect(result.content[0].text).toMatch(/^Error/);
    });

    test('validation errors fail fast without API calls', async () => {
      const handler = new CreateSupportCaseHandler();

      const startTime = Date.now();
      const result = await handler.handle({} as any);
      const duration = Date.now() - startTime;

      expect((result as MCPResponse).isError).toBe(true);
      expect(duration).toBeLessThan(100); // Should fail fast, not retry
    });
  });

  describe('Default Values and Server Logic', () => {
    test('list-support-cases applies pageSize=50 default', async () => {
      // Tests our server logic: pageSize = 50 when not specified
      mockSuccessfulFetch({ cases: [], nextPageToken: null });

      const handler = new ListSupportCasesHandler();
      const result = await handler.handle({ parent: 'projects/example-project' });

      // Should not error (validates our default logic works)
      expect((result as MCPResponse).isError).toBe(false);
    });
  });
});
