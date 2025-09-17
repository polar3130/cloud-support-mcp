/**
 * list_support_cases tool definition
 *
 * Tool to retrieve a list of support cases for a Google Cloud project or organization
 */

import { ToolDefinition } from './types.js';

export const listSupportCasesTool: ToolDefinition = {
  name: 'list_support_cases',
  description: 'List all support cases for a Google Cloud project or organization',
  inputSchema: {
    type: 'object',
    properties: {
      parent: {
        type: 'string',
        description: 'The parent resource name (projects/{project_id} or organizations/{org_id})',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of cases to return (default: 50, max: 100)',
        default: 50,
      },
      pageToken: {
        type: 'string',
        description: 'Token for pagination',
      },
      filter: {
        type: 'string',
        description: 'Filter expression (e.g., "state=OPEN" or "priority=P1")',
      },
    },
    required: ['parent'],
  },
};
