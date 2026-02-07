
<context>
Goal: implement the “validation, CI wiring, and polish” next steps for promptguard without scope creep:
- Add `doctor` command (setup/config validation + suggested fixes)
- Add `--json` machine-readable output (primarily for `check`, optionally `diff`)
- Add GitHub Actions drift gating workflow (PR + main push)
- Rewrite README into a concise “vote magnet” version with correct, copy/paste-able commands and consistent formatting
Constraints:
- Keep existing deterministic core logic (`src/lib/promptguard.ts`) as the single source of truth.
- Preserve current CLI behavior (exit codes + human-readable output) for users without CI.
- When `--json` is used: output human text to stderr and JSON to stdout (per your choice).
</context>

<repo-findings>
Current state:
- CLI exists at `tools/promptguard.ts` with commands: init, snapshot, diff, lock, check.
- Deterministic core exists at `src/lib/promptguard.ts` with: normalizePrompt, parseSections, diffBySection, checkPrompt, extractFirstJsonFence, stableHash.
- Config file exists at `promptguard.config.json` with snapshots/git, requiredHeadings, schemaLocks (snapshots mode not currently used in CLI logic).
- Web demo (`src/components/PromptguardDemo.tsx`) reuses core logic (checkPrompt + diffBySection) and is already consistent with CLI’s section-aware approach.
Gaps vs your “final” README/spec:
- No `doctor` command yet.
- No `--json` output yet.
- No `.github/workflows/...` CI drift gate example actually included in repo yet.
- README is solid but not yet optimized for “60-second why + quickstart + CI snippet” and your draft has some formatting issues (missing fenced blocks / missing `bun install` line placement).
</repo-findings>

<decisions-captured>
From your answers:
- `doctor` v1 should validate: config JSON, manifest JSON, prompt file existence (not lock-file enforcement yet).
- `--json`: split output (JSON to stdout, human text to stderr).
- CI workflow triggers: pull_request + push to main.
</decisions-captured>

<implementation-plan>
1) CLI: add `doctor` command
   - File: `tools/promptguard.ts`
   - Add new command handler:
     - `promptguard doctor` prints a short report and exits non-zero if critical issues.
   - Checks to implement (v1):
     a) Config validation
        - If `promptguard.config.json` is missing: print INFO that defaults will apply (as `loadConfig` already does), and recommend running `init` to generate it.
        - If present but invalid JSON: already handled by `readJson` → exit code 2. Ensure `doctor` surfaces this cleanly with context (keep code 2).
     b) Manifest validation
        - If `.promptguard/manifest.json` missing: print actionable instructions:
          - run `bun tools/promptguard.ts init`
          - then `bun tools/promptguard.ts snapshot <file> -m "baseline"`
        - If present but invalid JSON: `readJson` already exits code 2.
        - If present but empty prompts: warn and recommend snapshotting.
     c) Prompt file checks
        - For each `fileRel` in manifest:
          - Ensure file exists; if not, error with suggestion to update manifest (re-init) or restore file.
          - Ensure readable; else error.
   - Exit codes:
     - 0 = everything OK (warnings allowed)
     - 1 = doctor found actionable problems (missing manifest, missing prompt files, etc.)
     - 2 = invalid JSON config/manifest (parsing failures), consistent with existing `readJson` behavior

2) CLI: add `--json` output (stdout JSON, stderr human)
   - File: `tools/promptguard.ts`
   - Scope:
     - Implement for `check` first (highest CI value).
     - Optionally implement for `diff` as well (useful for tooling), but keep minimal if you prefer strict scope.
   - Parsing:
     - Add a simple flag parser for each command: detect `--json` anywhere after the command.
     - Keep existing positional args behavior intact (e.g., `diff <file>`, `snapshot <file> -m ...`).
   - Output contract for `check --json`:
     - stdout JSON shape (deterministic, stable fields):
       - `ok: boolean`
       - `warnings: string[]`
       - `errors: { file: string; message: string }[]`
       - `summary: { filesChecked: number; warnings: number; errors: number }`
       - `timestamp` optional (if included, note that it reduces determinism of output; recommend omitting for CI stability)
     - stderr human output:
       - Keep current WARN/ERROR/OK lines to stderr when `--json` is used.
   - Ensure exit code remains the source of truth for CI gating:
     - ok -> 0
     - errors -> 1
     - invalid JSON -> 2
   - (Optional) `diff --json` contract:
     - stdout: `{ file, snapshotPath, changedSections: [{ title, oldHash, newHash, oldPreview, newPreview }], ok }`
     - stderr: keep current human diff output.

3) CI wiring: add GitHub Actions workflow
   - Create file: `.github/workflows/promptguard.yml`
   - Trigger:
     - `on: [pull_request]` and `push` to `main`
   - Steps:
     - checkout
     - setup bun (use a modern `oven-sh/setup-bun` action rather than older pinned versions)
     - `bun install`
     - `bun tools/promptguard.ts check`
   - Note: keep it minimal and fast; avoid caching unless needed.

4) README rewrite: “vote magnet” version (correct formatting + copy/paste-ready)
   - File: `README.md`
   - Replace/reshape into:
     - Title + 1-liner
     - “Why promptguard?” 60-second section (tight, high-signal)
     - Key features (ensure only implemented features are listed; mark `doctor` and `--json` as included once implemented)
     - Quickstart:
       - `bun install`
       - `bun tools/promptguard.ts init`
       - `bun tools/promptguard.ts snapshot prompts/example.prompt.md -m "baseline"`
       - edit prompt
       - `check`, `diff`, `lock`
     - Interactive demo section:
       - point to `/` and what to click
     - CI snippet:
       - include the exact workflow YAML (matching the file we add)
     - “When not to use”
     - Repo layout (keep)
   - Fix the draft issues:
     - ensure code fences are properly opened/closed
     - ensure commands include required args (e.g., `snapshot <file> -m "..."`)
     - avoid listing features not shipped yet (until we add them in steps 1–2)

5) Validation checklist (what we will test after implementation)
   - CLI
     - `bun tools/promptguard.ts init`
     - `bun tools/promptguard.ts snapshot prompts/example.prompt.md -m "baseline"`
     - Edit prompt to remove a required heading → `check` exits 1 and prints error
     - Add `--json` to `check`:
       - stdout is valid JSON
       - stderr contains human-readable messages
       - exit codes unchanged
     - `bun tools/promptguard.ts doctor`:
       - before init: exits 1 with clear instructions
       - after init + snapshot: exits 0
       - if manifest references missing file: exits 1 with actionable message
   - Web demo
     - Confirm still works (should be unaffected; it uses core library only)

</implementation-plan>

<notes-on-scope-and-future>
Explicitly not doing yet (to avoid scope creep):
- Extending doctor to validate schema lock files and lock drift (we can add later).
- Implementing the `snapshots: "local"` mode behavior; config supports it, but CLI doesn’t currently branch on it. If you want, we can add it as a separate, clearly-scoped follow-up.
- Advanced contract change detection (key rename/remove analysis). This can build on the existing JSON-fence lock but is a v2 feature.
</notes-on-scope-and-risk>

<deliverables>
- Updated `tools/promptguard.ts` with:
  - `doctor` command
  - `--json` support for `check` (and optionally `diff`)
  - split stdout/stderr behavior
- New `.github/workflows/promptguard.yml`
- Updated `README.md` aligned with shipped features and the new CI + doctor + json usage
</deliverables>
