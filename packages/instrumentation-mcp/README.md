<div align="center">
  <a href="https://github.com/shinzo-labs/shinzo-ts">
    <img src="https://github.com/user-attachments/assets/78542e5b-1da1-44ad-a3e2-5b4eb9e6a962" alt="Shinzo Logo" width="180" height="180">
  </a>
  <h1 align="center">@shinzolabs/instrumentation-mcp</h1>
  <p align="center">
    <b>OpenTelemetry instrumentation for MCP servers.</b><br/>

  </p>
</div>

## Installation

```bash
npm install @shinzolabs/instrumentation-mcp
# or
pnpm add @shinzolabs/instrumentation-mcp
```

## Usage

For minimal-footprint usage, just pass in the server name, version, and exporter endpoint:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { instrumentServer, TelemetryConfig } from "@shinzolabs/instrumentation-mcp"

const NAME = "my-mcp-server"
const VERSION = "1.0.0"

const server = new McpServer({
  name: NAME,
  version: VERSION,
  description: "Example MCP server with telemetry"
})

// Use TelemetryConfig to set configuration options
const telemetryConfig: TelemetryConfig = {
  serverName: NAME,
  serverVersion: VERSION,
  exporterEndpoint: "http://localhost:4318/v1" // OpenTelemetry collector endpoint - /trace and /metrics are added automatically
}

// Initialize telemetry
const telemetry = instrumentServer(server, telemetryConfig)

// Add tools using the tool method
server.tool(...)
```

The TelemetryConfig also exposes a number of other options for precise telemetry processing:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { instrumentServer, TelemetryConfig } from "@shinzolabs/instrumentation-mcp"

const NAME = "my-other-mcp-server"
const VERSION = "1.0.0"

const server = new McpServer({
  name: NAME,
  version: VERSION,
  description: "Example MCP server with telemetry"
})

const telemetryConfig: TelemetryConfig = {
  serviceName: NAME,
  serviceVersion: VERSION,
  exporterEndpoint: "http://localhost:4318/v1", // OpenTelemetry collector endpoint
  exporterAuth: {
    type: "bearer",
    token: process.env.OTEL_AUTH_TOKEN
  },
  enablePIISanitization: false,
  enableTracing: false,
  samplingRate: 0.7,
  dataProcessors: [
    (telemetryData: any) => {
      if (telemetryData['mcp.tool.name'] === "sensitive_operation") {
        for (const key of Object.keys(telemetryData)) {
          if (key.startsWith('mcp.request.argument')) delete telemetryData[key]
        }
      }
      return telemetryData
    }
  ]
}

const telemetry = instrumentServer(server, telemetryConfig)

// Add tools using the tool method
server.tool(...)
```

## Configuration Options

The `TelemetryConfig` interface provides comprehensive configuration options for customizing telemetry behavior:

### TelemetryConfig Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `serverName` | `string` | ✅ | - | Name of the MCP server |
| `serverVersion` | `string` | ✅ | - | Version of the MCP server |
| `exporterEndpoint` | `string` | ⚠️ | - | OpenTelemetry collector OTLP endpoint URL (required unless using console exporter) |
| `exporterAuth` | `ExporterAuth` | ❌ | - | Authentication configuration for the exporter |
| `samplingRate` | `number` | ❌ | `1.0` | Trace sampling rate (0.0 to 1.0) |
| `metricExportIntervalMs` | `number` | ❌ | `5000` | Metric export interval in milliseconds |
| `enablePIISanitization` | `boolean` | ❌ | `true` | Enable automatic PII sanitization |
| `enableArgumentCollection` | `boolean` | ❌ | `false` | Enable collection of tool arguments in traces |
| `dataProcessors` | `((data: any) => any)[]` | ❌ | `[]` | Array of custom data processing functions |
| `exporterType` | `'otlp-http' \| 'otlp-grpc' \| 'console'` | ❌ | `'otlp-http'` | Type of telemetry exporter |
| `enableMetrics` | `boolean` | ❌ | `true` | Enable metrics collection |
| `enableTracing` | `boolean` | ❌ | `true` | Enable tracing collection |
| `batchTimeoutMs` | `number` | ❌ | `2000` | Batch timeout in milliseconds |
| `PIISanitizer` | `PIISanitizer` | ❌ | - | Custom PII sanitizer instance |

### ExporterAuth Configuration

The `exporterAuth` property supports multiple authentication methods:

| Auth Type | Properties | Description |
|-----------|------------|-------------|
| `bearer` | `token: string` | Bearer token authentication |
| `apiKey` | `apiKey: string` | API key authentication |
| `basic` | `username: string, password: string` | Basic HTTP authentication |

### Usage Examples

#### Minimal Configuration
```typescript
const telemetryConfig: TelemetryConfig = {
  serverName: "my-server",
  serverVersion: "1.0.0",
  exporterEndpoint: "http://localhost:4318/v1" // OpenTelemetry collector endpoint
}
```

#### Bearer Token Authentication
```typescript
const telemetryConfig: TelemetryConfig = {
  serverName: "my-server",
  serverVersion: "1.0.0",
  exporterEndpoint: "https://api.example.com/v1",
  exporterAuth: {
    type: "bearer",
    token: process.env.OTEL_AUTH_TOKEN
  }
}
```

#### Custom Data Processing
```typescript
const telemetryConfig: TelemetryConfig = {
  serverName: "my-server",
  serverVersion: "1.0.0",
  exporterEndpoint: "http://localhost:4318/v1", // OpenTelemetry collector endpoint
  dataProcessors: [
    (data) => {
      // Remove sensitive parameters
      if (data['mcp.tool.name'] === 'sensitive_tool') {
        delete data['mcp.request.argument.password']
      }
      return data
    }
  ]
}
```

#### Console Development Setup
```typescript
const telemetryConfig: TelemetryConfig = {
  serverName: "my-server",
  serverVersion: "1.0.0",
  exporterType: "console",
  enableMetrics: false, // Console exporter doesn't support metrics
  samplingRate: 1.0 // Sample all traces in development
}
```

## Features

- **Automatic Instrumentation**: One line of code gives you instant instrumentation for all the capabilities on your MCP server.
- **Anonymous, Configurable Telemetry**: Built-in PII sanitization and user consent mechanisms ensure you always remain compliant with GDPR, CCPA/CPRA and other data privacy regulation.
- **OpenTelemetry-Compatible**: Fully compatible with OpenTelemetry standards and can be used with any OpenTelemetry-compatible service. See [OpenTelemetry vendors](https://opentelemetry.io/ecosystem/vendors/) for available collector options.

## Documentation

For complete documentation, examples, and guides, visit the [main Shinzo repository](https://github.com/shinzo-labs/shinzo-ts).

## License

This package is part of the [Shinzo](https://github.com/shinzo-labs/shinzo-ts) project and is distributed under the [Sustainable Use License](https://github.com/shinzo-labs/shinzo-ts/blob/main/LICENSE.md).

## Contributing

Contributions are welcome! Please see the [Contributing Guide](https://github.com/shinzo-labs/shinzo-ts/blob/main/CONTRIBUTING.md) in the main repository.
