//region mutate
/**
 * Runs mutation testing over a source file or a whole ship, and reports the mutants that survived.
 *
 * Coverage proves a line ran. It cannot prove anything checked it. Mutation testing closes that gap by
 * deliberately breaking a branch and asking whether any test notices: a mutant that survives on a file
 * already at 100% branch coverage is, by definition, a branch the suite executed without constraining.
 *
 * A survivor is not automatically a defect. Every one falls into exactly one of three buckets, and only
 * reading it tells you which — see docs/mutation-testing.md for how to tell them apart:
 *   1. a missing assertion   - write the test.
 *   2. a redundant guard     - the branch cannot change the outcome because something downstream
 *                              already handles it. A deletion candidate; raise it, do not delete it.
 *   3. equivalent by design  - an optimization that short-circuits work producing the same result.
 *                              Prove it and move on. Never contrive a test to kill one of these.
 *
 * Only the conditional operator is enabled, so the report maps one-to-one onto branch coverage. Scores
 * from different operator sets are not comparable; if that set is ever widened, say so alongside any
 * number it produces.
 *
 * Usage:
 *   bun run mutate src/plugins/_base/core/managers/TraitResolver.js
 *   bun run mutate src/plugins/_base/core
 */
import { readFileSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { glob } from 'glob';
import Logger, { LogStyle } from './logger.js';

/**
 * Mutators Stryker offers that this tool deliberately leaves off, so the report stays one-to-one with
 * branch coverage. Widening this set changes what a score means and makes it incomparable to old runs.
 * @type {string[]}
 */
const DISABLED_MUTATORS = [
  'ArithmeticOperator', 'ArrayDeclaration', 'ArrowFunction', 'AssignmentOperator', 'BlockStatement',
  'BooleanLiteral', 'EqualityOperator', 'LogicalOperator', 'MethodExpression', 'ObjectLiteral',
  'OptionalChaining', 'Regex', 'StringLiteral', 'UnaryOperator', 'UpdateOperator',
];

/**
 * Whether a source path sits outside the surface coverage measures, mirroring vitest.config.js.
 * Mutating an unmeasured file produces expected survivors that bury the real ones.
 * @param {string} sourcePath Repository-relative path to a plugin source file.
 * @returns {boolean}
 */
function isExcluded(sourcePath)
{
  if (sourcePath.includes('/_metadata/_annotations.js')) return true;

  if (sourcePath.includes('/_metadata/meta.js')) return true;

  if (sourcePath.includes('/vite.config.')) return true;

  if (sourcePath.endsWith('/entry.js')) return true;

  // an unfinished plugin's survivors are expected rather than informative.
  if (sourcePath.includes('src/plugins/abs/ext/star/')) return true;

  if (sourcePath.includes('/sprites/')) return true;

  // the view layer is unmeasured everywhere except the one family already lifted into coverage.
  const isSaveFamily = sourcePath.includes('src/plugins/_base/ext/save/');
  if (sourcePath.includes('/scenes/') && !isSaveFamily) return true;

  if (sourcePath.includes('/windows/') && !isSaveFamily) return true;

  return false;
}

/**
 * Expands the requested target into the concrete list of files worth mutating.
 * @param {string} target A source file, or a directory to scan recursively.
 * @returns {Promise<string[]>}
 */
async function resolveTargets(target)
{
  if (!existsSync(target))
  {
    Logger.logAnyway(`no such path: ${target}`, LogStyle.brightRed);
    process.exit(1);
  }

  if (statSync(target).isFile()) return [ target ];

  const found = await glob(`${target.replace(/\/$/, '')}/**/*.js`);

  return found.filter(sourcePath => !isExcluded(sourcePath));
}

/**
 * Writes the Stryker configuration this run needs into a scratch directory outside the repository, so
 * a scan never leaves an untracked file behind in a tree it is only reading.
 * @param {string[]} targets The source files to mutate.
 * @param {string} scratchDir The throwaway directory holding the config and the JSON report.
 * @returns {{configPath: string, reportPath: string}}
 */
function writeConfig(targets, scratchDir)
{
  const reportPath = join(scratchDir, 'report.json');
  const configPath = join(scratchDir, 'stryker.config.json');

  writeFileSync(configPath, JSON.stringify({
    testRunner: 'vitest',
    reporters: [ 'json' ],
    jsonReporter: { fileName: reportPath },
    // run only the tests that actually executed each mutant; roughly an order of magnitude faster.
    coverageAnalysis: 'perTest',
    // stryker's typescript preprocessor fires on the repo's tsconfig and demands a package this
    // pure-JS repo does not have. keeping the file out of the sandbox is cheaper than installing it.
    ignorePatterns: [ '/tsconfig.json' ],
    mutate: targets,
    mutator: { excludedMutations: DISABLED_MUTATORS },
    tempDirName: join(scratchDir, 'sandbox'),
    timeoutMS: 60_000,
    concurrency: 4,
    cleanTempDir: true,
  }, null, 2), 'utf8');

  return { configPath, reportPath };
}

/**
 * Rebuilds absolute character offsets for each line so a mutant's location can be sliced back out of
 * the source. Stryker reports 1-based line and column, and the exact expression matters far more than
 * the line: it emits several mutants per line, one per sub-expression.
 * @param {string} source The full source text of the mutated file.
 * @returns {number[]}
 */
function lineOffsets(source)
{
  const offsets = [ 0 ];
  source.split('\n')
    .forEach(line => offsets.push(offsets[offsets.length - 1] + line.length + 1));

  return offsets;
}

/**
 * Prints one file's surviving mutants, each beside the expression it replaced.
 * @param {string} filePath Absolute path of the mutated file, as Stryker reported it.
 * @param {object} fileReport The per-file section of Stryker's JSON report.
 * @returns {{tested: number, killed: number, survived: number}}
 */
function reportFile(filePath, fileReport)
{
  const { source } = fileReport;
  const offsets = lineOffsets(source);
  const at = (location) => offsets[location.line - 1] + location.column - 1;

  const tested = fileReport.mutants.filter(mutant => mutant.status !== 'Ignored');
  const killed = tested.filter(mutant => mutant.status === 'Killed' || mutant.status === 'Timeout');
  const survived = tested.filter(mutant => mutant.status === 'Survived')
    .sort((a, b) => a.location.start.line - b.location.start.line);

  if (tested.length === 0) return { tested: 0, killed: 0, survived: 0 };

  const score = (killed.length / tested.length * 100).toFixed(1);
  const relative = filePath.replace(`${process.cwd()}/`, '');
  Logger.logAnyway(`${score.padStart(6)}%  ${String(survived.length).padStart(3)} survived / ` +
    `${String(tested.length).padStart(4)}  ${relative}`, survived.length === 0 ? LogStyle.brightGreen : LogStyle.reset);

  survived.forEach(mutant =>
  {
    const was = source.slice(at(mutant.location.start), at(mutant.location.end))
      .replace(/\s+/g, ' ');
    Logger.logAnyway(`         L${String(mutant.location.start.line).padStart(4)}  -> ` +
      `${JSON.stringify(mutant.replacement).padEnd(8)}  was: ${was.slice(0, 74)}`);
  });

  return { tested: tested.length, killed: killed.length, survived: survived.length };
}

// argv[0] is the runtime and argv[1] is this script; the target is the first thing the caller typed.
const [ , , target ] = process.argv;

if (!target)
{
  Logger.logAnyway('usage: bun run mutate <source-file-or-directory>', LogStyle.brightRed);
  process.exit(1);
}

const targets = await resolveTargets(target);

if (targets.length === 0)
{
  Logger.logAnyway(`nothing measurable under ${target}`, LogStyle.brightRed);
  process.exit(1);
}

const scratchDir = mkdtempSync(join(tmpdir(), 'rmmz-mutate-'));
const { configPath, reportPath } = writeConfig(targets, scratchDir);

Logger.logAnyway(`mutating ${targets.length} file(s) under ${target}...`);

spawnSync('./node_modules/.bin/stryker', [ 'run', configPath ],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: 'ignore' });

if (!existsSync(reportPath))
{
  Logger.logAnyway('stryker produced no report; re-run without --quiet wiring to see its output.', LogStyle.brightRed);
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const totals = { tested: 0, killed: 0, survived: 0 };

Object.entries(report.files)
  .sort(([ a ], [ b ]) => basename(a).localeCompare(basename(b)))
  .forEach(([ filePath, fileReport ]) =>
  {
    const fileTotals = reportFile(filePath, fileReport);
    totals.tested += fileTotals.tested;
    totals.killed += fileTotals.killed;
    totals.survived += fileTotals.survived;
  });

if (totals.tested === 0)
{
  Logger.logAnyway('no conditions to mutate here.', LogStyle.brightGreen);
  process.exit(0);
}

const overall = (totals.killed / totals.tested * 100).toFixed(1);
Logger.logAnyway(`\n${overall}% mutation score - ${totals.killed} killed, ${totals.survived} survived, ` +
  `${totals.tested} mutants across ${targets.length} file(s).`, LogStyle.brightGreen);
Logger.logAnyway('read every survivor before acting: missing assertion, redundant guard, or equivalent by ' +
  'design. See docs/mutation-testing.md.');
//endregion mutate
