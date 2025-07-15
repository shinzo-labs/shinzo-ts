import { TelemetryManager } from './telemetry'
import { TelemetryData, McpServerLike } from './types'
import { SpanStatusCode } from '@opentelemetry/api'
import { generateUuid } from './utils'

export class McpServerInstrumentation {
  private telemetryManager: TelemetryManager
  private server: McpServerLike
  private originalMethods: Map<string, Function> = new Map()
  private isInstrumented: boolean = false

  constructor(server: McpServerLike, telemetryManager: TelemetryManager) {
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
    const originalAddTool = this.server.tool?.bind(this.server)
    if (originalAddTool) {
      this.server.tool = (name: string, description: string, inputSchema: any, handler: Function) => {
        const instrumentedHandler = this.createInstrumentedHandler(handler, 'tool', name)
        return originalAddTool(name, description, inputSchema, instrumentedHandler)
      }
    }
  }

  private instrumentResourceReads(): void {
    const originalAddResource = this.server.resource?.bind(this.server)
    if (originalAddResource) {
      this.server.resource = (uri: string, handler: Function) => {
        const instrumentedHandler = this.createInstrumentedHandler(handler, 'resource', uri)
        return originalAddResource(uri, instrumentedHandler)
      }
    }
  }

  private instrumentPromptCalls(): void {
    const originalAddPrompt = this.server.prompt?.bind(this.server)
    if (originalAddPrompt) {
      this.server.prompt = (name: string, description: string, handler: Function) => {
        const instrumentedHandler = this.createInstrumentedHandler(handler, 'prompt', name)
        return originalAddPrompt(name, description, instrumentedHandler)
      }
    }
  }

  private createInstrumentedHandler(originalHandler: Function, type: 'tool' | 'resource' | 'prompt', name: string): Function {
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
        this.emitTelemetryEvent(processedData)

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
        this.emitTelemetryEvent(processedData)

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

  private emitTelemetryEvent(data: TelemetryData): void {
    if (this.server.emit) this.server.emit('telemetry', data)
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
