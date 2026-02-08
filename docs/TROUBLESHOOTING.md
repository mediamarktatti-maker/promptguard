# Troubleshooting

Common issues and how to fix them.

---

## "Missing .promptguard/manifest.json"

**Problem**: PromptGuard hasn't been initialized.

**Fix**:
```bash
bun tools/promptguard.ts init
```

---

## "No snapshot found for [file]"

**Problem**: You're trying to diff a file that hasn't been snapshotted.

**Fix**:
```bash
bun tools/promptguard.ts snapshot prompts/your-file.md -m "initial baseline"
```

---

## "Missing required heading: [heading]"

**Problem**: Your prompt is missing a section that's required in the config.

**Fix**:
1. Add the missing heading to your prompt file:
   ```markdown
   ## Goal
   [Your content here]
   ```

2. Or remove the heading from `promptguard.config.json`:
   ```json
   {
     "requiredHeadings": ["Goal", "Output"]
   }
   ```

---

## "JSON contract drifted vs lock"

**Problem**: The JSON schema in your prompt changed since it was locked.

**Fix**:
- If the change is intentional:
  ```bash
  bun tools/promptguard.ts lock prompts/your-file.md
  ```
- If the change is accidental: revert the JSON block

---

## "Command not found: bun"

**Problem**: Bun is not installed or not in PATH.

**Fix**:
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Or use npx with tsx
npx tsx tools/promptguard.ts check
```

---

## Check passes locally but fails in CI

**Problem**: Different states between local and CI.

**Fixes**:
1. Ensure `.promptguard/manifest.json` is committed
2. Ensure all snapshots are committed
3. Run `doctor` to verify setup:
   ```bash
   bun tools/promptguard.ts doctor
   ```

---

## "Snapshot missing on disk"

**Problem**: A snapshot file was deleted but still referenced.

**Fix**:
```bash
# Re-snapshot the file
bun tools/promptguard.ts snapshot prompts/file.md -m "recreate snapshot"
```

---

## Still stuck?

1. Run `doctor` for a full diagnosis:
   ```bash
   bun tools/promptguard.ts doctor
   ```

2. Run `status` for a quick overview:
   ```bash
   bun tools/promptguard.ts status
   ```

3. Open an issue: [GitHub Issues](https://github.com/mediamarktatti-maker/promptguard/issues)
