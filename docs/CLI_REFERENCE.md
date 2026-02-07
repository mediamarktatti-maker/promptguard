# PromptGuard CLI Reference

The `promptguard` CLI is the core tool for managing prompt drift. It is deterministic, local-first, and designed to work exactly like Git.

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | Output results in structured JSON format (useful for CI/dashboards). |
| `--help` | Show command help. |

---

## Commands

### `init`
Initializes a new PromptGuard project.

**Usage:**
```bash
bun tools/promptguard.ts init
```

**What it does:**
1.  Creates `.promptguard/` directory (for history and manifest).
2.  Creates `promptguard.config.json` with default settings.
3.  Auto-discovers existing `.md` files in `prompts/` and adds them to the manifest.

**Example Output:**
```text
┌──────────────────────────────┐
│ PromptGuard Initialized 🛡️   │
├──────────────────────────────┤
│ Created .promptguard/        │
│ Created promptguard.config.json
│ tracked 3 prompts            │
└──────────────────────────────┘
```

---

### `snapshot`
Creates a baseline "commit" for a specific prompt file. This is your "source of truth".

**Usage:**
```bash
bun tools/promptguard.ts snapshot <path/to/prompt.md> -m "Commit message"
```

**Arguments:**
- `<file>`: Path to the prompt file (e.g., `prompts/code-review.md`).
- `-m <message>`: Required. A description of why this snapshot exists (e.g., "Initial version").

**What it does:**
1.  Calculates a stable hash of the prompt content.
2.  Stores a copy of the content in `.promptguard/history/<slug>/<timestamp>.md`.
3.  Updates `.promptguard/manifest.json` with the new hash and path.

---

### `diff`
Compares the current file on disk against the last recorded snapshot.

**Usage:**
```bash
bun tools/promptguard.ts diff <path/to/prompt.md> [--json]
```

**What it does:**
- Shows a semantic diff of *what changed*.
- If `--json` is passed, returns a JSON object with `changed: true/false` and section-level details.

**Example Output:**
```text
⚠️  Section diff for prompts/code-review.md (vs .promptguard/history/...):

## Output
- old:
  The response must be valid JSON...
+ new:
  The response must be YAML...
```

---

### `check`
Validates **ALL** tracked prompts against their constraints. This is your primary CI command.

**Usage:**
```bash
bun tools/promptguard.ts check [--json]
```

**What it does:**
1.  **Schema Lock Check**: Verifies if JSON output definitions match the locked schema (if `lock` was run).
2.  **Heading Check**: Verifies that required headings (defined in config) are present.
3.  **Drift Check**: (Implicit) You should run `diff` to check for content drift, but `check` focuses on *structure* and *contract*.

**Exit Codes:**
- `0`: All checks passed.
- `1`: Validation failed (missing headers, broken schema).

**Example Output:**
```text
┌──────────────────────────────┐
│ PromptGuard Check Passed ✅  │
├──────────────────────────────┤
│ All 4 prompt(s) validated.   │
│ No drift. No errors. 🛡️      │
└──────────────────────────────┘
```

---

### `lock`
"Freezes" the JSON schema definition inside a prompt. If you have a `{ "type": "json_fence" }` rule, this command records the *current* JSON schema as the canonical contract.

**Usage:**
```bash
bun tools/promptguard.ts lock <path/to/prompt.md>
```

**Why usage it:**
Use this when you are happy with your output format and want to prevent accidental changes to the JSON structure, even if you change other parts of the prompt.

---

### `doctor`
Diagnoses common setup issues and suggests fixes.

**Usage:**
```bash
bun tools/promptguard.ts doctor
```

**Checks:**
- `prompts/` directory existence.
- Config file validity.
- Manifest integrity.
- File readability.
- Snapshot consistency.

**Example Output:**
```text
┌──────────────────────────────┐
│ Doctor Check Failed ❌       │
├──────────────────────────────┤
│ Issues found. See errors...  │
└──────────────────────────────┘
```
