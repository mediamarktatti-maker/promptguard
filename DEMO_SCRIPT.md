# PromptGuard Demo Video Script
## Vibeathon Submission (3-5 minutes)

---

## Pre-Recording Checklist

### Setup
- [ ] Clean terminal with dark theme (for visibility)
- [ ] Font size increased (at least 16pt for readability)
- [ ] Browser open to demo page (localhost:5173)
- [ ] Sample prompts ready in `prompts/` directory
- [ ] Close unnecessary applications
- [ ] Screen recording software ready (OBS, QuickTime, or similar)

### Sample Prompt for Demo
Ensure `prompts/example.prompt.md` exists with sections like Goal, Constraints, Output.

---

## Video Script

### INTRO (0:00 - 0:30) — 30 seconds

**[SCREEN: PromptGuard banner or terminal with command]**

**SAY:**
> "Hey everyone! I'm [Your Name], and this is PromptGuard—a tool that treats your prompts like code.
>
> If you've ever had an AI agent break because someone changed a word in a prompt, this is for you.
>
> Let me show you how it catches drift before it breaks production."

**DO:**
- Show the terminal
- Maybe show the GitHub repo briefly

---

### PROBLEM STATEMENT (0:30 - 1:00) — 30 seconds

**[SCREEN: Show a visual of prompt drift (before/after)]**

**SAY:**
> "Here's the problem: prompts drift silently. Someone adds a sentence, removes a constraint, and suddenly your agent is hallucinating.
>
> Without guardrails, prompt changes are invisible. There's no review, no tests, no way to know what changed.
>
> PromptGuard fixes that."

**DO:**
- Show a simple before/after comparison if possible
- Or stay on terminal and gesture to the concept

---

### DEMO: INIT & SNAPSHOT (1:00 - 1:45) — 45 seconds

**[SCREEN: Terminal in project directory]**

**SAY:**
> "Let me show you. First, we initialize PromptGuard."

**DO:**
```bash
cd my-project
bun tools/promptguard.ts init
```

**SAY:**
> "This creates a manifest and discovers all prompts. Now let's snapshot our baseline."

**DO:**
```bash
cat prompts/example.prompt.md
bun tools/promptguard.ts snapshot prompts/example.prompt.md -m "baseline"
```

**SAY:**
> "That's it. Our prompt is now locked. Like a git commit for prompts."

---

### DEMO: DETECT DRIFT (1:45 - 2:45) — 60 seconds

**[SCREEN: Edit prompt in editor, then terminal]**

**SAY:**
> "Now watch what happens when someone changes the prompt."

**DO:**
1. Open `prompts/example.prompt.md` in editor
2. Change one section (e.g., modify the Output section)
3. Save the file

**SAY:**
> "I just changed the Output section. Let's see what PromptGuard finds."

**DO:**
```bash
bun tools/promptguard.ts diff prompts/example.prompt.md
```

**SAY:**
> "Look at that! It shows exactly WHAT changed—by section. Not just 'file changed', but which section drifted.
>
> And if we run check..."

**DO:**
```bash
bun tools/promptguard.ts check
```

**SAY:**
> "It fails loud. Perfect for CI. No more silent drift."

---

### DEMO: BROWSER DEMO (2:45 - 3:30) — 45 seconds

**[SCREEN: Browser at localhost:5173]**

**SAY:**
> "And here's the best part—we have an interactive demo right in the browser."

**DO:**
1. Open browser to localhost:5173
2. Show the interactive demo page
3. Edit a prompt in the left panel
4. Watch the diff appear in real-time

**SAY:**
> "You can see live diffs as you type. Great for experimenting before committing.
>
> The entire experience is local. No API calls. No LLMs. Just fast, deterministic hashing."

---

### KEY FEATURES HIGHLIGHT (3:30 - 4:00) — 30 seconds

**[SCREEN: Terminal or feature list overlay]**

**SAY:**
> "What makes PromptGuard special for vibe coders:
>
> **One** — 100% local. No API keys, no LLM calls. Uses hashing.
>
> **Two** — Section-aware diffs. See exactly what changed.
>
> **Three** — JSON schema locking. Freeze your output format.
>
> **Four** — Fail loud in CI. Stop drift before production.
>
> This is prompt engineering with guardrails."

---

### CALL TO ACTION (4:00 - 4:30) — 30 seconds

**[SCREEN: GitHub repo URL]**

**SAY:**
> "PromptGuard is open source and ready to use. Check it out on GitHub.
>
> If you're tired of 'it worked yesterday' failures, give it a try.
>
> Don't guess. Guard.
>
> Thanks for watching!"

**DO:**
- Show GitHub URL on screen: `github.com/vibe-flow-fixer/promptguard`
- Wave or smile at camera (if showing face)
- End screen with logo/URL

---

## Post-Recording

### Editing Tips
1. Trim any long pauses or loading times
2. Add subtle background music (lo-fi, low volume)
3. Add text overlays for key commands:
   - `bun tools/promptguard.ts init`
   - `bun tools/promptguard.ts snapshot`
   - `bun tools/promptguard.ts check`
4. Speed up long operations (1.5x-2x) but keep audio at normal speed
5. Target final length: 3:30 - 4:30 (sweet spot)

### Thumbnail Suggestions
- Terminal screenshot with PromptGuard check output
- Text: "Stop Prompt Drift"
- Shield emoji or logo

---

## Key Phrases to Emphasize

These align with Vibeathon judging criteria:

| Criteria | What to Say |
|----------|-------------|
| **Usefulness (40%)** | "Catches drift before production" |
| **Impact (25%)** | "No more 'it worked yesterday' failures" |
| **Execution (20%)** | "100% local, git-native, CI-ready" |
| **Innovation (15%)** | "Section-aware semantic diffing" |

---

## Alternative Quick Demo (If Short on Time)

If you need a faster 2-minute version:

1. **Intro (15 sec)**: "PromptGuard - stop prompt drift"
2. **Init & Snapshot (30 sec)**: Quick commands
3. **Diff & Check (45 sec)**: Show the magic
4. **Browser Demo (15 sec)**: Quick peek
5. **CTA (15 sec)**: GitHub link

---

## Backup: If Something Goes Wrong

1. **Check fails unexpectedly**: Show it's working as intended, explain the error
2. **Demo page not loading**: Focus on CLI, mention browser demo exists
3. **Slow operations**: Mention you'll speed up in post

Good luck with the recording! 🎬
