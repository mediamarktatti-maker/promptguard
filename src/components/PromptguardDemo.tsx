import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { checkPrompt, diffBySection, normalizePrompt, stableHash } from "@/lib/promptguard";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import {
  Maximize2,
  Minimize2,
  Star,
  Play,
  Download,
  Upload,
  FileText,
  History,
  Trophy,
  Terminal,
  Zap,
  Shield,
  Code,
  MessageSquare,
  Sparkles
} from "lucide-react";

const DEFAULT_CONFIG = {
  requiredHeadings: ["Goal", "Constraints", "Output", "Examples", "Failure modes"],
  requireJsonBlock: true,
};

// Prompt Templates Gallery
const PROMPT_TEMPLATES = [
  {
    id: "meeting-summary",
    name: "Meeting Summary",
    icon: MessageSquare,
    description: "Summarize meeting transcripts into structured JSON",
    content: normalizePrompt(`# Meeting Summary

## Goal
Summarize a meeting transcript into structured JSON with key decisions and action items.

## Constraints
- Output must be valid JSON
- Do not invent facts not present in the transcript
- Keep summary under 100 words
- Each action item must have an owner

## Output

\`\`\`json
{
  "summary": "string",
  "decisions": ["string"],
  "action_items": [{ "owner": "string", "task": "string", "due": "string | null" }]
}
\`\`\`

## Examples
Input: "We decided to ship Friday. Alex will update the docs by Thursday."
Output: {"summary":"Team agreed to ship Friday.","decisions":["Ship Friday"],"action_items":[{"owner":"Alex","task":"Update docs","due":"Thursday"}]}

## Failure modes
- If transcript is empty, return empty object with empty arrays.
- If no decisions found, return empty decisions array.
`),
  },
  {
    id: "code-review",
    name: "Code Review",
    icon: Code,
    description: "Generate structured code review feedback",
    content: normalizePrompt(`# Code Review

## Goal
Analyze code changes and provide structured review feedback with severity levels.

## Constraints
- Focus on bugs, security issues, and performance
- Be constructive, not critical
- Provide specific line references when possible
- Limit to 5 most important issues

## Output

\`\`\`json
{
  "summary": "string",
  "issues": [{
    "severity": "critical | warning | suggestion",
    "line": "number | null",
    "message": "string",
    "suggestion": "string"
  }],
  "approved": "boolean"
}
\`\`\`

## Examples
Input: "function add(a,b){return a+b}"
Output: {"summary":"Simple function, looks good.","issues":[],"approved":true}

## Failure modes
- If code is empty, return error message.
- If language is unrecognized, note it in summary.
`),
  },
  {
    id: "translation",
    name: "Translation",
    icon: Zap,
    description: "Translate text while preserving formatting",
    content: normalizePrompt(`# Translation

## Goal
Translate text from source language to target language while preserving formatting and tone.

## Constraints
- Preserve markdown formatting
- Maintain original tone (formal/informal)
- Keep proper nouns untranslated
- Return confidence score

## Output

\`\`\`json
{
  "source_language": "string",
  "target_language": "string",
  "translation": "string",
  "confidence": "number between 0 and 1",
  "notes": ["string"]
}
\`\`\`

## Examples
Input: {"text": "Hello world", "target": "es"}
Output: {"source_language":"en","target_language":"es","translation":"Hola mundo","confidence":0.99,"notes":[]}

## Failure modes
- If language detection fails, ask for clarification.
- If text contains unsupported characters, note in response.
`),
  },
  {
    id: "security-audit",
    name: "Security Audit",
    icon: Shield,
    description: "Audit code for security vulnerabilities",
    content: normalizePrompt(`# Security Audit

## Goal
Analyze code for security vulnerabilities following OWASP guidelines.

## Constraints
- Check for injection, XSS, CSRF, auth issues
- Assign CVSS-like severity (0-10)
- Provide remediation steps
- No false positives preferred over missing issues

## Output

\`\`\`json
{
  "scan_id": "string",
  "vulnerabilities": [{
    "type": "string",
    "severity": "number 0-10",
    "location": "string",
    "description": "string",
    "remediation": "string"
  }],
  "overall_risk": "low | medium | high | critical"
}
\`\`\`

## Examples
Input: "SELECT * FROM users WHERE id = " + userId
Output: {"scan_id":"...","vulnerabilities":[{"type":"SQL Injection","severity":9,"location":"line 1","description":"Unsanitized user input in SQL query","remediation":"Use parameterized queries"}],"overall_risk":"critical"}

## Failure modes
- If code is obfuscated, note limited analysis.
- If language unknown, return empty scan with note.
`),
  },
];

