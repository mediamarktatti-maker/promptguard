# CI/CD Integration

PromptGuard is designed to be a gatekeeper in your CI/CD pipeline. Just like you run tests (`npm test`) to catch bad code, you should run `promptguard check` to catch bad prompts.

## GitHub Actions

Create a file at `.github/workflows/promptguard.yml`:

```yaml
name: PromptGuard Check

on:
  push:
    branches: [main]
  pull_request:

jobs:
  check-prompts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install

      - name: Run PromptGuard Check
        run: bun tools/promptguard.ts check
```

## Exit Codes

| Code | Meaning | Action |
|------|---------|--------|
| `0` | Success | Continue pipeline |
| `1` | Failure | Block merge/deploy |

## Dashboard Integration (`--json`)

If you want to consume PromptGuard results in a dashboard or external tool, use the `--json` flag.

**Command:**
```bash
bun tools/promptguard.ts check --json
```

**Output:**
```json
{
  "ok": false,
  "warnings": [],
  "errors": [
    {
      "file": "prompts/broken.md",
      "message": "Missing required heading: Output"
    }
  ],
  "summary": {
    "filesChecked": 4,
    "warnings": 0,
    "errors": 1
  }
}
```
