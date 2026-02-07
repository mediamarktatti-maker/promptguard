export type PromptSection = {
  title: string;
  level: number;
  content: string;
};

export type PromptGuardConfig = {
  requiredHeadings?: string[];
  /** If true, require at least one fenced ```json block in the prompt */
  requireJsonBlock?: boolean;
};

export type PromptGuardCheckResult =
  | { ok: true; warnings: string[] }
  | { ok: false; errors: string[] };

/**
 * Deterministic, sync, runtime-agnostic hash for change detection.
 * Not cryptographic (by design) — used to make section diffs fast in-browser.
 */
export function stableHash(text: string): string {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned hex
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizePrompt(input: string): string {
  // Deterministic whitespace normalization: keeps meaning, stabilizes diffs.
  let s = input.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.trimEnd() + "\n";
  return s;
}

export function parseSections(markdown: string): PromptSection[] {
  const md = normalizePrompt(markdown);
  const lines = md.split("\n");
  const sections: PromptSection[] = [];

  let currentTitle = "__preamble__";
  let currentLevel = 0;
  let buf: string[] = [];

  const flush = () => {
    const content = buf.join("\n").trimEnd();
    sections.push({ title: currentTitle, level: currentLevel, content });
    buf = [];
  };

  for (const line of lines) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      currentLevel = m[1].length;
      currentTitle = m[2];
      continue;
    }
    buf.push(line);
  }
  flush();

  return sections;
}

export function extractFirstJsonFence(markdown: string): string | null {
  const md = normalizePrompt(markdown);
  const match = md.match(/```json\s*\n([\s\S]*?)\n```/i);
  return match ? match[1].trim() : null;
}

export function checkPrompt(markdown: string, config: PromptGuardConfig): PromptGuardCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sections = parseSections(markdown);
  const headingTitles = new Set(
    sections
      .filter((s) => s.title !== "__preamble__")
      .map((s) => s.title.trim().toLowerCase()),
  );

  const required = (config.requiredHeadings ?? []).map((h) => h.trim()).filter(Boolean);
  for (const h of required) {
    if (!headingTitles.has(h.toLowerCase())) {
      errors.push(`Missing required heading: "${h}" — add \`## ${h}\` to your prompt`);
    }
  }

  if (config.requireJsonBlock) {
    const json = extractFirstJsonFence(markdown);
    if (!json) errors.push("Missing required JSON block — add \\`\\`\\`json\\n{...}\\n\\`\\`\\` to your prompt");
  }

  // Gentle nudge: if there are no headings at all, prompts drift fast.
  if (sections.filter((s) => s.title !== "__preamble__").length === 0) {
    warnings.push("No markdown headings detected — consider adding sections like 'Constraints' and 'Output'.");
  }

  return errors.length ? { ok: false, errors } : { ok: true, warnings };
}

export type SectionDiff = {
  title: string;
  changed: boolean;
  oldHash: string;
  newHash: string;
  oldPreview: string;
  newPreview: string;
};

export function diffBySection(oldMd: string, newMd: string): SectionDiff[] {
  const oldSections = parseSections(oldMd);
  const newSections = parseSections(newMd);

  const oldMap = new Map(oldSections.map((s) => [s.title, s]));
  const newMap = new Map(newSections.map((s) => [s.title, s]));
  const titles = Array.from(new Set([...oldMap.keys(), ...newMap.keys()]));

  const preview = (t: string) =>
    t
      .split("\n")
      .slice(0, 8)
      .join("\n")
      .trimEnd();

  return titles
    .filter((t) => t !== "__preamble__")
    .map((title) => {
      const a = oldMap.get(title)?.content ?? "";
      const b = newMap.get(title)?.content ?? "";
      const oldHash = stableHash(a);
      const newHash = stableHash(b);
      return {
        title,
        changed: oldHash !== newHash,
        oldHash,
        newHash,
        oldPreview: preview(a),
        newPreview: preview(b),
      };
    });
}
