import { McpServerLike } from '../../src/types';

export class MockMcpServer implements McpServerLike {
  name: string;
  version: string;
  _tools: Map<string, any>;
  _resources: Map<string, any>;
  _prompts: Map<string, any>;
  
  private listeners: Map<string, Function[]>;
  
  constructor(name: string = 'mock-server', version: string = '1.0.0') {
    this.name = name;
    this.version = version;
    this._tools = new Map();
    this._resources = new Map();
    this._prompts = new Map();
    this.listeners = new Map();
  }

  tool(name: string, description: string, inputSchema: any, handler: Function): any {
    this._tools.set(name, {
      name,
      description,
      inputSchema,
      handler
    });
    return this;
  }

  resource(uri: string, handler: Function): any {
    this._resources.set(uri, {
      uri,
      handler
    });
    return this;
  }

  prompt(name: string, description: string, handler: Function): any {
    this._prompts.set(name, {
      name,
      description,
      handler
    });
    return this;
  }

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }

  // Helper methods for testing
  async callTool(name: string, parameters: any = {}): Promise<any> {
    const tool = this._tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }
    return await tool.handler(parameters);
  }

  async callResource(uri: string, parameters: any = {}): Promise<any> {
    const resource = this._resources.get(uri);
    if (!resource) {
      throw new Error(`Resource '${uri}' not found`);
    }
    return await resource.handler(parameters);
  }

  async callPrompt(name: string, parameters: any = {}): Promise<any> {
    const prompt = this._prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt '${name}' not found`);
    }
    return await prompt.handler(parameters);
  }

  reset(): void {
    this._tools.clear();
    this._resources.clear();
    this._prompts.clear();
    this.listeners.clear();
  }

  getRegisteredTools(): string[] {
    return Array.from(this._tools.keys());
  }

  getRegisteredResources(): string[] {
    return Array.from(this._resources.keys());
  }

  getRegisteredPrompts(): string[] {
    return Array.from(this._prompts.keys());
  }
}

// Helper function to create test tools
export const createTestTools = (server: MockMcpServer) => {
  server.tool('calculator', 'Performs basic arithmetic operations', {
    type: 'object',
    properties: {
      operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] },
      a: { type: 'number' },
      b: { type: 'number' }
    },
    required: ['operation', 'a', 'b']
  }, async ({ operation, a, b }: { operation: string; a: number; b: number }) => {
    switch (operation) {
      case 'add':
        return { result: a + b };
      case 'subtract':
        return { result: a - b };
      case 'multiply':
        return { result: a * b };
      case 'divide':
        if (b === 0) throw new Error('Division by zero');
        return { result: a / b };
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  });

  server.tool('echo', 'Echoes back the input', {
    type: 'object',
    properties: {
      message: { type: 'string' }
    },
    required: ['message']
  }, async ({ message }: { message: string }) => {
    return { echo: message };
  });

  server.tool('slow-operation', 'Simulates a slow operation', {
    type: 'object',
    properties: {
      delay: { type: 'number', default: 100 }
    }
  }, async ({ delay = 100 }: { delay?: number }) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return { completed: true, delay };
  });

  server.tool('failing-tool', 'Always fails for testing error handling', {
    type: 'object',
    properties: {
      errorMessage: { type: 'string', default: 'Tool failed' }
    }
  }, async ({ errorMessage = 'Tool failed' }: { errorMessage?: string }) => {
    throw new Error(errorMessage);
  });
};

// Helper function to create test resources
export const createTestResources = (server: MockMcpServer) => {
  server.resource('file://test.txt', async () => {
    return { 
      uri: 'file://test.txt',
      content: 'This is test content',
      mimeType: 'text/plain'
    };
  });

  server.resource('file://slow-resource.txt', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      uri: 'file://slow-resource.txt',
      content: 'This is slow content',
      mimeType: 'text/plain'
    };
  });

  server.resource('file://error.txt', async () => {
    throw new Error('Resource not found');
  });
};

// Helper function to create test prompts
export const createTestPrompts = (server: MockMcpServer) => {
  server.prompt('greeting', 'Generate a greeting message', async ({ name }: { name?: string }) => {
    return {
      messages: [
        {
          role: 'user',
          content: `Hello${name ? ` ${name}` : ''}! How are you today?`
        }
      ]
    };
  });

  server.prompt('analysis', 'Analyze the provided data', async ({ data }: { data: any }) => {
    return {
      messages: [
        {
          role: 'user',
          content: `Please analyze this data: ${JSON.stringify(data)}`
        }
      ]
    };
  });

  server.prompt('failing-prompt', 'Always fails for testing error handling', async () => {
    throw new Error('Prompt failed');
  });
};