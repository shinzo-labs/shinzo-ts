import { TelemetryManager } from './telemetry'
import { TelemetryData } from './types'
import { SpanStatusCode } from '@opentelemetry/api'
import { generateUuid } from './utils'
import { McpServer, RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp'

export class McpServerInstrumentation {
  private telemetryManager: TelemetryManager
  private server: McpServer
  private originalMethods: Map<string, Function> = new Map()
  private isInstrumented: boolean = false

  constructor(server: McpServer, telemetryManager: TelemetryManager) {
    this.server = server
    this.telemetryManager = telemetryManager
  }

  public instrument(): void {
    if (this.isInstrumented) return

    this.instrumentToolCalls()
    this.instrumentResourceReads()
    this.instrumentPromptCalls()
    this.isInstrumented = true
  }

  private instrumentToolCalls(): void {
    const originalTool = this.server.tool.bind(this.server)

    // TODO add instrumentation for the tool method

    this.server.tool = (name: string, ...rest: unknown[]): RegisteredTool => {
      const cb = rest[rest.length - 1] as Function
      if (typeof cb === 'function') {
        rest[rest.length - 1] = this.createInstrumentedHandler(cb, 'tools/call', name)
      }
      return originalTool(name, ...rest)
    }
  }

  private instrumentResourceReads(): void {
    // TODO add instrumentation for the resource method
  }

  private instrumentPromptCalls(): void {
    // TODO add instrumentation for the prompt method
  }

  private instrumentNotification(): void {
    // TODO add instrumentation for the notification method
  }

  private instrumentedTool

  private createInstrumentedHandler(originalHandler: Function, method: string, name: string): Function {
    return async (...args: any[]) => {
      const startTime = Date.now()
      const requestId = generateUuid()

      const span = this.telemetryManager.createSpan(`${type}s/call ${name}`, {
        'mcp.method.name': `${type}s/call`,
        [`mcp.${type}.name`]: name,
        'mcp.request.id': requestId
      })

      const telemetryData: TelemetryData = {
        timestamp: startTime,
        sessionId: generateUuid(),
        requestId,
        methodName: `${type}s/call`,
        [`${type}Name`]: name,
        parameters: this.extractParameters(args),
        attributes: {
          'mcp.method.name': `${type}s/call`,
          [`mcp.${type}.name`]: name,
          'mcp.request.id': requestId
        }
      }

      try {
        const result = await originalHandler.apply(this.server, args)
        const endTime = Date.now()
        const duration = endTime - startTime

        telemetryData.result = result
        telemetryData.duration = duration

        span.setAttributes({
          'mcp.operation.success': true,
          'mcp.operation.duration': duration
        })
        span.setStatus({ code: SpanStatusCode.OK })

        this.telemetryManager.recordMetric(`mcp.${type}.operation.duration`, duration, {
          [`mcp.${type}.name`]: name,
          'mcp.operation.success': 'true'
        })

        const processedData = this.telemetryManager.processTelemetryData(telemetryData)

        return result
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime

        telemetryData.error = error as Error
        telemetryData.duration = duration

        span.setAttributes({
          'mcp.operation.success': false,
          'mcp.operation.duration': duration,
          'error.type': (error as Error).name,
          'error.message': (error as Error).message
        })
        span.setStatus({ 
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        })

        this.telemetryManager.recordMetric(`mcp.${type}.operation.duration`, duration, {
          [`mcp.${type}.name`]: name,
          'mcp.operation.success': 'false',
          'error.type': (error as Error).name
        })

        const processedData = this.telemetryManager.processTelemetryData(telemetryData)

        throw error
      } finally {
        span.end()
      }
    }
  }

  private extractParameters(args: any[]): Record<string, any> {
    if (args.length === 0) {
      return {}
    }

    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      return args[0]
    }

    return args.reduce((params, arg, index) => {
      params[`arg${index}`] = arg
      return params
    }, {})
  }

  public uninstrument(): void {
    if (!this.isInstrumented) return

    this.originalMethods.forEach((originalMethod, methodName) => {
      (this.server as any)[methodName] = originalMethod
    })

    this.originalMethods.clear()
    this.isInstrumented = false
  }
}
