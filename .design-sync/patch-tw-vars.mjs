/**
 * Two-pass CSS post-processor for the design-sync bundle.
 *
 * Pass 1 — Remove all --tw-* declarations.
 *   Tailwind injects ~125 --tw-* custom properties as framework-internal
 *   state variables (transforms, rings, shadows, filters) under *, ::before,
 *   ::after, ::backdrop, and individual utility selectors (.hover\:…).
 *   These are not design tokens and must not reach the token scanner at all.
 *   Removing the declaration lines entirely (vs. tagging) is the only way
 *   to clear both the classification check AND the location check.
 *   Empty rule blocks left behind are also cleaned up.
 *
 * Pass 2 — Annotate real :root color tokens with /* @kind color *\/.
 *   The 11 brand tokens are stored as bare HSL triplets and consumed via
 *   hsl(var(--token)), so the scanner cannot infer "color" from the value.
 *   The annotation supplies the missing hint explicitly.
 *
 * Usage: node .design-sync/patch-tw-vars.mjs <css-file>
 * Run after every Tailwind recompile, before the converter.
 */

import { readFileSync, writeFileSync } from 'fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node patch-tw-vars.mjs <css-file>'); process.exit(1); }

let css = readFileSync(file, 'utf8');

// ── Pass 1: remove --tw-* declaration lines ──────────────────────────────────
const twLineRe = /^[ \t]*--tw-[a-z][a-z0-9-]*\s*:[^;]*;[^\n]*\n/gm;
const removedCount = (css.match(twLineRe) ?? []).length;
css = css.replace(twLineRe, '');

// Clean up rule blocks that are now entirely empty (only whitespace between braces).
// Matches:  <selector-text> { <whitespace-only> }
// The selector text must not itself contain { to avoid greedy over-matching.
css = css.replace(/[^{}]+\{\s*\}/g, '');

// ── Pass 2: annotate :root color tokens ──────────────────────────────────────
// Matches the 11 brand tokens by name. All carry bare HSL triplet values
// (e.g.  352 59% 30%) that the scanner cannot auto-classify as colors.
const colorTokenNames = [
  'primary', 'primary-foreground',
  'accent', 'accent-foreground',
  'background', 'foreground',
  'card', 'card-foreground',
  'muted', 'muted-foreground',
  'border',
].join('|');

const colorRe = new RegExp(
  `^([ \\t]*--(${colorTokenNames})\\s*:[^;]+;)$`,
  'gm',
);
css = css.replace(colorRe, '$1 /* @kind color */');
const colorCount = (css.match(/\/\* @kind color \*\//g) ?? []).length;

writeFileSync(file, css, 'utf8');
console.log(`  removed ${removedCount} --tw-* declarations, annotated ${colorCount} color tokens in ${file}`);
