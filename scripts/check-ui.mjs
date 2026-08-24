#!/usr/bin/env node
/**
 * UI consistency checker.
 *
 * Two kinds of rule:
 *   - HARD rules must stay at zero. They cover the mechanical drift that
 *     flattened the UI before: ad-hoc font sizes, shouting section headers,
 *     four different divider weights, a redundant radius step.
 *   - RATCHET rules track debt that is too large to fix in one pass (mostly
 *     raw <button> instead of the Button component). They may only go down.
 *     Update scripts/ui-baseline.json when you burn some down.
 *
 * Run: npm run lint:ui        Update the ratchet: npm run lint:ui -- --update
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const BASELINE = path.join(ROOT, 'scripts', 'ui-baseline.json');
const UPDATE = process.argv.includes('--update');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(full)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const rel = (f) => path.relative(ROOT, f);

/** Which feature a file belongs to, for the ratchet. */
function featureOf(file) {
  const m = rel(file).match(/^src\/features\/([^/]+)\//);
  return m ? m[1] : 'shared';
}

const HARD_RULES = [
  {
    id: 'no-arbitrary-font-size',
    // text-[0.85em] and friends are relative and fine; pixel values are not.
    test: (line) => line.match(/text-\[[0-9.]+(px|rem)\]/g),
    hint: 'Use text-2xs (11) / text-xs (12) / text-sm (14) / text-base (16).',
  },
  {
    id: 'no-shouting-headers',
    // Chips and badges legitimately shout; they are the ones with a radius.
    test: (line) =>
      /\buppercase\b/.test(line) && !/rounded/.test(line) ? ['uppercase'] : null,
    hint: 'Sentence case for headings and labels. Keep uppercase for short chips only.',
  },
  {
    id: 'one-divider-weight',
    test: (line) => line.match(/border-border\/(?!60\b)[0-9]+/g),
    hint: 'Dividers are border-border/60. Nothing else.',
  },
  {
    id: 'no-redundant-radius',
    // rounded-sm (4px) survives for controls under ~20px, e.g. the checkbox.
    test: (line) => line.match(/\brounded-md\b/g),
    hint: 'sm 4px (tiny) · lg 12px (controls) · xl 14px (surfaces) · 2xl 16px (modals) · full (pills).',
  },
  {
    id: 'no-primary-variant',
    test: (line) => line.match(/variant="primary"/g),
    hint: 'The default Button variant is already the brand primary.',
  },
  {
    id: 'no-manual-primary-fill',
    test: (line) =>
      /<Button[^>]*bg-primary text-primary-foreground/.test(line)
        ? ['bg-primary on Button']
        : null,
    hint: 'Drop the className; the default variant paints itself.',
  },
];

const violations = [];
const rawButtons = {};

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // Escape hatch: `ui-ok` on the line or the one above it. Write why.
    const suppressed = /ui-ok/.test(line) || (i > 0 && /ui-ok/.test(lines[i - 1]));
    if (suppressed) return;
    for (const rule of HARD_RULES) {
      const hits = rule.test(line);
      if (hits && hits.length) {
        violations.push({ rule, file: rel(file), line: i + 1, hits: [...new Set(hits)].join(', ') });
      }
    }
  });
  const raw = (fs.readFileSync(file, 'utf8').match(/<button\b/g) || []).length;
  if (raw) rawButtons[featureOf(file)] = (rawButtons[featureOf(file)] || 0) + raw;
}

if (UPDATE) {
  fs.writeFileSync(BASELINE, JSON.stringify({ rawButtons }, null, 2) + '\n');
  console.log('Baseline updated:', rel(BASELINE));
}

let failed = false;

if (violations.length) {
  failed = true;
  const byRule = new Map();
  for (const v of violations) {
    if (!byRule.has(v.rule.id)) byRule.set(v.rule.id, { hint: v.rule.hint, items: [] });
    byRule.get(v.rule.id).items.push(v);
  }
  for (const [id, { hint, items }] of byRule) {
    console.error(`\n✗ ${id} — ${items.length} violation(s)`);
    console.error(`  ${hint}`);
    for (const v of items.slice(0, 12)) console.error(`  ${v.file}:${v.line}  (${v.hits})`);
    if (items.length > 12) console.error(`  … and ${items.length - 12} more`);
  }
}

if (!UPDATE && fs.existsSync(BASELINE)) {
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).rawButtons || {};
  const regressions = [];
  for (const [feature, count] of Object.entries(rawButtons)) {
    const allowed = baseline[feature] ?? 0;
    if (count > allowed) regressions.push(`${feature}: ${count} raw <button>, baseline ${allowed}`);
  }
  if (regressions.length) {
    failed = true;
    console.error('\n✗ raw-button-ratchet — new raw <button> elements');
    console.error('  Use <Button> from @/shared/components/ui/button so size, radius and');
    console.error('  emphasis come from one place.');
    for (const r of regressions) console.error(`  ${r}`);
  }
}

if (failed) {
  console.error('\nUI check failed. See .claude/skills/ui-design-system/SKILL.md\n');
  process.exit(1);
}

const debt = Object.values(rawButtons).reduce((a, b) => a + b, 0);
console.log(`UI check passed. Raw <button> debt: ${debt} (ratchet holds).`);
