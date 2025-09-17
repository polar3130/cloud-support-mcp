/**
 * search_support_cases tool definition
 *
 * Tool to search support cases using various filters
 */

import { ToolDefinition, Priority, CaseState } from './types.js';

export const searchSupportCasesTool: ToolDefinition = {
  name: 'search_support_cases',
  description: 'Search support cases with various filters',
  inputSchema: {
    type: 'object',
    properties: {
      parent: {
        type: 'string',
        description: 'The parent resource name (projects/{project_id} or organizations/{org_id})',
      },
      query: {
        type: 'string',
        description: 'Search query (searches in case description and title)',
      },
      state: {
        type: 'string',
        description: 'Case state filter',
        enum: ['OPEN', 'CLOSED', 'ALL'] as CaseState[],
        default: 'ALL',
      },
      priority: {
        type: 'string',
        description: 'Case priority filter',
        enum: ['PRIORITY_UNSPECIFIED', 'P0', 'P1', 'P2', 'P3', 'P4'] as Priority[],
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 20,
      },
    },
    required: ['parent'],
  },
};
