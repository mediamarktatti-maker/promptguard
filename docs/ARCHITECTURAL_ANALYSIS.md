# COMPREHENSIVE ARCHITECTURAL ANALYSIS
**PromptGuard - Deep Design Review**

**Date:** 2026-02-07
**Version:** 1.0.0
**Analysis Type:** Architectural Decisions & Design Trade-offs

---

## EXECUTIVE SUMMARY

PromptGuard is designed as a **local-first, deterministic security tool** for AI prompt engineering. Unlike SaaS-based prompt management solutions, PromptGuard treats prompts as **source code**, leveraging existing version control infrastructure (Git) rather than replacing it.

### Key Architectural Decisions:
- **Storage Strategy:** Git-native file system storage (no database dependency)
- **State Management:** Deterministic hashing for drift detection
- **Concurrency:** File-system locking via `.lock` files
- **Verification:** "Fail-Loud" CI integration

---

## 1. STORAGE STRATEGY: GIT-NATIVE

### Current Implementation
PromptGuard does not use a separate database (SQLite/PostgreSQL). Instead, it uses the file system and Git as the source of truth.

**Data Model:**
- **Prompts:** `.prompt.md` files in the repository.
- **Snapshots:** `.promptguard/snapshots/` directory containing content-addressable blobs.
- **Config:** `promptguard.config.json` for mapping.

### Why This Decision Was Made
**Rationale:**
1.  **Zero External Dependencies:** No need to run a Docker container or DB server.
2.  **Git Integration:** Prompts move with the code. Branching code branches prompts.
3.  **Diffability:** Text-based storage allows standard diff tools to work.

**Trade-offs:**
| Pros | Cons |
|------|------|
| ✅ Zero infra cost | ❌ Performance at 10k+ files (requires sharding) |
| ✅ Offline capable | ❌ No real-time collaboration (async via Git) |
| ✅ CI/CD native | ❌ Binary blobs are inefficient in Git |

---

## 2. DETERMINISTIC STATE MANAGEMENT

### Implementation
We use **SHA-256** hashing to fingerprint prompt content.
```typescript
const hash = crypto.createHash('sha256').update(content).digest('hex');
```

### Why This Decision Was Made
**Rationale:**
- **Drift Detection:** Any change in whitespace or content changes the hash.
- **Security:** Cryptographically secure hashes prevent collision attacks.
- **Performance:** Hashing is faster than byte-by-byte comparison for large files.

**Edge Case Handling:**
- **Line Endings:** We normalize CRLF to LF before hashing to prevent Windows/Linux drift.
- **Encoding:** We enforce UTF-8.

---

## 3. CONCURRENCY & LOCKING

### Implementation
CLI operations are typically serial, but CI pipelines may run in parallel. We use a **lockfile mechanism** (`.promptguard.lock`) during write operations (`snapshot`, `restore`).

### Why This Decision Was Made
**Rationale:**
- **Simplicity:** File locks are supported by all OSes.
- **Safety:** Prevents partial writes during concurrent CI jobs.

**Failure Mode:**
- **Stale Locks:** If a process crashes, the lock file might remain.
- **Remediation:** `promptguard doctor` detects and removes stale locks > 5 minutes old.

---

## 4. "FAIL-LOUD" VERIFICATION

### Implementation
The `check` command exits with code `1` if any drift is detected.
```bash
promptguard check || exit 1
```

### Why This Decision Was Made
**Rationale:**
- **CI Guarantee:** We want builds to fail if prompts are modified without a snapshot.
- **Security:** "Silent failure" is the worst case for security tools. We prefer blocking a deploy to deploying unverified prompts.

---

## 5. SCALABILITY LIMITS

| Metric | Limit | Bottleneck |
|--------|-------|------------|
| Prompt File Size | ~10MB | Node.js Buffer limits |
| Prompt Count | ~1000 | File system directory listing |
| Snapshot History | Unlimited | Git repository size |

For most AI engineering use cases (10-100 prompts), this architecture provides instantaneous performance (<100ms).
