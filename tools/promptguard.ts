#!/usr/bin/env bun

/*
  promptguard — deterministic prompt drift guard

  Run with:
    bun tools/promptguard.ts <command> [...args]
*/

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { checkPrompt, diffBySection, extractFirstJsonFence, normalizePrompt, stableHash } from "../src/lib/promptguard";

type Config = {
  snapshots?: "git" | "local";
  requiredHeadings?: string[];
  schemaLocks?: Record<string, { type: "json_fence" }>;
};

type Manifest = {
  version: 1;
  prompts: Record<
    string,
    {
      lastSnapshotPath?: string;
      lastSnapshotSha?: string;
      lastSnapshotAt?: string;
    }
  >;
};

const ROOT = process.cwd();
const STATE_DIR = path.join(ROOT, ".promptguard");
const HISTORY_DIR = path.join(STATE_DIR, "history");
const LOCKS_DIR = path.join(STATE_DIR, "locks");
const MANIFEST_PATH = path.join(STATE_DIR, "manifest.json");
const CONFIG_PATH = path.join(ROOT, "promptguard.config.json");

// Tiny ANSI color utility for premium CLI vibes without dependencies
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
};

// Box drawing utility for "Wow" factor output
function box(title: string, lines: string[], colorFn = (s: string) => s) {
  const width = Math.max(title.length + 2, ...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "").length)) + 4;
  const h = "─".repeat(width - 2);
  console.log(colorFn(`┌${h}┐`));
  console.log(colorFn(`│ ${c.bold}${title.padEnd(width - 4)}${c.reset}${colorFn(" │")}`));
  console.log(colorFn(`├${h}┤`));
  for (const line of lines) {
    const visibleLen = line.replace(/\x1b\[[0-9;]*m/g, "").length;
    console.log(colorFn(`│ `) + line + " ".repeat(width - 4 - visibleLen) + colorFn(" │"));
  }
  console.log(colorFn(`└${h}┘`));
}

function die(msg: string, code = 1): never {
  console.error(`${c.red}${c.bold}❌ ERROR:${c.reset} ${msg}`);
  process.exit(code);
}

function parseJsonFlag(args: string[]): { json: boolean; args: string[] } {
  const json = args.includes("--json");
  return { json, args: args.filter((a) => a !== "--json") };
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function listMarkdownFilesUnder(dirAbs: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dirAbs)) return out;

  const walk = (p: string) => {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const next = path.join(p, e.name);
      if (e.isDirectory()) {
        walk(next);
        continue;
      }
      if (e.isFile() && e.name.toLowerCase().endsWith(".md")) out.push(next);
    }
  };

  walk(dirAbs);
  return out;
}

function readJson<T>(p: string): T {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as T;
  } catch (e: any) {
    die(`Invalid JSON at ${p}: ${e?.message ?? String(e)}`, 2);
  }
}

function writeJson(p: string, v: unknown) {
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n", "utf8");
}

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    return { snapshots: "git", requiredHeadings: ["Goal", "Constraints", "Output", "Examples", "Failure modes"], schemaLocks: {} };
  }
  return readJson<Config>(CONFIG_PATH);
}

function loadManifest(): Manifest {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { version: 1, prompts: {} };
  }
  return readJson<Manifest>(MANIFEST_PATH);
}

function saveManifest(m: Manifest) {
  ensureDir(STATE_DIR);
  writeJson(MANIFEST_PATH, m);
}

