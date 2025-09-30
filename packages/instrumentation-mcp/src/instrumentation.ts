import { TelemetryManager } from './telemetry'
import { Span, SpanStatusCode } from '@opentelemetry/api'
import { generateUuid, getRuntimeInfo } from './utils'
import { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp'
import { SessionTracker, SessionEvent } from './session'

export class McpServerInstrumentation {
  private telemetryManager: TelemetryManager
  private server: McpServer
  private isInstrumented: boolean = false
  private sessionTracker: SessionTracker | null = null

  constructor(server: McpServer, telemetryManager: TelemetryManager) {
    this.server = server
    this.telemetryManager = telemetryManager
  }

  /**
   * Enable session tracking for debugging and replay
   */
  public enableSessionTracking(resourceUuid: string, metadata?: Record<string, any>): void {
    if (!this.sessionTracker) {
      this.sessionTracker = new SessionTracker(this.telemetryManager.getConfig(), resourceUuid)
      void this.sessionTracker.start(metadata)
    }
  }

  /**
   * Get the session tracker instance
   */
  public getSessionTracker(): SessionTracker | null {
    return this.sessionTracker
  }

  /**
   * Complete the current session
   */
  public async completeSession(): Promise<void> {
    if (this.sessionTracker) {
      await this.sessionTracker.complete()
      this.sessionTracker = null
    }
  }

  public instrument(): void {
    if (this.isInstrumented) return

    this.instrumentTools()
    this.instrumentCompletions()
    this.instrumentLogs()
    this.instrumentNotifications()
    this.instrumentPings()
    this.instrumentPrompts()
    this.instrumentResources()
    this.instrumentRoots()
    this.instrumentSampling()
    this.isInstrumented = true
  }

  private instrumentTools(): void {
    if (!this.server.tool || typeof this.server.tool !== 'function') {
      return
    }
  
    const originalTool = this.server.tool.bind(this.server)

    this.server.tool = (name: string, ...rest: any[]): RegisteredTool => {
      const cb = rest[rest.length - 1] as (...args: any[]) => any
      if (typeof cb === 'function') {
        rest[rest.length - 1] = this.createInstrumentedHandler(cb, 'tools/call', name)
      }
      return (originalTool as any)(name, ...rest)
    }
  }

  private instrumentCompletions(): void {
    // TODO add instrumentation for the completion method
  }

  private instrumentLogs(): void {
    // TODO add instrumentation for the logging method
  }

  private instrumentNotifications(): void {
    // TODO add instrumentation for the notification method
  }

  private instrumentPings(): void {
    // TODO add instrumentation for the ping method
  }

  private instrumentPrompts(): void {
    // TODO add instrumentation for the prompt method
  }

  private instrumentResources(): void {
    // TODO add instrumentation for the resource method
  }

  private instrumentRoots(): void {
    // TODO add instrumentation for the root method
  }

  private instrumentSampling(): void {
    // TODO add instrumentation for the sampling method
  }

  private createInstrumentedHandler(originalHandler: (...args: any[]) => any, method: string, name: string): (...args: any[]) => any {
    const { address, port } = getRuntimeInfo()

    const baseAttributes = {
      'mcp.method.name': method,
      'mcp.tool.name': name
    }

    const recordHistogram = this.telemetryManager.getHistogram('mcp.server.operation.duration', {
      description: 'MCP request or notification duration as observed on the receiver from the time it was received until the result or ack is sent.',
      unit: 'ms'
    })

    const incrementCounter = this.telemetryManager.getIncrementCounter(`${method} ${name}`, {
      description: 'MCP request or notification count as observed on the receiver.',
      unit: 'calls'
    })

    return async (params: any) => {
      const spanAttributes = {
        ...baseAttributes,
        'mcp.request.id': generateUuid(),
        'client.address': address,
        ...(port ? { 'client.port': port } : {}),
        ...(this.telemetryManager.getArgumentAttributes(params))
      }

      return this.telemetryManager.startActiveSpan(`${method} ${name}`, spanAttributes, async (span: Span) => {
        incrementCounter(1)

        let result: any
        let error: any

        const startTime = Date.now()
        const startTimestamp = new Date()

        // Track tool call event if session tracking is enabled
        if (this.sessionTracker?.isSessionActive()) {
          this.sessionTracker.addEvent({
            timestamp: startTimestamp,
            event_type: 'tool_call',
            tool_name: name,
            input_data: this.telemetryManager.getConfig().enableArgumentCollection ? params : undefined,
            metadata: { method }
          })
        }

        try {
          result = await originalHandler.apply(this.server, [params])
          span.setStatus({ code: SpanStatusCode.OK })

          // Track successful tool response
          if (this.sessionTracker?.isSessionActive()) {
            this.sessionTracker.addEvent({
              timestamp: new Date(),
              event_type: 'tool_response',
              tool_name: name,
              output_data: this.telemetryManager.getConfig().enableArgumentCollection ? result : undefined,
              duration_ms: Date.now() - startTime,
              metadata: { method }
            })
          }
        } catch (err) {
          error = err
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message })
          span.setAttribute('error.type', (error as Error).name)

          // Track error event
          if (this.sessionTracker?.isSessionActive()) {
            this.sessionTracker.addEvent({
              timestamp: new Date(),
              event_type: 'error',
              tool_name: name,
              error_data: {
                message: (error as Error).message,
                name: (error as Error).name,
                stack: (error as Error).stack
              },
              duration_ms: Date.now() - startTime,
              metadata: { method }
            })
          }
        }

        const endTime = Date.now()
        const duration = endTime - startTime

        recordHistogram(duration, {
          ...baseAttributes,
          'error.type': error ? (error as Error).name : undefined
        })

        span.end()

        if (error) throw error

        return result
      })
    }
  }
}
