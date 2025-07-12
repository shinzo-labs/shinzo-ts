<a id="readme-top"></a>
<div align="center">
    <a href="https://github.com/shinzo-labs/shinzo">
        <img src="https://github.com/user-attachments/assets/78542e5b-1da1-44ad-a3e2-5b4eb9e6a962" alt="Logo" width="256" height="256">
    </a>
    <h1 align="center">
        Shinzo: The Composable Analytics Stack for MCP Servers
    </h1>
    <p align=center>
        <a href="https://github.com/shinzo-labs/shinzo/stargazers">
            <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2Fshinzo-labs%2Fshinzo%2Fstargazers&query=%24.length&logo=github&label=stars&color=e3b341" alt="Stars">
            </a>
        <a href="https://github.com/shinzo-labs/shinzo/forks">
            <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fapi.github.com%2Frepos%2Fshinzo-labs%2Fshinzo%2Fforks&query=%24.length&logo=github&label=forks&color=8957e5" alt="Forks">
            </a>
        <a href="https://github.com/shinzo-labs/shinzo/pulls">
            <img src="https://img.shields.io/badge/build-passing-green" alt="Build">
        </a>
        <a href="https://github.com/shinzo-labs/shinzo/graphs/contributors">
            <img src="https://img.shields.io/badge/contributors-welcome-339933?logo=github" alt="contributors welcome">
        </a>
        <a href="https://discord.gg/UYUdSdp5N8">
            <img src="https://discord-live-members-count-badge.vercel.app/api/discord-members?guildId=1079318797590216784" alt="Discord">
        </a>
        <a href="https://www.linkedin.com/company/shinzo-labs">
            <img src="https://img.shields.io/badge/linkedin-0a66c2?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjxzdmcgaGVpZ2h0PSI3MiIgdmlld0JveD0iMCAwIDcyIDcyIiB3aWR0aD0iNzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNOCw3MiBMNjQsNzIgQzY4LjQxODI3OCw3MiA3Miw2OC40MTgyNzggNzIsNjQgTDcyLDggQzcyLDMuNTgxNzIyIDY4LjQxODI3OCwtOC4xMTYyNDUwMWUtMTYgNjQsMCBMOCwwIEMzLjU4MTcyMiw4LjExNjI0NTAxZS0xNiAtNS40MTA4MzAwMWUtMTYsMy41ODE3MjIgMCw4IEwwLDY0IEM1LjQxMDgzMDAxZS0xNiw2OC40MTgyNzggMy41ODE3MjIsNzIgOCw3MiBaIiBmaWxsPSIjMDA3RUJCIi8+PHBhdGggZD0iTTYyLDYyIEw1MS4zMTU2MjUsNjIgTDUxLjMxNTYyNSw0My44MDIxMTQ5IEM1MS4zMTU2MjUsMzguODEyNzU0MiA0OS40MTk3OTE3LDM2LjAyNDUzMjMgNDUuNDcwNzAzMSwzNi4wMjQ1MzIzIEM0MS4xNzQ2MDk0LDM2LjAyNDUzMjMgMzguOTMwMDc4MSwzOC45MjYxMTAzIDM4LjkzMDA3ODEsNDMuODAyMTE0OSBMMzguOTMwMDc4MSw2MiBMMjguNjMzMzMzMyw2MiBMMjguNjMzMzMzMywyNy4zMzMzMzMzIEwzOC45MzAwNzgxLDI3LjMzMzMzMzMgTDM4LjkzMDA3ODEsMzIuMDAyOTI4MyBDMzguOTMwMDc4MSwzMi4wMDI5MjgzIDQyLjAyNjA0MTcsMjYuMjc0MjE1MSA0OS4zODI1NTIxLDI2LjI3NDIxNTEgQzU2LjczNTY3NzEsMjYuMjc0MjE1MSA2MiwzMC43NjQ0NzA1IDYyLDQwLjA1MTIxMiBMNjIsNjIgWiBNMTYuMzQ5MzQ5LDIyLjc5NDAxMzMgQzEyLjg0MjA1NzMsMjIuNzk0MDEzMyAxMCwxOS45Mjk2NTY3IDEwLDE2LjM5NzAwNjcgQzEwLDEyLjg2NDM1NjYgMTIuODQyMDU3MywxMCAxNi4zNDkzNDksMTAgQzE5Ljg1NjY0MDYsMTAgMjIuNjk3MDA1MiwxMi44NjQzNTY2IDIyLjY5NzAwNTIsMTYuMzk3MDA2NyBDMjIuNjk3MDA1MiwxOS45Mjk2NTY3IDE5Ljg1NjY0MDYsMjIuNzk0MDEzMyAxNi4zNDkzNDksMjIuNzk0MDEzMyBaIE0xMS4wMzI1NTIxLDYyIEwyMS43Njk0MDEsNjIgTDIxLjc2OTQwMSwyNy4zMzMzMzMzIEwxMS4wMzI1NTIxLDI3LjMzMzMzMzMgTDExLjAzMjU1MjEsNjIgWiIgZmlsbD0iI0ZGRiIvPjwvZz48L3N2Zz4=" alt="LinkedIn">
        </a>
    </p>
    Shinzo is the first fully composable analytics solution built with OpenTelemetry conventions for the MCP ecosystem. Gain insight into agent usage patterns, contextualize tool calls, and analyze performance of your servers across platforms. The complete stack can be installed in just a few commands with an emphasis on ease of use and flexibility.
    <p align=center>
        <a href="https://github.com/shinzo-labs/shinzo">
            <strong>Explore the docs »</strong>
        </a>
    </p>
