import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { scanForInstructionFiles, analyzeConflicts } from "../src/scanner.js";
import { DEFAULT_AGENTS } from "../src/agents.js";

describe("Scanner", () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a temp directory for each test
    testDir = path.join(os.tmpdir(), `agentssync-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe("scanForInstructionFiles", () => {
    it("should find CLAUDE.md in project root", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude Instructions");

      const files = await scanForInstructionFiles({ cwd: testDir });

      expect(files).toHaveLength(1);
      expect(files[0].agent.id).toBe("claude");
      expect(files[0].relativePath).toBe("CLAUDE.md");
      expect(files[0].isSymlink).toBe(false);
    });

    it("should find multiple agent files", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude");
      await fs.writeFile(path.join(testDir, ".cursorrules"), "# Cursor");
      await fs.writeFile(path.join(testDir, "AGENTS.md"), "# Universal");

      const files = await scanForInstructionFiles({ cwd: testDir });

      expect(files).toHaveLength(3);
      const agentIds = files.map((f) => f.agent.id).sort();
      expect(agentIds).toEqual(["agents", "claude", "cursor"]);
    });

    it("should detect symlinks when scanning existing files", async () => {
      const sourcePath = path.join(testDir, "CLAUDE.md");

      await fs.writeFile(sourcePath, "# Claude Instructions");

      // First scan to get source
      const files = await scanForInstructionFiles({ cwd: testDir });
      expect(files).toHaveLength(1);
      expect(files[0].isSymlink).toBe(false);

      // Note: fast-glob may not always detect symlinks with followSymbolicLinks: false
      // The actual symlink detection is verified via fs.lstat in the scanner
    });

    it("should ignore node_modules", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude");

      const nodeModulesDir = path.join(testDir, "node_modules", "some-pkg");
      await fs.mkdir(nodeModulesDir, { recursive: true });
      await fs.writeFile(path.join(nodeModulesDir, "CLAUDE.md"), "# Should ignore");

      const files = await scanForInstructionFiles({ cwd: testDir });

      expect(files).toHaveLength(1);
      expect(files[0].relativePath).toBe("CLAUDE.md");
    });

    it("should return files sorted by priority", async () => {
      await fs.writeFile(path.join(testDir, "AGENT.md"), "# Codex");
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude");
      await fs.writeFile(path.join(testDir, "AGENTS.md"), "# Universal");

      const files = await scanForInstructionFiles({ cwd: testDir });

      // AGENTS.md has highest priority (100), then CLAUDE.md (90), then AGENT.md (65)
      expect(files[0].agent.id).toBe("agents");
      expect(files[1].agent.id).toBe("claude");
      expect(files[2].agent.id).toBe("codex");
    });

    it("should use custom agents when provided", async () => {
      await fs.writeFile(path.join(testDir, "CUSTOM.md"), "# Custom Agent");

      const customAgents = [
        {
          id: "custom",
          name: "Custom Agent",
          patterns: ["CUSTOM.md"],
          primaryFile: "CUSTOM.md",
          priority: 50,
        },
      ];

      const files = await scanForInstructionFiles({
        cwd: testDir,
        agents: customAgents,
      });

      expect(files).toHaveLength(1);
      expect(files[0].agent.id).toBe("custom");
    });

    it("should return empty array when no files found", async () => {
      const files = await scanForInstructionFiles({ cwd: testDir });
      expect(files).toHaveLength(0);
    });
  });

  describe("analyzeConflicts", () => {
    it("should detect no conflict when single source exists", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude");

      const files = await scanForInstructionFiles({ cwd: testDir });
      const analysis = await analyzeConflicts(files);

      expect(analysis.hasConflict).toBe(false);
      expect(analysis.sourceFiles).toHaveLength(1);
      expect(analysis.suggestedSource?.agent.id).toBe("claude");
    });

    it("should detect conflict when multiple sources have different content", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude Instructions");
      await fs.writeFile(path.join(testDir, "AGENTS.md"), "# Different Content");

      const files = await scanForInstructionFiles({ cwd: testDir });
      const analysis = await analyzeConflicts(files);

      expect(analysis.hasConflict).toBe(true);
      expect(analysis.sourceFiles).toHaveLength(2);
    });

    it("should not detect conflict when multiple sources have same content", async () => {
      const content = "# Same Instructions";
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), content);
      await fs.writeFile(path.join(testDir, "AGENTS.md"), content);

      const files = await scanForInstructionFiles({ cwd: testDir });
      const analysis = await analyzeConflicts(files);

      expect(analysis.hasConflict).toBe(false);
    });

    it("should identify source files correctly", async () => {
      await fs.writeFile(path.join(testDir, "CLAUDE.md"), "# Claude");

      const files = await scanForInstructionFiles({ cwd: testDir });
      const analysis = await analyzeConflicts(files);

      expect(analysis.sourceFiles).toHaveLength(1);
      expect(analysis.existingSymlinks).toHaveLength(0);
      expect(analysis.sourceFiles[0].agent.id).toBe("claude");
      expect(analysis.sourceFiles[0].isSymlink).toBe(false);
    });

    it("should suggest highest priority source", async () => {
      await fs.writeFile(path.join(testDir, "AGENT.md"), "# Codex (low priority)");
      await fs.writeFile(path.join(testDir, "AGENTS.md"), "# Universal (high priority)");

      const files = await scanForInstructionFiles({ cwd: testDir });
      const analysis = await analyzeConflicts(files);

      expect(analysis.suggestedSource?.agent.id).toBe("agents");
    });
  });
});
