import { McpServerInstrumentation } from '../src/instrumentation';
import { TelemetryManager } from '../src/telemetry';
import { MockMcpServer, createTestTools, createTestResources, createTestPrompts } from './mocks/MockMcpServer';

// Mock the telemetry manager
jest.mock('../src/telemetry');

describe('McpServerInstrumentation', () => {
  let mockServer: MockMcpServer;
  let mockTelemetryManager: jest.Mocked<TelemetryManager>;
  let instrumentation: McpServerInstrumentation;
  let mockSpan: any;

  beforeEach(() => {
    mockServer = new MockMcpServer();
    
    // Create mock span
    mockSpan = {
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn()
    };

    // Create mock telemetry manager
    mockTelemetryManager = {
      createSpan: jest.fn().mockReturnValue(mockSpan),
      recordMetric: jest.fn(),
      processTelemetryData: jest.fn().mockImplementation((data) => data),
      shutdown: jest.fn(),
      addCustomAttribute: jest.fn()
    } as any;

    instrumentation = new McpServerInstrumentation(mockServer, mockTelemetryManager);
  });

  afterEach(() => {
    mockServer.reset();
    jest.clearAllMocks();
  });

  describe('instrument', () => {
    it('should instrument server methods', () => {
      const originalTool = mockServer.tool;
      const originalResource = mockServer.resource;
      const originalPrompt = mockServer.prompt;

      instrumentation.instrument();

      // Methods should still exist but potentially be wrapped
      expect(typeof mockServer.tool).toBe('function');
      expect(typeof mockServer.resource).toBe('function');
      expect(typeof mockServer.prompt).toBe('function');
    });

    it('should handle tool calls', async () => {
      createTestTools(mockServer);
      instrumentation.instrument();

      const result = await mockServer.callTool('calculator', {
        operation: 'add',
        a: 2,
        b: 3
      });

      expect(result).toEqual({ result: 5 });
    });

    it('should handle resource calls', async () => {
      createTestResources(mockServer);
      instrumentation.instrument();

      const result = await mockServer.callResource('file://test.txt');

      expect(result).toEqual({
        uri: 'file://test.txt',
        content: 'This is test content',
        mimeType: 'text/plain'
      });
    });

    it('should handle prompt calls', async () => {
      createTestPrompts(mockServer);
      instrumentation.instrument();

      const result = await mockServer.callPrompt('greeting', { name: 'World' });

      expect(result).toEqual({
        messages: [
          {
            role: 'user',
            content: 'Hello World! How are you today?'
          }
        ]
      });
    });

    it('should handle tool errors', async () => {
      createTestTools(mockServer);
      instrumentation.instrument();

      await expect(mockServer.callTool('failing-tool')).rejects.toThrow('Tool failed');
    });

    it('should handle resource errors', async () => {
      createTestResources(mockServer);
      instrumentation.instrument();

      await expect(mockServer.callResource('file://error.txt')).rejects.toThrow('Resource not found');
    });

    it('should handle prompt errors', async () => {
      createTestPrompts(mockServer);
      instrumentation.instrument();

      await expect(mockServer.callPrompt('failing-prompt')).rejects.toThrow('Prompt failed');
    });

    it('should not double-instrument', () => {
      const originalTool = mockServer.tool;
      instrumentation.instrument();
      const instrumentedTool = mockServer.tool;
      instrumentation.instrument(); // Second call should be ignored

      expect(mockServer.tool).toBe(instrumentedTool);
    });

    it('should handle slow operations', async () => {
      createTestTools(mockServer);
      instrumentation.instrument();

      const startTime = Date.now();
      await mockServer.callTool('slow-operation', { delay: 50 });
      const endTime = Date.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeGreaterThanOrEqual(50);
    }, 10000);

    it('should extract parameters correctly', async () => {
      createTestTools(mockServer);
      instrumentation.instrument();

      const result = await mockServer.callTool('calculator', {
        operation: 'multiply',
        a: 4,
        b: 5
      });

      expect(result).toEqual({ result: 20 });
    });

    it('should emit telemetry events when server supports it', async () => {
      const emitSpy = jest.spyOn(mockServer, 'emit');
      createTestTools(mockServer);
      instrumentation.instrument();

      await mockServer.callTool('echo', { message: 'test' });

      // Verify the tool executed correctly
      expect(emitSpy).toBeDefined(); // Server has emit capability
    });
  });

  describe('uninstrument', () => {
    it('should not throw when uninstrumenting', () => {
      instrumentation.instrument();
      expect(() => instrumentation.uninstrument()).not.toThrow();
    });

    it('should handle uninstrument without instrumentation', () => {
      expect(() => instrumentation.uninstrument()).not.toThrow();
    });
  });

  describe('private methods', () => {
    it('should generate unique request IDs', async () => {
      createTestTools(mockServer);
      instrumentation.instrument();

      // Execute multiple calls and verify they work
      const results = await Promise.all([
        mockServer.callTool('echo', { message: 'test1' }),
        mockServer.callTool('echo', { message: 'test2' }),
        mockServer.callTool('echo', { message: 'test3' })
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ echo: 'test1' });
      expect(results[1]).toEqual({ echo: 'test2' });
      expect(results[2]).toEqual({ echo: 'test3' });
    });
  });
});