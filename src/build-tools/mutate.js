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
 *   bun run mutate src/plugins/_base/core --concurrency 8
 *   bun run mutate src/plugins/_base/core --out .tmp/mutation/base-core.json
 *   bun run mutate src/plugins/hud/core --all-tests
 *
 * That last flag exists because Vitest normally narrows the suite to the test files it can prove are
 * related to the mutated source, and it proves that from the static module graph. A test reaching its
 * subject through a dynamic `import(someVariable)` leaves no static edge, so Vitest reports that no
 * test relates to the file and Stryker exits without scanning the ship at all. Passing --all-tests
 * widens the net to the whole suite: far slower, since every run pays for the full suite up front,
 * but it is the difference between a result and no result for those ships.
 */
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, basename, dirname } from 'node:path';
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
 * The flags this tool accepts, each of which consumes the argument immediately following it. Listing
 * them lets the positional target be found by elimination rather than by position, so a target may sit
 * before or after its flags without the caller having to remember which order this tool prefers.
 * @type {string[]}
 */
const VALUE_FLAGS = [ '--out', '--concurrency' ];

/**
 * How many mutants Stryker runs at once when the caller does not say. Four is deliberately modest:
 * throughput flattens hard above it while memory keeps climbing, so the extra workers buy far less
 * than they cost on a machine that is doing anything else at the same time.
 * @type {string}
 */
const DEFAULT_CONCURRENCY = '4';

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
 * Reads the value sitting immediately after a flag, or the given fallback when the flag is absent.
 * Every flag this tool takes is optional, so a missing one is an ordinary outcome rather than an error.
 * @param {string[]} args The command line arguments, runtime and script name already dropped.
 * @param {string} flag The flag whose value is wanted, including its leading dashes.
 * @param {string} fallback The value to use when the caller did not pass that flag.
 * @returns {string}
 */
function flagValue(args, flag, fallback)
{
  const index = args.indexOf(flag);

  if (index === -1) return fallback;

  return args[index + 1];
}

/**
 * Separates the positional target from the optional flags surrounding it, so the caller may write the
 * path before or after the flags. Anything beginning with a dash is a flag, and anything directly
 * following one of the value-taking flags belongs to that flag rather than being the target.
 * @param {string[]} args The command line arguments, runtime and script name already dropped.
 * @returns {{target: string, outPath: string, concurrency: number, allTests: boolean}}
 */
