import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { initializeAgentObservability, TelemetryConfig } from "../dist/index.js";

// Create MCP server
const server = new Server(
  {
    name: "console-demo-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Configuration for console output (useful for development/testing)
const telemetryConfig: TelemetryConfig = {
  serviceName: "console-demo-server",
  serviceVersion: "1.0.0",
  exporterEndpoint: "console://localhost", // Not used for console exporter
  exporterType: "console", // Output to console instead of remote endpoint
  samplingRate: 1.0, // Sample 100% for demo
  enablePIISanitization: true,
  enableMetrics: false, // Console exporter doesn't support metrics
  enableTracing: true,
  customAttributes: {
    environment: "development",
    demo: "true"
  },
  dataProcessors: [
    // Add demo-specific processing
    (telemetryData: any) => {
      console.log("📊 Processing telemetry data:", {
        method: telemetryData.methodName,
        tool: telemetryData.toolName,
        duration: telemetryData.duration,
        success: !telemetryData.error
      });
      return telemetryData;
    }
  ]
};

// Initialize telemetry with console output
const telemetry = initializeAgentObservability(server as any, telemetryConfig);

// Tool handler functions
async function handleCalculate(operation: string, a: number, b: number) {
  let result: number;

  switch (operation) {
    case "add":
      result = a + b;
      break;
    case "subtract":
      result = a - b;
      break;
    case "multiply":
      result = a * b;
      break;
    case "divide":
      if (b === 0) {
        throw new Error("Division by zero is not allowed");
      }
      result = a / b;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return {
    operation,
    operands: [a, b],
    result,
    timestamp: new Date().toISOString()
  };
}

async function handleTextTransform(text: string, transformation: string) {
  let result: string | number;

  switch (transformation) {
    case "uppercase":
      result = text.toUpperCase();
      break;
    case "lowercase":
      result = text.toLowerCase();
      break;
    case "reverse":
      result = text.split('').reverse().join('');
      break;
    case "length":
      result = text.length;
      break;
    default:
      throw new Error(`Unknown transformation: ${transformation}`);
  }

  return {
    originalText: text,
    transformation,
    result,
    timestamp: new Date().toISOString()
  };
}

// Add tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculate",
        description: "Perform basic calculations",
        inputSchema: {
          type: "object",
          properties: {
            operation: {
              type: "string",
              enum: ["add", "subtract", "multiply", "divide"],
              description: "Mathematical operation"
            },
            a: {
              type: "number",
              description: "First number"
            },
            b: {
              type: "number",
              description: "Second number"
            }
          },
          required: ["operation", "a", "b"]
        }
      },
      {
        name: "text_transform",
        description: "Transform text strings",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "Text to transform"
            },
            transformation: {
              type: "string",
              enum: ["uppercase", "lowercase", "reverse", "length"],
              description: "Type of transformation"
            }
          },
          required: ["text", "transformation"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  console.log(`🔧 Tool called: ${name} with args:`, args);

  switch (name) {
    case "calculate":
      const result1 = await handleCalculate(args?.operation as string, args?.a as number, args?.b as number);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result1, null, 2)
          }
        ]
      };
    case "text_transform":
      const result2 = await handleTextTransform(args?.text as string, args?.transformation as string);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result2, null, 2)
          }
        ]
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down telemetry...');
  await telemetry.shutdown();
  process.exit(0);
});

// Start server
async function main() {
  console.log('🚀 Starting console demo server with telemetry...');
  console.log('📈 Telemetry will be output to console');
  console.log('🔧 Available tools: calculate, text_transform');

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);