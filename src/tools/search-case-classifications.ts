/**
 * search_case_classifications tool definition
 *
 * Tool to search and retrieve valid case classifications for use in support case creation
 */

import { ToolDefinition } from './types.js';

export const searchCaseClassificationsTool: ToolDefinition = {
  name: 'search_case_classifications',
  description: 'Search and retrieve valid case classifications for creating support cases',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'Filter expression to search classifications (e.g., displayName:"*Compute Engine*")',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of classifications to return (default: 50)',
        default: 50,
      },
      pageToken: {
        type: 'string',
        description: 'Token for pagination',
      },
    },
  },
};
