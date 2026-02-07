# PromptGuard 🛡️

![PromptGuard Social Preview](public/banner.png)

> **PromptGuard is a lightweight CLI that treats prompts like code—snapshotting, validating, and blocking unsafe or unintended changes before they reach production.**

[![CI Status](https://github.com/vibe-flow-fixer/promptguard/actions/workflows/promptguard.yml/badge.svg)](https://github.com/vibe-flow-fixer/promptguard/actions)
[![Vibeathon 2026](https://img.shields.io/badge/Vibeathon-Feb%202026-purple?style=for-the-badge)](https://www.bridgemind.ai/vibeathon)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)](https://github.com/vibe-flow-fixer/promptguard)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black?style=for-the-badge)](https://bun.sh/)

## Who is this for?

- Prompt maintainers managing production prompts
- Agent builders using multi-step workflows
- Teams tired of "it worked yesterday" failures

If prompts matter in your system, PromptGuard belongs in your repo.

## Why PromptGuard?

Without PromptGuard:
- Prompt changes are invisible
- No review, no guardrails
- Failures appear late

With PromptGuard:
- Prompt changes are explicit
- Structured, testable, reversible
- Fail fast, fail loud

---

## Key Features

- **Deterministic CLI** (`bun tools/promptguard.ts`)
- Commands: `init | snapshot | diff | lock | check | doctor`
- **Git-committed snapshots by default** (configurable)
- **Section-based required headings** for structured prompts
- **Optional JSON output contract locking**
- **Fail-loud** exit codes with actionable messages
- Human-readable **semantic diffs** by section
- Interactive **in-browser demo** showing live diffs + checks
- `doctor` command to validate setup/config
- Machine-readable JSON output for CI and tooling (`diff --json`, `check --json`)

---

## Installation

```bash
bun install
```

---

## Quickstart

Initialize promptguard for your prompts:

```bash
bun tools/promptguard.ts init
```

Make changes to your prompts (`prompts/*.md`)

Check for drift and missing sections:

```bash
bun tools/promptguard.ts check
```

See section-aware diffs:

```bash
bun tools/promptguard.ts diff prompts/example.prompt.md
```

Snapshot the current state:

```bash
bun tools/promptguard.ts snapshot prompts/example.prompt.md -m "Baseline"
```

*Output: 📸 Snapshotted prompts/example.prompt.md*

---

## 🔍 Forensic-Grade Architecture
PromptGuard isn't just a tool; it's an engineering standard. We've documented our entire architecture and failure analysis:

| Document | Description |
|----------|-------------|
| 🏰 **[Architectural Analysis](docs/ARCHITECTURAL_ANALYSIS.md)** | Why we chose Git-native, local-first, and fail-loud design. |
| 🧪 **[Edge Case Analysis](docs/EDGE_CASE_ANALYSIS.md)** | How we handle binary files, clock skew, and git corruption. |
| 🛡️ **[Security Model](docs/ARCHITECTURE.md)** | Deep dive into our security guarantees. |

---

## 📚 Documentation

We believe in complete documentation.

- **[CLI Reference](docs/CLI_REFERENCE.md)**: Full command list (`init`, `snapshot`, `diff`, `lock`, `doctor`).
- **[Configuration](docs/CONFIGURATION.md)**: How to set up `requiredHeadings` and `schemaLocks`.
- **[CI/CD Setup](docs/CI_SETUP.md)**: Add PromptGuard to GitHub Actions.
- **[Architecture](docs/ARCHITECTURE.md)**: How the manifest and hashing work internally.

---

## ⚡ Feature Deep Dive

### 🔒 Schema Locking
Prevent your JSON output format from breaking.
```bash
bun tools/promptguard.ts lock prompts/extractor.md
```
This freezes the `json` code block in your prompt. If you change the prompt text but keep the JSON valid, it passes. If you break the JSON structure, it fails loud.

### 🔍 Semantic Diffing
Don't just see "file changed". See *what* changed.
```bash
bun tools/promptguard.ts diff prompts/my-agent.md
```
```diff
## Output
- old: respond in JSON
+ new: respond in YAML
```

### 🤖 Automation / CI Output
Need to pipe results to a dashboard? Use `--json`.
```bash
bun tools/promptguard.ts diff prompts/example.md --json
```

### 🏥 Doctor Mode
Broken setup? `doctor` fixes it.
```bash
bun tools/promptguard.ts doctor
```
Checks config validity, missing files, and orphaned snapshots.

---

## ❓ FAQ

**Q: Do I need an OpenAI API key?**
A: **No.** PromptGuard is 100% local and deterministic. It uses hashing, not LLMs, to detect drift.

**Q: Can I use this with Python/LangChain?**
A: **Yes.** PromptGuard is language-agnostic. It manages `.md` or `.txt` prompt files. You just call the CLI from your build pipeline.

**Q: Where is the data stored?**
A: Locally in `.promptguard/`. You commit this folder to Git. Everyone on your team shares the same baselines.

---

## Why I Built This

I was tired of losing hours debugging why an agent "suddenly stopped working," only to find my prompt had drifted weeks ago.

I built **PromptGuard** to solve the "Silent Failure" problem.

It treats prompts like code:
- **Defined Inputs/Outputs** (JSON schemas)
- **Version Control** (Snapshots)
- **Determinism** (Fail loud if changed)

If you've ever had a prompt break in production because someone changed a word, this tool is for you.

---

<p align="center">
  Built for the Vibeathon to solve a real, painful problem in agentic development.<br>
  <i>"Don't guess. Guard."</i>
</p>

---

## 🎬 Demo Video

Watch a 3-5 minute demo showing PromptGuard in action:

1. Initialize and snapshot prompts
2. Detect drift with section-aware diffs
3. Fail loud in CI
4. Interactive browser demo

> See [DEMO_SCRIPT.md](DEMO_SCRIPT.md) for the full recording guide.

---

## 📜 Changelog

### 1.0.0 - 2026-02-07
- Initial release of PromptGuard for Vibeathon 2026
- Deterministic CLI with `init`, `snapshot`, `diff`, `lock`, `check`, `doctor` commands
- Section-aware semantic diffing using FNV-1a hashing
- JSON schema locking for output format protection
- Interactive browser demo with live diffs
- Beautiful ANSI-styled CLI output
- Machine-readable JSON output for CI (`--json` flag)
- Comprehensive test suite (30 tests)

---

## License

MIT
