# Cloud Support MCP Server

MCP server for Google Cloud Support API v2.

Provides tools for managing Google Cloud support cases through AI assistants.
Supports case creation, updates, comments, and search functionality.

## Installation

```bash
npm install
npm run build
```

## Authentication

Set up Google Cloud authentication:

```bash
# Service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Or use gcloud
gcloud auth application-default login
```

## Usage

```bash
npm start
```

## Tools

- `list_support_cases` - List support cases
- `get_support_case` - Get case details
- `search_support_cases` - Search cases
- `search_case_classifications` - Search classifications
- `create_support_case` - Create new case
- `create_case_comment` - Add comment
- `update_support_case` - Update case
- `close_support_case` - Close case
- `get_case_comments` - Get comments
- `list_case_attachments` - List attachments

## Usage Examples

### List Cases

```json
{
  "name": "list_support_cases",
  "arguments": {
    "parent": "projects/your-project-id",
    "pageSize": 10
  }
}
```

### Create Case

```json
{
  "name": "create_support_case",
  "arguments": {
    "parent": "projects/your-project-id",
    "displayName": "Issue Summary",
    "description": "Detailed description",
    "classification": { "id": "technical-issue" }
  }
}
```

### Search Case Classifications

Search for appropriate case classifications using display name patterns:

```json
{
  "name": "search_case_classifications",
  "arguments": {
    "query": "displayName:*BigQuery*",
    "pageSize": 20
  }
}
```

**Query Format Examples:**
- `"displayName:*Billing*"` - Find billing-related classifications
- `"displayName:*Compute*"` - Find Compute Engine classifications  
- `"displayName:*Storage*"` - Find storage-related classifications

**Note**: Use asterisks (*) to wrap search terms in the displayName field. Direct text searches without the displayName: prefix may not work as expected.

## Development

```bash
npm run dev         # Development mode
npm test            # Run tests
npm run lint        # Code linting
npm run type-check  # TypeScript validation
```

## Requirements

- Node.js 18+
- Google Cloud Support API access
- Appropriate IAM permissions

## Author

polar3130

## License

MIT
