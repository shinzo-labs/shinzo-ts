import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PeriodicExportingMetricReader, MetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { trace, metrics, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { TelemetryConfig, TelemetryData, DataProcessor, ObservabilityInstance } from './types';
import { createDefaultConfig, mergeConfigs } from './config';
import { PIISanitizer } from './sanitizer';

export class TelemetryManager implements ObservabilityInstance {
  private sdk: NodeSDK | undefined;
  private config: TelemetryConfig;
  private tracer: any;
  private meter: any;
  private piiSanitizer: PIISanitizer;
  private sessionId: string;
  private isInitialized: boolean = false;

  constructor(config: TelemetryConfig) {
    this.config = mergeConfigs(createDefaultConfig(), config);
    this.sessionId = this.generateSessionId();
    this.piiSanitizer = new PIISanitizer(this.config.enablePIISanitization || false);
    this.initializeSDK();
  }

  private initializeSDK(): void {
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
      'mcp.session.id': this.sessionId,
      ...this.config.customAttributes
    });

    const traceExporter = this.createTraceExporter();
    const metricExporter = this.createMetricExporter();

    this.sdk = new NodeSDK({
      resource,
      traceExporter: this.config.enableTracing ? traceExporter : undefined,
      metricReader: this.config.enableMetrics ? (metricExporter as any) : undefined,
    });

    this.sdk.start();
    this.isInitialized = true;

    this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
    this.meter = metrics.getMeter(this.config.serviceName, this.config.serviceVersion);
  }

  private createTraceExporter() {
    if (this.config.exporterType === 'console') {
      return new ConsoleSpanExporter();
    }

    const headers: Record<string, string> = {};
    if (this.config.exporterAuth) {
      switch (this.config.exporterAuth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.exporterAuth.token}`;
          break;
        case 'apiKey':
          headers['X-API-Key'] = this.config.exporterAuth.apiKey!;
          break;
        case 'basic':
          const encoded = Buffer.from(`${this.config.exporterAuth.username}:${this.config.exporterAuth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
          break;
      }
    }

    return new OTLPTraceExporter({
      url: this.config.exporterEndpoint,
      headers
    });
  }

  private createMetricExporter(): MetricReader | undefined {
    if (this.config.exporterType === 'console') {
      return undefined;
    }

    const headers: Record<string, string> = {};
    if (this.config.exporterAuth) {
      switch (this.config.exporterAuth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${this.config.exporterAuth.token}`;
          break;
        case 'apiKey':
          headers['X-API-Key'] = this.config.exporterAuth.apiKey!;
          break;
        case 'basic':
          const encoded = Buffer.from(`${this.config.exporterAuth.username}:${this.config.exporterAuth.password}`).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
          break;
      }
    }

    const metricExporter = new OTLPMetricExporter({
      url: this.config.exporterEndpoint.replace('/traces', '/metrics'),
      headers
    });

    return new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: this.config.batchTimeout || 2000,
    });
  }

  private generateSessionId(): string {
    return `mcp-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public createSpan(name: string, attributes?: Record<string, any>) {
    if (!this.isInitialized) {
      throw new Error('Telemetry not initialized');
    }

    const span = this.tracer.startSpan(name, {
      kind: SpanKind.SERVER,
      attributes: {
        'mcp.session.id': this.sessionId,
        ...attributes
      }
    });

    return span;
  }

  public recordMetric(name: string, value: number, attributes?: Record<string, any>): void {
    if (!this.isInitialized) {
      return;
    }

    const histogram = this.meter.createHistogram(name, {
      description: `MCP server metric: ${name}`,
      unit: 'ms'
    });

    histogram.record(value, {
      'mcp.session.id': this.sessionId,
      ...attributes
    });
  }

  public addCustomAttribute(key: string, value: string | number | boolean): void {
    this.config.customAttributes = this.config.customAttributes || {};
    this.config.customAttributes[key] = value;
  }

  public processTelemetryData(data: TelemetryData): TelemetryData {
    let processedData = { ...data };

    if (this.config.enablePIISanitization) {
      processedData = this.piiSanitizer.sanitize(processedData);
    }

    if (this.config.dataProcessors) {
      for (const processor of this.config.dataProcessors) {
        processedData = processor(processedData);
      }
    }

    return processedData;
  }

  public async shutdown(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }
}