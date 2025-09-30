import { generateUuid } from './utils'
import { TelemetryConfig } from './types'

export interface SessionEvent {
  timestamp: Date
  event_type: 'tool_call' | 'tool_response' | 'error' | 'user_input' | 'system_message'
  tool_name?: string
  input_data?: Record<string, any>
  output_data?: Record<string, any>
  error_data?: Record<string, any>
  duration_ms?: number
  metadata?: Record<string, any>
}

export class SessionTracker {
  private config: TelemetryConfig
  private sessionId: string
  private sessionUuid: string | null = null
  private resourceUuid: string
  private startTime: Date
  private eventQueue: SessionEvent[] = []
  private isActive: boolean = false
  private flushInterval: NodeJS.Timeout | null = null

  constructor(config: TelemetryConfig, resourceUuid: string) {
    this.config = config
    this.sessionId = generateUuid()
    this.resourceUuid = resourceUuid
    this.startTime = new Date()
  }

  /**
   * Start the session tracking
   */
  public async start(metadata?: Record<string, any>): Promise<void> {
    if (this.isActive) return

    try {
      const response = await this.sendToBackend('/sessions/create', {
        session_id: this.sessionId,
        resource_uuid: this.resourceUuid,
        start_time: this.startTime.toISOString(),
        metadata
      })

      if (response.session_uuid) {
        this.sessionUuid = response.session_uuid
        this.isActive = true

        // Start periodic flush of events
        this.flushInterval = setInterval(() => {
          void this.flushEvents()
        }, 5000) // Flush every 5 seconds
      }
    } catch (error) {
      console.error('Failed to start session tracking:', error)
    }
  }

  /**
   * Add an event to the session
   */
  public addEvent(event: SessionEvent): void {
    if (!this.isActive || !this.sessionUuid) return

    this.eventQueue.push(event)

    // If queue gets large, flush immediately
    if (this.eventQueue.length >= 10) {
      void this.flushEvents()
    }
  }

  /**
   * Flush queued events to backend
   */
  private async flushEvents(): Promise<void> {
    if (!this.isActive || !this.sessionUuid || this.eventQueue.length === 0) return

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    try {
      for (const event of eventsToSend) {
        await this.sendToBackend('/sessions/add_event', {
          session_uuid: this.sessionUuid,
          timestamp: event.timestamp.toISOString(),
          event_type: event.event_type,
          tool_name: event.tool_name,
          input_data: event.input_data,
          output_data: event.output_data,
          error_data: event.error_data,
          duration_ms: event.duration_ms,
          metadata: event.metadata
        })
      }
    } catch (error) {
      console.error('Failed to flush session events:', error)
      // Re-add events to queue if flush failed
      this.eventQueue.unshift(...eventsToSend)
    }
  }

  /**
   * Complete the session
   */
  public async complete(): Promise<void> {
    if (!this.isActive || !this.sessionUuid) return

    // Flush any remaining events
    await this.flushEvents()

    // Stop periodic flushing
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }

    try {
      await this.sendToBackend('/sessions/complete', {
        session_uuid: this.sessionUuid,
        end_time: new Date().toISOString()
      })

      this.isActive = false
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }

  /**
   * Send data to the backend
   */
  private async sendToBackend(endpoint: string, data: any): Promise<any> {
    if (!this.config.exporterEndpoint) {
      throw new Error('Exporter endpoint not configured')
    }

    const baseUrl = this.config.exporterEndpoint.replace(/\/v1\/traces$/, '')
    const url = `${baseUrl}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add authentication if configured
    if (this.config.exporterAuth) {
      switch (this.config.exporterAuth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.exporterAuth.token}`
          break
        case 'apiKey':
          headers['X-API-Key'] = this.config.exporterAuth.apiKey!
          break
        case 'basic':
          const credentials = Buffer.from(
            `${this.config.exporterAuth.username}:${this.config.exporterAuth.password}`
          ).toString('base64')
          headers['Authorization'] = `Basic ${credentials}`
          break
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get the session ID
   */
  public getSessionId(): string {
    return this.sessionId
  }

  /**
   * Check if session is active
   */
  public isSessionActive(): boolean {
    return this.isActive
  }
}
