import { BaseHandler } from './base-handler.js';
import { apiClient } from '../api/index.js';
import type { SearchSupportCasesArgs, SupportCaseData } from '../types/index.js';

/**
 * SearchSupportCasesHandler
 * Handler responsible for support case search and filtering functionality
 */
export class SearchSupportCasesHandler extends BaseHandler {
  /**
   * Execute support case search and filtering
   * @param args Search conditions (parent resource, query, state, priority, max results)
   * @returns Filtered support case list
   */
  async handle(args: SearchSupportCasesArgs) {
    return this.executeWithErrorHandling('searching support cases', async () => {
      const { parent, query, state = 'ALL', priority, maxResults = 20 } = args;

      // Validate required parameters
      if (!parent) {
        throw new Error('parent is required');
      }

      // Validate invalid parent format
      if (!parent.startsWith('projects/') && !parent.startsWith('organizations/')) {
        throw new Error('Invalid parent format. Must start with "projects/" or "organizations/"');
      }

      // Build API filters
      let filter = '';
      const filters = [];

      // Filter by state
      if (state !== 'ALL') {
        filters.push(`state=${state}`);
      }

      // Filter by priority
      if (priority) {
        filters.push(`priority=${priority}`);
      }

      // Combine filter conditions
      if (filters.length > 0) {
        filter = filters.join(' AND ');
      }

      // Get current project ID (for logging purposes)
      await this.getCurrentProjectIdWithLogging();

      // Send request using API client
      const endpoint = `/v2/${parent}/cases:search`;
      const pageSize = Math.max(1, Math.min(maxResults, 100)); // Handle negative values appropriately
      const queryParams: Record<string, string | number> = {
        pageSize,
      };

      if (filter) queryParams.filter = filter;

      const response = await apiClient.get(endpoint, queryParams);
      const data = response.data as {
        cases?: SupportCaseData[];
        nextPageToken?: string;
      };

      // Handle null or undefined cases
      if (!data) {
        return {
          searchQuery: query,
          appliedFilters: { state, priority },
          totalFound: 0,
          cases: [],
        };
      }

      let cases = data.cases || [];

      // Search filtering by query (client-side)
      if (query) {
        const searchTerm = query.toLowerCase();
        cases = cases.filter((case_: SupportCaseData) => {
          const displayName = (case_.displayName || '').toLowerCase();
          const description = (case_.description || '').toLowerCase();

          // Support for compound search using OR operator
          if (searchTerm.includes(' or ')) {
            const searchTerms = searchTerm.split(' or ').map((term) => term.trim());
            return searchTerms.some(
              (term) => displayName.includes(term) || description.includes(term)
            );
          }

          // Single keyword search
          return displayName.includes(searchTerm) || description.includes(searchTerm);
        });
      }

      // Format search results and limit count
      const formattedCases = cases.slice(0, maxResults).map((case_: SupportCaseData) => {
        const description = case_.description || '';
        const truncatedDescription =
          description.length > 200 ? description.substring(0, 200) + '...' : description;

        return {
          name: case_.name || '',
          displayName: case_.displayName || '',
          description: truncatedDescription,
          state: case_.state || '',
          priority: case_.priority || '',
          createTime: case_.createTime || '',
          updateTime: case_.updateTime || '',
          creator: case_.creator?.displayName || case_.creator?.email || '',
          escalated: case_.escalated || false,
        };
      });

      // Return search results in MCP response format
      const responseData: {
        searchQuery: string | undefined;
        appliedFilters: { state: string; priority: string | undefined };
        totalFound: number;
        cases: Array<{
          name: string;
          displayName: string;
          description: string;
          state: string;
          priority: string;
          createTime: string;
          updateTime: string;
          creator: string;
          escalated: boolean;
        }>;
        nextPageToken?: string;
      } = {
        searchQuery: query,
        appliedFilters: { state, priority },
        totalFound: formattedCases.length,
        cases: formattedCases,
      };

      // Add nextPageToken if it exists
      if (data.nextPageToken) {
        responseData.nextPageToken = data.nextPageToken;
      }

      return responseData;
    });
  }
}
