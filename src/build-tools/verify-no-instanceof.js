//region verify-no-instanceof
/**
 * Verifies that no plugin source file uses `instanceof` outside of the documented allowlist.
 *
 * The ideal is that plugin code never needs instanceof: hydrated RPG_* models carry semantic
 * predicate methods (isSkill, isEquipItem, isActor, isMapScene, …), and SerializableRegistry
 * restores class prototypes across JsonEx round-trips so deserialization guards are unnecessary.
 *
 * The allowlisted files each contain an instanceof use that has been reviewed and cannot be
 * replaced with a semantic alternative:
 *
 *   RPGManager.js          — `instanceof RPG_Base` resolves clones to their _original() for
 *                            cache keying; genuine polymorphic boundary with no semantic hook.
 *   JABS_HitboxPulseOptions.js — polymorphic factory that accepts an instance-or-partial-literal;
 *                            caller decides which shape to pass.
 *   JABS_StandardController.js — `instanceof Map` at a JsonEx boundary; native Map cannot be
 *                            registered with SerializableRegistry.
 *   time/Scene_Base.js     — `instanceof scene` where `scene` is a dynamic class variable
 *                            supplied by the caller; no semantic method can cover arbitrary classes.
 *   ParameterRegistry.js   — `instanceof ParameterDefinition` at the public API entry point;
 *                            legitimate input validation at a real external boundary.
 *
 * Usage:
 *   node src/build-tools/verify-no-instanceof.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_DIR = './src/plugins';

/**
 * Files permitted to contain `instanceof` — each entry is a normalized path relative to the
 * repository root. Additions require a written justification in this comment block above.
 * @type {string[]}
 */
const ALLOWLIST = [
  path.normalize('src/plugins/_base/managers/RPGManager.js'),
  path.normalize('src/plugins/abs/core/models/JABS_HitboxPulseOptions.js'),
  path.normalize('src/plugins/abs/ext/input/_models/JABS_StandardController.js'),
  path.normalize('src/plugins/time/core/scenes/Scene_Base.js'),
  path.normalize('src/plugins/_base/core/ParameterRegistry.js'),
];

/**
 * Collects every line in a source file that contains an `instanceof` expression outside a comment.
 * @param {string} filePath Repository-relative path to the source file.
 * @param {string} contents Raw source text.
 * @returns {string[]} Violation messages, one per offending line.
 */
function collectInstanceofViolations(filePath, contents)
{
  const violations = [];
  const lines = contents.split('\n');

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++)
  {
    const line = lines[lineIndex];

    // fast-path: skip lines that don't mention instanceof at all.
    if (line.includes('instanceof') === false)
    {
      continue;
    }

    // strip the inline-comment tail so `// instanceof` never triggers a violation.
    const commentStart = line.indexOf('//');
    const codePart = commentStart === -1
      ? line
      : line.slice(0, commentStart);

    // only flag if instanceof survives in the non-comment portion.
    if (codePart.includes('instanceof') === false)
    {
      continue;
    }

    // record the violation with a file:line reference for easy navigation.
    violations.push(
      `${filePath}:${lineIndex + 1}: \`instanceof\` is forbidden outside the allowlist — add a semantic predicate or document the exception`
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
    const normalizedPath = path.normalize(filePath);

    // skip allowlisted files — their instanceof uses have been reviewed and documented above.
    if (ALLOWLIST.some(allowed => normalizedPath.endsWith(allowed)))
    {
      continue;
    }

    const contents = await fs.readFile(filePath, 'utf-8');
    violations.push(...collector(normalizedPath, contents));
  }

  return violations;
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code — 0 for clean, 1 for violations found.
 */
async function main()
{
  const files = await glob(`${SRC_PLUGINS_DIR}/**/*.js`);
  const violations = await scanFiles(files, collectInstanceofViolations);

  if (violations.length === 0)
  {
    Logger.logAnyway('instanceof verify: OK (no instanceof usage outside allowlist).', LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`instanceof verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);

  for (const message of violations)
  {
    Logger.logAnyway(`  • ${message}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-instanceof
