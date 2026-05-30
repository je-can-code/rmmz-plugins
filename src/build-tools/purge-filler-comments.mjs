/**
 * Removes agent-generated filler inline comments from all plugin and build-tool source files.
 * These patterns were inserted mechanically to satisfy a comment-density check without
 * contributing any real information. They are noise, not documentation.
 *
 * Usage:
 *   node src/build-tools/purge-filler-comments.mjs
 *   node src/build-tools/purge-filler-comments.mjs --dry-run
 */
import * as fs from 'node:fs/promises';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Patterns that match known filler comment lines produced by AI agents.
 * Each pattern anchors to the full trimmed line to avoid false positives on real prose.
 * @type {RegExp[]}
 */
const FILLER_PATTERNS = [
  // "hand back <expr> to the caller." — restates the return value verbatim.
  /^\s*\/\/ hand back .+ to the caller\.\s*$/,
  // "policy step inside <functionName>." — meaningless positional label.
  /^\s*\/\/ policy step inside .+\.\s*$/,
  // "capture <var> for downstream policy in this routine." — names the variable.
  /^\s*\/\/ capture .+ for downstream policy in this routine\.\s*$/,
  // "when <condition>, take this branch." — restates the if-condition in English.
  /^\s*\/\/ when .+, take this branch\.\s*$/,
  // "iterate the loop counter until the guard exits." — describes any for-loop.
  /^\s*\/\/ iterate the loop counter until the guard exits\.\s*$/,
  // "walk each entry in the iterable for this routine." — describes any for-of.
  /^\s*\/\/ walk each entry in the iterable for this routine\.\s*$/,
  // "handle this switch arm for the current discriminant." — names a case block.
  /^\s*\/\/ handle this switch arm for the current discriminant\.\s*$/,
  // "dispatch on the discriminant for the next policy branch." — restates switch().
  /^\s*\/\/ dispatch on the discriminant for the next policy branch\.\s*$/,
];

/**
 * Returns true when this source line is a known filler comment.
 * @param {string} line Raw line from a source file.
 * @returns {boolean}
 */
function isFillerLine(line)
{
  return FILLER_PATTERNS.some(pattern => pattern.test(line));
}

/**
 * Collapses runs of more than one blank line into a single blank line.
 * Removing comment lines can leave double-blanks that look wrong.
 * @param {string[]} lines Array of source lines.
 * @returns {string[]}
 */
function collapseBlankLines(lines)
{
  const result = [];
  let prevBlank = false;

  for (const line of lines)
  {
    const isBlank = line.trim().length === 0;

    if (isBlank && prevBlank) continue;

    result.push(line);
    prevBlank = isBlank;
  }

  return result;
}

const files = await glob([
  'src/plugins/**/*.js',
  'src/build-tools/**/*.js',
]);

let totalRemoved = 0;
let filesChanged = 0;

for (const file of files)
{
  const content = await fs.readFile(file, 'utf-8');
  const lines = content.split('\n');
  const filtered = lines.filter(line => isFillerLine(line) === false);

  if (filtered.length === lines.length) continue;

  const collapsed = collapseBlankLines(filtered);
  const removed = lines.length - filtered.length;
  totalRemoved += removed;
  filesChanged++;

  console.log(`  ${file}: -${removed}`);

  if (DRY_RUN === false)
  {
    await fs.writeFile(file, collapsed.join('\n'));
  }
}

const label = DRY_RUN ? '[dry-run] would remove' : 'removed';
console.log(`\nDone: ${label} ${totalRemoved} filler lines from ${filesChanged} files.`);