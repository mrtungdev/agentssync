import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createSymlink, removeSymlink } from "../src/symlinker.js";

describe("Symlinker", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `agentssync-symlink-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("createSymlink", () => {
    it("should create a symlink to source file", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# Claude Instructions");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
      });

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();

      // Verify symlink was created
      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);

      // Verify symlink points to correct file
      const linkTarget = await fs.readlink(targetPath);
      expect(linkTarget).toBe("CLAUDE.md");

      // Verify content is accessible through symlink
      const content = await fs.readFile(targetPath, "utf-8");
      expect(content).toBe("# Claude Instructions");
    });

    it("should create parent directories if needed", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, ".github", "copilot-instructions.md");

      await fs.writeFile(sourcePath, "# Instructions");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
      });

      expect(result.success).toBe(true);

      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
    });

    it("should use relative paths in symlinks", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const nestedDir = path.join(testDir, "nested", "deep");
      const targetPath = path.join(nestedDir, "link.md");

      await fs.mkdir(nestedDir, { recursive: true });
      await fs.writeFile(sourcePath, "# Instructions");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
      });

      expect(result.success).toBe(true);

      const linkTarget = await fs.readlink(targetPath);
      expect(linkTarget).toBe("../../CLAUDE.md");
    });

    it("should return success when symlink already points to correct source", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# Instructions");
      await fs.symlink("CLAUDE.md", targetPath);

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
      });

      expect(result.success).toBe(true);
    });

    it("should fail when target exists and force is false", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# Source");
      await fs.writeFile(targetPath, "# Existing file");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
        force: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("already exists");
    });

    it("should overwrite when force is true", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# New Source");
      await fs.writeFile(targetPath, "# Old Content");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
        force: true,
      });

      expect(result.success).toBe(true);

      const stats = await fs.lstat(targetPath);
      expect(stats.isSymbolicLink()).toBe(true);
    });

    it("should not create symlink in dry-run mode", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# Instructions");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);

      // Verify file was NOT created
      await expect(fs.access(targetPath)).rejects.toThrow();
    });

    it("should fail when source does not exist", async () => {
      const sourcePath = path.join(testDir, "nonexistent.md");
      const targetPath = path.join(testDir, "AGENTS.md");

      const result = await createSymlink({
        source: sourcePath,
        target: targetPath,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("removeSymlink", () => {
    it("should remove an existing symlink", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");
      const linkPath = path.join(testDir, "AGENTS.md");

      await fs.writeFile(sourcePath, "# Instructions");
      await fs.symlink("CLAUDE.md", linkPath);

      await removeSymlink(linkPath);

      // Symlink should be removed
      await expect(fs.access(linkPath)).rejects.toThrow();
      // Source should still exist
      const sourceExists = await fs.access(sourcePath).then(() => true).catch(() => false);
      expect(sourceExists).toBe(true);
    });

    it("should throw when path is not a symlink", async () => {
      const filePath = path.join(testDir, "regular.md");
      await fs.writeFile(filePath, "# Regular file");

      await expect(removeSymlink(filePath)).rejects.toThrow();
    });
  });
});
