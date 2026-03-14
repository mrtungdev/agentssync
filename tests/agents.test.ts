import { describe, it, expect } from "vitest";
import { DEFAULT_AGENTS, DEFAULT_IGNORE_PATTERNS } from "../src/agents.js";

describe("Agents Registry", () => {
  describe("DEFAULT_AGENTS", () => {
    it("should have at least 10 agents defined", () => {
      expect(DEFAULT_AGENTS.length).toBeGreaterThanOrEqual(10);
    });

    it("should have unique agent IDs", () => {
      const ids = DEFAULT_AGENTS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required properties for each agent", () => {
      for (const agent of DEFAULT_AGENTS) {
        expect(agent.id).toBeDefined();
        expect(typeof agent.id).toBe("string");
        expect(agent.id.length).toBeGreaterThan(0);

        expect(agent.name).toBeDefined();
        expect(typeof agent.name).toBe("string");

        expect(agent.patterns).toBeDefined();
        expect(Array.isArray(agent.patterns)).toBe(true);
        expect(agent.patterns.length).toBeGreaterThan(0);

        expect(agent.primaryFile).toBeDefined();
        expect(typeof agent.primaryFile).toBe("string");

        expect(agent.priority).toBeDefined();
        expect(typeof agent.priority).toBe("number");
      }
    });

    it("should include major AI agents", () => {
      const agentIds = DEFAULT_AGENTS.map((a) => a.id);

      expect(agentIds).toContain("claude");
      expect(agentIds).toContain("cursor");
      expect(agentIds).toContain("copilot");
      expect(agentIds).toContain("windsurf");
      expect(agentIds).toContain("cline");
      expect(agentIds).toContain("agents");
      expect(agentIds).toContain("codex");
    });

    it("should have AGENTS.md (universal) with highest priority", () => {
      const agentsUniversal = DEFAULT_AGENTS.find((a) => a.id === "agents");
      expect(agentsUniversal).toBeDefined();
      expect(agentsUniversal!.priority).toBe(100);

      // Verify it has highest priority
      for (const agent of DEFAULT_AGENTS) {
        expect(agent.priority).toBeLessThanOrEqual(100);
      }
    });

    it("should have correct patterns for known agents", () => {
      const claude = DEFAULT_AGENTS.find((a) => a.id === "claude");
      expect(claude?.patterns).toContain("CLAUDE.md");

      const cursor = DEFAULT_AGENTS.find((a) => a.id === "cursor");
      expect(cursor?.patterns).toContain(".cursorrules");

      const copilot = DEFAULT_AGENTS.find((a) => a.id === "copilot");
      expect(copilot?.patterns).toContain(".github/copilot-instructions.md");
    });
  });

  describe("DEFAULT_IGNORE_PATTERNS", () => {
    it("should include common ignored directories", () => {
      expect(DEFAULT_IGNORE_PATTERNS).toContain("**/node_modules/**");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("**/.git/**");
      expect(DEFAULT_IGNORE_PATTERNS).toContain("**/dist/**");
    });

    it("should be an array of glob patterns", () => {
      expect(Array.isArray(DEFAULT_IGNORE_PATTERNS)).toBe(true);

      for (const pattern of DEFAULT_IGNORE_PATTERNS) {
        expect(typeof pattern).toBe("string");
        expect(pattern.length).toBeGreaterThan(0);
      }
    });
  });
});
