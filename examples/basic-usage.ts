import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"

import { initializeAgentObservability, TelemetryConfig } from "../dist/index.js"

// Create MCP server
const server = new Server(
  {
    name: "example-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Configure telemetry with comprehensive options
const telemetryConfig: TelemetryConfig = {
  serviceName: "my-mcp-server",
  serviceVersion: "1.2.0",
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
  exporterAuth: process.env.OTEL_AUTH_TOKEN ? {
    type: "bearer",
    token: process.env.OTEL_AUTH_TOKEN
  } : undefined,
  samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || "1.0"),
  enableUserConsent: process.env.ENABLE_USER_CONSENT === "true",
  enablePIISanitization: process.env.ENABLE_PII_SANITIZATION !== "false",
  customAttributes: {
    environment: process.env.NODE_ENV || "development",
    region: process.env.AWS_REGION || "us-east-1",
    deployment: process.env.DEPLOYMENT_ID || "local",
    version: process.env.APP_VERSION || "1.0.0"
  },
  dataProcessors: [
    // Custom processor to remove sensitive data
    (telemetryData: any) => {
      if (telemetryData.toolName === "sensitive_operation") {
        if (telemetryData.parameters) {
          delete telemetryData.parameters.apiKey
        }
      }
      return telemetryData
    }
  ]
}

// Add tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "return_a",
        description: "Return A",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "A number to return"
            }
          },
          required: ["a"]
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "return_a":
      const a = request.params.arguments?.a as number
      return {
        content: [
          {
            type: "text",
            text: `Returning: ${a}`
          }
        ]
      }
    default:
      throw new Error(`Unknown tool: ${request.params.name}`)
  }
})

// Initialize telemetry
const telemetry = initializeAgentObservability(server as any, telemetryConfig)

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await telemetry.shutdown()
  process.exit(0)
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // MCP servers should not log to stdout as it interferes with JSON communication
}

main().catch(console.error)
