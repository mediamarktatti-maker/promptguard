# PromptGuard Configuration

PromptGuard is configured via a `promptguard.config.json` file in your project root.

## File Location
`./promptguard.config.json`

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `snapshots` | `"git" \| "local"` | `"git"` | Defines how snapshot history is stored. Currently only `"git"` style (local files in `.promptguard`) is fully supported in this version. |
| `requiredHeadings` | `string[]` | `[]` | A list of Markdown headings (e.g., `# Goal`) that **MUST** exist in every prompt file using Level 1 (`#`) or Level 2 (`##`) headers. Failing to include these causes `promptguard check` to fail. |
| `schemaLocks` | `Record<string, Rule>` | `{}` | Per-file rules for locking. See below. |

### Example Config

```json
{
  "snapshots": "git",
  "requiredHeadings": [
    "Goal",
    "Constraints",
    "Output",
    "Examples",
    "Failure modes"
  ],
  "schemaLocks": {
    "prompts/code-review.md": {
      "type": "json_fence"
    }
  }
}
```

---

## Schema Locks (`schemaLocks`)

You can define special validation rules for specific files.

### `json_fence`
Ensures the prompt contains a valid JSON block enclosed in triple backticks (```json ... ```).

**When to use:**
If your prompt tells an LLM to output JSON, you should use this lock to ensure the "Output Example" in your prompt remains valid JSON and doesn't drift into invalid syntax.

**How to verify:**
Run `bun tools/promptguard.ts check`. This will:
1.  Parse the file.
2.  Extract the first `json` code block.
3.  Validate it is parseable JSON.
4.  Compare it against the `.promptguard/locks/<slug>.json` canonical version (if locked).
