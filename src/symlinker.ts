import fs from "node:fs/promises";
import path from "node:path";
import type { SymlinkResult } from "./types.js";
import { isWindows } from "./utils.js";

export interface SymlinkOptions {
  /** Source file (actual content) */
  source: string;
  /** Target path (where symlink will be created) */
  target: string;
  /** Dry run mode */
  dryRun?: boolean;
  /** Force overwrite existing files/symlinks */
  force?: boolean;
}

/**
 * Create a symlink from target to source
 */
export async function createSymlink(
  options: SymlinkOptions
): Promise<SymlinkResult> {
  const { source, target, dryRun = false, force = false } = options;

  const result: SymlinkResult = {
    source,
    target,
    success: false,
    dryRun,
  };

  try {
    // Validate source exists
    await fs.access(source, fs.constants.R_OK);

    // Check if target already exists
    try {
      const targetStats = await fs.lstat(target);

      if (targetStats.isSymbolicLink()) {
        const existingTarget = await fs.readlink(target);
        const resolvedExisting = path.resolve(
          path.dirname(target),
          existingTarget
        );

        if (resolvedExisting === path.resolve(source)) {
          // Already pointing to correct source
          result.success = true;
          return result;
        }
      }

      if (!force) {
        result.error = `Target already exists: ${target}`;
        return result;
      }

      // Remove existing file/symlink
      if (!dryRun) {
        await fs.unlink(target);
      }
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code !== "ENOENT") throw error;
      // Target doesn't exist - good
    }

    if (dryRun) {
      result.success = true;
      return result;
    }

    // Ensure target directory exists
    await fs.mkdir(path.dirname(target), { recursive: true });

    // Calculate relative symlink path
    const symlinkPath = path.relative(path.dirname(target), source);

    // Create symlink with platform-specific handling
    await createPlatformSymlink(symlinkPath, target, source);

    result.success = true;
  } catch (err: unknown) {
    const error = err as Error;
    result.error = error.message;
  }

  return result;
}

/**
 * Create symlink with platform-specific handling
 */
async function createPlatformSymlink(
  relativePath: string,
  linkPath: string,
  absoluteSource: string
): Promise<void> {
  if (isWindows()) {
    try {
      // Try symlink first
      await fs.symlink(relativePath, linkPath, "file");
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === "EPERM") {
        // No symlink permissions - try hard link as fallback
        await fs.link(absoluteSource, linkPath);
      } else {
        throw error;
      }
    }
  } else {
    // Unix-like systems: straightforward symlink
    await fs.symlink(relativePath, linkPath);
  }
}

/**
 * Remove a symlink
 */
export async function removeSymlink(linkPath: string): Promise<void> {
  const stats = await fs.lstat(linkPath);
  if (!stats.isSymbolicLink()) {
    throw new Error(`Path is not a symlink: ${linkPath}`);
  }
  await fs.unlink(linkPath);
}
