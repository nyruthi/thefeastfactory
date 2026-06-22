/**
 * Annotate Tailwind internal custom properties with /* @kind other *\/
 * so the design-system token scanner skips them as framework machinery.
 *
 * Covers both the preflight reset block (*, ::before, ::after, ::backdrop)
 * and per-utility inline declarations (--tw-translate-x inside hover rules, etc.).
 *
 * Usage: node .design-sync/patch-tw-vars.mjs <css-file>
 */

import { readFileSync, writeFileSync } from 'fs';

const file = process.argv[2];
if (!file) { console.error('Usage: node patch-tw-vars.mjs <css-file>'); process.exit(1); }

const original = readFileSync(file, 'utf8');

// Match any --tw-* property declaration and append the annotation if not already present.
// Pattern: --tw-<name>   :   <value>   ;
// The annotation must sit between the semicolon and the newline so the CSS remains valid.
const patched = original.replace(
  /(--tw-[a-z][a-z0-9-]*\s*:[^;]*;)(?!\s*\/\* @kind other \*\/)/g,
  '$1 /* @kind other */',
);

const count = (patched.match(/\/\* @kind other \*\//g) ?? []).length;
writeFileSync(file, patched, 'utf8');
console.log(`  patched ${count} --tw-* declarations in ${file}`);
