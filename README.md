<a id="readme-top"></a>
<div align="center">
    <a href="https://github.com/shinzo-labs/shinzo-ts"><img src="https://github.com/user-attachments/assets/64f5e0ae-6924-41b1-b1da-1b22627e5c43" alt="Logo" width="256" height="256"></a>
    <h1 align="center">
        Shinzo TypeScript SDK: Complete Observability for MCP Servers
    </h1>
    <p align=center>
        <a href="https://github.com/shinzo-labs/shinzo-ts/stargazers"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2Fshinzo-labs%2Fshinzo%2Fstargazers&query=%24.length&logo=github&label=stars&color=e3b341" alt="Stars"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/forks"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2Fshinzo-labs%2Fshinzo%2Fforks&query=%24.length&logo=github&label=forks&color=8957e5" alt="Forks"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/pulls"><img src="https://img.shields.io/badge/build-passing-green" alt="Build"></a>
        <a href="https://github.com/shinzo-labs/shinzo-ts/graphs/contributors"><img src="https://img.shields.io/badge/contributors-welcome-339933?logo=github" alt="contributors welcome"></a>
        <a href="https://discord.gg/UYUdSdp5N8"><img src="https://discord-live-members-count-badge.vercel.app/api/discord-members?guildId=1079318797590216784" alt="Discord"></a>
    </p>
    <div align="center">
      <a href="https://youtu.be/OtBTAfbBr-w">
        <img src="https://github.com/user-attachments/assets/53783d00-2c47-4065-9614-bd381aaa21d6" alt="Shinzo Product Demo Video" width="560" height="315">
      </a>
    </div>
    The SDK provides OpenTelemetry-compatible instrumentation for TypeScript MCP servers. Gain insight into agent usage patterns, contextualize tool calls, and analyze performance of your servers across platforms. Instrumentation can be installed in servers in just a few steps with an emphasis on ease of use and flexibility.
    <p align=center>
        <a href="https://docs.shinzo.ai/sdk/typescript/installation"><strong>Explore the docs »</strong></a>
    </p>
</div>

