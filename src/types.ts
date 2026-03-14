/** Supported AI agent definition */
export interface AgentConfig {
  /** Unique identifier (e.g., "claude", "cursor") */
  id: string;
  /** Display name (e.g., "Claude Code", "Cursor") */
  name: string;
  /** Instruction file patterns to search for */
  patterns: string[];
  /** Description for user display */
  description?: string;
  /** Primary file to create when this agent is selected as target */
  primaryFile: string;
  /** Priority when multiple sources exist (higher = preferred) */
  priority: number;
}

/** Discovered instruction file */
export interface DiscoveredFile {
  /** Absolute path to the file */
  path: string;
  /** Relative path from project root */
  relativePath: string;
  /** Associated agent config */
  agent: AgentConfig;
  /** Whether file is already a symlink */
  isSymlink: boolean;
  /** If symlink, the target it points to */
  symlinkTarget?: string;
  /** File size in bytes */
  size: number;
}

/** Conflict when multiple source files exist */
export interface Conflict {
  /** Files that conflict */
  files: DiscoveredFile[];
  /** Suggested resolution based on priority */
  suggestedSource: DiscoveredFile;
}

/** Analysis result from conflict detection */
export interface ConflictAnalysis {
  /** Files that contain actual content (not symlinks) */
  sourceFiles: DiscoveredFile[];
  /** Files that are already symlinks */
  existingSymlinks: DiscoveredFile[];
  /** Whether multiple sources with different content exist */
  hasConflict: boolean;
  /** Suggested primary source based on priority */
  suggestedSource: DiscoveredFile | null;
}

/** Result of symlink operation */
export interface SymlinkResult {
  /** Source file (the actual content) */
  source: string;
  /** Target file (the symlink created) */
  target: string;
  /** Whether operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Whether this was a dry run */
  dryRun: boolean;
}

/** User configuration file schema */
export interface UserConfig {
  /** Custom agents to add */
  customAgents?: AgentConfig[];
  /** Agents to exclude from scanning */
  excludeAgents?: string[];
  /** Additional glob patterns to ignore */
  ignorePatterns?: string[];
  /** Default source agent ID when no preference */
  defaultSource?: string;
}

/** CLI options parsed from arguments */
export interface CliOptions {
  /** Run without creating symlinks */
  dryRun: boolean;
  /** Non-interactive mode (use defaults) */
  yes: boolean;
  /** Verbose output */
  verbose: boolean;
  /** Config file path */
  config?: string;
  /** Working directory */
  cwd: string;
  /** Show help */
  help: boolean;
  /** Show version */
  version: boolean;
}