function toSlug(filePath: string): string {
  return filePath.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function rel(p: string) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function resolveFile(p: string): string {
  const abs = path.isAbsolute(p) ? p : path.join(ROOT, p);
  if (!fs.existsSync(abs)) die(`File not found: ${p}`);
  return abs;
}

function readPromptFile(abs: string): string {
  return normalizePrompt(fs.readFileSync(abs, "utf8"));
}

function cmdInit() {
  ensureDir(HISTORY_DIR);
  ensureDir(LOCKS_DIR);

  // Auto-discover prompts for a smoother first run.
  // We intentionally only scan prompts/**/*.md to avoid surprising repos.
  const promptRoots = [path.join(ROOT, "prompts")];
  const discovered = promptRoots.flatMap(listMarkdownFilesUnder).map((abs) => rel(abs));
  const prompts: Manifest["prompts"] = {};
  for (const fileRel of discovered) prompts[fileRel] = {};

  saveManifest({ version: 1, prompts });

  if (!fs.existsSync(CONFIG_PATH)) {
    const template: Config = {
      snapshots: "git",
      requiredHeadings: ["Goal", "Constraints", "Output", "Examples", "Failure modes"],
      schemaLocks: {},
    };
    writeJson(CONFIG_PATH, template);
  }
  const discoveredMsg = discovered.length ? ` (+ discovered ${discovered.length} prompt(s))` : "";

  box("PromptGuard Initialized 🛡️", [
    `Created ${c.cyan}.promptguard/${c.reset}`,
    `Created ${c.cyan}promptguard.config.json${c.reset}`,
    discovered.length ? `${c.green}tracked ${c.bold}${discovered.length}${c.reset}${c.green} prompts${c.reset}` : `${c.yellow}No prompts found in prompts/${c.reset}`,
    "",
    `Run ${c.bold}bun tools/promptguard.ts doctor${c.reset} to verify setup.`
  ], (s) => `${c.blue}${s}${c.reset}`);
}

function cmdSnapshot(fileArg: string | undefined, message: string | undefined) {
  if (!fileArg) die(`Usage: snapshot <file> -m <message>`);
  if (!message) die("Missing -m message (why this snapshot exists)");

  const abs = resolveFile(fileArg);
  const fileRel = rel(abs);
  const content = readPromptFile(abs);
  const digest = stableHash(content);

  const m = loadManifest();
  const slug = toSlug(fileRel);
  const t = new Date().toISOString().replace(/[:.]/g, "-");
  const snapDir = path.join(HISTORY_DIR, slug);
  ensureDir(snapDir);

  const snapshotPath = path.join(snapDir, `${t}.md`);
  const header = [
    "---",
    `file: ${fileRel}`,
    `sha256: ${digest}`,
    `message: ${message.replace(/\n/g, " ")}`,
    `createdAt: ${new Date().toISOString()}`,
    "---",
    "",
  ].join("\n");
  fs.writeFileSync(snapshotPath, header + content, "utf8");

  m.prompts[fileRel] = {
    lastSnapshotPath: rel(snapshotPath),
    lastSnapshotSha: digest,
    lastSnapshotAt: new Date().toISOString(),
  };
  saveManifest(m);

  console.log(`${c.green}📸 Snapshotted ${c.bold}${fileRel}${c.reset} → ${c.dim}${rel(snapshotPath)}${c.reset}`);
}

function cmdDiff(fileArg: string | undefined, jsonMode = false) {
  if (!fileArg) die("Usage: diff <file> [--json]");

  const abs = resolveFile(fileArg);
  const fileRel = rel(abs);
  const m = loadManifest();
  const entry = m.prompts[fileRel];
  if (!entry?.lastSnapshotPath) die(`No snapshot found for ${fileRel}. Run: snapshot ${fileRel} -m "baseline"`);

  const snapAbs = path.join(ROOT, entry.lastSnapshotPath);
  if (!fs.existsSync(snapAbs)) die(`Snapshot missing on disk: ${entry.lastSnapshotPath}`);

  const current = readPromptFile(abs);
  const snapRaw = fs.readFileSync(snapAbs, "utf8");
  const snap = snapRaw.replace(/^---[\s\S]*?---\n\n/, "");

  const diffs = diffBySection(snap, current);
  const changed = diffs.filter((d) => d.changed);

  const outHuman = (...s: string[]) => {
    const stream = jsonMode ? process.stderr : process.stdout;
    stream.write(s.join(" ") + "\n");
  };

  const jsonOutput = {
    file: fileRel,
    snapshot: entry.lastSnapshotPath,
    snapshotSha: entry.lastSnapshotSha,
    hasChanges: changed.length > 0,
    sections: diffs.map((d) => ({
      title: d.title,
      changed: d.changed,
      oldHash: d.oldHash,
      newHash: d.newHash,
      oldPreview: d.oldPreview,
      newPreview: d.newPreview,
    })),
    summary: {
      totalSections: diffs.length,
      changedSections: changed.length,
    },
  };

  if (!changed.length) {
    if (!jsonMode) console.log(`${c.green}✅ No changes vs snapshot${c.reset} ${c.dim}(${entry.lastSnapshotPath})${c.reset}`);
    if (jsonMode) process.stdout.write(JSON.stringify(jsonOutput, null, 2) + "\n");
    return;
  }

  outHuman(`${c.yellow}⚠️  Section diff for ${c.bold}${fileRel}${c.reset} (vs ${entry.lastSnapshotPath}):\n`);
  for (const d of changed) {
    outHuman(`${c.bold}## ${d.title}${c.reset}`);
    outHuman(`${c.red}- old:${c.reset}`);
    outHuman(indent(d.oldPreview || "(empty)"));
    outHuman(`${c.green}+ new:${c.reset}`);
    outHuman(indent(d.newPreview || "(empty)"));
    outHuman("");
  }

  if (jsonMode) process.stdout.write(JSON.stringify(jsonOutput, null, 2) + "\n");
}

function indent(s: string) {
  return s
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

function cmdLock(fileArg: string | undefined) {
  if (!fileArg) die("Usage: lock <file>");

  const abs = resolveFile(fileArg);
  const fileRel = rel(abs);
  const content = readPromptFile(abs);
  const json = extractFirstJsonFence(content);
  if (!json) die("No fenced JSON block found (```json ... ```) to lock.");

  // Store canonical lock content.
  const slug = toSlug(fileRel);
  ensureDir(LOCKS_DIR);
  const lockPath = path.join(LOCKS_DIR, `${slug}.json`);
  fs.writeFileSync(lockPath, json.trim() + "\n", "utf8");

  // Ensure config includes lock rule.
  const cfg = loadConfig();
  cfg.schemaLocks = cfg.schemaLocks ?? {};
  cfg.schemaLocks[fileRel] = { type: "json_fence" };
  writeJson(CONFIG_PATH, cfg);

  console.log(`${c.cyan}🔒 Locked JSON contract for ${c.bold}${fileRel}${c.reset} → ${c.dim}${rel(lockPath)}${c.reset}`);
}

function cmdCheck(jsonMode = false) {
  const cfg = loadConfig();
  const m = loadManifest();

  const errors: string[] = [];
  const warnings: string[] = [];

  const files = Object.keys(m.prompts);
  if (!files.length) {
    warnings.push("No prompts tracked in .promptguard/manifest.json yet. Snapshot at least one prompt.");
  }

  for (const fileRel of files) {
    const abs = resolveFile(fileRel);
    const current = readPromptFile(abs);
    const check = checkPrompt(current, {
      requiredHeadings: cfg.requiredHeadings ?? [],
      requireJsonBlock: Boolean(cfg.schemaLocks?.[fileRel]?.type === "json_fence"),
    });
    if (!check.ok) {
      for (const e of check.errors) errors.push(`${c.bold}${fileRel}:${c.reset} ${e}`);
    } else {
      for (const w of check.warnings) warnings.push(`${c.bold}${fileRel}:${c.reset} ${w}`);
    }

    const lockRule = cfg.schemaLocks?.[fileRel];
    if (lockRule?.type === "json_fence") {
      const slug = toSlug(fileRel);
      const lockPath = path.join(LOCKS_DIR, `${slug}.json`);
      if (!fs.existsSync(lockPath)) {
        errors.push(`${c.bold}${fileRel}:${c.reset} schema lock configured but missing lock file. Run: lock ${fileRel}`);
      } else {
        const locked = fs.readFileSync(lockPath, "utf8").trim();
        const now = (extractFirstJsonFence(current) ?? "").trim();
        if (stableHash(locked) !== stableHash(now)) {
          errors.push(`${c.bold}${fileRel}:${c.reset} JSON contract drifted vs lock. Re-lock with: lock ${fileRel} (only if intentional)`);
        }
      }
    }
  }

  const outHuman = (...s: string[]) => {
    // When --json is used, human-readable output goes to stderr (CI-friendly).
    const stream = jsonMode ? process.stderr : process.stdout;
    stream.write(s.join(" ") + "\n");
  };

  const json = {
    ok: errors.length === 0,
    warnings: [...warnings],
    errors: errors.map((e) => {
      // Strip ANSI codes for JSON output
      const clean = e.replace(/\x1b\[[0-9;]*m/g, "");
      const idx = clean.indexOf(": ");
      if (idx === -1) return { file: "", message: clean };
      return { file: clean.slice(0, idx), message: clean.slice(idx + 2) };
    }),
    summary: {
      filesChecked: files.length,
      warnings: warnings.length,
      errors: errors.length,
    },
  };

  if (warnings.length) outHuman(warnings.map((w) => `${c.yellow}⚠️  WARN:${c.reset} ${w}`).join("\n") + "\n");
  if (errors.length) {
    // outHuman(errors.map((e) => `${c.red}❌ ERROR:${c.reset} ${e}`).join("\n"));
    // Use Box for Failure (Fail Loud & Beautiful)
    if (!jsonMode) {
      box("PromptGuard Check Failed ❌", errors, (s) => `${c.red}${s}${c.reset}`);
    } else {
      outHuman(errors.map((e) => `${c.red}❌ ERROR:${c.reset} ${e}`).join("\n"));
    }

    if (jsonMode) process.stdout.write(JSON.stringify(json, null, 2) + "\n");
    process.exit(1);
  }

  if (!jsonMode) {
    box("PromptGuard Check Passed ✅", [
      `${c.green}All ${files.length} prompt(s) validated.${c.reset}`,
      "No drift. No errors. 🛡️"
    ], (s) => `${c.green}${s}${c.reset}`);
  } else {
    outHuman(`${c.green}OK: promptguard check passed${c.reset}`);
  }

  if (jsonMode) process.stdout.write(JSON.stringify(json, null, 2) + "\n");
}

function cmdDoctor() {
  let exitCode = 0;

  const info: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  console.error(`${c.bold}🔍 Running promptguard doctor...${c.reset}\n`);

  // Check prompts directory exists
  const promptsDir = path.join(ROOT, "prompts");
  if (!fs.existsSync(promptsDir)) {
    warnings.push("No 'prompts/' directory found");
    warnings.push(`Suggestion: ${c.cyan}mkdir prompts${c.reset} && create your first prompt file`);
  } else {
    const promptFiles = listMarkdownFilesUnder(promptsDir);
    info.push(`Found ${c.bold}${promptFiles.length}${c.reset} prompt file(s) in prompts/`);
  }

  // Config validation
  if (!fs.existsSync(CONFIG_PATH)) {
    info.push("promptguard.config.json not found — defaults will apply");
    info.push(`Suggestion: ${c.cyan}bun tools/promptguard.ts init${c.reset}`);
  } else {
    try {
      const cfg = readJson<Config>(CONFIG_PATH);
      info.push("✓ promptguard.config.json is valid JSON");

      // Check config has reasonable settings
      if (!cfg.requiredHeadings?.length) {
        warnings.push("No required headings configured - prompts can drift easily");
        warnings.push("Suggestion: Add requiredHeadings in promptguard.config.json");
      } else {
        info.push(`✓ ${cfg.requiredHeadings.length} required headings configured`);
      }
    } catch {
      errors.push("Invalid JSON in promptguard.config.json");
      errors.push("Fix: Check JSON syntax or delete and run 'init' again");
    }
  }

  // Manifest validation
  if (!fs.existsSync(MANIFEST_PATH)) {
    errors.push("Missing .promptguard/manifest.json");
    errors.push(`Fix: ${c.cyan}bun tools/promptguard.ts init${c.reset}`);
    errors.push(`Then: ${c.cyan}bun tools/promptguard.ts snapshot <file> -m "baseline"${c.reset}`);
  } else {
    const m = loadManifest();
    const files = Object.keys(m.prompts);
    if (!files.length) {
      warnings.push("No prompts tracked yet in manifest");
      warnings.push(`Suggestion: ${c.cyan}bun tools/promptguard.ts snapshot <file> -m "baseline"${c.reset}`);
    } else {
      info.push(`✓ ${files.length} prompt(s) tracked in manifest`);
    }

    // Prompt file checks
    const cfg = loadConfig();
    for (const fileRel of files) {
      const abs = path.join(ROOT, fileRel);
      if (!fs.existsSync(abs)) {
        errors.push(`Missing prompt file: ${fileRel}`);
        errors.push("Fix: restore the file OR re-init to refresh manifest");
        continue;
      }

      try {
        fs.accessSync(abs, fs.constants.R_OK);
      } catch {
        errors.push(`Unreadable prompt file: ${fileRel}`);
        continue;
      }

      // Validate prompt content
      const content = readPromptFile(abs);
      const check = checkPrompt(content, {
        requiredHeadings: cfg.requiredHeadings ?? [],
        requireJsonBlock: Boolean(cfg.schemaLocks?.[fileRel]?.type === "json_fence"),
      });

      if (!check.ok) {
        for (const e of check.errors) {
          errors.push(`${fileRel}: ${e}`);
        }
      }

      // Check snapshot exists and is readable
      const entry = m.prompts[fileRel];
      if (entry?.lastSnapshotPath) {
        const snapAbs = path.join(ROOT, entry.lastSnapshotPath);
        if (!fs.existsSync(snapAbs)) {
          warnings.push(`Snapshot missing for ${fileRel}: ${entry.lastSnapshotPath}`);
          warnings.push(`Suggestion: ${c.cyan}bun tools/promptguard.ts snapshot ${fileRel} -m "recreate"${c.reset}`);
        } else {
          info.push(`✓ ${fileRel} has valid snapshot`);
        }
      }
    }
  }

  // Summary output
  console.error("");
  for (const l of info) console.error(`${c.blue}ℹ️  ${l}${c.reset}`);
  for (const l of warnings) console.error(`${c.yellow}⚠️  WARN: ${l}${c.reset}`);
  if (errors.length) {
    for (const l of errors) console.error(`${c.red}❌ ERROR: ${l}${c.reset}`);
    exitCode = 1;
  }

  console.error("");
  if (exitCode === 0) {
    box("Doctor Check Passed ✅", ["Your PromptGuard setup is healthy."], (s) => `${c.green}${s}${c.reset}`);
  } else {
    box("Doctor Check Failed ❌", ["Issues found. See errors above."], (s) => `${c.red}${s}${c.reset}`);
  }
  process.exit(exitCode);
}

function cmdHelp() {
  console.log(`
${c.bold}🛡️  promptguard${c.reset} ${c.dim}(local deterministic drift guard)${c.reset}

${c.bold}Usage:${c.reset}
  ${c.cyan}bun tools/promptguard.ts${c.reset} <command> [args]

${c.bold}Commands:${c.reset}
  ${c.green}init${c.reset}                        Initialize .promptguard/ and config
  ${c.green}snapshot${c.reset} <file> -m <msg>    Create a baseline snapshot
  ${c.green}diff${c.reset} <file>               Compare current prompt vs snapshot
  ${c.green}lock${c.reset} <file>               Lock JSON schema contract
  ${c.green}check${c.reset}                     Verify all prompts against rules
  ${c.green}doctor${c.reset}                    Diagnose setup issues
  `);
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd) return cmdHelp();

  if (cmd === "init") return cmdInit();
  if (cmd === "snapshot") {
    const file = rest[0];
    const mIndex = rest.findIndex((x: string) => x === "-m" || x === "--message");
    const msg = mIndex >= 0 ? rest.slice(mIndex + 1).join(" ") : undefined;
    return cmdSnapshot(file, msg);
  }
  if (cmd === "diff") {
    const { json, args } = parseJsonFlag(rest);
    return cmdDiff(args[0], json);
  }
  if (cmd === "lock") return cmdLock(rest[0]);
  if (cmd === "check") {
    const { json } = parseJsonFlag(rest);
    return cmdCheck(json);
  }
  if (cmd === "doctor") return cmdDoctor();
  return cmdHelp();
}

main();
