# CHANGELOG

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-03-14

- Initial release
- Support for multiple AI agent instruction files:
  - Universal (AGENTS.md) - Linux Foundation standard
  - Claude Code (CLAUDE.md)
  - GitHub Copilot (.github/copilot-instructions.md)
  - Cursor (.cursorrules)
  - Windsurf (.windsurfrules)
  - Cline (.clinerules)
  - OpenAI Codex CLI (AGENT.md)
  - Amazon Q (.amazonq/rules)
- Interactive CLI with source file selection
- Automatic symlink creation between agent files
- Dry-run mode (`--dry-run`)
- Force overwrite mode (`--force`)
- Non-interactive mode (`-y`)
- Custom configuration via `.agentssync.json`
- Priority-based conflict resolution