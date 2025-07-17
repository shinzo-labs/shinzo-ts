# @shinzo/instrumentation-mcp Examples

This directory contains example MCP servers demonstrating how to use the `@shinzo/instrumentation-mcp` package for telemetry and observability.

## Available Examples

### 1. Basic Usage (`basic-usage.ts`)
A simple MCP server showing minimal telemetry configuration with the new `McpServer` class.

**Key Features:**
- Minimal configuration using default OTLP HTTP exporter
- Simple tool implementations with automatic instrumentation
- Basic telemetry configuration with `serverName` and `serverVersion`
- Graceful shutdown handling

**Tools Included:**
- `add_numbers` - Adds a list of numbers together
- `random_wait` - Waits for a random duration and reports the time
- `create_story` - Creates a short story from provided words

## Quick Start

### Prerequisites
- Node.js ≥ 22.16
- pnpm ≥ 10.2.1

### Installation
```bash
# From the monorepo root
pnpm install

# Build the instrumentation package
pnpm build
```

### Running Examples

#### Basic Usage Example
```bash
# Navigate to the examples directory
cd packages/instrumentation-mcp/examples

# Run with ts-node
npx ts-node basic-usage.ts
```

## Environment Variables

The examples support the following environment variables:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | string | `http://localhost:4318/v1` | OpenTelemetry collector endpoint |
| `OTEL_AUTH_TOKEN` | string | - | Bearer token for authentication |
| `OTEL_SAMPLING_RATE` | number | `1.0` | Trace sampling rate (0.0 to 1.0) |

## Testing with MCP Clients

### Claude Desktop Integration
Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "shinzo-basic-example": {
      "command": "npx",
      "args": ["ts-node", "/path/to/shinzo/packages/instrumentation-mcp/examples/basic-usage.ts"],
      "env": {
        "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4318/v1",
        "OTEL_AUTH_TOKEN": "my-auth-token"
      }
    }
  }
}
```

## Telemetry Output

### Basic Usage Example
- Exports telemetry to configured OTLP endpoint
- Includes traces for all tool calls
- Provides metrics for performance monitoring
- Sanitizes PII by default

### Error Handling
Both examples include proper error handling and graceful shutdown procedures.

## Next Steps

1. **Run the Examples**: Start with the basic usage example to understand the fundamentals
2. **Modify Configuration**: Experiment with different `TelemetryConfig` options
3. **Add Custom Tools**: Extend the examples with your own tool implementations
4. **Set Up Collection**: Configure an OpenTelemetry collector to receive the telemetry data
5. **Explore Advanced Features**: Check out the main README for comprehensive configuration options

For complete documentation, visit the [main Shinzo repository](https://github.com/shinzo-labs/shinzo-ts).
