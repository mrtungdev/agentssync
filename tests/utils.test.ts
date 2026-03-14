import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  isWindows,
  getSymlinkCapability,
  loadUserConfig,
  formatSize,
  getRelativePath,
} from "../src/utils.js";

describe("Utils", () => {
  describe("isWindows", () => {
    it("should return boolean", () => {
      const result = isWindows();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("getSymlinkCapability", () => {
    it("should return 'full' or 'limited'", () => {
      const result = getSymlinkCapability();
      expect(["full", "limited"]).toContain(result);
    });

    it("should return 'full' on non-Windows platforms", () => {
      if (os.platform() !== "win32") {
        expect(getSymlinkCapability()).toBe("full");
      }
    });
  });

  describe("formatSize", () => {
    it("should format bytes", () => {
      expect(formatSize(500)).toBe("500B");
    });

    it("should format kilobytes", () => {
      expect(formatSize(1024)).toBe("1.0KB");
      expect(formatSize(2560)).toBe("2.5KB");
    });

    it("should format megabytes", () => {
      expect(formatSize(1024 * 1024)).toBe("1.0MB");
      expect(formatSize(1024 * 1024 * 2.5)).toBe("2.5MB");
    });
  });

  describe("getRelativePath", () => {
    it("should return relative path in same directory", () => {
      const from = "/project/AGENTS.md";
      const to = "/project/CLAUDE.md";
      expect(getRelativePath(from, to)).toBe("CLAUDE.md");
    });

    it("should return relative path with parent traversal", () => {
      const from = "/project/.github/copilot-instructions.md";
      const to = "/project/CLAUDE.md";
      expect(getRelativePath(from, to)).toBe("../CLAUDE.md");
    });

    it("should return relative path for deeply nested", () => {
      const from = "/project/a/b/c/file.md";
      const to = "/project/source.md";
      expect(getRelativePath(from, to)).toBe("../../../source.md");
    });
  });

  describe("loadUserConfig", () => {
    let testDir: string;

    beforeEach(async () => {
      testDir = path.join(os.tmpdir(), `agentssync-config-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(testDir, { recursive: true, force: true });
    });

    it("should return empty config when no config file exists", async () => {
      const config = await loadUserConfig(undefined, testDir);
      expect(config).toEqual({});
    });

    it("should load config from explicit path", async () => {
      const configPath = path.join(testDir, "custom-config.json");
      const configData = {
        excludeAgents: ["copilot"],
        defaultSource: "claude",
      };

      await fs.writeFile(configPath, JSON.stringify(configData));

      const config = await loadUserConfig(configPath, testDir);
      expect(config.excludeAgents).toEqual(["copilot"]);
      expect(config.defaultSource).toBe("claude");
    });

    it("should load config from project directory", async () => {
      const configPath = path.join(testDir, ".agentssync.json");
      const configData = {
        ignorePatterns: ["**/temp/**"],
      };

      await fs.writeFile(configPath, JSON.stringify(configData));

      const config = await loadUserConfig(undefined, testDir);
      expect(config.ignorePatterns).toEqual(["**/temp/**"]);
    });

    it("should validate custom agents", async () => {
      const configPath = path.join(testDir, ".agentssync.json");
      const configData = {
        customAgents: [
          {
            id: "custom",
            name: "Custom Agent",
            patterns: ["CUSTOM.md"],
            primaryFile: "CUSTOM.md",
            priority: 50,
          },
        ],
      };

      await fs.writeFile(configPath, JSON.stringify(configData));

      const config = await loadUserConfig(undefined, testDir);
      expect(config.customAgents).toHaveLength(1);
      expect(config.customAgents![0].id).toBe("custom");
    });

    it("should handle invalid JSON gracefully", async () => {
      const configPath = path.join(testDir, ".agentssync.json");
      await fs.writeFile(configPath, "invalid json {{{");

      // Should not throw, but return empty config
      const config = await loadUserConfig(undefined, testDir);
      expect(config).toEqual({});
    });
  });
});
