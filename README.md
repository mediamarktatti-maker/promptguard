# PromptGuard

**Treat prompts like code. Snapshot. Validate. Block drift.**

PromptGuard is a deterministic CLI that prevents silent prompt failures by detecting changes before they break production.

- **Fail loud** — CI fails when prompts drift
- **Section-aware diffs** — See *what* changed, not just *that* it changed
- **100% local** — No API keys, no cloud, no vendor lock-in
- **Git-native** — Snapshots commit alongside your code

**For**: Teams managing production prompts, agent builders, anyone tired of debugging "it worked yesterday."

---

## The Problem

Prompts are code. But unlike code, prompts have:
- No version control
- No tests
- No CI gating

The result? **Silent failures.**

Your prompt drifts. Your agent breaks. You spend hours debugging, only to find someone changed a word three weeks ago.

Existing solutions? They require API keys, cloud services, or complex setups. They don't fit into your existing workflow.

---

## The Solution

PromptGuard treats prompts like source code:

1. **Snapshot** your prompts to create a baseline
2. **Validate** required sections (Goal, Constraints, Output, etc.)
3. **Lock** JSON output schemas to prevent breaking changes
4. **Fail loud** in CI when anything changes unexpectedly

It's deterministic. It's local. It's fast. And it fits into your existing Git workflow.

---

## Core Features

| Feature | Why It Matters |
|---------|----------------|
| **Snapshot & Diff** | Detect changes at the section level, not just file level |
| **Required Headings** | Enforce structure. Catch missing sections before production |
| **JSON Schema Lock** | Freeze your output format. Break the schema? CI fails |
| **Doctor Command** | Diagnose setup issues with actionable fix commands |
| **JSON Output** | Machine-readable for dashboards and CI integrations |
| **Beautiful CLI** | Box drawings, colors, and clear error messages |

---

## How It Works

```
Prompt File (.md)
      ↓
  [normalize]     → Deterministic whitespace handling
      ↓
  [parse]         → Extract sections by heading
      ↓
  [hash]          → FNV-1a for speed
      ↓
  [compare]       → Snapshot vs current
      ↓
  PASS or FAIL    → Exit code 0 or 1
```

**Deterministic**: Same input always produces same output.  
**Local**: Nothing leaves your machine.  
**Fast**: No network calls, no LLMs, just hashing.

---

## Quickstart

```bash
# Install
bun install

# Initialize
bun tools/promptguard.ts init

# Check all prompts
bun tools/promptguard.ts check

# Snapshot a prompt
bun tools/promptguard.ts snapshot prompts/my-agent.md -m "Initial baseline"

# See what changed
bun tools/promptguard.ts diff prompts/my-agent.md
```

---

## Example Workflow

### Before PromptGuard
```
1. Edit prompt
2. Deploy
3. Agent breaks
4. Debug for 3 hours
5. Find the word "must" was changed to "should"
6. Rage
```

### After PromptGuard
```
1. Edit prompt
2. Push to GitHub
3. CI runs `bun tools/promptguard.ts check`
4. CI fails: "Section 'Constraints' changed"
5. Review diff, approve intentionally
6. Ship with confidence
```

---

## CI Integration

Add this to your GitHub Actions:

```yaml
- name: PromptGuard Check
  run: bun tools/promptguard.ts check --json
```

When prompts drift, CI fails. No silent breakage.

The `--json` flag outputs machine-readable results for dashboards and tooling.

---

## Who Should Use This

| Role | Use Case |
|------|----------|
| **Solo Builders** | Stop debugging drift. Sleep better |
| **Teams** | Enforce prompt review. Block accidental changes |
| **Agent Builders** | Protect multi-step workflows from cascading failures |
| **Prompt Maintainers** | Version control your prompts like code |

---

## Why This Wins

1. **Solves a real problem** — Prompt drift is painful and universal
2. **Zero dependencies on external services** — Works offline, no API keys
3. **Fits existing workflows** — Git, CI, command line
4. **Fail-loud philosophy** — Catch problems before production
5. **Usable today** — Clone, install, run. That's it

This isn't a prototype. This is a tool you can use in production right now.

---

## Roadmap

- [ ] VS Code extension for inline drift warnings
- [ ] `promptguard watch` for real-time drift detection
- [ ] Prompt versioning with rollback support
- [ ] Team collaboration features (shared baselines)
- [ ] Integration with popular agent frameworks

---

## License

MIT — Use it, fork it, ship it.

---

## Contributing

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

<p align="center">
  <strong>Don't guess. Guard.</strong><br>
  <em>Built for the Vibeathon to solve a real problem in agentic development.</em>
</p>
