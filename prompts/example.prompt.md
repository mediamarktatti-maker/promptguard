# Example Prompt

## Goal
Create a short, structured summary of a meeting transcript.

## Constraints
- Output must be valid JSON.
- Do not invent facts.
- Keep each bullet under 16 words.

## Output
Return a single JSON object:

```json
{
  "summary": "string",
  "decisions": ["string"],
  "action_items": [{ "owner": "string", "task": "string" }]
}
```

## Examples
Input: "We decided to ship Friday. Alex will update the docs."
Output: {"summary":"Ship Friday.","decisions":["Ship Friday"],"action_items":[{"owner":"Alex","task":"Update docs"}]}

## Failure modes
- If the transcript is empty, output an empty object with empty arrays.
