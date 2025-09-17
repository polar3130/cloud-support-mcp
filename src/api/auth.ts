/**
 * Google Cloud authentication module
 *
 * Provides authentication processing for Google Cloud Support API v2.
 * Supports multiple authentication methods and provides fallback functionality:
 * 1. gcloud CLI
 * 2. Service account key (GOOGLE_APPLICATION_CREDENTIALS)
 * 3. Application Default Credentials (ADC)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import { GoogleAuth } from 'google-auth-library';

// Promisify exec from child_process
const execAsync = promisify(exec);

/**
 * Authentication method enumeration
 */
export enum AuthMethod {
  GCLOUD_CLI = 'gcloud-cli',
  SERVICE_ACCOUNT_KEY = 'service-account-key',
  APPLICATION_DEFAULT = 'application-default',
}

/**
 * Authentication result type definition
 */
export interface AuthResult {
  accessToken: string;
  method: AuthMethod;
}

/**
 * Get access token using gcloud CLI
 */
async function getAccessTokenFromGcloud(): Promise<string> {
  const { stdout } = await execAsync('gcloud auth print-access-token');
  return stdout.trim();
}

/**
 * Get access token from service account key file
 */
async function getAccessTokenFromServiceAccount(): Promise<string> {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  }

  const credentialsContent = await readFile(credentialsPath, 'utf8');
  const credentials = JSON.parse(credentialsContent);

  const auth = new GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  if (!accessTokenResponse.token) {
    throw new Error('Failed to obtain access token from service account');
  }

  return accessTokenResponse.token;
}

/**
 * Get access token from Application Default Credentials (ADC)
 */
async function getAccessTokenFromADC(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();

  if (!accessTokenResponse.token) {
    throw new Error('Failed to obtain access token from ADC');
  }

  return accessTokenResponse.token;
}

/**
 * Get Google Cloud access token
 * Tries multiple authentication methods in order and uses the first successful method
 * @returns Access token and authentication method used
 * @throws When all authentication methods fail
 */
export async function getAccessToken(): Promise<string> {
  const authMethods = [
    { method: AuthMethod.GCLOUD_CLI, fn: getAccessTokenFromGcloud },
    { method: AuthMethod.SERVICE_ACCOUNT_KEY, fn: getAccessTokenFromServiceAccount },
    { method: AuthMethod.APPLICATION_DEFAULT, fn: getAccessTokenFromADC },
  ];

  const errors: Error[] = [];

  for (const { method, fn } of authMethods) {
    try {
      const accessToken = await fn();
      return accessToken;
    } catch (error) {
      errors.push(new Error(`${method}: ${error}`));
    }
  }

  const errorMessages = errors.map((e) => e.message).join('; ');
  throw new Error(`Failed to get access token using any method: ${errorMessages}`);
}

/**
 * Get detailed authentication information (including which method was used)
 * @returns Authentication result object
 */
export async function getAccessTokenWithMethod(): Promise<AuthResult> {
  const authMethods = [
    { method: AuthMethod.GCLOUD_CLI, fn: getAccessTokenFromGcloud },
    { method: AuthMethod.SERVICE_ACCOUNT_KEY, fn: getAccessTokenFromServiceAccount },
    { method: AuthMethod.APPLICATION_DEFAULT, fn: getAccessTokenFromADC },
  ];

  const errors: Error[] = [];

  for (const { method, fn } of authMethods) {
    try {
      const accessToken = await fn();
      return { accessToken, method };
    } catch (error) {
      errors.push(new Error(`${method}: ${error}`));
    }
  }

  const errorMessages = errors.map((e) => e.message).join('; ');
  throw new Error(`Failed to get access token using any method: ${errorMessages}`);
}

/**
 * Get project ID from gcloud CLI
 */
async function getProjectIdFromGcloud(): Promise<string> {
  const { stdout } = await execAsync('gcloud config get-value project');
  return stdout.trim();
}

/**
 * Get project ID from service account key file
 */
async function getProjectIdFromServiceAccount(): Promise<string> {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error('GOOGLE_APPLICATION_CREDENTIALS environment variable not set');
  }

  const credentialsContent = await readFile(credentialsPath, 'utf8');
  const credentials = JSON.parse(credentialsContent);

  if (!credentials.project_id) {
    throw new Error('project_id not found in service account credentials');
  }

  return credentials.project_id;
}

/**
 * Get project ID from ADC
 */
async function getProjectIdFromADC(): Promise<string> {
  const auth = new GoogleAuth();
  const projectId = await auth.getProjectId();

  if (!projectId) {
    throw new Error('Failed to obtain project ID from ADC');
  }

  return projectId;
}

/**
 * Get current Google Cloud project ID
 * Tries multiple methods in order and uses the first successful method
 * @returns Project ID string
 * @throws When all methods fail
 */
export async function getCurrentProjectId(): Promise<string> {
  const projectIdMethods = [
    { method: 'gcloud-cli', fn: getProjectIdFromGcloud },
    { method: 'service-account-key', fn: getProjectIdFromServiceAccount },
    { method: 'application-default', fn: getProjectIdFromADC },
  ];

  const errors: Error[] = [];

  for (const { method, fn } of projectIdMethods) {
    try {
      const projectId = await fn();
      return projectId;
    } catch (error) {
      errors.push(new Error(`${method}: ${error}`));
    }
  }

  const errorMessages = errors.map((e) => e.message).join('; ');
  throw new Error(`Failed to get current project ID using any method: ${errorMessages}`);
}

/**
 * Generate authentication headers for Google Cloud Support API
 * @returns Authentication header object
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const accessToken = await getAccessToken();
  const projectId = await getCurrentProjectId();

  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Goog-User-Project': projectId,
  };
}
