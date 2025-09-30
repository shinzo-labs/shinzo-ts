# Session Tracking and Replay

The Shinzo SDK now includes session tracking capabilities that enable detailed debugging and UX analysis of MCP server interactions.

## Overview

Session tracking captures:
- Tool calls with inputs and outputs
- Tool responses with timing information
- Errors with full stack traces
- User inputs and system messages
- Session metadata

This data is sent to the Shinzo Platform backend where it can be replayed chronologically, searched by error, and exported for analysis.

## Usage

### Basic Setup

```typescript
import { instrumentServer } from '@shinzo/instrumentation-mcp'

const observability = instrumentServer(server, {
  serverName: 'my-mcp-server',
  serverVersion: '1.0.0',
  exporterEndpoint: 'http://localhost:8000/telemetry/ingest_http',
  exporterAuth: {
    type: 'bearer',
    token: 'your-ingest-token'
  },
  enableArgumentCollection: true // Required for session tracking
})

// Enable session tracking
observability.instrumentation.enableSessionTracking(
  'resource-uuid-here',
  {
    user_id: 'user-123',
    environment: 'production',
    client_version: '1.0.0'
  }
)
```

### Session Lifecycle

```typescript
// Session automatically starts when enabled
observability.instrumentation.enableSessionTracking(resourceUuid, metadata)

// Tool calls, responses, and errors are automatically tracked
// ...your MCP server handles requests...

// Complete the session when done
await observability.instrumentation.completeSession()
```

### Checking Session Status

```typescript
const sessionTracker = observability.instrumentation.getSessionTracker()

if (sessionTracker?.isSessionActive()) {
  const sessionId = sessionTracker.getSessionId()
  console.log(`Active session: ${sessionId}`)
}
```

### Manual Event Tracking

You can also manually add events to the session:

```typescript
const sessionTracker = observability.instrumentation.getSessionTracker()

sessionTracker?.addEvent({
  timestamp: new Date(),
  event_type: 'user_input',
  metadata: {
    input_source: 'cli',
    command: 'search'
  }
})
```

## Event Types

- **tool_call**: When a tool is invoked
  - Includes: tool name, input data, metadata
- **tool_response**: When a tool completes successfully
  - Includes: tool name, output data, duration, metadata
- **error**: When a tool encounters an error
  - Includes: tool name, error details, stack trace, duration
- **user_input**: Custom user interaction events
- **system_message**: Custom system events

## Privacy and Data Collection

Session tracking respects the `enableArgumentCollection` config setting:
- When `true`: Full inputs and outputs are captured
- When `false`: Only metadata and timing information is captured

The backend also provides privacy filtering to redact sensitive parameters like passwords, tokens, and API keys.

## Backend Integration

Sessions are sent to the following endpoints:
- `POST /sessions/create` - Initialize session
- `POST /sessions/add_event` - Add events (batched automatically)
- `POST /sessions/complete` - Mark session complete

Events are automatically batched and flushed:
- Every 5 seconds
- When the queue reaches 10 events
- When the session completes

## Viewing Sessions

Sessions can be viewed in the Shinzo Platform dashboard:
1. Navigate to Sessions
2. Filter by time range, status, resource, or error
3. Click on a session to see the full timeline
4. Export sessions to JSON for offline analysis

## API Reference

### McpServerInstrumentation

#### `enableSessionTracking(resourceUuid: string, metadata?: Record<string, any>): void`
Enable session tracking for this server instance.

#### `getSessionTracker(): SessionTracker | null`
Get the current session tracker instance.

#### `completeSession(): Promise<void>`
Complete and finalize the current session.

### SessionTracker

#### `addEvent(event: SessionEvent): void`
Manually add an event to the session.

#### `getSessionId(): string`
Get the unique session ID.

#### `isSessionActive(): boolean`
Check if the session is currently active.

#### `complete(): Promise<void>`
Complete the session (called automatically by completeSession).

## Example: Full Lifecycle

```typescript
import { instrumentServer } from '@shinzo/instrumentation-mcp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'

const server = new McpServer({
  name: 'my-server',
  version: '1.0.0'
})

// Set up instrumentation
const observability = instrumentServer(server, {
  serverName: 'my-mcp-server',
  serverVersion: '1.0.0',
  exporterEndpoint: 'http://localhost:8000/telemetry/ingest_http',
  exporterAuth: {
    type: 'bearer',
    token: process.env.INGEST_TOKEN
  },
  enableArgumentCollection: true
})

// Enable session tracking when a client connects
server.onConnect = async () => {
  observability.instrumentation.enableSessionTracking(
    process.env.RESOURCE_UUID!,
    {
      client_id: 'client-123',
      environment: 'production'
    }
  )
}

// Clean up session when client disconnects
server.onClose = async () => {
  await observability.instrumentation.completeSession()
  await observability.shutdown()
}

// Start the server
await server.start()
```

## Troubleshooting

### Sessions not appearing in the dashboard
- Verify `exporterEndpoint` is correct and points to the backend
- Check that authentication is properly configured
- Ensure `enableArgumentCollection` is `true` if you want to see inputs/outputs
- Check backend logs for ingestion errors

### High memory usage
- Reduce `enableArgumentCollection` to `false` to avoid storing large payloads
- Sessions automatically batch and flush events to prevent buildup
- Complete sessions promptly with `completeSession()`

### Missing events
- Events are batched and flushed periodically (every 5 seconds)
- Call `completeSession()` to force a final flush
- Check network connectivity to the backend
