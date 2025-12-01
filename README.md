<div align="center">
  <a href="https://github.com/shinzo-labs/shinzo-ts">
    <img src="https://github.com/user-attachments/assets/78542e5b-1da1-44ad-a3e2-5b4eb9e6a962" alt="Shinzo Logo" width="180" height="180">
  </a>
  <h1 align="center">
    Shinzo TypeScript SDK: Complete Observability for MCP Servers
  </h1>
  <p align=center>
        <a href="https://github.com/shinzo-labs/shinzo-ts/stargazers"><img src="https://img.shields.io/github/stars/shinzo-labs/shinzo-ts?style=flat&logo=github&color=e3b341" alt="Stars"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/forks"><img src="https://img.shields.io/github/forks/shinzo-labs/shinzo-ts?style=flat&logo=github&color=8957e5" alt="Forks"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/pulls"><img src="https://img.shields.io/badge/build-passing-green" alt="Build"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/graphs/contributors"><img src="https://img.shields.io/badge/contributors-welcome-339933?logo=github" alt="contributors welcome"></a>
        <a href="https://discord.gg/UYUdSdp5N8"><img src="https://discord-live-members-count-badge.vercel.app/api/discord-members?guildId=1079318797590216784" alt="Discord"></a>
    </p>
    The SDK provides OpenTelemetry-compatible instrumentation for TypeScript MCP servers. Gain insight into agent usage patterns, contextualize tool calls, and analyze performance of your servers across platforms. Instrumentation can be installed in servers in just a few steps with an emphasis on ease of use and flexibility.
    <p align=center>
        <a href="https://docs.shinzo.ai/sdk/typescript/installation"><strong>Explore the docs »</strong></a>
    </p>
</div>

## Installation

```bash
npm install @shinzolabs/instrumentation-mcp
# or
pnpm add @shinzolabs/instrumentation-mcp
```

## Usage

For the simplest configuration, just pass in the server name, version, and exporter endpoint:

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

The TelemetryConfig exposes a number of other options for precise and expansive telemetry processing:

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

## Contributing

Contributions are welcome! Please see the [Contributing Guide](./CONTRIBUTING.md) in the main repository.

## License

This package is distributed under the [MIT License](./LICENSE.md).
