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
        name: "add_numbers",
        description: "Adds a list of numbers together",
        inputSchema: {
          type: "object",
          properties: {
            numbers: {
              type: "array",
              items: { type: "number" },
              description: "List of numbers to add together"
            }
          },
          required: ["numbers"]
        }
      },
      {
        name: "random_wait",
        description: "Waits for a random number of seconds between 0 and 3, then returns the duration",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "create_story",
        description: "Creates a short story using provided words like madlibs",
        inputSchema: {
          type: "object",
          properties: {
            noun: {
              type: "string",
              description: "A noun (person, place, or thing)"
            },
            verb: {
              type: "string",
              description: "An action verb"
            },
            adjective: {
              type: "string",
              description: "A descriptive word"
            },
            location: {
              type: "string",
              description: "A place or location"
            }
          },
          required: ["noun", "verb", "adjective", "location"]
        }
      }
    ]
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "add_numbers":
      const numbers = request.params.arguments?.numbers as number[]
      const sum = numbers.reduce((acc, num) => acc + num, 0)
      return {
        content: [
          {
            type: "text",
            text: `The sum of ${numbers.join(" + ")} = ${sum}`
          }
        ]
      }
    
    case "random_wait":
      const waitTime = Math.random() * 3 // Random time between 0 and 3 seconds
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000))
      return {
        content: [
          {
            type: "text",
            text: `Waited for ${waitTime.toFixed(2)} seconds`
          }
        ]
      }
    
    case "create_story":
      const { noun, verb, adjective, location } = request.params.arguments as {
        noun: string
        verb: string
        adjective: string
        location: string
      }
      const story = `Once upon a time, there was a ${adjective} ${noun} who loved to ${verb}. One day, they decided to visit ${location}. It was the most amazing adventure they had ever experienced!`
      return {
        content: [
          {
            type: "text",
            text: story
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
