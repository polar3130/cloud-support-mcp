/**
 * update_support_case tool definition
 *
 * Tool to update an existing support case
 * Only priority, displayName, and subscriberEmailAddresses can be updated
 */

import { ToolDefinition, Priority } from './types.js';

export const updateSupportCaseTool: ToolDefinition = {
  name: 'update_support_case',
  description:
    'Update an existing support case. Only priority, displayName, and subscriberEmailAddresses can be updated.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'The resource name of the case (e.g., projects/{project_id}/cases/{case_id})',
      },
      updateMask: {
        type: 'string',
        description:
          'Comma-separated list of fields to update (priority,displayName,subscriberEmailAddresses). If not specified, all provided fields will be updated.',
      },
      priority: {
        type: 'string',
        description: 'Case priority',
        enum: ['PRIORITY_UNSPECIFIED', 'P0', 'P1', 'P2', 'P3', 'P4'] as Priority[],
      },
      displayName: {
        type: 'string',
        description: 'The short summary of the issue reported in this case',
      },
      subscriberEmailAddresses: {
        type: 'array',
        description: 'Email addresses to receive updates on this case',
        items: {
          type: 'string',
        },
      },
    },
    required: ['name'],
  },
};
