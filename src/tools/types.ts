/**
 * Type definitions for MCP tool definitions
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * JSON Schema property type
 *
 * Strict type definition used in MCP tool input schemas
 */
export interface JsonSchemaProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  readonly description?: string;
  readonly enum?: readonly (string | number)[];
  readonly items?: JsonSchemaProperty;
  readonly properties?: Readonly<Record<string, JsonSchemaProperty>>;
  readonly required?: readonly string[];
  readonly default?: string | number | boolean | null;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
}

/**
 * Strict tool input schema type
 *
 * Uses extends to maintain compatibility with MCP SDK
 */
export interface ToolInputSchema extends Record<string, unknown> {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, JsonSchemaProperty>>;
  readonly required?: string[];
  readonly additionalProperties?: boolean;
}

/**
 * Base type for MCP tool definitions
 *
 */
export interface ToolDefinition extends Omit<Tool, 'inputSchema'> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ToolInputSchema;
}

/**
 * Array type for tool definitions
 */
export type ToolDefinitions = readonly ToolDefinition[];

/**
 * Type for function that retrieves tool definitions
 */
export type GetToolDefinitions = () => ToolDefinitions;

/**
 * Common parameter types for Google Cloud Support API
 */
export interface BaseCloudSupportParams {
  parent?: string;
  pageSize?: number;
  pageToken?: string;
}

/**
 * Common parameter types for support case related operations
 */
export interface SupportCaseParams extends BaseCloudSupportParams {
  name?: string;
  filter?: string;
}

/**
 * Priority enumeration type
 */
export type Priority = 'PRIORITY_UNSPECIFIED' | 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

/**
 * Case state enumeration type
 */
export type CaseState = 'OPEN' | 'CLOSED' | 'ALL';

/**
 * Escalation reason enumeration type
 */
export type EscalationReason = 'RESOLUTION_TIME' | 'TECHNICAL_EXPERTISE' | 'BUSINESS_IMPACT';

/**
 * Parameter type for listing case attachments
 */
export interface ListCaseAttachmentsArgs {
  parent: string;
  pageSize?: number;
  pageToken?: string;
}

/**
 * Parameter type for searching case classifications
 */
export interface SearchCaseClassificationsArgs {
  query?: string;
  pageSize?: number;
  pageToken?: string;
}
