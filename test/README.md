# Shinzo Test Suite

This directory contains comprehensive tests for the Shinzo observability package. The tests are designed to be self-contained, fast, and provide good coverage of all functionality.

## Test Structure

```
test/
├── README.md                 # This file
├── setup.ts                  # Global test setup and mocks
├── test-runner.ts           # Custom test runner with cleanup
├── mocks/
│   └── MockMcpServer.ts     # Mock MCP server for testing
├── config.test.ts           # Configuration validation tests
├── sanitizer.test.ts        # PII sanitization tests
├── instrumentation.test.ts  # MCP server instrumentation tests
├── telemetry.test.ts        # Telemetry manager tests
├── index.test.ts            # Main entry point tests
└── integration.test.ts      # End-to-end integration tests
```

## Test Categories

### Unit Tests
- **config.test.ts**: Tests configuration validation, default configs, and config merging
- **sanitizer.test.ts**: Tests PII sanitization patterns and data processing
- **telemetry.test.ts**: Tests telemetry manager initialization and OpenTelemetry integration
- **instrumentation.test.ts**: Tests MCP server instrumentation and method wrapping
- **index.test.ts**: Tests main entry point and exported functionality

### Integration Tests
- **integration.test.ts**: End-to-end tests that verify the complete workflow from MCP server initialization to telemetry collection

### Mock Infrastructure
- **mocks/MockMcpServer.ts**: Provides a realistic mock MCP server with tools, resources, and prompts for testing

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run only unit tests
pnpm test:unit

# Run only integration tests
pnpm test:integration

# Run tests with custom runner (includes cleanup)
pnpm test:runner

# Run tests for CI/CD
pnpm test:ci
```

### Advanced Options

```bash
# Run specific test file
pnpm test config.test.ts

# Run tests matching a pattern
pnpm test --testNamePattern="sanitize"

# Run tests with verbose output
pnpm test --verbose

# Run tests with coverage and open report
pnpm test:coverage && open coverage/lcov-report/index.html
```

## Test Features

### Self-Contained Tests
- All tests use mocked dependencies to avoid external network calls
- Tests clean up after themselves automatically
- No manual setup or teardown required

### Mock Infrastructure
- Comprehensive mock MCP server with realistic behavior
- Mocked OpenTelemetry components to avoid real telemetry collection
- Configurable test tools, resources, and prompts

### Performance Testing
- Tests include performance benchmarks for high-frequency operations
- Measures telemetry overhead and ensures minimal impact

### Error Handling
- Tests cover error scenarios and edge cases
- Validates proper error propagation and recovery

### PII Sanitization
- Comprehensive tests for sensitive data patterns
- Validates sanitization effectiveness and performance

## Test Configuration

The test suite is configured via `jest.config.js` with the following features:

- **Coverage Threshold**: 80% coverage required for branches, functions, lines, and statements
- **Test Timeout**: 30 seconds per test
- **Setup File**: Automatic mock setup and global test utilities
- **Cleanup**: Automatic cleanup of test artifacts
- **Isolation**: Tests run in isolated environments

## Mock Server Usage

The `MockMcpServer` class provides a realistic testing environment:

```typescript
import { MockMcpServer, createTestTools } from './mocks/MockMcpServer';

// Create mock server
const server = new MockMcpServer();

// Add test tools
createTestTools(server);

// Use in tests
await server.callTool('calculator', { operation: 'add', a: 1, b: 2 });
```

## Test Utilities

The setup file provides useful utilities:

```typescript
import { testUtils } from './setup';

// Wait for async operations
await testUtils.waitForNextTick();

// Advance timers
await testUtils.waitFor(1000);

// Create async mocks
const mockFn = testUtils.createAsyncMock('resolved value');
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Report**: Displayed in terminal
- **LCOV Report**: `coverage/lcov.info`

## Continuous Integration

The test suite is optimized for CI/CD environments:

- Uses `--ci` flag for better CI performance
- Includes `--forceExit` to ensure clean shutdown
- Generates coverage reports in CI-friendly formats
- Includes timeout handling for hung tests

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in `jest.config.js` or use `--timeout` flag
2. **Memory leaks**: Tests use `--detectOpenHandles` and `--forceExit` to prevent this
3. **Mock issues**: Check that all OpenTelemetry modules are properly mocked in `setup.ts`
4. **Network calls**: All external dependencies are mocked; real network calls should not occur

### Debug Mode

Run tests with debug information:

```bash
# Enable debug logging
DEBUG=* pnpm test

# Run with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Use the mock infrastructure provided
3. Ensure tests are self-contained and don't rely on external resources
4. Add appropriate cleanup in `beforeEach`/`afterEach` hooks
5. Include both positive and negative test cases
6. Test error conditions and edge cases
7. Update this README if adding new test categories or utilities

## Test Philosophy

The test suite follows these principles:

- **Fast**: Tests should run quickly to enable fast development cycles
- **Reliable**: Tests should be deterministic and not flaky
- **Isolated**: Tests should not depend on external resources or other tests
- **Comprehensive**: Tests should cover all code paths and edge cases
- **Maintainable**: Tests should be easy to understand and modify
- **Self-Documenting**: Tests should serve as documentation for the API