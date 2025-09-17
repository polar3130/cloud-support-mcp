/**
 * list_case_attachments tool definition
 *
 * Tool to list all attachments associated with a support case
 */

import { ToolDefinition } from './types.js';

export const listCaseAttachmentsTool: ToolDefinition = {
  name: 'list_case_attachments',
  description: 'List all attachments associated with a support case.',
  inputSchema: {
    type: 'object',
    properties: {
      parent: {
        type: 'string',
        description:
          'The name of the case for which attachments should be listed (e.g., projects/{project_id}/cases/{case_id} or organizations/{org_id}/cases/{case_id})',
      },
      pageSize: {
        type: 'number',
        description: 'Maximum number of attachments to return (default: 10, max: 100)',
        default: 10,
      },
      pageToken: {
        type: 'string',
        description: 'Token for pagination',
      },
    },
    required: ['parent'],
  },
};
