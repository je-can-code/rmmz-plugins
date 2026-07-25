//region verify-no-typeof
/**
 * Verifies that no plugin source file uses `typeof` outside of JsonMapper.
 *
 * JsonMapper is the sole sanctioned type-narrowing boundary in this codebase — it is the raw
 * RMMZ plugin-parameter parser and inspecting types is literally its job. Every other plugin
 * relies on JsonMapper (or the JMZ data editor) to produce correctly typed values and must
 * trust those contracts without re-checking them.
 *
 * All JSON config files in this project are authored by the JMZ data editor, never by hand.
 * The editor guarantees output shape; `JSON.parse` either succeeds or throws. There is no
 * human-at-a-keyboard boundary where a `typeof` guard could be meaningful.
 *
 * Usage:
 *   node src/build-tools/verify-no-typeof.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_DIR = './src/plugins';

/**
 * The one file allowed to contain `typeof` — it IS the type boundary.
 * @type {string}
 */
const EXEMPT_BASENAME = 'JsonMapper.js';

/**
 * Collects every line in a source file that contains a `typeof` expression outside a comment.
 * @param {string} filePath Repository-relative path to the source file.
 * @param {string} contents Raw source text.
 * @returns {string[]} Violation messages, one per offending line.
 */
function collectTypeofViolations(filePath, contents)
{
  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // fast-path: skip lines that don't mention typeof at all.
    if (line.includes('typeof') === false)
    {
      continue;
    }

    // strip the inline-comment tail so `// typeof` never triggers a violation.
    const commentStart = line.indexOf('//');
    const codePart = commentStart === -1
      ? line
      : line.slice(0, commentStart);

    // only flag if typeof survives in the non-comment portion.
    if (codePart.includes('typeof') === false)
    {
      continue;
    }

    // record the violation with a file:line reference for easy navigation.
    violations.push(
      `${filePath}:${lineIndex + 1}: \`typeof\` is forbidden outside JsonMapper — trust the contract`
    );
  }

  return violations;
}

/**
 * Scans a list of files with a collector function and aggregates all violations.
 * @param {string[]} files Paths to scan.
 * @param {(filePath: string, contents: string) => string[]} collector Violation collector.
 * @returns {Promise<string[]>}
 */
async function scanFiles(files, collector)
{
  const violations = [];

  for (const filePath of files)
  {
    const contents = await fs.readFile(filePath, 'utf-8');
    violations.push(...collector(path.normalize(filePath), contents));
  }

  return violations;
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code — 0 for clean, 1 for violations found.
 */
async function main()
{
  // scan all plugin source files, excluding the one file that is allowed to use typeof.
  const files = await glob(`${SRC_PLUGINS_DIR}/**/*.js`, {
    ignore: [ `**/${EXEMPT_BASENAME}` ],
  });

  const violations = await scanFiles(files, collectTypeofViolations);

  if (violations.length === 0)
  {
    Logger.logAnyway('typeof verify: OK (no typeof usage in plugin source).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`typeof verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);

  for (const message of violations)
  {
    Logger.logAnyway(`  • ${message}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-typeof
