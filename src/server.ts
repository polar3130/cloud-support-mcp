#!/usr/bin/env node

/**
 * Google Cloud Support MCP Server
 *
 * Model Context Protocol (MCP) server implementation that provides
 * Google Cloud Support case management functionality. Supports the following features:
 * - Retrieve list of support cases
 * - Get individual support case details
 * - Get comment history for support cases
 * - Search and filter support cases
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

// Type definition imports
import type { SupportedToolName } from './types/index.js';

// Type-safe tool dispatcher import
import { TypeSafeToolDispatcher, type ToolHandlerMap } from './utils/tool-dispatcher.js';

// API client imports
import { getAccessToken, getCurrentProjectId } from './api/index.js';

import { logger } from './utils/logger.js';
import { gracefulShutdown } from './utils/graceful-shutdown.js';

// Tool definition imports
import { getToolDefinitions } from './tools/index.js';

// Handler imports
import {
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
} from './handlers/index.js';

/**
 * Google Cloud Support MCP Server main class
 *
 * This class implements the Model Context Protocol (MCP) server and
 * provides Google Cloud Support API connection and tool execution functionality
 *
 */
export class CloudSupportMCPServer {
  private server: Server;
  private toolDispatcher: TypeSafeToolDispatcher;

  // Public properties for testing (for backward compatibility)
  public readonly listSupportCasesHandler: ListSupportCasesHandler;
  public readonly getSupportCaseHandler: GetSupportCaseHandler;
  public readonly getCaseCommentsHandler: GetCaseCommentsHandler;
  public readonly searchSupportCasesHandler: SearchSupportCasesHandler;
  public readonly createSupportCaseHandler: CreateSupportCaseHandler;
  public readonly updateSupportCaseHandler: UpdateSupportCaseHandler;
  public readonly closeSupportCaseHandler: CloseSupportCaseHandler;
  public readonly createCaseCommentHandler: CreateCaseCommentHandler;
  public readonly listCaseAttachmentsHandler: ListCaseAttachmentsHandler;
  public readonly searchCaseClassificationsHandler: SearchCaseClassificationsHandler;

  /**
   * CloudSupportMCPServer constructor
   * Initializes MCP server and sets up tool handlers
   */
  constructor() {
    // Initialize handler instances
    const handlers: ToolHandlerMap = {
      create_support_case: new CreateSupportCaseHandler(),
      get_case_comments: new GetCaseCommentsHandler(),
      get_support_case: new GetSupportCaseHandler(),
      list_support_cases: new ListSupportCasesHandler(),
      search_support_cases: new SearchSupportCasesHandler(),
      update_support_case: new UpdateSupportCaseHandler(),
      close_support_case: new CloseSupportCaseHandler(),
      create_case_comment: new CreateCaseCommentHandler(),
      list_case_attachments: new ListCaseAttachmentsHandler(),
      search_case_classifications: new SearchCaseClassificationsHandler(),
    };

    // Assign to public properties for backward compatibility
    this.listSupportCasesHandler = handlers['list_support_cases'];
    this.getSupportCaseHandler = handlers['get_support_case'];
    this.getCaseCommentsHandler = handlers['get_case_comments'];
    this.searchSupportCasesHandler = handlers['search_support_cases'];
    this.createSupportCaseHandler = handlers['create_support_case'];
    this.updateSupportCaseHandler = handlers['update_support_case'];
    this.closeSupportCaseHandler = handlers['close_support_case'];
    this.createCaseCommentHandler = handlers['create_case_comment'];
    this.listCaseAttachmentsHandler = handlers['list_case_attachments'];
    this.searchCaseClassificationsHandler = handlers['search_case_classifications'];

    // Initialize type-safe tool dispatcher
    this.toolDispatcher = new TypeSafeToolDispatcher(handlers);

    // Create MCP server instance
    this.server = new Server(
      {
        name: 'cloud-support-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {}, // Enable tool functionality
        },
      }
    );

    // Set up tool handlers
    this.setupToolHandlers();
  }

  /**
   * Set up MCP tool handlers
   * Defines available tools and sets up execution handlers
   *
   */
  private setupToolHandlers() {
    // Set up tool list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: getToolDefinitions(),
      };
    });

    // Set up tool execution - use type-safe dispatcher
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      try {
        // Check tool name type safety
        if (!this.toolDispatcher.isToolSupported(name)) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Type-safe tool execution
        return await this.toolDispatcher.executeToolSafely(name as SupportedToolName, args);
      } catch (error) {
        // Unified error handling
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Tool Execution Failed',
                  tool: name,
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
    });
  }

  /**
   * Start MCP server
   * Starts server using stdio transport
   *
   */
  async run() {
    try {
      logger.info('Starting Cloud Support MCP Server');

      const transport = new StdioServerTransport();

      // Register server shutdown handlers
      this.registerShutdownHandlers(transport);

      await this.server.connect(transport);

      logger.info('Cloud Support MCP Server started successfully on stdio');
    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }

  /**
   * Register graceful shutdown handlers
   */
  private registerShutdownHandlers(transport: StdioServerTransport) {
    // Server stop handler
    gracefulShutdown.registerHandler(
      'mcp-server',
      async () => {
        logger.info('Shutting down MCP server');
        if (this.server && typeof this.server.close === 'function') {
          await this.server.close();
        }
        logger.info('MCP server shutdown complete');
      },
      5000 // 5 second timeout
    );

    // Transport stop handler
    gracefulShutdown.registerHandler(
      'stdio-transport',
      async () => {
        logger.info('Closing stdio transport');
        if (transport && typeof transport.close === 'function') {
          await transport.close();
        }
        logger.info('Stdio transport closed');
      },
      3000 // 3 second timeout
    );

    // Resource cleanup handler
    gracefulShutdown.registerHandler(
      'resource-cleanup',
      async () => {
        logger.info('Cleaning up server resources');
        // Additional cleanup processing as needed
        logger.info('Resource cleanup complete');
      },
      2000 // 2 second timeout
    );

    logger.debug('Shutdown handlers registered');
  }

  // Note: These methods are kept for testing purposes,
  // actual API client functionality has been moved to src/api/ modules

  /**
   * Get access token (test backward compatibility method)
   * @deprecated Use getAccessToken from src/api/auth.js for new code
   */
  private async getAccessToken(): Promise<string> {
    return getAccessToken();
  }

  /**
   * Get current project ID (test backward compatibility method)
   * @deprecated Use getCurrentProjectId from src/api/auth.js for new code
   */
  private async getCurrentProjectId(): Promise<string> {
    return getCurrentProjectId();
  }
}

/**
 * Process-level error handling configuration
 * Graceful shutdown manager handles automatically
 */
logger.info('Process error handlers configured via graceful shutdown manager');

const server = new CloudSupportMCPServer();

/**
 * Main process
 * Avoids automatic execution in test environment, starts server only in production environment
 */
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  server.run().catch((error) => {
    logger.fatal('Failed to start server', error);
    process.exit(1);
  });
}
