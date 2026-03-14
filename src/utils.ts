import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { UserConfig } from "./types.js";

const CONFIG_FILE_NAME = ".agentssync.json";

/**
 * Check if running on Windows
 */
export function isWindows(): boolean {
  return os.platform() === "win32";
}

/**
 * Get symlink capability on current platform
 */
export function getSymlinkCapability(): "full" | "limited" {
  if (!isWindows()) return "full";
  // On Windows, symlinks require admin or Developer Mode
  // We'll try and fall back to hard links if needed
  return "limited";
}

/**
 * Load user configuration from project or home directory
 */
export async function loadUserConfig(
  explicitPath?: string,
  cwd?: string
): Promise<UserConfig> {
  const configPaths = [
    explicitPath,
    cwd ? path.join(cwd, CONFIG_FILE_NAME) : null,
    path.join(os.homedir(), CONFIG_FILE_NAME),
  ].filter((p): p is string => p != null && p !== "");

  for (const configPath of configPaths) {
    try {
      const content = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(content) as UserConfig;
      validateConfig(config);
      return config;
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") {
        // File exists but has issues - warn but continue
        console.warn(
          `Warning: Could not load config from ${configPath}: ${error.message}`
        );
      }
    }
  }

  return {}; // Default empty config
}

/**
 * Validate user config structure
 */
function validateConfig(config: UserConfig): void {
  if (config.customAgents) {
    for (const agent of config.customAgents) {
      if (!agent.id || !agent.name || !agent.patterns || !agent.primaryFile) {
        throw new Error(
          "Custom agents must have id, name, patterns, and primaryFile"
        );
      }
    }
  }
}

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Calculate relative path from source to target for symlinks
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(path.dirname(from), to);
}
