// Core exports for programmatic usage
export { scanForInstructionFiles, analyzeConflicts } from "./scanner.js";
export { createSymlink, removeSymlink } from "./symlinker.js";
export { DEFAULT_AGENTS, DEFAULT_IGNORE_PATTERNS } from "./agents.js";
export { loadUserConfig, isWindows, getSymlinkCapability } from "./utils.js";

// Type exports
export type {
  AgentConfig,
  DiscoveredFile,
  Conflict,
  ConflictAnalysis,
  SymlinkResult,
  UserConfig,
  CliOptions,
} from "./types.js";
