# agentssync

> Sync AI agent instruction files via symlinks - maintain a single source of truth across Claude, Cursor, Copilot, Windsurf, and 15+ AI coding tools.

[![npm version](https://img.shields.io/npm/v/@mrtungdev/agentssync.svg)](https://www.npmjs.com/package/@mrtungdev/agentssync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## The Problem

Modern developers use multiple AI coding assistants. Each tool has its own instruction file:

- **Claude Code** reads `CLAUDE.md`
- **GitHub Copilot** reads `.github/copilot-instructions.md`
- **Cursor** reads `.cursorrules`
- **Windsurf** reads `.windsurfrules`
- **OpenAI Codex CLI** reads `AGENT.md`
- ...and many more

Maintaining identical instructions across all these files is tedious and error-prone.

## The Solution

**agentssync** creates symlinks between AI instruction files, so you maintain one source file and all other agents automatically stay in sync.

```
CLAUDE.md (source - your single source of truth)
    ├── AGENTS.md → CLAUDE.md
    ├── .cursorrules → CLAUDE.md
    ├── .windsurfrules → CLAUDE.md
    ├── .clinerules → CLAUDE.md
    └── .github/copilot-instructions.md → CLAUDE.md
```

## Installation

```bash
# Using npm
npm install -g agentssync

# Using bun
bun install -g agentssync

# Using pnpm
pnpm add -g agentssync
```

## Quick Start

```bash
# Navigate to your project
cd my-project

# Run agentssync
agentssync
```

That's it! The interactive CLI will:
1. Scan for existing AI instruction files
2. Let you select the primary source file
3. Let you choose which agents to create symlinks for
4. Create the symlinks

## Usage

### Interactive Mode (Default)

```bash
agentssync
```

### Non-Interactive Mode

```bash
# Auto-select all available agents
agentssync -y

# Preview without making changes
agentssync --dry-run

# Specify a different directory
agentssync ./my-project
```

### CLI Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |
| `--dry-run` | `-d` | Preview changes without creating symlinks |
| `--yes` | `-y` | Auto-confirm all prompts (non-interactive) |
| `--verbose` | | Show detailed output |
| `--config` | `-c` | Path to config file |

## Supported AI Agents

| Agent | Instruction File | Priority |
|-------|-----------------|----------|
| Universal (AGENTS.md) | `AGENTS.md` | 100 |
| Claude Code | `CLAUDE.md` | 90 |
| GitHub Copilot | `.github/copilot-instructions.md` | 85 |
| Cursor | `.cursorrules` | 80 |
| Windsurf | `.windsurfrules` | 75 |
| Cline | `.clinerules` | 70 |
| OpenAI Codex CLI | `AGENT.md` | 65 |
| Gemini CLI | `GEMINI.md` | 60 |
| Amazon Q Developer | `.amazonq/rules/rules.md` | 55 |
| JetBrains AI | `.junie/guidelines.md` | 50 |
| Roo Code | `.roorules` | 45 |
| Augment Code | `.augment/rules/rules.md` | 40 |
| Aider | `CONVENTIONS.md` | 35 |
| Continue.dev | `.continuerules` | 30 |
| Sourcegraph Cody | `.cody/cody.json` | 25 |

**Priority** determines which file is suggested as the primary source when multiple instruction files exist.

## Configuration

Create a `.agentssync.json` file in your project root or home directory:

```json
{
  "customAgents": [
    {
      "id": "my-agent",
      "name": "My Custom Agent",
      "patterns": ["MY_AGENT.md"],
      "primaryFile": "MY_AGENT.md",
      "priority": 50
    }
  ],
  "excludeAgents": ["amazonq", "cody"],
  "ignorePatterns": ["**/temp/**"],
  "defaultSource": "claude"
}
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `customAgents` | `AgentConfig[]` | Add custom AI agents |
| `excludeAgents` | `string[]` | Agent IDs to exclude from scanning |
| `ignorePatterns` | `string[]` | Additional glob patterns to ignore |
| `defaultSource` | `string` | Default source agent ID |

## Programmatic API

You can also use agentssync as a library:

```typescript
import {
  scanForInstructionFiles,
  analyzeConflicts,
  createSymlink,
  DEFAULT_AGENTS,
} from "agentssync";

// Scan for files
const files = await scanForInstructionFiles({
  cwd: process.cwd(),
  agents: DEFAULT_AGENTS,
});

// Analyze conflicts
const analysis = await analyzeConflicts(files);

// Create a symlink
const result = await createSymlink({
  source: "/path/to/CLAUDE.md",
  target: "/path/to/.cursorrules",
  force: true,
});
```

## How It Works

1. **Scanning**: Uses [fast-glob](https://github.com/mrmlnc/fast-glob) to recursively find AI instruction files
2. **Conflict Detection**: Compares file content hashes to detect actual conflicts
3. **Symlink Creation**: Creates relative symlinks for portability across machines
4. **Cross-Platform**: Works on macOS, Linux, and Windows (with Developer Mode or admin)

### Windows Notes

On Windows, creating symlinks requires either:
- **Developer Mode** enabled (Settings > Update & Security > For Developers)
- **Administrator privileges**

If symlinks aren't available, agentssync will fall back to hard links.

## Examples

### Example 1: New Project Setup

```bash
# Create your instruction file
echo "# Project Instructions\n\nUse TypeScript..." > CLAUDE.md

# Sync to all agents
agentssync -y
```

### Example 2: Preview Changes

```bash
$ agentssync --dry-run

┌  agentssync
│
◇  Found 1 file(s)
│
●  Found 1 AI instruction file(s):
│    Claude Code: CLAUDE.md (source)
│
◆  Using source: CLAUDE.md
│
●  Symlinks to create:
│    AGENTS.md -> CLAUDE.md
│    .cursorrules -> CLAUDE.md
│    .windsurfrules -> CLAUDE.md
│
▲  Dry run - no files were actually created
│
└  Done!
```

### Example 3: Custom Config

```json
// .agentssync.json
{
  "excludeAgents": ["copilot", "amazonq"],
  "customAgents": [
    {
      "id": "internal",
      "name": "Internal AI Tool",
      "patterns": [".internal/ai-rules.md"],
      "primaryFile": ".internal/ai-rules.md",
      "priority": 80
    }
  ]
}
```

## Development

```bash
# Clone the repo
git clone https://github.com/mrtungdev/agentssync.git
cd agentssync

# Install dependencies
bun install

# Build
bun run build

# Run tests
bun test

# Run tests with coverage
bun run test:coverage

# Link for local testing
bun link
agentssync --help
```

## Contributing

Contributions are welcome! Here's how you can help:

### Adding New AI Agents

1. Edit `src/agents.ts`
2. Add your agent to the `DEFAULT_AGENTS` array:

```typescript
{
  id: "new-agent",
  name: "New Agent Name",
  patterns: [".newagent-rules"],
  description: "Description of the agent",
  primaryFile: ".newagent-rules",
  priority: 50,
}
```

3. Add tests in `tests/agents.test.ts`
4. Submit a PR

### Reporting Issues

- Use [GitHub Issues](https://github.com/mrtungdev/agentssync/issues)
- Include your OS, Node.js version, and steps to reproduce

### Pull Request Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`bun test`)
5. Commit with clear messages
6. Push and create a Pull Request

## Roadmap

- [ ] Watch mode for auto-syncing on file changes
- [ ] GitHub Action for CI/CD integration
- [ ] VSCode extension
- [ ] Bi-directional sync detection
- [ ] Template system for instruction files

## License

MIT License - see [LICENSE](LICENSE) for details.

