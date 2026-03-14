import * as p from "@clack/prompts";
import pc from "picocolors";
import type { DiscoveredFile, AgentConfig, SymlinkResult } from "./types.js";
import { formatSize } from "./utils.js";

/**
 * Select primary source file when multiple exist
 */
export async function selectSourceFile(
  files: DiscoveredFile[]
): Promise<DiscoveredFile | symbol> {
  return p.select({
    message: "Multiple source files detected. Select primary source:",
    options: files.map((file) => ({
      label: `${file.agent.name} (${file.relativePath})`,
      value: file,
      hint: `priority: ${file.agent.priority}, size: ${formatSize(file.size)}`,
    })),
  });
}

/**
 * Select target agents to create symlinks for
 */
export async function selectTargetAgents(
  availableAgents: AgentConfig[],
  existingFiles: DiscoveredFile[],
  sourceAgent: AgentConfig
): Promise<AgentConfig[] | symbol> {
  const existingAgentIds = new Set(existingFiles.map((f) => f.agent.id));

  const options = availableAgents
    .filter((agent) => agent.id !== sourceAgent.id)
    .map((agent) => {
      const exists = existingAgentIds.has(agent.id);
      const existingFile = existingFiles.find((f) => f.agent.id === agent.id);

      return {
        label: agent.name,
        value: agent,
        hint: exists
          ? existingFile?.isSymlink
            ? pc.cyan("symlink exists")
            : pc.yellow("file exists")
          : agent.primaryFile,
      };
    });

  return p.multiselect({
    message: "Select target agents to create symlinks:",
    options,
    required: false,
  });
}

/**
 * Confirm operation
 */
export async function confirmOperation(
  message: string
): Promise<boolean | symbol> {
  return p.confirm({
    message,
  });
}

/**
 * Display discovered files
 */
export function displayDiscoveredFiles(files: DiscoveredFile[]): void {
  if (files.length === 0) {
    p.log.warn("No AI instruction files found in this directory.");
    p.log.info(
      pc.dim("Tip: Create a CLAUDE.md or AGENTS.md file first, then run agentssync again.")
    );
    return;
  }

  p.log.info(`Found ${pc.bold(files.length.toString())} AI instruction file(s):`);

  for (const file of files) {
    const status = file.isSymlink
      ? pc.cyan("(symlink)")
      : pc.green("(source)");

    p.log.message(`  ${pc.bold(file.agent.name)}: ${file.relativePath} ${status}`);

    if (file.isSymlink && file.symlinkTarget) {
      p.log.message(pc.dim(`    -> ${file.symlinkTarget}`));
    }
  }
}

/**
 * Display symlink operation results
 */
export function displayResults(results: SymlinkResult[]): void {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length > 0) {
    p.log.success(`Created ${successful.length} symlink(s):`);
    for (const result of successful) {
      const mode = result.dryRun ? pc.yellow("[dry-run] ") : "";
      const targetRel = result.target.split("/").pop() || result.target;
      const sourceRel = result.source.split("/").pop() || result.source;
      p.log.message(`  ${mode}${targetRel} ${pc.dim("->")} ${sourceRel}`);
    }
  }

  if (failed.length > 0) {
    p.log.error(`Failed to create ${failed.length} symlink(s):`);
    for (const result of failed) {
      const targetRel = result.target.split("/").pop() || result.target;
      p.log.message(`  ${pc.red("x")} ${targetRel}`);
      p.log.message(pc.dim(`    Error: ${result.error}`));
    }
  }
}

/**
 * Display conflict warning
 */
export function displayConflictWarning(files: DiscoveredFile[]): void {
  p.log.warn("Multiple source files contain different content:");
  for (const f of files) {
    p.log.message(`  - ${f.agent.name}: ${f.relativePath}`);
  }
}

/**
 * Check if user cancelled
 */
export function isCancel(value: unknown): value is symbol {
  return p.isCancel(value);
}