function parseArguments(args)
{
  const positional = args.filter((argument, index) =>
  {
    // a flag is never the target.
    if (argument.startsWith('--')) return false;

    // neither is the value that belongs to one.
    const previous = args[index - 1];

    return !VALUE_FLAGS.includes(previous);
  });

  const outPath = flagValue(args, '--out', '');
  const requestedConcurrency = flagValue(args, '--concurrency', DEFAULT_CONCURRENCY);
  const allTests = args.includes('--all-tests');

  return { target: positional[0], outPath, concurrency: Number(requestedConcurrency), allTests };
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
 * @param {number} concurrency How many mutants Stryker may run at once.
 * @param {boolean} allTests Whether to consider the whole suite rather than only the tests Vitest can
 * statically prove are related to the mutated files.
 * @returns {{configPath: string, reportPath: string}}
 */
function writeConfig(targets, scratchDir, concurrency, allTests)
{
  const reportPath = join(scratchDir, 'report.json');
  const configPath = join(scratchDir, 'stryker.config.json');

  writeFileSync(configPath, JSON.stringify({
    // `related` narrows the suite using the static module graph, which a test that imports its subject
    // through a variable path is invisible to. Turning it off is the only way those files get scanned.
    vitest: { related: !allTests },
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
    concurrency,
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
 * Reduces one file's section of Stryker's report to the numbers and the survivors worth keeping, each
 * survivor carried beside the exact expression it replaced. The full location is kept rather than only
 * the line, because several mutants routinely share a start line and keying on the line alone silently
 * collapses them into one when a later run is compared against this one.
 * @param {string} filePath Absolute path of the mutated file, as Stryker reported it.
 * @param {object} fileReport The per-file section of Stryker's JSON report.
 * @returns {{path: string, tested: number, killed: number, survivors: object[]}}
 */
function collectFile(filePath, fileReport)
{
  const { source } = fileReport;
  const offsets = lineOffsets(source);
  const at = (location) => offsets[location.line - 1] + location.column - 1;

  const tested = fileReport.mutants.filter(mutant => mutant.status !== 'Ignored');
  const killed = tested.filter(mutant => mutant.status === 'Killed' || mutant.status === 'Timeout');
  const survived = tested.filter(mutant => mutant.status === 'Survived');
  survived.sort((a, b) => a.location.start.line - b.location.start.line);

  const survivors = survived.map(mutant =>
  {
    const start = at(mutant.location.start);
    const end = at(mutant.location.end);
    const was = source.slice(start, end)
      .replace(/\s+/g, ' ');

    return {
      line: mutant.location.start.line,
      column: mutant.location.start.column,
      endLine: mutant.location.end.line,
      endColumn: mutant.location.end.column,
      replacement: mutant.replacement,
      was,
    };
  });

  const relative = filePath.replace(`${process.cwd()}/`, '');

  return { path: relative, tested: tested.length, killed: killed.length, survivors };
}

/**
 * Prints one file's score followed by every survivor it still carries, each beside the expression it
 * replaced. A file holding nothing mutable stays silent rather than reporting a meaningless zero.
 * @param {{path: string, tested: number, killed: number, survivors: object[]}} summary One file's
 * reduced report, as produced by {@link collectFile}.
 * @returns {void}
 */
function printFile(summary)
{
  const { path, tested, killed, survivors } = summary;

  if (tested === 0) return;

  const score = (killed / tested * 100).toFixed(1);
  const style = survivors.length === 0 ? LogStyle.brightGreen : LogStyle.reset;
  Logger.logAnyway(`${score.padStart(6)}%  ${String(survivors.length).padStart(3)} survived / ` +
    `${String(tested).padStart(4)}  ${path}`, style);

  survivors.forEach(survivor =>
  {
    Logger.logAnyway(`         L${String(survivor.line).padStart(4)}  -> ` +
      `${JSON.stringify(survivor.replacement).padEnd(8)}  was: ${survivor.was.slice(0, 74)}`);
  });
}

/**
 * Persists the whole run as JSON so a scan survives the terminal that produced it. The operator set is
 * written alongside the numbers on purpose: a mutation score means nothing without it, and a report
 * read weeks later has no other way to know which mutators were in play when it was made.
 * @param {string} outPath Where to write the report; parent directories are created as needed.
 * @param {object} payload The finished report, ready to serialize.
 * @returns {void}
 */
function writeReport(outPath, payload)
{
  mkdirSync(dirname(outPath), { recursive: true });
  const serialized = JSON.stringify(payload, null, 2);
  writeFileSync(outPath, serialized, 'utf8');
  Logger.logAnyway(`report written to ${outPath}`, LogStyle.brightCyan);
}

const { target, outPath, concurrency, allTests } = parseArguments(process.argv.slice(2));

if (!target)
{
  Logger.logAnyway('usage: bun run mutate <source-file-or-directory> [--concurrency N] [--out FILE]',
    LogStyle.brightRed);
  process.exit(1);
}

const targets = await resolveTargets(target);

if (targets.length === 0)
{
  Logger.logAnyway(`nothing measurable under ${target}`, LogStyle.brightRed);
  process.exit(1);
}

const scratchDir = mkdtempSync(join(tmpdir(), 'rmmz-mutate-'));
const { configPath, reportPath } = writeConfig(targets, scratchDir, concurrency, allTests);

Logger.logAnyway(`mutating ${targets.length} file(s) under ${target} at concurrency ${concurrency}...`);

spawnSync('./node_modules/.bin/stryker', [ 'run', configPath ],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: 'ignore' });

if (!existsSync(reportPath))
{
  Logger.logAnyway('stryker produced no report; re-run without --quiet wiring to see its output.', LogStyle.brightRed);
  process.exit(1);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const totals = { tested: 0, killed: 0, survived: 0 };

const entries = Object.entries(report.files);
entries.sort(([ a ], [ b ]) => basename(a).localeCompare(basename(b)));

const summaries = entries.map(([ filePath, fileReport ]) => collectFile(filePath, fileReport));

summaries.forEach(summary =>
{
  printFile(summary);
  totals.tested += summary.tested;
  totals.killed += summary.killed;
  totals.survived += summary.survivors.length;
});

if (outPath)
{
  writeReport(outPath, {
    target,
    concurrency,
    // recorded because it changes which tests were in play, and therefore what a survivor here means.
    allTests,
    // the count Stryker actually reported on, which a caller can compare against what it asked for.
    requestedFiles: targets.length,
    reportedFiles: summaries.length,
    excludedMutators: DISABLED_MUTATORS,
    totals,
    files: summaries,
  });
}

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