<details>
  <summary>📋 Table of Contents</summary>

  - [🤖 About Shinzo](#about-shinzo)
    - [🏗️ System Architecture](#system-architecture)
    - [✨ Key Features](#key-features)
  - [⚙️ Setup](#setup)
  - [🗺️ Roadmap](#roadmap)
  - [🤝 Contributing](#contributing)
  - [📄 License](#license)
  - [📞 Contact](#contact)
  - [📚 Additional Resources](##additional-resources)
</details>

## 🤖 About Shinzo

 Shinzo is a complete observability platform for developers and publishers building MCP ([Model Context Protocol](https://modelcontextprotocol.io/introduction)) servers and agentic AI systems, with the goal to put powerful, privacy-conscious telemetry and analysis tools directly in the hands of server developers. All components adhere to [OpenTelemetry](https://opentelemetry.io/docs/) conventions, making it easy to connect Shinzo to other [OpenTelemetry-compatible software](https://opentelemetry.io/ecosystem/vendors/).

### 🏗️ System Architecture

- **Drop-In Instrumentation**: Drop-in OpenTelemetry-compatible instrumentation for MCP servers. Install with a single command to auto-instrument your server and export telemetry to the collector of your choice.
- **Telemetry Collector**: High-performance OpenTelemetry backend service with support for data sanitization, secure storage, and configurable retention attributes.
- **Analytics Dashboard**: Frontend dashboard for real-time analytics, trace analysis, performance profiling, tool usage stats, and more.

### ✨ Key Features

- **Automatic Instrumentation**: One line of code gives you instant instrumentation for your MCP server's capabilities.
- **Configurable Telemetry, Anonymous by Default**: Built-in PII sanitization and data processing features help you stay compliant with [GDPR](https://gdpr.eu/what-is-gdpr/), [CCPA](https://oag.ca.gov/privacy/ccpa)/[CPRA](https://thecpra.org/) and other data privacy regulation effortlessly.
- **Full Control**: All components of Shinzo can be self-hosted with our sustainable use license or cloud hosted through Shinzo Labs.
- **Custom Analytics Dashboards**: Self-hosted, real-time dashboards for tool usage, performance, and traces.
- **OpenTelemetry-Compatible**: Since the entire system meets OpenTelemetry standard conventions, developers can mix-and-match our modules with any [OpenTelemetry-compatible service](https://opentelemetry.io/ecosystem/vendors/).

## ⚙️ Setup

### 1. Install & Use in Your Own MCP Server

Add Shinzo to your MCP server project:

```sh
pnpm add @shinzolabs/instrumentation-mcp
# or
npm install @shinzolabs/instrumentation-mcp
```

Then instrument your MCP server using the SDK. Example:

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { instrumentServer, TelemetryConfig } from "@shinzolabs/instrumentation-mcp"

const NAME = "my-mcp-server"
const VERSION = "1.0.0"

const server = new McpServer({
  name: NAME,
  version: VERSION,
  description: "Example MCP server with telemetry"
})

// Use TelemetryConfig to set configuration options
const telemetryConfig: TelemetryConfig = {
  serverName: NAME,
  serverVersion: VERSION,
  exporterEndpoint: "http://localhost:4318/v1" // OpenTelemetry collector endpoint - /trace and /metrics are added automatically
}

// Initialize telemetry
const telemetry = instrumentServer(server, telemetryConfig)

// Add tools using the tool method
server.tool(...)
```

See [`packages/instrumentation-mcp/examples/basic-usage.ts`](./packages/instrumentation-mcp/examples/basic-usage.ts) for a full working example.

### 2. Local Development & Testing

Clone the repo and install dependencies:

```sh
git clone https://github.com/shinzo-labs/shinzo-ts.git
cd shinzo
pnpm install
```

Build the package:

```sh
pnpm build
```

Run the test suite:

```sh
pnpm test
```

You can also run specific test scripts (see `package.json` for all options):

```sh
pnpm test:unit    # Run only unit tests
pnpm test:integration  # Run only integration tests
pnpm lint         # Lint the codebase
```

## 🗺️ Roadmap

> _Note: For the complete roadmap timeline with all issues, see the [Roadmap](https://github.com/orgs/shinzo-labs/projects/1/views/4) page on Github._

- ✅ **Phase 0** _(June 2025)_
  - ✅ 🏗️ System Architecture Design
  - ✅ 🤝 Contributor Operations

- ✅ **Phase 1** _(July 2025)_
  - ✅ 📏 OpenTelemetry MCP Semantic Conventions
  - ✅ 🛠️ TypeScript Instrumentation SDK

- ✅ **Phase 2** _(August 2025)_
  - ✅ 📡 Telemetry Collector
  - ✅ 📊 Analytics Dashboard

- ✅ **Phase 3** _(September 2025)_
  - ✅ 🐍 Python Instrumentation SDK
  - ✅ 🏅 SOC2 Type II Kick-Off

- ⬜️ **Phase 4** _(Q4 2025)_
  - ✅ 🟡 Token Analytics
  - ✅ 🛡️ Session Management Insights
  - ⬜️ 🧠 Agentic Recommendations
  - ⬜️ 🏭 Industry Vertical Solutions

- ⬜️ **Phase 5 & Beyond** _(Q1 2026)_
  - ⬜️ 🏅 SOC2 Type II Certification
  - ⬜️ 🦦 Go Instrumentation SDK
  - ⬜️ 💠 C# Instrumentation SDK
  - ⬜️ 🗣️ User Elicitation Management

- ⬜️ **Phase 6** _(Q2 2026+)_
  - ⬜️ 🚨 Incident Alerting System
  - ⬜️ 🚀 Server Config & Deployment Console
  - ⬜️ ☕ Java Instrumentation SDK
  - ⬜️ 🦀 Rust Instrumentation SDK

## 🤝 Contributing

Contributions to Shinzo are appreciated, whether you are a veteran building sophisticated enterprise AI agent systems or a newcomer just testing the waters. Shinzo accepts contributions both in terms of direct code contributions as well as non-technical support like community engagement, user testing, and professional partnerships. Feel free to join the conversation on our [Discord server](https://discord.gg/UYUdSdp5N8) and checkout  the [Contributing](./CONTRIBUTING.md) page to learn how you can become a contributor.

## 📄 License

Shinzo is [fair-code](https://faircode.io) software distributed under the [Sustainable Use License](./LICENSE.md) and [Shinzo Enterprise License](./LICENSE_EE.md).

- **Source Available**: Always visible source code
- **Self-Hostable**: Deploy anywhere
- **Extensible**: Add your own features or functionality

Enterprise licenses are available for additional features and support through [Shinzo Labs](mailto:austin@shinzolabs.com).

We believe that the fair-code license model offers a strong compromise between democratizing the benefits of open software while ensuring long-term sustainability of software maintenance and operations. Our specific license model is adapted from [n8n](https://github.com/n8n-io/n8n/tree/master), with additional context for the origin of the licenses [here](https://docs.n8n.io/reference/license/).

Some of this software's capabilities enable developers and businesses to collect data on usage of products by respective end users. Shinzo Labs accepts no responsibility for how this software is used by other developers, and by using this software you accept all terms of the relevant licenses, including the section on [No Liability](./LICENSE.md#no-liability).

## 📞 Contact

Contact Austin Born (austin@shinzolabs.com, [@austinbuilds](https://x.com/austinbuilds)) if you have any questions or comments related to this software.

## 📚 Additional Resources

* [Model Context Protocol](https://modelcontextprotocol.io/introduction)
* [OpenTelemetry](https://opentelemetry.io/docs/)
* [GDPR](https://gdpr.eu/what-is-gdpr/)
* [CCPA](https://oag.ca.gov/privacy/ccpa)/[CPRA](https://thecpra.org/)

<p align="right">(<a href="">back to top</a>)</p>
