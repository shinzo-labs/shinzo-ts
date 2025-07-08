import { ConfigValidator, createDefaultConfig, mergeConfigs } from '../src/config';
import { TelemetryConfig } from '../src/types';

describe('ConfigValidator', () => {
  describe('validate', () => {
    it('should pass validation with valid config', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      };

      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it('should throw error when serviceName is missing', () => {
      const config = {
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318'
      } as TelemetryConfig;

      expect(() => ConfigValidator.validate(config)).toThrow('serviceName is required');
    });

    it('should throw error when serviceVersion is missing', () => {
      const config = {
        serviceName: 'test-service',
        exporterEndpoint: 'http://localhost:4318'
      } as TelemetryConfig;

      expect(() => ConfigValidator.validate(config)).toThrow('serviceVersion is required');
    });

    it('should throw error when exporterEndpoint is missing', () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0'
      } as TelemetryConfig;

      expect(() => ConfigValidator.validate(config)).toThrow('exporterEndpoint is required');
    });

    it('should throw error when samplingRate is invalid', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        samplingRate: 1.5
      };

      expect(() => ConfigValidator.validate(config)).toThrow('samplingRate must be between 0 and 1');
    });

    it('should validate bearer auth correctly', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'bearer',
          token: 'test-token'
        }
      };

      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it('should throw error when bearer token is missing', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'bearer'
        }
      };

      expect(() => ConfigValidator.validate(config)).toThrow('Bearer token is required when using bearer auth');
    });

    it('should validate apiKey auth correctly', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'apiKey',
          apiKey: 'test-key'
        }
      };

      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });

    it('should validate basic auth correctly', () => {
      const config: TelemetryConfig = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
        exporterEndpoint: 'http://localhost:4318',
        exporterAuth: {
          type: 'basic',
          username: 'user',
          password: 'pass'
        }
      };

      expect(() => ConfigValidator.validate(config)).not.toThrow();
    });
  });
});

describe('createDefaultConfig', () => {
  it('should create default config with expected values', () => {
    const defaultConfig = createDefaultConfig();

    expect(defaultConfig).toEqual({
      samplingRate: 1.0,
      enableUserConsent: false,
      enablePIISanitization: true,
      exporterType: 'otlp-http',
      enableMetrics: true,
      enableTracing: true,
      enableLogging: false,
      batchTimeout: 2000,
      maxBatchSize: 100,
      customAttributes: {},
      dataProcessors: []
    });
  });
});

describe('mergeConfigs', () => {
  it('should merge configs correctly', () => {
    const defaultConfig = {
      samplingRate: 1.0,
      enableTracing: true,
      customAttributes: { default: 'value' },
      dataProcessors: [jest.fn()]
    };

    const userConfig: TelemetryConfig = {
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      exporterEndpoint: 'http://localhost:4318',
      samplingRate: 0.5,
      customAttributes: { user: 'value' },
      dataProcessors: [jest.fn()]
    };

    const merged = mergeConfigs(defaultConfig, userConfig);

    expect(merged.samplingRate).toBe(0.5);
    expect(merged.enableTracing).toBe(true);
    expect(merged.customAttributes).toEqual({
      default: 'value',
      user: 'value'
    });
    expect(merged.dataProcessors).toHaveLength(2);
  });
});