<p align="center">
  <img src="public/banner.png" alt="PromptGuard" width="100%">
</p>

<h1 align="center">🛡️ PromptGuard</h1>

<p align="center">
  <strong>Deterministic prompt drift detection for AI systems.</strong><br>
  Snapshot. Diff. Validate. <strong>Block drift before it ships.</strong>
</p>

<p align="center">
  <a href="https://github.com/mediamarktatti-maker/promptguard/actions"><img src="https://github.com/mediamarktatti-maker/promptguard/actions/workflows/promptguard.yml/badge.svg" alt="CI Status"></a>
  <a href="https://www.bridgemind.ai/vibeathon"><img src="https://img.shields.io/badge/Vibeathon-Feb%202026-purple?style=flat-square" alt="Vibeathon 2026"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://bun.sh/"><img src="https://img.shields.io/badge/Bun-1.0+-black?style=flat-square" alt="Bun"></a>
  <img src="https://img.shields.io/badge/Tests-30%2F30%20Passing-brightgreen?style=flat-square" alt="Tests">
  <img src="https://img.shields.io/badge/Zero%20APIs-100%25%20Local-blue?style=flat-square" alt="Local-first">
</p>

<br>

<p align="center">
  <em>"Someone changed one word in a prompt. The agent broke in production. It took 6 hours to find."</em><br>
  <strong>PromptGuard makes sure that never happens again.</strong>
</p>

---

## ⚡ 30-Second Demo

```bash
# Initialize PromptGuard
bun tools/promptguard.ts init

# Snapshot a prompt baseline
bun tools/promptguard.ts snapshot prompts/agent.md -m "v1 baseline"

# ... someone edits the prompt ...

# Catch the drift
bun tools/promptguard.ts check
# ❌ FAIL — Section "Constraints" changed (exit code 1)

# See exactly what changed
bun tools/promptguard.ts diff prompts/agent.md
# ## Constraints
# - old: must respond in JSON
# + new: should respond in JSON
```

**5 minutes to setup. Zero API keys. Zero cloud. Just files and hashes.**

---

## 🧠 The Problem

Every team building with LLMs has experienced this:

| Symptom | Root Cause |
|---------|------------|
| 🔥 Agent worked yesterday, fails today | Prompt changed silently |
| 🔍 Debugging takes hours | Changes are invisible in Git diffs |
| 💥 Breaking changes sneak into production | No CI gate for prompt files |
| 🤷 "Who changed this?" | No snapshot history |

**Prompts are the most fragile part of any AI system — yet they have zero infrastructure.** No tests. No versioning. No CI. No review process.

---

## ✅ The Solution

PromptGuard treats prompts like source code:

