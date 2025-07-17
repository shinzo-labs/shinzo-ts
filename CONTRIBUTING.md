# Contributing to Shinzo

## Overview

Contributions to this codebase are welcomed and appreciated. We encourage novice and professional developers alike to help improve the quality of our software, which is offered as a benefit to the developer community.

## Project Philosophy

- **Build as a community**: Centralized development, decentralized input. We ship early, iterate fast, and reward contributors.
- **Lean on battle-tested technology**: Prefer proven, stable software over experimental solutions.
- **Develop a composable architecture**: Every component works independently; use only what you need.
- **Performance is a top priority**: Minimal overhead, maximum insight.
- **Democratize the power of AI**: Build open, accessible tools for all agentic developers.

## Code of Conduct

As a member of our community, you are expected to follow all rules in our [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). Please report unacceptable behavior through the channels specified in the covenant.

## Technical Contributions

### Issues

If you would like to raise any issues, please do so in the [Issues](https://github.com/shinzo-labs/shinzo-ts/issues) section and a core contributor will respond in a timely manner. Issue threads may be closed if there are no additional comments added within 7 days of the last update by a contributor on the thread.

### Pull Requests

If you would like to contribute code to the codebase, you may review the open issues in [Issues](https://github.com/shinzo-labs/shinzo-ts/issues) to participate in discussion or ask to be assigned directly to it. If you would like to suggest a feature that is not already captured in the Issues section, please open a new Issue ticket. 

Once you have been assigned an issue, the steps to contribute are:
1. Create a fork version of the repo.
2. Open a branch with a name prefixed with `feat/`, `fix/`, or `chore/` depending on the nature of the change. Use your best judgement when deciding on the prefix.
3. Implement the desired changes.
4. Add tests to any relevant test suites to validate functionality.
5. Create a changeset for your changes by running `npx @changesets/cli` (or `pnpm changeset`) from the root of the repository. This will prompt you to select which packages are affected and describe the changes. Choose the appropriate version bump type (patch, minor, or major) based on semantic versioning principles.
6. Open a Pull Request from your forked repo back to the main repo. Tag one of the core contributors as a reviewer.
7. A comment will be added to your PR from the CLA Assistant bot regarding signing our [Contributor License Agreement](./CONTRIBUTOR_LICENSE_AGREEMENT.md). Please follow the steps to sign, otherwise we will not be able to accept your contribution.
8. Once the core contributor has reviewed the code and all comments have been resolved, the PR will be approved and merged into the `main` branch.
9. When your PR is merged, the changeset will be used to automatically create a release PR with proper version bumps and changelogs. Once the release PR is merged, updated packages will be published to npm automatically.

### Working with Changesets

This project uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing of packages in the monorepo. Here's how to work with them:

#### Creating a Changeset

When you make changes that should trigger a new release, run:
```bash
npx @changesets/cli
# or
pnpm changeset
```

This will:
1. Ask you to select which packages are affected by your changes
2. Prompt you to choose the version bump type (patch, minor, or major)
3. Ask for a description of the changes
4. Generate a changeset file in `.changeset/`

#### Version Bump Guidelines

Follow semantic versioning:
- **Patch** (1.0.0 → 1.0.1): Bug fixes, small improvements
- **Minor** (1.0.0 → 1.1.0): New features, non-breaking changes
- **Major** (1.0.0 → 2.0.0): Breaking changes

#### Changeset Files

Changeset files are markdown files that describe your changes. They should be committed with your PR and will be consumed when creating releases.

## Non-Technical Contributions

Shinzo can only grow with the support of a vibrant developer community and strong partnerships with other organizations and communities. If you think there may be an opportunity to collaborate or advance the project in some way, please reach out to the contact below.

## Contact

If you have any questions or comments about the guidelines here or anything else about the software, feel free to join the discussion on our [Discord server](https://discord.gg/UYUdSdp5N8) or contact the project maintainer Austin Born (austin@shinzolabs.com, [@austinbuilds](https://x.com/austinbuilds)) directly.
