import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

import { initializeAgentObservability, TelemetryConfig } from "../dist/index.js"

const NAME = "my-mcp-server"
const VERSION = "1.2.0"

// Create MCP server
const server = new McpServer({
  name: NAME,
  version: VERSION,
  description: "Example MCP server with telemetry"
})

// Configure telemetry with comprehensive options
const telemetryConfig: TelemetryConfig = {
  serverName: NAME,
  serverVersion: VERSION,
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1" // /trace and /metrics are added automatically
}

// Initialize telemetry
const telemetry = initializeAgentObservability(server, telemetryConfig)

// Add tools using the tool method
server.tool("add_numbers",
  "Adds a list of numbers together",
  {
    numbers: z.array(z.number()).describe("List of numbers to add together")
  },
  async (params) => {
    const sum = params.numbers.reduce((acc, num) => acc + num, 0)
    return {
      content: [
        {
          type: "text",
          text: `The sum of ${params.numbers.join(" + ")} = ${sum}`
        }
      ]
    }
  }
)

server.tool("random_wait",
  "Waits for a random number of seconds between 0 and 3, then returns the duration",
  {},
  async () => {
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
  }
)

server.tool("create_story",
  "Creates a short story using provided words like madlibs",
  {
    noun: z.string().describe("A noun (person, place, or thing)"),
    verb: z.string().describe("An action verb"),
    adjective: z.string().describe("A descriptive word"),
    location: z.string().describe("A place or location")
  },
  async (params) => {
    const story = `Once upon a time, there was a ${params.adjective} ${params.noun} who loved to ${params.verb}. One day, they decided to visit ${params.location}. It was the most amazing adventure they had ever experienced!`
    return {
      content: [
        {
          type: "text",
          text: story
        }
      ]
    }
  }
)

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
