import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { initializeAgentObservability, TelemetryConfig } from "shinzo";

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
);

// Advanced telemetry configuration
const telemetryConfig: TelemetryConfig = {
  serviceName: "advanced-mcp-server",
  serviceVersion: "2.0.0",
  exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
  exporterAuth: {
    type: "bearer",
    token: process.env.OTEL_AUTH_TOKEN
  },
  samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || "1.0"),
  enableUserConsent: process.env.ENABLE_USER_CONSENT === "true",
  enablePIISanitization: process.env.ENABLE_PII_SANITIZATION !== "false",
  exporterType: "otlp-http",
  enableMetrics: true,
  enableTracing: true,
  enableLogging: false,
  batchTimeout: 5000,
  maxBatchSize: 50,
  customAttributes: {
    environment: process.env.NODE_ENV || "development",
    region: process.env.AWS_REGION || "us-east-1",
    deployment: process.env.DEPLOYMENT_ID || "local",
    version: process.env.APP_VERSION || "1.0.0"
  },
  dataProcessors: [
    // Remove sensitive fields from database operations
    (telemetryData) => {
      if (telemetryData.toolName === "database_query") {
        if (telemetryData.parameters?.query) {
          // Sanitize SQL queries
          telemetryData.parameters.query = telemetryData.parameters.query
            .replace(/password\s*=\s*['"][^'"]*['"]/gi, "password='[REDACTED]'")
            .replace(/api_key\s*=\s*['"][^'"]*['"]/gi, "api_key='[REDACTED]'");
        }
      }
      return telemetryData;
    },
    // Add performance categorization
    (telemetryData) => {
      if (telemetryData.duration !== undefined) {
        telemetryData.attributes = telemetryData.attributes || {};
        if (telemetryData.duration > 5000) {
          telemetryData.attributes.performance_category = "slow";
        } else if (telemetryData.duration > 1000) {
          telemetryData.attributes.performance_category = "medium";
        } else {
          telemetryData.attributes.performance_category = "fast";
        }
      }
      return telemetryData;
    }
  ]
};

// Initialize telemetry
const telemetry = initializeAgentObservability(server, telemetryConfig);

// Add custom attributes dynamically
telemetry.addCustomAttribute("server_start_time", Date.now());
telemetry.addCustomAttribute("process_id", process.pid);

// Complex tool with database simulation
server.tool("database_query", "Execute database query", 
  { 
    query: z.string().describe("SQL query to execute"),
    params: z.array(z.any()).optional().describe("Query parameters")
  }, 
  async ({ query, params }) => {
    // Simulate database operation
    const startTime = Date.now();
    
    // Create custom span for database operation
    const dbSpan = telemetry.createSpan("database.query", {
      "db.statement": query,
      "db.operation": query.split(' ')[0].toUpperCase()
    });
    
    try {
      // Simulate query execution time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
      
      // Record custom metric
      telemetry.recordMetric("database.query.duration", Date.now() - startTime, {
        "db.operation": query.split(' ')[0].toUpperCase()
      });
      
      const result = {
        rows: [
          { id: 1, name: "John Doe", email: "john@example.com" },
          { id: 2, name: "Jane Smith", email: "jane@example.com" }
        ],
        rowCount: 2,
        executionTime: Date.now() - startTime
      };
      
      dbSpan.end();
      return result;
    } catch (error) {
      dbSpan.recordException(error as Error);
      dbSpan.end();
      throw error;
    }
  }
);

// File processing tool
server.tool("process_file", "Process file content", 
  { 
    filename: z.string().describe("File name to process"),
    content: z.string().describe("File content")
  }, 
  async ({ filename, content }) => {
    // Simulate file processing
    const processingSpan = telemetry.createSpan("file.process", {
      "file.name": filename,
      "file.size": content.length
    });
    
    try {
      // Simulate processing time based on content length
      const processingTime = Math.min(content.length / 100, 3000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      const result = {
        filename,
        processedLines: content.split('\n').length,
        processedCharacters: content.length,
        processingTime
      };
      
      telemetry.recordMetric("file.processing.duration", processingTime, {
        "file.type": filename.split('.').pop() || "unknown"
      });
      
      processingSpan.end();
      return result;
    } catch (error) {
      processingSpan.recordException(error as Error);
      processingSpan.end();
      throw error;
    }
  }
);

// Error-prone tool for testing error handling
server.tool("error_test", "Test error handling", 
  { 
    shouldError: z.boolean().describe("Whether to throw an error"),
    errorType: z.enum(["validation", "network", "internal"]).optional().describe("Type of error to throw")
  }, 
  async ({ shouldError, errorType = "internal" }) => {
    if (shouldError) {
      switch (errorType) {
        case "validation":
          throw new Error("Validation failed: Invalid input parameters");
        case "network":
          throw new Error("Network error: Unable to connect to external service");
        case "internal":
          throw new Error("Internal error: Something went wrong");
        default:
          throw new Error("Unknown error occurred");
      }
    }
    
    return { success: true, message: "Operation completed successfully" };
  }
);

// Handle server requests
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "database_query":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(await server.tools.get("database_query")?.handler(args), null, 2)
          }
        ]
      };
    case "process_file":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(await server.tools.get("process_file")?.handler(args), null, 2)
          }
        ]
      };
    case "error_test":
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(await server.tools.get("error_test")?.handler(args), null, 2)
          }
        ]
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Shutting down telemetry...');
  await telemetry.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down telemetry...');
  await telemetry.shutdown();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Advanced MCP server running with Shinzo telemetry enabled");
  console.log("Environment:", process.env.NODE_ENV || "development");
  console.log("Sampling rate:", telemetryConfig.samplingRate);
  console.log("PII sanitization:", telemetryConfig.enablePIISanitization);
}

main().catch(console.error);