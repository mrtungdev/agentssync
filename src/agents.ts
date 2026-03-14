import type { AgentConfig } from "./types.js";

export const DEFAULT_AGENTS: AgentConfig[] = [
  // Universal Standard (Linux Foundation)
  {
    id: "agents",
    name: "Universal (AGENTS.md)",
    patterns: ["AGENTS.md"],
    description: "Linux Foundation universal standard, supported by most agents",
    primaryFile: "AGENTS.md",
    priority: 100,
  },

  // Claude
  {
    id: "claude",
    name: "Claude Code",
    patterns: ["CLAUDE.md"],
    description: "Anthropic Claude Code instruction file",
    primaryFile: "CLAUDE.md",
    priority: 90,
  },

  // GitHub Copilot
  {
    id: "copilot",
    name: "GitHub Copilot",
    patterns: [".github/copilot-instructions.md"],
    description: "GitHub Copilot custom instructions",
    primaryFile: ".github/copilot-instructions.md",
    priority: 85,
  },

  // Cursor
  {
    id: "cursor",
    name: "Cursor",
    patterns: [".cursorrules"],
    description: "Cursor AI editor rules",
    primaryFile: ".cursorrules",
    priority: 80,
  },

  // Windsurf
  {
    id: "windsurf",
    name: "Windsurf",
    patterns: [".windsurfrules"],
    description: "Windsurf (Codeium) instruction rules",
    primaryFile: ".windsurfrules",
    priority: 75,
  },

  // Cline
  {
    id: "cline",
    name: "Cline",
    patterns: [".clinerules"],
    description: "Cline AI coding assistant rules",
    primaryFile: ".clinerules",
    priority: 70,
  },

  // Codex CLI (OpenAI)
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    patterns: ["AGENT.md"],
    description: "OpenAI Codex CLI agent instructions",
    primaryFile: "AGENT.md",
    priority: 65,
  },

  // Gemini CLI
  {
    id: "gemini",
    name: "Gemini CLI",
    patterns: ["GEMINI.md"],
    description: "Google Gemini CLI instructions",
    primaryFile: "GEMINI.md",
    priority: 60,
  },

  // Amazon Q
  {
    id: "amazonq",
    name: "Amazon Q Developer",
    patterns: [".amazonq/rules/*.md"],
    description: "Amazon Q Developer rules",
    primaryFile: ".amazonq/rules/rules.md",
    priority: 55,
  },

  // JetBrains AI
  {
    id: "jetbrains",
    name: "JetBrains AI Assistant",
    patterns: [".junie/guidelines.md"],
    description: "JetBrains AI Assistant rules",
    primaryFile: ".junie/guidelines.md",
    priority: 50,
  },

  // Roo Code
  {
    id: "roo",
    name: "Roo Code",
    patterns: [".roo/rules/*.md", ".roorules"],
    description: "Roo Code instruction rules",
    primaryFile: ".roorules",
    priority: 45,
  },

  // Augment
  {
    id: "augment",
    name: "Augment Code",
    patterns: [".augment/rules/*.md"],
    description: "Augment Code rules",
    primaryFile: ".augment/rules/rules.md",
    priority: 40,
  },

  // Aider
  {
    id: "aider",
    name: "Aider",
    patterns: [".aider.conf.yml", "CONVENTIONS.md"],
    description: "Aider AI pair programmer",
    primaryFile: "CONVENTIONS.md",
    priority: 35,
  },

  // Continue.dev
  {
    id: "continue",
    name: "Continue.dev",
    patterns: [".continue/rules/*.md", ".continuerules"],
    description: "Continue.dev configuration",
    primaryFile: ".continuerules",
    priority: 30,
  },

  // Sourcegraph Cody
  {
    id: "cody",
    name: "Sourcegraph Cody",
    patterns: [".cody/cody.json"],
    description: "Sourcegraph Cody configuration",
    primaryFile: ".cody/cody.json",
    priority: 25,
  },
];

// Patterns to always ignore during scanning
export const DEFAULT_IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/.next/**",
  "**/coverage/**",
  "**/vendor/**",
  "**/.venv/**",
  "**/venv/**",
  "**/__pycache__/**",
];
