#!/usr/bin/env node

/**
 * Test runner utility for ensuring proper test execution and cleanup
 */

import { spawn } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const TEST_TIMEOUT = 60000; // 1 minute timeout
const CLEANUP_PATHS = [
  'coverage',
  'dist',
  '.nyc_output',
  'junit.xml',
  'test-results.xml'
];

interface TestRunnerOptions {
  coverage?: boolean;
  watch?: boolean;
  verbose?: boolean;
  pattern?: string;
  timeout?: number;
}

class TestRunner {
  private projectRoot: string;
  private options: TestRunnerOptions;

  constructor(projectRoot: string, options: TestRunnerOptions = {}) {
    this.projectRoot = projectRoot;
    this.options = {
      coverage: false,
      watch: false,
      verbose: false,
      timeout: TEST_TIMEOUT,
      ...options
    };
  }

  async run(): Promise<boolean> {
    console.log('🧪 Starting test runner...');

    try {
      // Cleanup before running tests
      await this.cleanup();

      // Run tests
      const success = await this.runTests();

      if (success) {
        console.log('✅ All tests passed!');
        if (this.options.coverage) {
          await this.generateCoverageReport();
        }
      } else {
        console.log('❌ Some tests failed!');
      }

      return success;
    } catch (error) {
      console.error('💥 Test runner failed:', error);
      return false;
    } finally {
      // Cleanup after running tests (unless in watch mode)
      if (!this.options.watch) {
        await this.cleanup();
      }
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test artifacts...');

    for (const path of CLEANUP_PATHS) {
      const fullPath = join(this.projectRoot, path);
      if (existsSync(fullPath)) {
        try {
          rmSync(fullPath, { recursive: true, force: true });
          console.log(`  Removed: ${path}`);
        } catch (error) {
          console.warn(`  Failed to remove ${path}:`, error);
        }
      }
    }
  }

  private async runTests(): Promise<boolean> {
    console.log('🚀 Running tests...');

    const args = ['jest'];

    if (this.options.coverage) {
      args.push('--coverage');
    }

    if (this.options.watch) {
      args.push('--watch');
    }

    if (this.options.verbose) {
      args.push('--verbose');
    }

    if (this.options.pattern) {
      args.push('--testNamePattern', this.options.pattern);
    }

    // Add additional Jest options for better test isolation
    args.push(
      '--detectOpenHandles',
      '--forceExit',
      '--runInBand', // Run tests serially to avoid conflicts
      '--maxWorkers=1'
    );

    return new Promise((resolve) => {
      const child = spawn('npx', args, {
        cwd: this.projectRoot,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          // Disable real network requests
          DISABLE_NETWORK: 'true'
        }
      });

      // Set timeout
      const timeout = setTimeout(() => {
        console.log('⏰ Test timeout reached, killing process...');
        child.kill('SIGTERM');
        resolve(false);
      }, this.options.timeout);

      child.on('close', (code) => {
        clearTimeout(timeout);
        resolve(code === 0);
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        console.error('Test process error:', error);
        resolve(false);
      });
    });
  }

  private async generateCoverageReport(): Promise<void> {
    console.log('📊 Generating coverage report...');

    const coveragePath = join(this.projectRoot, 'coverage');
    if (existsSync(coveragePath)) {
      console.log(`Coverage report available at: ${coveragePath}/lcov-report/index.html`);
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--coverage':
        options.coverage = true;
        break;
      case '--watch':
        options.watch = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--pattern':
        options.pattern = args[++i];
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i], 10);
        break;
      case '--help':
        console.log(`
Test Runner Usage:
  npm run test:runner [options]

Options:
  --coverage      Generate coverage report
  --watch         Watch mode
  --verbose       Verbose output
  --pattern       Test name pattern
  --timeout       Test timeout in milliseconds
  --help          Show this help

Examples:
  npm run test:runner --coverage
  npm run test:runner --watch
  npm run test:runner --pattern "integration"
        `);
        process.exit(0);
        break;
    }
  }

  const projectRoot = join(__dirname, '..');
  const runner = new TestRunner(projectRoot, options);

  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };