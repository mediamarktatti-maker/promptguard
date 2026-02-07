# Architecture & Internals

PromptGuard is designed on the principle of **Deterministic Prompt Engineering**. It treats prompts as source code compilation targets, not just text files.

## Core Components

### 1. The Manifest (`.promptguard/manifest.json`)
This is the database of tracked prompts. It maps every prompt file to:
- The last known "safe" snapshot hash (SHA-256).
- The path to that snapshot file.
- The timestamp of the last snapshot.

**Example:**
```json
{
  "version": 1,
  "prompts": {
    "prompts/code-review.md": {
      "lastSnapshotPath": ".promptguard/history/prompts-code-review-md/2026-01-30T12-00-00-000Z.md",
      "lastSnapshotSha": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "lastSnapshotAt": "2026-01-30T12:00:00.000Z"
    }
  }
}
```

### 2. Snapshots (`.promptguard/history/`)
Every time you run `promptguard snapshot`, the content is hashed and stored immutably.
- **Normalization**: Before hashing, we normalize newlines (`\n`) and trim whitespace to ensure consistent hashes across OSs (Windows/Linux/Mac).
- **Storage**: Snapshots are plain Markdown files with YAML frontmatter containing metadata.

### 3. Locks (`.promptguard/locks/`)
When you run `promptguard lock`, we extract the first JSON block from the prompt and save it here. This "canonical JSON" is used to validate future changes. If the schema in the prompt changes but the lock file doesn't, `check` fails.

## Determinism
PromptGuard uses `SHA-256` hashing. This means:
`Hash(Prompt_Now) === Hash(Snapshot)` -> **No Drift**.

This logic is:
1.  **Fast**: No LLM required.
2.  **Private**: No data leaves your machine.
3.  **Reliable**: Not probabilistic.

## File Structure
```text
.
├── promptguard.config.json  # User configuration
├── .promptguard/            # Internal state
│   ├── manifest.json        # The database
│   ├── history/             # Immutable snapshots
│   └── locks/               # JSON schema contracts
└── prompts/                 # Your actual prompt files
    ├── code-review.md
    └── translation.md
```
