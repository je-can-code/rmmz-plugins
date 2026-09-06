//region verify-no-sourceless-addstate
/**
 * Verifies that no plugin source file calls `addState` without naming a source battler.
 *
 * `Game_Battler.prototype.addState` is not one method, it is a fork between two entire state
 * systems, and the second parameter is what chooses:
 *
 *   addState(stateId)            → vanilla RPG Maker. turn-based, no JABS_State object.
 *   addState(stateId, source)    → JABS. frame-based <stateDuration>, expire chains, the lot.
 *
 * Everything real-time about a state lives on the JABS_State that only the second form creates.
 * A state applied through the vanilla form still appears on the battler and still shows in a menu,
 * so the mistake produces no error, no warning, and no visible difference at the moment it is
 * made- it produces a state that silently never expires and therefore never advances whatever arc
 * it belonged to. The food chain shipped that way: every chain entry state was applied sourceless,
 * so eating did apply Well Fed and the chain could never move past it.
 *
 * The parameter is named `attacker`, which is what makes this so easy to get wrong. It reads as
 * optional bookkeeping about who inflicted the state, so a self-applied buff looks like a case
 * with nothing to pass. It is not optional and it is not bookkeeping. When a battler applies a
 * state to itself the answer is itself:
 *
 *   caster.addState(stateId, caster);
 *
 * There is no allowlist, deliberately. The one call that genuinely wants vanilla is the fallback
 * inside `addStateWithOverrides`, which runs only when JABS is disabled- and because `addState`
 * routes to vanilla whenever the engine is off regardless of what it was handed, naming the source
 * there costs nothing and behaves identically. Every remaining sourceless call is a bug.
 *
 * Usage:
 *   node src/build-tools/verify-no-sourceless-addstate.js
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_DIR = './src/plugins';

/**
 * Matches a call to `addState` on any receiver, capturing the opening parenthesis position.
 *
 * Anchored on the dot so `addStateWithOverrides` and any other longer name cannot match, since
 * those declare their source in their own signature and are not this fork.
 * @type {RegExp}
 */
const ADD_STATE_CALL = /\.addState\(/g;

/**
 * Determines whether an argument list contains more than one top-level argument.
 *
 * Commas nested inside parentheses, brackets, braces, strings or template literals belong to a
 * sub-expression rather than to this call, so only depth-zero commas outside a quoted run count.
 * @param {string} source The full file contents.
 * @param {number} openIndex Index of the call's opening parenthesis.
 * @returns {boolean} True when a second argument was supplied.
 */
function hasSecondArgument(source, openIndex)
{
  let depth = 0;
  let quote = String.empty;

  for (let i = openIndex; i < source.length; i++)
  {
    const character = source[i];

    // inside a quoted run, only the matching unescaped terminator matters.
    if (quote !== String.empty)
    {
      if (character === '\\')
      {
        i++;
        continue;
      }

      if (character === quote) quote = String.empty;

      continue;
    }

    // a quote of any flavor opens a run that commas cannot escape from.
    if (character === '\'' || character === '"' || character === '`')
    {
      quote = character;
      continue;
    }

    if (character === '(' || character === '[' || character === '{')
    {
      depth++;
      continue;
    }

    if (character === ')' || character === ']' || character === '}')
    {
      depth--;

      // the call's own closing parenthesis- no top-level comma was ever found.
      if (depth === 0) return false;

      continue;
    }

    // a comma directly inside this call's parentheses separates its arguments.
    if (character === ',' && depth === 1) return true;
  }

  // an unbalanced call cannot be judged; treat it as compliant rather than inventing a failure.
  return true;
}

/**
 * Collects every sourceless `addState` call in a single source file.
 * @param {string} filePath Repository-relative path to the source file.
 * @param {string} contents Raw source text.
 * @returns {string[]} Violation messages, one per offending call.
 */
function collectSourcelessAddStateViolations(filePath, contents)
{
  const violations = [];
  ADD_STATE_CALL.lastIndex = 0;
  let match = ADD_STATE_CALL.exec(contents);

  while (match !== null)
  {
    // the captured index sits on the dot; the parenthesis is the last character of the match.
    const openIndex = match.index + match[0].length - 1;
    const lineNumber = contents.slice(0, match.index).split('\n').length;
    const line = contents.split('\n')[lineNumber - 1];

    // a call sitting in a comment is prose about the rule, not a use of it.
    const commentStart = line.indexOf('//');
    const columnInLine = line.indexOf('.addState(');
    const isCommented = commentStart !== -1 && commentStart < columnInLine;

    if (isCommented === false && hasSecondArgument(contents, openIndex) === false)
    {
      violations.push(
        `${filePath}:${lineNumber}: \`addState\` without a source applies a vanilla state — `
        + 'pass the applying battler (itself, for a self-applied state)'
      );
    }

    match = ADD_STATE_CALL.exec(contents);
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
  const files = await glob(`${SRC_PLUGINS_DIR}/**/*.js`);
  const violations = await scanFiles(files, collectSourcelessAddStateViolations);

  if (violations.length === 0)
  {
    Logger.logAnyway(
      'sourceless-addState verify: OK (every state application names its source).',
      LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(
    `sourceless-addState verify FAILED: ${violations.length} violation(s) found.`,
    LogStyle.brightRed);

  for (const message of violations)
  {
    Logger.logAnyway(`  • ${message}`, LogStyle.brightRed);
  }

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-no-sourceless-addstate