</div>

<details>
  <summary>Table of Contents</summary>

  - [About Shinzo](#about-shinzo)
    - [System Architecture](#system-architecture)
    - [Key Features](#key-features)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Usage](#usage)
  - [Roadmap](#roadmap)
  - [Contributing](#contributing)
  - [Contact](#contact)
  - [Additional Resources](##additional-resources)
</details>

## About Shinzo

Shinzo is an open, composable analytics stack purpose-built for developers and publishers building MCP ([Model Context Protocol](https://modelcontextprotocol.io/introduction)) servers and agentic AI systems, with the goal to put powerful, privacy-conscious telemetry and analysis tools directly in the hands of server developers. All components adhere to [OpenTelemetry](https://opentelemetry.io/docs/) conventions, making it easy to connect Shinzo to other [OpenTelemetry-compatible software](https://opentelemetry.io/ecosystem/vendors/).

### System Architecture

- **Drop-In Instrumentation SDK**: Drop-in OpenTelemetry-compatible SDK for MCP servers. Install with a single command to auto-instrument your server and export telemetry to the collector of your choice.
- **Telemetry Collector**: High-performance OpenTelemetry backend service with support for data sanitization, secure storage, and configurable retention attributes.
- **Analytics Dashboard**: Frontend dashboard for real-time analytics, trace analysis, performance profiling, tool usage stats, and more.

### Key Features

- **Auto-Instrumentation**: One line of code gives you instant instrumentation for all the capabilities on your MCP server.
- **Anonymous, Configurable Telemetry**: PII sanitization and flexible sampling ensures you only collect the data you want.
- **Automated User Consent**: Remain compliant with [GDPR](https://gdpr.eu/what-is-gdpr/), [CCPA](https://oag.ca.gov/privacy/ccpa)/[CPRA](https://thecpra.org/) and other data privacy regulation with our built-in mechanisms for user consent.
- **Custom Analytics Dashboards**: Self-hosted, real-time dashboards for tool usage, performance, and traces.
- **OpenTelemetry-Compatible**: Since the entire stack meets OpenTelemetry standard conventions, developers can mix-and-match our components with any OpenTelemetry-compatible service.

## Setup

> 🚧 This section is currently under construction. See the [Roadmap](#roadmap) section for current status ond progress on features.

## Roadmap

> _Note: For the complete roadmap timeline with all issues, see the [Roadmap](https://github.com/orgs/shinzo-labs/projects/1/views/4) page on Github._

- [x] **Phase 0** (June 2025):
  - [x] System Architecture Design
  - [ ] Contributor Operations
- [ ] **Phase 1** (July 2025):
  - [ ] OpenTelemetry MCP semantic conventions
  - [ ] TypeScript Instrumentation SDK
- [ ] **Phase 2** (August 2025):
  - [ ] Telemetry Collector
- [ ] **Phase 3** (September 2025):
  - [ ] Analytics Dashboard
  - [ ] Agentic Analysis
- [ ] **Phase 4** (Q4 2025):
  - [ ] Python Instrumentation SDK
  - [ ] Java Instrumentation SDK
  - [ ] Rust Instrumentation SDK
  - [ ] Kotlin Instrumentation SDK
- [ ] **Phase 5 and Beyond** (2026+):
  - [ ] Server publishing and deployment
  - [ ] Incident response system
  - [ ] MCP server auto-reconfiguration
  - [ ] Industry vertical solutions
  - [ ] Business Intelligence

## Contributing

Contributions to Shinzo are appreciated, whether you are a veteran building sophisticated enterprise AI agent systems or a newcomer just testing the waters. Shinzo accepts contributions both in terms of direct code contributions as well as non-technical support like community engagement, user testing, and professional partnerships. Feel free to join the conversation on our [Discord server](https://discord.gg/qrVWEuRh) and checkout  the [Contributing](./CONTRIBUTING.md) page to learn how you can become a contributor.

## Contact

Contact Austin Born (austin@shinzolabs.com, [@austinbuilds](https://x.com/austinbuilds)) if you have any questions or comments related to this software.

## Additional Resources

* [Model Context Protocol](https://modelcontextprotocol.io/introduction)
* [OpenTelemetry](https://opentelemetry.io/docs/)
* [GDPR](https://gdpr.eu/what-is-gdpr/)
* [CCPA](https://oag.ca.gov/privacy/ccpa)/[CPRA](https://thecpra.org/)

<p align="right">(<a href="">back to top</a>)</p>
