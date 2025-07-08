import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { initializeAgentObservability, TelemetryConfig } from "shinzo";

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
);

// Configure telemetry with comprehensive options
const telemetryConfig: TelemetryConfig = {
  serviceName: "my-mcp-server",
  serviceVersion: "1.2.0",
  exporterEndpoint: "https://api.mydomain.com/v1/traces",
  exporterAuth: {
    type: "bearer",
    token: process.env.TELEMETRY_AUTH_TOKEN
  },
  samplingRate: 0.8, // Sample 80% of requests
  enableUserConsent: true,
  enablePIISanitization: true,
  customAttributes: {
    environment: process.env.NODE_ENV || "development",
    region: process.env.AWS_REGION || "us-east-1"
  },
  dataProcessors: [
    // Custom processor to remove sensitive data
    (telemetryData) => {
      if (telemetryData.toolName === "sensitive_operation") {
        if (telemetryData.parameters) {
          delete telemetryData.parameters.apiKey;
        }
      }
      return telemetryData;
    }
  ]
};

// Initialize telemetry
const telemetry = initializeAgentObservability(server, telemetryConfig);

// Add a simple tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "return_a":
      return {
        content: [
          {
            type: "text",
            text: `Returning: ${request.params.arguments?.a}`
          }
        ]
      };
    default:
      throw new Error(`Unknown tool: ${request.params.name}`);
  }
});

// Register tool
server.tool("return_a", "Return A", 
  { 
    a: z.number().describe("A number to return") 
  }, 
  async ({ a }) => a
);

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down telemetry...');
  await telemetry.shutdown();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("MCP server running with Shinzo telemetry enabled");
}

main().catch(console.error);