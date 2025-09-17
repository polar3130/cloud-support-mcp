/**
 * Type definitions for type-safe tool execution system
 */

import type {
  ListSupportCasesArgs,
  GetSupportCaseArgs,
  GetCaseCommentsArgs,
  CreateSupportCaseArgs,
  UpdateSupportCaseArgs,
  CloseSupportCaseArgs,
  CreateCaseCommentArgs,
  ListCaseAttachmentsArgs,
  SearchSupportCasesArgs,
  SearchCaseClassificationsArgs,
} from './mcp-types.js';

/**
 * Mapping of all MCP tool names to their argument types
 *
 * This map enables type-safe tool execution.
 * Each tool name has its corresponding argument type strictly defined.
 */
export interface ToolArgumentsMap {
  list_support_cases: ListSupportCasesArgs;
  get_support_case: GetSupportCaseArgs;
  get_case_comments: GetCaseCommentsArgs;
  search_support_cases: SearchSupportCasesArgs;
  create_support_case: CreateSupportCaseArgs;
  update_support_case: UpdateSupportCaseArgs;
  close_support_case: CloseSupportCaseArgs;
  create_case_comment: CreateCaseCommentArgs;
  list_case_attachments: ListCaseAttachmentsArgs;
  search_case_classifications: SearchCaseClassificationsArgs;
}

/**
 * Type for supported tool names
 *
 * Type automatically generated from keys of ToolArgumentsMap
 */
export type SupportedToolName = keyof ToolArgumentsMap;

/**
 * Helper type to get argument type for specific tool name
 *
 * @template T Tool name
 */
export type ToolArgsFor<T extends SupportedToolName> = ToolArgumentsMap[T];

/**
 * Result type for type-safe tool execution
 *
 * Response format compliant with MCP protocol
 */
export interface ToolExecutionResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Validation error during tool execution
 *
 * Thrown when input values do not match expected types
 */
export class ToolValidationError extends Error {
  constructor(
    public readonly toolName: string,
    public readonly validationErrors: string[],
    message?: string
  ) {
    super(message || `Validation failed for tool "${toolName}": ${validationErrors.join(', ')}`);
    this.name = 'ToolValidationError';
  }
}

/**
 * Type guard function: checks if unknown value is of specific tool argument type
 *
 * @param toolName Tool name
 * @param value Value to check
 * @returns true if type safety is confirmed
 */
export function isValidToolArgs<T extends SupportedToolName>(
  toolName: T,
  value: unknown
): value is ToolArgsFor<T> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const args = value as Record<string, unknown>;

  // Validate required fields for each tool
  switch (toolName) {
    case 'list_support_cases':
      return typeof args.parent === 'string';

    case 'get_support_case':
      return typeof args.name === 'string';

    case 'get_case_comments':
      return typeof args.name === 'string';

    case 'search_support_cases':
      return typeof args.parent === 'string';

    case 'create_support_case': {
      const validParent = typeof args.parent === 'string';
      const validDisplayName = typeof args.displayName === 'string';
      const validDescription = typeof args.description === 'string';
      const hasClassification = args.classification && typeof args.classification === 'object';
      const validClassificationId =
        hasClassification &&
        typeof (args.classification as Record<string, unknown>).id === 'string';

      return validParent && validDisplayName && validDescription && Boolean(validClassificationId);
    }

    case 'update_support_case':
      return typeof args.name === 'string';

    case 'close_support_case':
      return typeof args.name === 'string';

    case 'create_case_comment': {
      const validParent = typeof args.parent === 'string';
      const validBody = typeof args.body === 'string';
      return validParent && validBody;
    }

    case 'list_case_attachments':
      return typeof args.parent === 'string';

    case 'search_case_classifications':
      return true; // This tool has no required fields

    default:
      // TypeScript exhaustive check
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustiveCheck: never = toolName;
      return false;
  }
}

/**
 * Execute tool argument validation
 *
 * @param toolName Tool name
 * @param args Arguments to validate
 * @returns Validated arguments
 * @throws {ToolValidationError} When validation fails
 */
export function validateToolArgs<T extends SupportedToolName>(
  toolName: T,
  args: unknown
): ToolArgsFor<T> {
  if (!isValidToolArgs(toolName, args)) {
    const errors: string[] = [];

    if (!args || typeof args !== 'object') {
      errors.push('Arguments must be an object');
    } else {
      // Generate more detailed error messages
      const argObj = args as Record<string, unknown>;

      switch (toolName) {
        case 'list_support_cases':
        case 'search_support_cases':
        case 'list_case_attachments':
          if (typeof argObj.parent !== 'string') {
            errors.push('parent must be a string');
          }
          break;

        case 'get_support_case':
        case 'get_case_comments':
        case 'update_support_case':
        case 'close_support_case':
          if (typeof argObj.name !== 'string') {
            errors.push('name must be a string');
          }
          break;

        case 'create_support_case':
          if (typeof argObj.parent !== 'string') errors.push('parent must be a string');
          if (typeof argObj.displayName !== 'string') errors.push('displayName must be a string');
          if (typeof argObj.description !== 'string') errors.push('description must be a string');
          if (!argObj.classification || typeof argObj.classification !== 'object') {
            errors.push('classification must be an object');
          } else if (typeof (argObj.classification as Record<string, unknown>).id !== 'string') {
            errors.push('classification.id must be a string');
          }
          break;

        case 'create_case_comment':
          if (typeof argObj.parent !== 'string') errors.push('parent must be a string');
          if (typeof argObj.body !== 'string') errors.push('body must be a string');
          break;
      }
    }

    throw new ToolValidationError(toolName, errors);
  }

  return args as ToolArgsFor<T>;
}
