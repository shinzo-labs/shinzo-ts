# Shinzo Instrumentation MCP Examples

This directory contains example MCP servers demonstrating different configurations and use cases for the Shinzo Instrumentation MCP package.

## Examples

### 1. Basic Usage (`basic-usage.ts`)
A simple MCP server with basic telemetry configuration using the `@shinzo/instrumentation-mcp` package.

**Features:**
- Basic telemetry setup with OTLP HTTP exporter
- Simple tool implementation
- PII sanitization enabled
- Custom data processors

### 2. Advanced Usage (`advanced-usage.ts`)
A comprehensive example showing advanced telemetry features with `@shinzo/instrumentation-mcp`.

**Features:**
- Full telemetry configuration with environment variables
- Custom spans and metrics
- Multiple tools with different telemetry patterns
- Error handling and performance categorization
- Custom attributes and data processors

### 3. Console Exporter (`console-exporter.ts`)
A development-focused example that outputs telemetry to the console.

**Features:**
- Console-based telemetry output
- Simple tools for testing
- Real-time telemetry visualization
- Development/debugging friendly

## Running the Examples

### Prerequisites
- Node.js ≥ 22.16
- pnpm ≥ 10.2.1
- TypeScript knowledge

### Installation
```bash
# From the instrumentation-mcp package root
pnpm install

# Build the package
pnpm run build
```

### Running Examples

#### Basic Usage
```bash
# Run directly with ts-node
npx ts-node examples/basic-usage.ts

# Or build and run compiled version
pnpm run build
node dist/examples/basic-usage.js
```

#### Advanced Usage
```bash
npx ts-node examples/advanced-usage.ts
```

#### Console Exporter
```bash
npx ts-node examples/console-exporter.ts
```

## Environment Variables

### Required Environment Variables
None of the examples require environment variables to run, but they will use defaults.

### Optional Environment Variables

#### For Both Basic and Advanced Usage

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | string | No | `http://localhost:4318/v1/traces` | OpenTelemetry collector endpoint |
| `OTEL_AUTH_TOKEN` | string | No | - | Bearer token for OTLP endpoint authentication |
| `OTEL_SAMPLING_RATE` | float | No | `1.0` | Sampling rate as float (0.0 to 1.0) |
| `ENABLE_USER_CONSENT` | boolean | No | `false` | Enable user consent checking |
| `ENABLE_PII_SANITIZATION` | boolean | No | `true` | Enable PII sanitization |
| `NODE_ENV` | string | No | `development` | Environment identifier |
| `AWS_REGION` | string | No | `us-east-1` | AWS region identifier |
| `DEPLOYMENT_ID` | string | No | `local` | Deployment identifier |
| `APP_VERSION` | string | No | `1.0.0` | Application version |

#### For Console Exporter
No additional environment variables needed - outputs to console by default.

## Testing with MCP Clients

To test these examples with an MCP client, you can use the MCP CLI or integrate with Claude Desktop:

### Using MCP CLI
```bash
# Install MCP CLI
yarn global add @modelcontextprotocol/cli # or npm install -g @modelcontextprotocol/cli

# Run example server
mcp run npx ts-node examples/basic-usage.ts
```

### Integration with Claude Desktop
Add to your Claude Desktop configuration:
```json
{
  "servers": {
    "shinzo-instrumentation-mcp-example": {
      "command": "npx",
      "args": ["ts-node", "/path/to/shinzo/packages/instrumentation-mcp/examples/basic-usage.ts"]
    }
  }
}
```

## Telemetry Data

All examples will generate telemetry data including:
- Tool execution traces
- Performance metrics
- MCP attributes using standard OpenTelemetry semantic conventions
- PII-sanitized data (when enabled)

The telemetry data can be sent to any OpenTelemetry-compatible collector or viewed in the console for debugging.
