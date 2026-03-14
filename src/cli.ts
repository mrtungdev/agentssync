#!/usr/bin/env node

import { parseArgs } from "node:util";
import path from "node:path";
import * as p from "@clack/prompts";
import pc from "picocolors";

import { scanForInstructionFiles, analyzeConflicts } from "./scanner.js";
import { createSymlink } from "./symlinker.js";
import { loadUserConfig, getSymlinkCapability } from "./utils.js";
import { DEFAULT_AGENTS } from "./agents.js";
import {
  selectSourceFile,
  selectTargetAgents,
  confirmOperation,
  displayDiscoveredFiles,
  displayResults,
  displayConflictWarning,
  isCancel,
} from "./prompts.js";
import type { CliOptions, DiscoveredFile, SymlinkResult, AgentConfig } from "./types.js";

const VERSION = "1.0.0";

async function main(): Promise<void> {
  // Parse CLI arguments
  const { values, positionals } = parseArgs({
    options: {
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
      "dry-run": { type: "boolean", short: "d" },
      yes: { type: "boolean", short: "y" },
      verbose: { type: "boolean" },
      config: { type: "string", short: "c" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return;
  }

  if (values.version) {
    console.log(`agentssync v${VERSION}`);
    return;
  }

  const cwd = positionals[0] ? path.resolve(positionals[0]) : process.cwd();

  const options: CliOptions = {
    dryRun: values["dry-run"] ?? false,
    yes: values.yes ?? false,
    verbose: values.verbose ?? false,
    config: values.config,
    cwd,
    help: false,
    version: false,
  };

  // Introduction
  p.intro(pc.bgCyan(pc.black(" agentssync ")));

  // Check platform symlink capability
  const symlinkCapability = getSymlinkCapability();
  if (symlinkCapability === "limited") {
    p.log.warn(
      "Windows detected. Symlinks require admin or Developer Mode.\n" +
        "Will try hard links as fallback."
    );
  }

  // Load user configuration
  const userConfig = await loadUserConfig(options.config, cwd);
  const agents = [...DEFAULT_AGENTS, ...(userConfig.customAgents ?? [])].filter(
    (a) => !userConfig.excludeAgents?.includes(a.id)
  );

  // Step 1: Scan for existing files
  const spinner = p.spinner();
  spinner.start("Scanning for AI instruction files...");

  const discoveredFiles = await scanForInstructionFiles({
    cwd,
    agents,
    ignorePatterns: userConfig.ignorePatterns,
  });

  spinner.stop(`Found ${discoveredFiles.length} file(s)`);

  // Display found files
  displayDiscoveredFiles(discoveredFiles);

  if (discoveredFiles.length === 0) {
    p.outro("No files to sync.");
    return;
  }

  // Step 2: Analyze conflicts
  const analysis = await analyzeConflicts(discoveredFiles);

  // Step 3: Handle conflicts if any
  let primarySource: DiscoveredFile | null = analysis.suggestedSource;

  if (analysis.hasConflict && analysis.sourceFiles.length > 1) {
    displayConflictWarning(analysis.sourceFiles);

    if (options.yes) {
      primarySource = analysis.suggestedSource;
      if (primarySource) {
        p.log.info(`Auto-selecting: ${primarySource.agent.name}`);
      }
    } else {
      const selected = await selectSourceFile(analysis.sourceFiles);
      if (isCancel(selected)) {
        p.cancel("Operation cancelled.");
        process.exit(0);
      }
      primarySource = selected;
    }
  }

  if (!primarySource) {
    p.log.error("No source file available to create symlinks from.");
    p.outro("Exiting.");
    return;
  }

  p.log.success(`Using source: ${pc.bold(primarySource.relativePath)}`);

  // Step 4: Select target agents
  let targetAgents: AgentConfig[];

  if (options.yes) {
    // Auto-select all available agents that don't have files yet
    const existingAgentIds = new Set(discoveredFiles.map((f) => f.agent.id));
    targetAgents = agents.filter(
      (a) => a.id !== primarySource!.agent.id && !existingAgentIds.has(a.id)
    );

    if (targetAgents.length === 0) {
      p.log.warn("All agents already have files. Nothing to do.");
      p.outro("Done!");
      return;
    }

    p.log.info(`Auto-selecting ${targetAgents.length} target agent(s)`);
  } else {
    const selected = await selectTargetAgents(
      agents,
      discoveredFiles,
      primarySource.agent
    );

    if (isCancel(selected)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }

    targetAgents = selected;
  }

  if (targetAgents.length === 0) {
    p.log.warn("No targets selected. Nothing to do.");
    p.outro("Done!");
    return;
  }

  // Step 5: Show preview and confirm
  p.log.info("Symlinks to create:");
  for (const agent of targetAgents) {
    p.log.message(`  ${agent.primaryFile} ${pc.dim("->")} ${primarySource.relativePath}`);
  }

  if (!options.yes && !options.dryRun) {
    const confirmed = await confirmOperation("Proceed with creating symlinks?");
    if (isCancel(confirmed) || !confirmed) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
  }

  // Step 6: Create symlinks
  const createSpinner = p.spinner();
  createSpinner.start("Creating symlinks...");

  const results: SymlinkResult[] = [];

  for (const agent of targetAgents) {
    const targetPath = path.join(cwd, agent.primaryFile);

    const result = await createSymlink({
      source: primarySource.path,
      target: targetPath,
      dryRun: options.dryRun,
      force: true, // User confirmed
    });

    results.push(result);
  }

  const successCount = results.filter((r) => r.success).length;
  if (successCount === results.length) {
    createSpinner.stop("All symlinks created successfully!");
  } else {
    createSpinner.stop(`Created ${successCount}/${results.length} symlinks`);
  }

  // Step 7: Show results
  displayResults(results);

  if (options.dryRun) {
    p.log.warn("Dry run - no files were actually created");
  }

  p.outro("Done!");
}

function printHelp(): void {
  console.log(`
${pc.bold("agentssync")} - Sync AI agent instruction files via symlinks

${pc.bold("USAGE")}
  agentssync [directory] [options]

${pc.bold("OPTIONS")}
  -h, --help      Show this help message
  -v, --version   Show version number
  -d, --dry-run   Preview changes without creating symlinks
  -y, --yes       Auto-confirm all prompts
  --verbose       Show detailed output
  -c, --config    Path to config file (.agentssync.json)

${pc.bold("EXAMPLES")}
  agentssync                 Run in current directory
  agentssync ./my-project    Run in specified directory
  agentssync --dry-run       Preview what would be created
  agentssync -y              Non-interactive mode

${pc.bold("SUPPORTED AGENTS")}
  AGENTS.md, CLAUDE.md, AGENT.md, .cursorrules, .windsurfrules,
  .clinerules, GEMINI.md, .github/copilot-instructions.md, and more

${pc.bold("CONFIGURATION")}
  Create .agentssync.json in your project or home directory:
  {
    "customAgents": [...],
    "excludeAgents": ["copilot"],
    "defaultSource": "claude"
  }
`);
}

main().catch((err) => {
  p.log.error(err.message);
  process.exit(1);
});
