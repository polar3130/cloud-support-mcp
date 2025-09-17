/**
 * Unified export of MCP tool definitions
 *
 * Exports all tool definitions from a single location,
 * providing a tool list while ensuring type safety.
 */

// Type definition exports
export * from './types.js';

// Individual tool definition imports
import { listSupportCasesTool } from './list-support-cases.js';
import { getSupportCaseTool } from './get-support-case.js';
import { getCaseCommentsTool } from './get-case-comments.js';
import { searchSupportCasesTool } from './search-support-cases.js';
import { createSupportCaseTool } from './create-support-case.js';
import { updateSupportCaseTool } from './update-support-case.js';
import { closeSupportCaseTool } from './close-support-case.js';
import { createCaseCommentTool } from './create-case-comment.js';
import { listCaseAttachmentsTool } from './list-case-attachments.js';
import { searchCaseClassificationsTool } from './search-case-classifications.js';

import { ToolDefinitions } from './types.js';

/**
 * Function to get all tool definitions
 *
 * @returns Array of all MCP tool definitions
 * @description Provides all tool definitions while ensuring type safety
 */
export function getToolDefinitions(): ToolDefinitions {
  return [
    listSupportCasesTool,
    getSupportCaseTool,
    getCaseCommentsTool,
    searchSupportCasesTool,
    createSupportCaseTool,
    updateSupportCaseTool,
    closeSupportCaseTool,
    createCaseCommentTool,
    listCaseAttachmentsTool,
    searchCaseClassificationsTool,
  ] as const;
}

/**
 * Export individual tool definitions (named exports)
 */
export {
  listSupportCasesTool,
  getSupportCaseTool,
  getCaseCommentsTool,
  searchSupportCasesTool,
  createSupportCaseTool,
  updateSupportCaseTool,
  closeSupportCaseTool,
  createCaseCommentTool,
  listCaseAttachmentsTool,
  searchCaseClassificationsTool,
};
