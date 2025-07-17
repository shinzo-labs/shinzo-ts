import { TelemetryManager } from './telemetry'
import { Span, SpanStatusCode } from '@opentelemetry/api'
import { generateUuid, getRuntimeInfo } from './utils'
import { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp'

export class McpServerInstrumentation {
  private telemetryManager: TelemetryManager
  private server: McpServer
  private isInstrumented: boolean = false

  constructor(server: McpServer, telemetryManager: TelemetryManager) {
    this.server = server
    this.telemetryManager = telemetryManager
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
      const cb = rest[rest.length - 1] as Function
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

  private getParamsSpanAttributes(params: any, prefix = 'mcp.request.argument'): Record<string, any> {
    const attributes: Record<string, any> = {}
    const flatten = (obj: any, path: string) => {
      for (const key in obj) {
        const value = obj[key]
        const attrKey = `${path}.${key}`
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, attrKey)
        } else {
          attributes[attrKey] = value
        }
      }
    }
    if (params && typeof params === 'object') flatten(params, prefix)
    return attributes
  }

  private createInstrumentedHandler(originalHandler: Function, method: string, name: string): Function {
    const requestId = generateUuid()
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
        'mcp.request.id': requestId,
        'client.address': address,
        ...(port ? { 'client.port': port } : {}),
        ...this.getParamsSpanAttributes(params)
      }

      return this.telemetryManager.startActiveSpan(`${method} ${name}`, spanAttributes, async (span: Span) => {
        incrementCounter(1)

        let result: any
        let error: any

        const startTime = Date.now()

        try {
          result = await originalHandler.apply(this.server, [params])
          span.setStatus({ code: SpanStatusCode.OK })
        } catch (error) {
          error = error
          span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message })
          span.setAttribute('error.type', (error as Error).name)
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
