# Frequently Asked Questions

---

## General

### What is PromptGuard?
PromptGuard is a CLI tool that treats AI prompts like source code—snapshotting them, validating their structure, and blocking unintended changes before they reach production.

### Do I need an API key?
**No.** PromptGuard is 100% local and deterministic. It uses hashing, not LLMs, to detect drift.

### What languages does it support?
PromptGuard is **language-agnostic**. It manages `.md` prompt files. You call it from any build pipeline—Python, Node, Rust, Go, whatever.

### Where is my data stored?
Locally in `.promptguard/`. You commit this folder to Git. Everyone on your team shares the same baselines.

---

## Usage

### How do I get started?
```bash
bun install
bun tools/promptguard.ts init
bun tools/promptguard.ts check
```

### How do I snapshot a prompt?
```bash
bun tools/promptguard.ts snapshot prompts/my-agent.md -m "initial baseline"
```

### How do I see what changed?
```bash
bun tools/promptguard.ts diff prompts/my-agent.md
```

### How do I add PromptGuard to CI?
Add this to your GitHub Actions:
```yaml
- run: bun tools/promptguard.ts check --json
```

---

## Technical

### How does the hashing work?
PromptGuard uses **FNV-1a** (32-bit) for fast, deterministic hashing. It's not cryptographic—it's optimized for speed and collision detection in section-based diffing.

### Is it deterministic?
**Yes.** Same input always produces the same output. No randomness, no LLM calls, no network.

### What's a "required heading"?
A markdown heading (like `## Goal`) that must be present in your prompt. If it's missing, `check` fails.

### What's a "schema lock"?
A frozen JSON block inside your prompt. If the JSON structure changes, `check` fails. Useful for protecting output formats.

---

## Comparison

### How is this different from Git?
Git shows "file changed". PromptGuard shows "section X changed in file Y" with semantic diffing by heading.

### How is this different from LLM-based tools?
LLM tools require API keys, are non-deterministic, and cost money. PromptGuard is free, local, and deterministic.

### Why not just use `diff`?
`diff` shows line-by-line changes. PromptGuard shows **section-by-section** changes, which is more meaningful for prompts.

---

## Troubleshooting

### Check passes locally but fails in CI
Make sure `.promptguard/manifest.json` and all snapshot files are committed to Git.

### "No snapshot found"
Snapshot the file first:
```bash
bun tools/promptguard.ts snapshot <file> -m "baseline"
```

### "Missing required heading"
Add the heading to your prompt, or remove it from `promptguard.config.json`.

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more.
