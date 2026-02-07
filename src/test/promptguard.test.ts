import { describe, it, expect } from 'vitest';
import {
  stableHash,
  normalizePrompt,
  parseSections,
  extractFirstJsonFence,
  checkPrompt,
  diffBySection,
} from '../lib/promptguard';

describe('stableHash', () => {
  it('returns consistent hash for same input', () => {
    const h1 = stableHash('hello world');
    const h2 = stableHash('hello world');
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{8}$/);
  });

  it('returns different hash for different input', () => {
    expect(stableHash('a')).not.toBe(stableHash('b'));
  });

  it('handles empty string', () => {
    const h = stableHash('');
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });

  it('handles unicode characters', () => {
    const h = stableHash('你好世界🎉');
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('normalizePrompt', () => {
  it('normalizes CRLF to LF', () => {
    expect(normalizePrompt('a\r\nb')).toBe('a\nb\n');
  });

  it('trims trailing whitespace on lines', () => {
    expect(normalizePrompt('hello   \nworld')).toBe('hello\nworld\n');
  });

  it('collapses multiple blank lines', () => {
    expect(normalizePrompt('a\n\n\n\nb')).toBe('a\n\nb\n');
  });

  it('ensures trailing newline', () => {
    expect(normalizePrompt('no trailing')).toBe('no trailing\n');
  });

  it('handles empty input', () => {
    expect(normalizePrompt('')).toBe('\n');
  });
});

describe('parseSections', () => {
  it('extracts sections from markdown', () => {
    const md = '# Title\ncontent\n## Section\nmore';
    const sections = parseSections(md);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.some(s => s.title === 'Title')).toBe(true);
  });

  it('handles preamble before first heading', () => {
    const md = 'preamble text\n# First';
    const sections = parseSections(md);
    expect(sections[0].title).toBe('__preamble__');
    expect(sections[0].content).toContain('preamble');
  });

  it('tracks heading levels', () => {
    const md = '# H1\n## H2\n### H3';
    const sections = parseSections(md);
    expect(sections.find(s => s.title === 'H1')?.level).toBe(1);
    expect(sections.find(s => s.title === 'H2')?.level).toBe(2);
    expect(sections.find(s => s.title === 'H3')?.level).toBe(3);
  });

  it('handles empty content sections', () => {
    const md = '# Empty\n# Also Empty';
    const sections = parseSections(md);
    expect(sections.length).toBeGreaterThan(0);
  });
});

describe('extractFirstJsonFence', () => {
  it('extracts JSON from fenced block', () => {
    const md = 'text\n```json\n{"key": "value"}\n```\nmore';
    expect(extractFirstJsonFence(md)).toBe('{"key": "value"}');
  });

  it('returns null if no JSON fence', () => {
    expect(extractFirstJsonFence('# No JSON here')).toBeNull();
  });

  it('extracts only first JSON fence', () => {
    const md = '```json\n{"first": true}\n```\n```json\n{"second": true}\n```';
    expect(extractFirstJsonFence(md)).toBe('{"first": true}');
  });

  it('handles multiline JSON', () => {
    const md = '```json\n{\n  "key": "value",\n  "num": 42\n}\n```';
    const result = extractFirstJsonFence(md);
    expect(result).toContain('"key"');
    expect(result).toContain('"num"');
  });
});

describe('checkPrompt', () => {
  it('passes with all required headings', () => {
    const md = '# Goal\ndo stuff\n# Output\nresult';
    const result = checkPrompt(md, { requiredHeadings: ['Goal', 'Output'] });
    expect(result.ok).toBe(true);
  });

  it('fails with missing required heading', () => {
    const md = '# Goal\nstuff';
    const result = checkPrompt(md, { requiredHeadings: ['Goal', 'Missing'] });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toContain('Missing required heading: "Missing"');
    }
  });

  it('is case-insensitive for headings', () => {
    const md = '# GOAL\nstuff';
    const result = checkPrompt(md, { requiredHeadings: ['goal'] });
    expect(result.ok).toBe(true);
  });

  it('checks for JSON block when required', () => {
    const md = '# Goal\nNo JSON here';
    const result = checkPrompt(md, { requireJsonBlock: true });
    expect(result.ok).toBe(false);
  });

  it('passes JSON check when block present', () => {
    const md = '# Goal\n```json\n{"ok": true}\n```';
    const result = checkPrompt(md, { requireJsonBlock: true });
    expect(result.ok).toBe(true);
  });

  it('warns when no headings present', () => {
    const md = 'Just plain text';
    const result = checkPrompt(md, {});
    if (result.ok) {
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });
});

describe('diffBySection', () => {
  it('detects changed sections', () => {
    const old = '# Goal\nold content';
    const newMd = '# Goal\nnew content';
    const diffs = diffBySection(old, newMd);
    expect(diffs.find(d => d.title === 'Goal')?.changed).toBe(true);
  });

  it('detects unchanged sections', () => {
    const md = '# Goal\nsame content';
    const diffs = diffBySection(md, md);
    expect(diffs.every(d => !d.changed)).toBe(true);
  });

  it('detects new sections', () => {
    const old = '# Goal\ncontent';
    const newMd = '# Goal\ncontent\n# New Section\nmore';
    const diffs = diffBySection(old, newMd);
    expect(diffs.some(d => d.title === 'New Section')).toBe(true);
  });

  it('detects removed sections', () => {
    const old = '# Goal\ncontent\n# Old Section\nstuff';
    const newMd = '# Goal\ncontent';
    const diffs = diffBySection(old, newMd);
    const oldSection = diffs.find(d => d.title === 'Old Section');
    expect(oldSection?.changed).toBe(true);
    expect(oldSection?.newPreview).toBe('');
  });

  it('excludes preamble from diffs', () => {
    const old = 'preamble\n# Goal\nA';
    const newMd = 'different preamble\n# Goal\nA';
    const diffs = diffBySection(old, newMd);
    expect(diffs.some(d => d.title === '__preamble__')).toBe(false);
  });

  it('provides preview snippets', () => {
    const md = '# Goal\nLine 1\nLine 2\nLine 3';
    const diffs = diffBySection(md, md);
    const goal = diffs.find(d => d.title === 'Goal');
    expect(goal?.oldPreview).toContain('Line 1');
  });
});