const DEFAULT_PROMPT = PROMPT_TEMPLATES[0].content;

// Enhanced Achievements
const ACHIEVEMENT_DEFINITIONS = [
  { id: "first_check", label: "First Check", icon: "🎯", detail: "Ran promptguard check at least once", threshold: (s: { checksPassed: number; checksFailed: number }) => s.checksPassed + s.checksFailed >= 1 },
  { id: "drift_catcher", label: "Drift Catcher", icon: "🐛", detail: "Triggered a fail-loud error", threshold: (s: { checksFailed: number }) => s.checksFailed >= 1 },
  { id: "baseline_keeper", label: "Baseline Keeper", icon: "📸", detail: "Created an in-browser baseline snapshot", threshold: (s: { snapshots: number }) => s.snapshots >= 1 },
  { id: "reviewer", label: "Reviewer", icon: "💬", detail: "Left feedback on a prompt", threshold: (s: { comments: number }) => s.comments >= 1 },
  { id: "power_user", label: "Power User", icon: "⚡", detail: "Ran 10+ checks", threshold: (s: { checksPassed: number; checksFailed: number }) => s.checksPassed + s.checksFailed >= 10 },
  { id: "json_master", label: "JSON Master", icon: "📋", detail: "Tested 3+ templates", threshold: (s: { templatesUsed: number }) => (s.templatesUsed ?? 0) >= 3 },
  { id: "historian", label: "Historian", icon: "📚", detail: "Created 5+ snapshots", threshold: (s: { snapshots: number }) => s.snapshots >= 5 },
  { id: "perfectionist", label: "Perfectionist", icon: "✨", detail: "5 consecutive checks passed", threshold: (s: { consecutivePasses: number }) => (s.consecutivePasses ?? 0) >= 5 },
];

type Stats = {
  checksPassed: number;
  checksFailed: number;
  snapshots: number;
  comments: number;
  templatesUsed?: number;
  consecutivePasses?: number;
  ciSimulations?: number;
};

type SnapshotEntry = {
  id: string;
  content: string;
  hash: string;
  createdAt: string;
  message: string;
};

