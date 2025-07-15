import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

import { initializeAgentObservability, TelemetryConfig } from "../dist/index.js"

// Create MCP server
const server = new Server(
  {
    name: "advanced-example-server",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
)

// Advanced telemetry configuration
const telemetryConfig: TelemetryConfig = {
  serviceName: "advanced-mcp-server",
  serviceVersion: "2.0.0",
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
  exporterAuth: process.env.OTEL_AUTH_TOKEN ? {
    type: "bearer",
    token: process.env.OTEL_AUTH_TOKEN
  } : undefined,
  samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || "1.0"),
  enableUserConsent: process.env.ENABLE_USER_CONSENT === "true",
  enablePIISanitization: process.env.ENABLE_PII_SANITIZATION !== "false",
  exporterType: "otlp-http",
  enableMetrics: true,
  enableTracing: true,
  enableLogging: false,
  batchTimeout: 5000,
  maxBatchSize: 50,
  dataProcessors: [
    // Remove sensitive fields from database operations
    (telemetryData: any) => {
      if (telemetryData.toolName === "database_query") {
        if (telemetryData.parameters?.query) {
          // Sanitize SQL queries
          telemetryData.parameters.query = telemetryData.parameters.query
            .replace(/password\s*=\s*['"][^'"]*['"]/gi, "password='[REDACTED]'")
            .replace(/api_key\s*=\s*['"][^'"]*['"]/gi, "api_key='[REDACTED]'")
        }
      }
      return telemetryData
    },
    // Add performance categorization
    (telemetryData: any) => {
      if (telemetryData.duration !== undefined) {
        telemetryData.attributes = telemetryData.attributes || {}
        if (telemetryData.duration > 5000) {
          telemetryData.attributes.performance_category = "slow"
        } else if (telemetryData.duration > 1000) {
          telemetryData.attributes.performance_category = "medium"
        } else {
          telemetryData.attributes.performance_category = "fast"
        }
      }
      return telemetryData
    }
  ]
}

// Initialize telemetry
const telemetry = initializeAgentObservability(server as any, telemetryConfig)

// Tool handler functions
async function handleDatabaseQuery(query: string, params?: any[]) {
  // Simulate database operation
  const startTime = Date.now()

  // Create custom span for database operation
  const dbSpan = telemetry.createSpan("database.query", {
    "db.statement": query,
    "db.operation": query.split(' ')[0].toUpperCase()
  })

  try {
    // Simulate query execution time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000))

    // Record custom metric
    telemetry.recordMetric("database.query.duration", Date.now() - startTime, {
      "db.operation": query.split(' ')[0].toUpperCase()
    })

    const result = {
      rows: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" }
      ],
      rowCount: 2,
      executionTime: Date.now() - startTime
    }

    dbSpan.end()
    return result
  } catch (error) {
    dbSpan.recordException(error as Error)
    dbSpan.end()
    throw error
  }
}

async function handleProcessFile(filename: string, content: string) {
  // Simulate file processing
  const processingSpan = telemetry.createSpan("file.process", {
    "file.name": filename,
    "file.size": content.length
  })

  try {
    // Simulate processing time based on content length
    const processingTime = Math.min(content.length / 100, 3000)
    await new Promise(resolve => setTimeout(resolve, processingTime))

    const result = {
      filename,
      processedLines: content.split('\n').length,
      processedCharacters: content.length,
      processingTime
    }

    telemetry.recordMetric("file.processing.duration", processingTime, {
      "file.type": filename.split('.').pop() || "unknown"
    })

    processingSpan.end()
    return result
  } catch (error) {
    processingSpan.recordException(error as Error)
    processingSpan.end()
    throw error
  }
}

async function handleErrorTest(shouldError: boolean, errorType: string = "internal") {
  if (shouldError) {
    switch (errorType) {
      case "validation":
        throw new Error("Validation failed: Invalid input parameters")
      case "network":
        throw new Error("Network error: Unable to connect to external service")
      case "internal":
        throw new Error("Internal error: Something went wrong")
      default:
        throw new Error("Unknown error occurred")
    }
  }

  return { success: true, message: "Operation completed successfully" }
}

// Add tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "database_query",
        description: "Execute database query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "SQL query to execute"
            },
            params: {
              type: "array",
              description: "Query parameters",
              items: {}
            }
          },
          required: ["query"]
        }
      },
      {
        name: "process_file",
        description: "Process file content",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "File name to process"
            },
            content: {
              type: "string",
              description: "File content"
            }
          },
          required: ["filename", "content"]
        }
      },
      {
        name: "error_test",
        description: "Test error handling",
        inputSchema: {
          type: "object",
          properties: {
            shouldError: {
              type: "boolean",
              description: "Whether to throw an error"
            },
            errorType: {
              type: "string",
              enum: ["validation", "network", "internal"],
              description: "Type of error to throw"
            }
          },
          required: ["shouldError"]
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case "database_query":
      const result1 = await handleDatabaseQuery(args?.query as string, args?.params as any[])
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result1, null, 2)
          }
        ]
      }
    case "process_file":
      const result2 = await handleProcessFile(args?.filename as string, args?.content as string)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result2, null, 2)
          }
        ]
      }
    case "error_test":
      const result3 = await handleErrorTest(args?.shouldError as boolean, args?.errorType as string)
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result3, null, 2)
          }
        ]
      }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
})

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  await telemetry.shutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
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
