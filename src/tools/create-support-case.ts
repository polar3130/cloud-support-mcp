/**
 * create_support_case tool definition
 *
 * Tool to create a new support case and associate it with a parent resource
 */

import { ToolDefinition, Priority } from './types.js';

export const createSupportCaseTool: ToolDefinition = {
  name: 'create_support_case',
  description: 'Create a new support case and associate it with a parent',
  inputSchema: {
    type: 'object',
    properties: {
      parent: {
        type: 'string',
        description: 'The parent resource name (projects/{project_id} or organizations/{org_id})',
      },
      displayName: {
        type: 'string',
        description: 'The short summary of the issue reported in this case',
      },
      description: {
        type: 'string',
        description: 'A broad description of the issue',
      },
      classification: {
        type: 'object',
        description: 'The issue classification applicable to this case',
        properties: {
          id: {
            type: 'string',
            description: 'The classification ID',
          },
          displayName: {
            type: 'string',
            description: 'The classification display name',
          },
        },
        required: ['id'],
      },
      priority: {
        type: 'string',
        description: 'Case priority filter',
        enum: ['PRIORITY_UNSPECIFIED', 'P0', 'P1', 'P2', 'P3', 'P4'] as Priority[],
      },
      subscriberEmailAddresses: {
        type: 'array',
        description: 'Email addresses to receive updates on this case',
        items: {
          type: 'string',
        },
      },
      testCase: {
        type: 'boolean',
        description: 'Whether this case was created for internal API testing',
      },
      timeZone: {
        type: 'string',
        description: 'The timezone of the user who created the support case (IANA format)',
      },
      languageCode: {
        type: 'string',
        description: 'The language code for support (BCP 47 format)',
      },
    },
    required: ['parent', 'displayName', 'description', 'classification', 'priority'],
  },
};