```
┌──────────────────────────────────────────────────────┐
│                 PROMPTGUARD PIPELINE                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│   prompt.md  →  normalize  →  parse sections         │
│                                      ↓               │
│                               hash (FNV-1a)          │
│                                      ↓               │
│                          compare vs snapshot          │
│                                      ↓               │
│                    ✅ PASS (exit 0)  or               │
│                    ❌ FAIL (exit 1) + section diff    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Key properties:**
- 🔒 **Deterministic** — Same input → same output, always
- 🏠 **Local-first** — Nothing leaves your machine
- ⚡ **Fast** — No network, no LLMs, just hashing
- 🌿 **Git-native** — Snapshots commit alongside your code

---

## 🆚 How PromptGuard Compares

| | PromptGuard | Manual `git diff` | LLM-based tools | Nothing |
|---|:-:|:-:|:-:|:-:|
| **Detects prompt drift** | ✅ Section-aware | ⚠️ Line-level only | ✅ Semantic | ❌ |
| **Deterministic** | ✅ FNV-1a hash | ✅ | ❌ Non-deterministic | — |
| **Works offline** | ✅ 100% local | ✅ | ❌ Needs API | — |
| **CI integration** | ✅ Exit codes + JSON | ⚠️ Manual | ⚠️ Complex | ❌ |
| **Zero cost** | ✅ Free forever | ✅ | ❌ API costs | ✅ |
| **5-minute setup** | ✅ | ✅ | ❌ Keys + config | — |
| **Structure enforcement** | ✅ Required headings | ❌ | ⚠️ Fragile | ❌ |
| **Schema locking** | ✅ JSON freeze | ❌ | ❌ | ❌ |

---

## 🎯 Who Is This For?

- **Solo Developers** — Stop debugging drift. Sleep better.
- **Teams** — Enforce prompt review. Block accidental changes in CI.
- **Agent Builders** — Protect multi-step workflows from cascading failures.
- **Prompt Engineers** — Version control your prompts like source code.

If prompts matter in your system, **PromptGuard belongs in your repo**.

---

## ⚡ Core Features

| Feature | Command | What It Does |
|---------|---------|--------------|
| **📸 Snapshot** | `snapshot <file>` | Create a versioned baseline of any prompt |
| **🔍 Diff** | `diff <file>` | Section-aware semantic diffing (not just line diff) |
| **✅ Check** | `check` | Validate all prompts — fail loud on drift |
| **🔒 Lock** | `lock <file>` | Freeze JSON output schema to prevent breaking changes |
| **🩺 Doctor** | `doctor` | Diagnose setup issues with actionable fix commands |
| **📊 Status** | `status` | Overview of tracked prompts and config health |

All commands support `--json` for CI/automation. Every failure returns **exit code 1**.

---

## 🚀 Quickstart

### Install & Initialize

```bash
# Install dependencies
bun install

# Initialize PromptGuard (creates config + discovers prompts)
bun tools/promptguard.ts init
```

### Guard Your Prompts

```bash
# Snapshot a prompt as your baseline
bun tools/promptguard.ts snapshot prompts/my-agent.md -m "Initial baseline"

# Check all prompts for drift
bun tools/promptguard.ts check

# See what changed in a specific prompt
bun tools/promptguard.ts diff prompts/my-agent.md
```

### Add to CI (GitHub Actions)

```yaml
name: PromptGuard Check
on: [push, pull_request]
jobs:
  promptguard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun tools/promptguard.ts check --json
```

**When prompts drift, CI fails. No silent breakage. Ever.**

---

## 📖 Real-World Workflow

<table>
<tr>
<th>❌ Before PromptGuard</th>
<th>✅ After PromptGuard</th>
</tr>
<tr>
<td>

1. Edit prompt
2. Deploy
3. Agent breaks in production
4. Debug for **3 hours**
5. Discover "must" → "should"
6. 😤

</td>
<td>

1. Edit prompt
2. Push to GitHub
3. CI runs `promptguard check`
4. CI fails: "Section 'Constraints' changed"
5. Review diff, approve or fix
6. Ship with confidence ✅

</td>
</tr>
</table>

---

## ⚙️ Configuration

`promptguard.config.json`:
```json
{
  "snapshots": "git",
  "requiredHeadings": ["Goal", "Constraints", "Output", "Examples", "Failure modes"],
  "schemaLocks": {
    "prompts/extractor.md": { "type": "json_fence" }
  }
}
```

| Option | Description |
|--------|-------------|
| `snapshots` | `"git"` (committed) or `"local"` (.promptguard only) |
| `requiredHeadings` | Array of section headings every prompt must have |
| `schemaLocks` | Lock JSON output schemas to prevent breaking changes |

---

## 📊 What Gets Checked

| Check | Example | On Failure |
|-------|---------|------------|
| **Required Headings** | Must have `## Goal`, `## Constraints` | ❌ FAIL + missing heading name |
| **Section Drift** | Content changed vs baseline | ❌ FAIL + exact diff shown |
| **JSON Schema Lock** | Locked output format must match | ❌ FAIL + schema mismatch |
| **File Integrity** | Tracked files must exist on disk | ❌ FAIL + file path shown |

---

## 🧪 Testing