export function PromptguardDemo() {
  const [baseline, setBaseline] = useState(DEFAULT_PROMPT);
  const [current, setCurrent] = useState(DEFAULT_PROMPT);
  const [mode, setMode] = useState<"check" | "diff" | "ci">("check");
  const [output, setOutput] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  const [stats, setStats] = useLocalStorageState<Stats>("promptguard.demo.stats.v2", {
    checksPassed: 0,
    checksFailed: 0,
    snapshots: 0,
    comments: 0,
    templatesUsed: 0,
    consecutivePasses: 0,
    ciSimulations: 0,
  });

  const [snapshots, setSnapshots] = useLocalStorageState<SnapshotEntry[]>(
    "promptguard.demo.snapshots.v1",
    []
  );

  const [feedback, setFeedback] = useLocalStorageState<
    { id: string; rating: number; comment: string; createdAt: string }[]
  >("promptguard.demo.feedback.v1", []);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [status, setStatus] = useState<"idle" | "ok" | "warn" | "error" | "snapshot" | "ci">("idle");
  const [statusPulseKey, setStatusPulseKey] = useState(0);
  const [ciRunning, setCiRunning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const config = useMemo(() => DEFAULT_CONFIG, []);

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const runCheck = useCallback(async () => {
    setIsScanning(true);

    // Simulate scan delay for visual effect
    await sleep(800);

    const res = checkPrompt(current, config);
    setIsScanning(false);

    if (res.ok === false) {
      setMode("check");
      setOutput(res.errors.map((e) => `❌ ERROR: ${e}`).join("\n"));
      setStatus("error");
      setStats((s) => ({ ...s, checksFailed: s.checksFailed + 1, consecutivePasses: 0 }));
      setStatusPulseKey((k) => k + 1);
      return;
    }
    const lines = ["✅ OK: promptguard check passed", ...res.warnings.map((w) => `⚠️ WARN: ${w}`)];
    setMode("check");
    setOutput(lines.join("\n").trim());
    setStatus(res.warnings.length ? "warn" : "ok");
    setStats((s) => ({
      ...s,
      checksPassed: s.checksPassed + 1,
      consecutivePasses: (s.consecutivePasses ?? 0) + 1
    }));
    triggerConfetti();
    setStatusPulseKey((k) => k + 1);
  }, [current, config, setStats]);

  const runDiff = useCallback(() => {
    const diffs = diffBySection(baseline, current);
    const changed = diffs.filter((d) => d.changed);
    if (!changed.length) {
      setMode("diff");
      setOutput("✅ No section changes vs baseline snapshot.");
      setStatus("ok");
      setStatusPulseKey((k) => k + 1);
      return;
    }
    setMode("diff");
    setOutput(
      [
        "📊 Section diff (baseline → current):",
        ...changed.flatMap((d) => [
          "",
          `## ${d.title}`,
          "─ old:",
          indent(d.oldPreview || "(empty)"),
          "+ new:",
          indent(d.newPreview || "(empty)"),
        ]),
      ].join("\n")
    );
    setStatus("warn");
    setStatusPulseKey((k) => k + 1);
  }, [baseline, current]);

  const snapshotBaseline = useCallback((message = "Manual snapshot") => {
    const entry: SnapshotEntry = {
      id: crypto.randomUUID(),
      content: current,
      hash: stableHash(current),
      createdAt: new Date().toISOString(),
      message,
    };
    setSnapshots((prev) => [entry, ...prev].slice(0, 20)); // Keep last 20
    setBaseline(current);
    setMode("check");
    setOutput(`📸 Snapshot created: "${message}"\n\nHash: ${entry.hash}\nTime: ${new Date().toLocaleString()}`);
    setStatus("snapshot");
    setStats((s) => ({ ...s, snapshots: s.snapshots + 1 }));
    setStatusPulseKey((k) => k + 1);
  }, [current, setSnapshots, setStats]);

  const simulateCiRun = useCallback(async () => {
    setCiRunning(true);
    setMode("ci");
    setStatus("ci");

    const lines: string[] = [];
    const addLine = (line: string) => {
      lines.push(line);
      setOutput(lines.join("\n"));
    };

    addLine("🚀 Starting CI pipeline...\n");
    await sleep(400);
    addLine("$ bun tools/promptguard.ts check --json");
    await sleep(600);

    const res = checkPrompt(current, config);

    if (res.ok === false) {
      addLine("\n❌ FAILED: Prompt drift detected\n");
      for (const e of res.errors) {
        addLine(`   ERROR: ${e}`);
      }
      addLine("\n💡 Fix the errors and push again.");
      addLine("\n────────────────────────────────");
      addLine("Pipeline: FAILED ❌");
      setStatus("error");
    } else {
      addLine("\n✅ PASSED: All checks passed\n");
      if (res.warnings.length) {
        for (const w of res.warnings) {
          addLine(`   WARN: ${w}`);
        }
      }
      addLine("\n────────────────────────────────");
      addLine("Pipeline: SUCCESS ✅");
      setStatus("ok");
      triggerConfetti();
    }

    setStats((s) => ({ ...s, ciSimulations: (s.ciSimulations ?? 0) + 1 }));
    setCiRunning(false);
    setStatusPulseKey((k) => k + 1);
  }, [current, config, setStats]);

  const loadTemplate = useCallback((template: typeof PROMPT_TEMPLATES[0]) => {
    setCurrent(template.content);
    setBaseline(template.content);
    setStats((s) => ({ ...s, templatesUsed: (s.templatesUsed ?? 0) + 1 }));
    setOutput(`📄 Loaded template: ${template.name}\n\n${template.description}`);
    setStatus("ok");
    setStatusPulseKey((k) => k + 1);
  }, [setStats]);

  const restoreSnapshot = useCallback((snapshot: SnapshotEntry) => {
    setCurrent(snapshot.content);
    setOutput(`🔄 Restored snapshot from ${new Date(snapshot.createdAt).toLocaleString()}\n\nMessage: ${snapshot.message}\nHash: ${snapshot.hash}`);
    setStatus("snapshot");
    setStatusPulseKey((k) => k + 1);
  }, []);

  const exportPrompt = useCallback(() => {
    const blob = new Blob([current], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompt.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [current]);

  const importPrompt = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setCurrent(normalizePrompt(text));
        setOutput(`📥 Imported: ${file.name}`);
        setStatus("ok");
        setStatusPulseKey((k) => k + 1);
      }
    };
    input.click();
  }, []);

  const addFeedback = useCallback(() => {
    const trimmed = comment.trim();
    if (!trimmed) return;
    setFeedback((items) => [
      {
        id: crypto.randomUUID(),
        rating,
        comment: trimmed,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
    setComment("");
    setStats((s) => ({ ...s, comments: s.comments + 1 }));
  }, [comment, rating, setFeedback, setStats]);

  const achievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map((a) => ({
      ...a,
      unlocked: a.threshold(stats as any),
    }));
  }, [stats]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const statusStyles = {
    idle: "border bg-surface",
    ok: "border bg-surface ring-2 ring-emerald-500/30",
    warn: "border bg-surface ring-2 ring-amber-500/30",
    error: "border bg-surface ring-2 ring-red-500/35 animate-shake",
    snapshot: "border bg-surface ring-2 ring-blue-500/25 shadow-glow",
    ci: "border bg-surface ring-2 ring-purple-500/30",
  } as const;

  // Confetti Component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            //@ts-ignore
            "--color": `hsl(${Math.random() * 360}, 70%, 50%)`,
          }}
        />
      ))}
    </div>
  );

  const HeaderStatus = () => (
    <div className="flex items-center gap-3">
      {status === "error" ? (
        <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-red-500 animate-pulse border border-red-500/20">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wide">DRIFT DETECTED</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-500 border border-emerald-500/20 shadow-glow-sm">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wide">SYSTEM SECURE</span>
        </div>
      )}
      <div className="h-6 w-px bg-border mx-1" />
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-xs font-mono">v1.0.0</span>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 relative">
      {showConfetti && <Confetti />}

      <div className="flex items-center justify-between pb-2 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            PromptGuard Terminal
          </h2>
          <p className="text-sm text-muted-foreground">Local, deterministic prompt testing.</p>
        </div>
        <HeaderStatus />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* ... tabs list ... */}
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Badges ({unlockedCount}/{achievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="grid gap-4">
          <div className="grid gap-2">
            {/* ... buttons ... */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">Prompt (current)</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Full screen
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  navigator.clipboard.writeText(current);
                  // We need a toast here, but for now we'll just rely on the button feedback or add a simple alert if toast isn't available in this scope.
                  // Actually, let's use the 'output' to show a temporary message if we can, or just let the user know.
                  // Since we have a status line, let's use that!
                  setOutput("✅ Copied prompt to clipboard!");
                  setStatus("ok");
                  setStatusPulseKey(k => k + 1);
                }}>
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-4 w-4"
                    >
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                    </svg>
                    Copy
                  </div>
                </Button>
                <Button variant="outline" size="sm" onClick={importPrompt}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm" onClick={exportPrompt}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="soft" size="sm" onClick={() => setCurrent(baseline)}>
                  Reset to baseline
                </Button>
                <Button variant="outline" size="sm" onClick={() => snapshotBaseline()}>
                  Snapshot baseline
                </Button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-md border bg-surface">
              {isScanning && <div className="animate-scan" />}
              <Textarea
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="min-h-[300px] border-none focus-visible:ring-0 font-mono text-sm resize-y"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" onClick={runCheck}>
                <Play className="mr-2 h-4 w-4" />
                Run check
              </Button>
              <Button variant="glow" onClick={runDiff}>
                Show diff
              </Button>
              <Button
                variant="outline"
                onClick={simulateCiRun}
                disabled={ciRunning}
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <Terminal className="mr-2 h-4 w-4" />
                {ciRunning ? "Running CI..." : "Simulate CI"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Output ({mode})</div>
            <pre
              key={statusPulseKey}
              className={
                "whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed shadow-lift transition-all animate-enter font-mono " +
                statusStyles[status]
              }
            >
              {output || "Run check/diff to see fail-loud output here."}
            </pre>
            <p className="text-sm text-muted-foreground">
              This in-browser demo uses the same deterministic core as the CLI (no APIs).
            </p>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="grid gap-4">
          <div className="text-sm text-muted-foreground mb-2">
            Load a template to see how structured prompts work. Each template follows best practices.
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {PROMPT_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    loadTemplate(template);
                    setActiveTab("editor");
                  }}
                  className="flex items-start gap-3 rounded-xl border bg-surface p-4 text-left transition hover:bg-surface-2 hover:shadow-lift"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-surface-2 shadow-lift">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <div className="flex-1">
                    <div className="font-medium">{template.name}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history" className="grid gap-4">
          <div className="text-sm text-muted-foreground mb-2">
            View and restore previous snapshots. Snapshots are stored in your browser.
          </div>
          {snapshots.length === 0 ? (
            <div className="rounded-xl border bg-surface-2 p-8 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No snapshots yet. Click "Snapshot baseline" to save the current prompt.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {snapshots.map((snapshot, idx) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-surface p-3 transition hover:bg-surface-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface-2 text-xs font-mono">
                        {snapshots.length - idx}
                      </span>
                      <span className="font-medium truncate">{snapshot.message}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                      <span className="font-mono">{snapshot.hash}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      restoreSnapshot(snapshot);
                      setActiveTab("editor");
                    }}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="grid gap-4">
          <div className="text-sm text-muted-foreground mb-2">
            Unlock badges by using PromptGuard features. Progress: {unlockedCount}/{achievements.length}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={
                  "flex items-center gap-3 rounded-xl border p-4 transition " +
                  (a.unlocked
                    ? "bg-surface shadow-lift"
                    : "bg-surface/50 opacity-60")
                }
              >
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1">
                  <div className={`font-medium ${a.unlocked ? "" : "text-muted-foreground"}`}>
                    {a.label}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.detail}</p>
                </div>
                {a.unlocked && (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Comments & Ratings */}
      <div className="grid gap-3 rounded-2xl border bg-surface p-4 shadow-lift">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium">Comments & ratings (local)</div>
          <div className="text-xs text-muted-foreground">Stored in your browser only</div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">Rating</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const v = i + 1;
                const active = v <= rating;
                return (
                  <button
                    key={v}
                    type="button"
                    className={
                      "inline-flex h-8 w-8 items-center justify-center rounded-md border transition hover:shadow-lift " +
                      (active ? "bg-surface-2" : "bg-surface")
                    }
                    onClick={() => setRating(v)}
                    aria-label={`Set rating to ${v}`}
                  >
                    <Star className={"h-4 w-4 " + (active ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </button>
                );
              })}
            </div>
          </label>

          <label className="grid flex-1 gap-1">
            <span className="text-xs text-muted-foreground">Comment</span>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[88px] bg-surface"
              placeholder="What drift did you catch? What rule helped?"
            />
          </label>

          <div className="flex gap-2">
            <Button variant="hero" onClick={addFeedback}>
              Add
            </Button>
            <Button variant="outline" onClick={() => setFeedback([])}>
              Clear
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            feedback.slice(0, 6).map((f) => (
              <div key={f.id} className="rounded-xl border bg-surface-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          "h-4 w-4 " + (i + 1 <= f.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground")
                        }
                      />
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{f.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fullscreen Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-3">
              <span>Prompt editor (full screen)</span>
              <Button variant="outline" size="sm" onClick={() => setFullscreen(false)}>
                <Minimize2 className="mr-2 h-4 w-4" />
                Exit
              </Button>
            </DialogTitle>
            <DialogDescription>
              Edit the prompt, then run check/diff to see deterministic, fail-loud output.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 grid gap-3 overflow-hidden">
            <Textarea
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="flex-1 min-h-0 bg-surface font-mono text-sm resize-none"
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="hero" onClick={runCheck}>
                <Play className="mr-2 h-4 w-4" />
                Run check
              </Button>
              <Button variant="glow" onClick={runDiff}>
                Show diff
              </Button>
              <Button variant="outline" onClick={() => setCurrent(baseline)}>
                Reset to baseline
              </Button>
              <Button variant="outline" onClick={() => snapshotBaseline()}>
                Snapshot baseline
              </Button>
              <Button
                variant="outline"
                onClick={simulateCiRun}
                disabled={ciRunning}
              >
                <Terminal className="mr-2 h-4 w-4" />
                Simulate CI
              </Button>
            </div>
            <pre
              className={
                "whitespace-pre-wrap rounded-xl p-4 text-sm leading-relaxed shadow-lift font-mono max-h-[200px] overflow-auto " +
                statusStyles[status]
              }
            >
              {output || "Run check/diff to see output here."}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function indent(s: string) {
  return s
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
