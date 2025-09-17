/**
 * Type-safe tool dispatcher
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { SupportedToolName, ToolArgsFor, ToolArgumentsMap } from '../types/tool-dispatcher.js';
import { validateToolArgs, ToolValidationError } from '../types/tool-dispatcher.js';

import { logger } from './logger.js';
import { RobustExecutor } from './retry.js';

// Handler imports
import type {
  CreateSupportCaseHandler,
  GetCaseCommentsHandler,
  GetSupportCaseHandler,
  ListSupportCasesHandler,
  SearchSupportCasesHandler,
  UpdateSupportCaseHandler,
  CloseSupportCaseHandler,
  CreateCaseCommentHandler,
  ListCaseAttachmentsHandler,
  SearchCaseClassificationsHandler,
} from '../handlers/index.js';

/**
 * Tool handler mapping type
 *
 * Defines handler instance types corresponding to each tool name
 */
export interface ToolHandlerMap {
  list_support_cases: ListSupportCasesHandler;
  get_support_case: GetSupportCaseHandler;
  get_case_comments: GetCaseCommentsHandler;
  search_support_cases: SearchSupportCasesHandler;
  create_support_case: CreateSupportCaseHandler;
  update_support_case: UpdateSupportCaseHandler;
  close_support_case: CloseSupportCaseHandler;
  create_case_comment: CreateCaseCommentHandler;
  list_case_attachments: ListCaseAttachmentsHandler;
  search_case_classifications: SearchCaseClassificationsHandler;
}

/**
 * Handler return value type (to match existing format)
 */
interface HandlerResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Type-safe tool dispatcher class
 *
 * Manages all tool execution type-safely and provides runtime type validation.
 */
export class TypeSafeToolDispatcher {
  private readonly robustExecutor: RobustExecutor;

  constructor(private readonly handlers: ToolHandlerMap) {
    this.robustExecutor = new RobustExecutor();
  }

  /**
   * Type-safe tool execution
   *
   * @template T Tool name type
   * @param toolName Tool name to execute
   * @param args Tool arguments (received as unknown type, validated at runtime)
   * @returns Tool execution result
   * @throws {ToolValidationError} When argument type is invalid
   *
   */
  async executeToolSafely<T extends SupportedToolName>(
    toolName: T,
    args: unknown
  ): Promise<CallToolResult> {
    const correlationId = crypto.randomUUID();

    logger.info(`Starting tool execution: ${toolName}`, {
      toolName,
      correlationId,
      argsProvided: args !== undefined,
    });

    try {
      // Step 1: Validate argument type safety
      const validatedArgs = validateToolArgs(toolName, args);

      logger.debug(`Tool arguments validated: ${toolName}`, {
        toolName,
        correlationId,
      });

      // Step 2: Call handler with robust execution
      const result = await this.robustExecutor.execute(
        async () => this.dispatchToHandler(toolName, validatedArgs),
        {
          operationName: `tool-execution-${toolName}`,
          timeoutMs: 30000, // 30 second timeout
        }
      );

      logger.info(`Tool execution completed: ${toolName}`, {
        toolName,
        correlationId,
        success: true,
      });

      // Step 3: Convert from existing handler format to MCP format
      return this.convertToCallToolResult(result);
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error, {
        toolName,
        correlationId,
        success: false,
      });

      // Error handling
      if (error instanceof ToolValidationError) {
        return this.formatValidationErrorResponse(error);
      }

      return this.formatGenericErrorResponse(toolName, error);
    }
  }

  /**
   * Dispatch processing to handler corresponding to specific tool
   *
   * @template T Tool name type
   * @param toolName Tool name
   * @param args Validated arguments
   * @returns Handler execution result
   */
  private async dispatchToHandler<T extends SupportedToolName>(
    toolName: T,
    args: ToolArgsFor<T>
  ): Promise<HandlerResult> {
    // Type-safe handler retrieval and execution
    switch (toolName) {
      case 'list_support_cases':
        return await this.handlers['list_support_cases'].handle(
          args as ToolArgumentsMap['list_support_cases']
        );

      case 'get_support_case':
        return await this.handlers['get_support_case'].handle(
          args as ToolArgumentsMap['get_support_case']
        );

      case 'get_case_comments':
        return await this.handlers['get_case_comments'].handle(
          args as ToolArgumentsMap['get_case_comments']
        );

      case 'search_support_cases':
        return await this.handlers['search_support_cases'].handle(
          args as ToolArgumentsMap['search_support_cases']
        );

      case 'create_support_case':
        return await this.handlers['create_support_case'].handle(
          args as ToolArgumentsMap['create_support_case']
        );

      case 'update_support_case':
        return await this.handlers['update_support_case'].handle(
          args as ToolArgumentsMap['update_support_case']
        );

      case 'close_support_case':
        return await this.handlers['close_support_case'].handle(
          args as ToolArgumentsMap['close_support_case']
        );

      case 'create_case_comment':
        return await this.handlers['create_case_comment'].handle(
          args as ToolArgumentsMap['create_case_comment']
        );

      case 'list_case_attachments':
        return await this.handlers['list_case_attachments'].handle(
          args as ToolArgumentsMap['list_case_attachments']
        );

      case 'search_case_classifications':
        return await this.handlers['search_case_classifications'].handle(
          args as ToolArgumentsMap['search_case_classifications']
        );

      default:
        // TypeScript exhaustive check
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _exhaustiveCheck: never = toolName;
        throw new Error(`Unsupported tool: ${String(toolName)}`);
    }
  }

  /**
   * Convert handler result to MCP CallToolResult format
   *
   * @param result Handler execution result
   * @returns MCP compliant CallToolResult
   */
  private convertToCallToolResult(result: HandlerResult): CallToolResult {
    return {
      content: result.content.map((item) => ({
        type: 'text' as const,
        text: item.text,
      })),
      isError: result.isError,
    };
  }

  /**
   * Format validation error response
   *
   * @param error Validation error
   * @returns Formatted error response
   */
  private formatValidationErrorResponse(error: ToolValidationError): CallToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'Validation Error',
              tool: error.toolName,
              message: error.message,
              validationErrors: error.validationErrors,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * Format generic error response
   *
   * @param toolName Tool name
   * @param error Error object
   * @returns Formatted error response
   */
  private formatGenericErrorResponse(toolName: string, error: unknown): CallToolResult {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'Tool Execution Error',
              tool: toolName,
              message: errorMessage,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  /**
   * Get list of supported tool names
   *
   * @returns Array of supported tool names
   */
  getSupportedTools(): SupportedToolName[] {
    return Object.keys(this.handlers) as SupportedToolName[];
  }

  /**
   * Check if specific tool is supported
   *
   * @param toolName Tool name to check
   * @returns true if supported
   */
  isToolSupported(toolName: string): toolName is SupportedToolName {
    return toolName in this.handlers;
  }
}
