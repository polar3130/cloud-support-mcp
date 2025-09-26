# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-09-26

### Fixed

- Fixed search_support_cases handler to properly support organization-level case search across hierarchical resources
- Improved error handling for invalid parent format validation in search functionality

## [1.0.0] - 2025-09-22

### Added

- Initial release of Cloud Support MCP Server
- Complete Google Cloud Support API v2 integration
- Support for case management operations (create, read, update, close)
- Case search and classification functionality
- Comment and attachment management
- Authentication via service account or ADC
- Comprehensive test suite
- TypeScript support with full type definitions
