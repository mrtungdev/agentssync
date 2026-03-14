import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { AgentConfig, DiscoveredFile, ConflictAnalysis } from "./types.js";
import { DEFAULT_AGENTS, DEFAULT_IGNORE_PATTERNS } from "./agents.js";

export interface ScanOptions {
  cwd: string;
  agents?: AgentConfig[];
  ignorePatterns?: string[];
}

/**
 * Scan directory for AI instruction files
 */
export async function scanForInstructionFiles(
  options: ScanOptions
): Promise<DiscoveredFile[]> {
  const {
    cwd,
    agents = DEFAULT_AGENTS,
    ignorePatterns = [],
  } = options;

  const allPatterns = agents.flatMap((agent) => agent.patterns);
  const allIgnore = [...DEFAULT_IGNORE_PATTERNS, ...ignorePatterns];

  const entries = await fg(allPatterns, {
    cwd,
    absolute: true,
    ignore: allIgnore,
    dot: true, // Include dotfiles like .cursorrules
    onlyFiles: true,
    followSymbolicLinks: false, // Important: detect symlinks properly
    stats: true,
  });

  const discovered: DiscoveredFile[] = [];

  for (const entry of entries) {
    const filePath = typeof entry === "string" ? entry : entry.path;
    const relativePath = path.relative(cwd, filePath);

    // Get stats
    let stats;
    try {
      stats = await fs.lstat(filePath);
    } catch {
      continue;
    }

    // Find matching agent
    const agent = agents.find((a) =>
      a.patterns.some((pattern) => matchesPattern(relativePath, pattern))
    );

    if (!agent) continue;

    const isSymlink = stats.isSymbolicLink();
    let symlinkTarget: string | undefined;

    if (isSymlink) {
      try {
        symlinkTarget = await fs.readlink(filePath);
      } catch {
        // Broken symlink
      }
    }

    discovered.push({
      path: filePath,
      relativePath,
      agent,
      isSymlink,
      symlinkTarget,
      size: stats.size,
    });
  }

  // Sort by priority (highest first)
  return discovered.sort((a, b) => b.agent.priority - a.agent.priority);
}

/**
 * Simple glob pattern matching
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = filePath.replace(/\\/g, "/");
  const normalizedPattern = pattern.replace(/\\/g, "/");

  // Handle exact match
  if (normalizedPath === normalizedPattern) return true;

  // Handle patterns with wildcards
  const regexPattern = normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special chars except * and ?
    .replace(/\*\*/g, "§DOUBLESTAR§") // Placeholder for **
    .replace(/\*/g, "[^/]*") // * matches anything except /
    .replace(/§DOUBLESTAR§/g, ".*") // ** matches anything
    .replace(/\?/g, "."); // ? matches single char

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(normalizedPath);
}

/**
 * Analyze discovered files for conflicts
 */
export async function analyzeConflicts(
  files: DiscoveredFile[]
): Promise<ConflictAnalysis> {
  // Separate real files from symlinks
  const sourceFiles = files.filter((f) => !f.isSymlink);
  const existingSymlinks = files.filter((f) => f.isSymlink);

  // Check for conflicts: multiple source files with different content
  let hasConflict = false;

  if (sourceFiles.length > 1) {
    const contentHashes = await Promise.all(
      sourceFiles.map(async (f) => {
        try {
          const content = await fs.readFile(f.path, "utf-8");
          return crypto.createHash("md5").update(content).digest("hex");
        } catch {
          return null;
        }
      })
    );

    const uniqueHashes = new Set(contentHashes.filter(Boolean));
    hasConflict = uniqueHashes.size > 1;
  }

  // Determine suggested source (highest priority non-symlink file)
  const suggestedSource =
    sourceFiles.length > 0
      ? sourceFiles.sort((a, b) => b.agent.priority - a.agent.priority)[0]
      : null;

  return {
    sourceFiles,
    existingSymlinks,
    hasConflict,
    suggestedSource,
  };
}