```bash
bun test          # Run all 30 tests
bun test --watch  # Watch mode
```

| Test Suite | Tests | Status |
|------------|-------|--------|
| `stableHash` | 4 | ✅ |
| `normalizePrompt` | 5 | ✅ |
| `parseSections` | 4 | ✅ |
| `extractFirstJsonFence` | 4 | ✅ |
| `checkPrompt` | 6 | ✅ |
| `diffBySection` | 6 | ✅ |
| **Total** | **30** | **All passing** |

---

## 📂 Project Structure

```
promptguard/
├── tools/
│   └── promptguard.ts          # CLI entry point (642 lines)
├── src/
│   ├── lib/
│   │   └── promptguard.ts      # Core logic: hash, normalize, diff, check
│   ├── components/
│   │   └── PromptguardDemo.tsx  # Interactive browser demo
│   └── test/
│       └── promptguard.test.ts  # 30 unit tests
├── prompts/                     # Your prompt files (.md)
├── .promptguard/                # State, history, locks
├── docs/                        # Full documentation (9 docs)
├── .github/workflows/           # CI configuration
└── promptguard.config.json      # Project configuration
```

---

## 📚 Documentation

| Doc | Description |
|-----|-------------|
| [CLI Reference](docs/CLI_REFERENCE.md) | Complete command documentation |
| [Configuration](docs/CONFIGURATION.md) | All config options explained |
| [CI Setup](docs/CI_SETUP.md) | GitHub Actions, GitLab CI, and more |
| [Architecture](docs/ARCHITECTURE.md) | How it works internally |
| [Edge Cases](docs/EDGE_CASE_ANALYSIS.md) | Binary files, clock skew, git corruption |
| [FAQ](docs/FAQ.md) | Frequently asked questions |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [Why Judges Care](docs/WHY_JUDGES_CARE.md) | Competition positioning |

---

## 🗺️ Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| **v1.0** | Core CLI — init, snapshot, diff, check, lock, doctor | ✅ Shipped |
| **v1.0** | Interactive browser demo | ✅ Shipped |
| **v1.0** | 30-test suite + CI pipeline | ✅ Shipped |
| **v1.1** | VS Code extension for inline drift warnings | 🔮 Planned |
| **v1.2** | `promptguard watch` — real-time file monitoring | 🔮 Planned |
| **v1.3** | Prompt rollback from snapshot history | 🔮 Planned |
| **v2.0** | Team collaboration — shared baselines | 🔮 Planned |

---

## 🧩 What PromptGuard Is NOT

| ❌ | Why |
|----|-----|
| Not an LLM wrapper | No AI calls. Pure deterministic hashing. |
| Not a cloud service | 100% local. Nothing leaves your machine. |
| Not expensive | Free. Open source. MIT licensed. |
| Not complex | `bun install` → `init` → done. |

---

## 🏆 Why This Project Wins

> **PromptGuard is not a prototype. It's a production-ready tool that solves a real problem, works today, and requires nothing but Git.**

| Criteria | PromptGuard | Typical Submission |
|----------|:-:|:-:|
| Solves real problem | ✅ Universal pain | Often niche |
| Usable today | ✅ 5-minute setup | Often prototype |
| Production-ready | ✅ 30 tests + CI | Often demo-only |
| Zero dependencies | ✅ No API keys | Often requires accounts |
| Original approach | ✅ Section-aware diffing | Often derivative |
| Comprehensive docs | ✅ 9 documentation files | Often README-only |

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/mediamarktatti-maker/promptguard
cd promptguard
bun install
bun test
```

---

## 📄 License

**MIT** — Use it, fork it, ship it.

---

<p align="center">
  <strong>Built for the <a href="https://www.bridgemind.ai/vibeathon">Vibeathon 2026</a></strong><br>
  <em>to solve a real problem in agentic AI development.</em>
  <br><br>
  🛡️ <strong>"Don't guess. Guard."</strong> 🛡️
</p>
