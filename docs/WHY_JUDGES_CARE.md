# Why Judges Will Care

> This document explains why PromptGuard deserves attention in a competitive hackathon.

---

## The Problem Space

**Prompt drift** is the #1 silent killer in agentic AI development.

Every team building with LLMs has experienced this:
- A prompt worked yesterday, fails today
- Someone changed a word, broke the agent
- Debugging takes hours because changes are invisible

**No one is solving this properly.**

---

## Why PromptGuard Is Different

### vs. Manual Diffing
| Manual | PromptGuard |
|--------|-------------|
| Git shows "file changed" | Shows *which section* changed |
| No structure enforcement | Required headings enforced |
| No CI integration | Fail-loud exit codes |

### vs. LLM-Based Tools
| LLM Tools | PromptGuard |
|-----------|-------------|
| Require API keys | 100% local |
| Non-deterministic | Deterministic (FNV-1a hash) |
| Slow (network calls) | Fast (local hashing) |
| Expensive | Free |

### vs. Nothing (Most Teams)
| Nothing | PromptGuard |
|---------|-------------|
| Silent drift | Explicit diffs |
| No baselines | Snapshotted history |
| Production failures | CI catches before deploy |

---

## Why It's Practical

1. **Zero Setup Friction**
   - `bun install` → `init` → done
   - No API keys, no cloud, no accounts

2. **Fits Existing Workflows**
   - Works with Git
   - Works with any CI
   - Works with any language (manages markdown files)

3. **Fail-Loud by Design**
   - Exit code 1 on drift
   - JSON output for dashboards
   - Clear error messages

---

## Why It's Safe

- **No network calls** — Nothing leaves your machine
- **No state mutation** — Read-only checks
- **Deterministic** — Same input = same output, always
- **Reversible** — Snapshots are just markdown files

---

## Why It's Immediately Useful

You can adopt PromptGuard in 5 minutes:

```bash
bun install
bun tools/promptguard.ts init
bun tools/promptguard.ts check
```

That's it. Your prompts are now protected.

---

## Competition Comparison

| Criteria | PromptGuard | Typical Submission |
|----------|-------------|-------------------|
| Solves real problem | ✅ Universal pain | Often niche |
| Usable today | ✅ 5-minute setup | Often prototype |
| Production-ready | ✅ 30 tests, CI | Often demo-only |
| Zero dependencies | ✅ No API keys | Often requires accounts |
| Original approach | ✅ Section-aware diffing | Often derivative |

---

## The Bottom Line

**PromptGuard is not a prototype.**

It's a production-ready tool that solves a real problem, works today, and requires nothing but Git.

That's why it deserves to win.
