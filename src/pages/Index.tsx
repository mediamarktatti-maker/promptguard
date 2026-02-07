import { Button } from "@/components/ui/button";
import { PromptguardDemo } from "@/components/PromptguardDemo";
import { SpotlightHero } from "@/components/SpotlightHero";
import {
  FileText,
  GitBranch,
  ShieldCheck,
  Terminal,
  Github,
  Copy,
  Check,
  Zap,
  Lock,
  Eye,
  Moon,
  Sun
} from "lucide-react";
import type { ReactNode } from "react";
import { useState, useEffect } from "react";

const Index = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Konami Code Easter Egg
  useEffect(() => {
    const konamiCode = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let cursor = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === konamiCode[cursor]) {
        cursor++;
        if (cursor === konamiCode.length) {
          setShowEasterEgg(true);
          setTimeout(() => setShowEasterEgg(false), 5000);
          cursor = 0;
        }
      } else {
        cursor = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
            //@ts-ignore
            "--color": `hsl(${Math.random() * 360}, 80%, 60%)`,
          }}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-background relative">
      {showEasterEgg && <Confetti />}

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-glow">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight font-cinzel uppercase">PromptGuard</span>
            <span className="hidden rounded-full border bg-surface px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
            >
              Demo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => document.getElementById("cli")?.scrollIntoView({ behavior: "smooth" })}
            >
              CLI
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("https://github.com", "_blank")}
              className="gap-2"
            >
              <Github className="h-4 w-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="h-9 w-9"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="mx-auto w-full max-w-6xl px-6 pb-10 pt-10">
        <SpotlightHero className="p-8 md:p-10">
          <div className="flex flex-col gap-8 animate-fade-in-up">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex w-fit items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs text-muted-foreground shadow-lift">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" aria-hidden="true" />
                  Open source & free forever
                </p>
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-amber-600/50 bg-amber-900/20 px-3 py-1 text-xs text-amber-500">
                  <Zap className="h-3 w-3" />
                  Forged for vibe coders
                </p>
              </div>
              <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl font-cinzel uppercase">
                <span className="text-gradient-gold">PromptGuard</span>
                <br />
                <span className="text-foreground/90 font-cormorant normal-case text-3xl md:text-4xl lg:text-5xl">Stop prompt drift with versioned, testable prompts</span>
              </h1>
              <p className="max-w-2xl text-pretty text-base text-muted-foreground md:text-lg lg:text-xl">
                A tiny, deterministic CLI that treats prompts like code: snapshot changes, show section-aware diffs,
                and <strong className="text-foreground">fail loudly in CI</strong> when output contracts drift.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="hero"
                size="lg"
                onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="shadow-glow"
              >
                Try the demo
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("cli")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <Terminal className="mr-2 h-4 w-4" />
                CLI quickstart
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => window.open("https://github.com", "_blank")}
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3 stagger-children">
              <Feature
                icon={<GitBranch className="h-4 w-4" />}
                title="Snapshot + history"
                body="Prompts become auditable artifacts with a baseline you can diff and revert."
              />
              <Feature
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Fail-loud checks"
                body="Required headings + optional JSON contract locks that break CI when drift happens."
              />
              <Feature
                icon={<Terminal className="h-4 w-4" />}
                title="Zero paid APIs"
                body="Just files + JSON + deterministic behavior. Works locally, demoable in minutes."
              />
            </div>
          </div>
        </SpotlightHero>
      </header>

      {/* Why PromptGuard Section */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="grid gap-6 rounded-2xl border bg-gradient-to-br from-surface to-surface-2 p-6 shadow-lift md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Why prompts drift (and why it hurts)</h2>
            <p className="mt-3 text-muted-foreground">
              Prompt drift is when small "harmless" edits accumulate until your prompt no longer produces the expected output.
              Unlike code, prompts rarely have tests — so drift goes unnoticed until it breaks production.
            </p>
            <ul className="mt-4 grid gap-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-red-500">✗</span>
                <span>Someone removes the "Output must be valid JSON" constraint</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-red-500">✗</span>
                <span>A new example contradicts the original intent</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-red-500">✗</span>
                <span>The output schema changes without updating downstream code</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-medium text-amber-600 dark:text-amber-400 font-cormorant text-lg">PromptGuard makes drift obvious</h3>
            <ul className="mt-3 grid gap-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-500">✓</span>
                <span>Required headings enforce structure</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-500">✓</span>
                <span>Section-aware diffs show exactly what changed</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-500">✓</span>
                <span>JSON contract locks fail CI on schema changes</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-amber-500">✓</span>
                <span>Snapshots make every change reviewable</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CLI Section */}
      <section id="cli" className="mx-auto w-full max-w-6xl px-6 pb-10">
        <div className="grid gap-4 rounded-2xl border bg-surface p-6 shadow-lift">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" />
              CLI quickstart
            </div>
            <span className="text-xs text-muted-foreground">Runs with Bun or Node</span>
          </div>

          <div className="grid gap-3">
            <CodeBlock
              id="install"
              title="Install"
              code="bun install"
              copied={copied}
              onCopy={copyToClipboard}
            />
            <CodeBlock
              id="init"
              title="Initialize"
              code="bun tools/promptguard.ts init"
              copied={copied}
              onCopy={copyToClipboard}
            />
            <CodeBlock
              id="snapshot"
              title="Snapshot a prompt"
              code='bun tools/promptguard.ts snapshot prompts/example.prompt.md -m "baseline"'
              copied={copied}
              onCopy={copyToClipboard}
            />
            <CodeBlock
              id="check"
              title="Check (CI-friendly)"
              code="bun tools/promptguard.ts check"
              copied={copied}
              onCopy={copyToClipboard}
            />
            <CodeBlock
              id="diff"
              title="Show diffs"
              code="bun tools/promptguard.ts diff prompts/example.prompt.md"
              copied={copied}
              onCopy={copyToClipboard}
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Snapshots are committed to git by default (configurable via <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">promptguard.config.json</code>).
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-10">
        <h2 className="mb-6 text-center text-2xl font-semibold tracking-tight">Everything you need</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<Eye className="h-5 w-5" />}
            title="Section-aware diffs"
            description="See exactly which sections changed, not just raw line diffs"
          />
          <FeatureCard
            icon={<Lock className="h-5 w-5" />}
            title="Contract locking"
            description="Lock JSON output schemas and fail CI when they drift"
          />
          <FeatureCard
            icon={<GitBranch className="h-5 w-5" />}
            title="Snapshot history"
            description="Review prompt changes over time with full audit trail"
          />
          <FeatureCard
            icon={<Terminal className="h-5 w-5" />}
            title="CI/CD ready"
            description="Machine-readable JSON output for automated pipelines"
          />
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="mx-auto w-full max-w-6xl px-6 pb-16">
        <div className="grid gap-4 rounded-2xl border bg-surface p-6 shadow-lift">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Interactive Demo</h2>
              <p className="text-sm text-muted-foreground">
                Edit the prompt to simulate drift (remove a heading or the JSON block), then run check/diff.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border bg-amber-500/10 px-2.5 py-1 text-xs text-amber-500">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live
              </span>
            </div>
          </div>
          <PromptguardDemo />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-glow">
              <ShieldCheck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-medium font-cinzel">PromptGuard</span>
          </div>
          <p className="text-sm text-muted-foreground font-serif">
            Forged with 🔥 for vibe coders. Open source under MIT license.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition hover:text-foreground"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </main >
  );
};

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-surface-2 p-4 shadow-lift transition hover:shadow-glow hover:border-primary/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border bg-surface shadow-lift">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-surface p-5 shadow-lift transition hover:shadow-glow hover:border-primary/30">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CodeBlock({
  id,
  title,
  code,
  copied,
  onCopy,
}: {
  id: string;
  title: string;
  code: string;
  copied: string | null;
  onCopy: (code: string, id: string) => void;
}) {
  return (
    <div className="group relative">
      <div className="text-xs text-muted-foreground mb-1">{title}</div>
      <div className="flex items-center justify-between rounded-lg border bg-surface-2 px-4 py-3">
        <code className="text-sm font-mono">{code}</code>
        <button
          onClick={() => onCopy(code, id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex h-8 w-8 items-center justify-center rounded-md border bg-surface hover:bg-surface-2"
          title="Copy to clipboard"
        >
          {copied === id ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default Index;
