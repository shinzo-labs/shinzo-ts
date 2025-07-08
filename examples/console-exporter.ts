import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { initializeAgentObservability, TelemetryConfig } from "shinzo";

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
    (telemetryData) => {
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
const telemetry = initializeAgentObservability(server, telemetryConfig);

// Simple calculation tool
server.tool("calculate", "Perform basic calculations", 
  { 
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Mathematical operation"),
    a: z.number().describe("First number"),
    b: z.number().describe("Second number")
  }, 
  async ({ operation, a, b }) => {
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
);

// String manipulation tool
server.tool("text_transform", "Transform text strings", 
  { 
    text: z.string().describe("Text to transform"),
    transformation: z.enum(["uppercase", "lowercase", "reverse", "length"]).describe("Type of transformation")
  }, 
  async ({ text, transformation }) => {
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
);

// Handle server requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  console.log(`🔧 Tool called: ${name} with args:`, args);
  
  switch (name) {
    case "calculate":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(await server.tools.get("calculate")?.handler(args), null, 2)
          }
        ]
      };
    case "text_transform":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(await server.tools.get("text_transform")?.handler(args), null, 2)
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