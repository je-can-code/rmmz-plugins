//region verify-book-freshness
/**
 * Verifies that every plugin's book documents the version the plugin ships as.<br/>
 * A plugin's book under `docs/plugins/<ship path>/` is its manual: the MZ header's help points readers
 * straight at it. So a plugin that changes while its book stands still leaves the manual describing a
 * plugin that no longer exists, and nothing else in the build would ever notice.
 *
 * Every book's `overview.md` therefore carries a stamp in its frontmatter, naming the version it documents:
 *
 *   version: "1.2.0"
 *
 * and this gate fails whenever that stamp and the ship's `PLUGIN_VERSION` disagree. A version is bumped at
 * pull-request time, which is exactly when a book is easiest to forget, so the bump fails the build until
 * someone brings the book up to date and moves its stamp to match. Moving the stamp is the claim "this book
 * describes this version". The gate cannot check that the claim is true, only that nobody skipped making it.
 *
 * A stamp ahead of its plugin fails too, because it names a version that does not exist yet. Write the stamp
 * quoted, the way the shelf's `okf_version` is: YAML reads an unquoted `1.10` as the number 1.1, and a stamp
 * that is not three dotted numbers fails. Versions compare numerically, part by part, so 1.10.0 is newer
 * than 1.9.0.
 *
 * A ship without a book has skipped the step entirely, so that fails as well. The one exception is
 * `abs/ext/star`, which is unfinished and off-limits, and keeps its `_annotations.js` until it is done.
 *
 * Usage:
 *   bun src/build-tools/verify-book-freshness.js
 *   bun src/build-tools/verify-book-freshness.js --selftest
 */
import fs from 'node:fs';
import { glob } from 'glob';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Logger, { LogStyle } from './logger.js';
import { extractFrontmatter, hasBook, resolveBookDirectory, resolveShipPath } from './okf-header.js';

/**
 * Where every ship lives.<br/>
 * A ship is any directory under here holding a `vite.config.*.js`, the same rule the build uses.
 * @type {string}
 */
const SRC_PLUGINS_DIR = './src/plugins';

/**
 * The shape of both a book's stamp and a ship's `PLUGIN_VERSION`: three dotted numbers, captured one by one.
 * @type {RegExp}
 */
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * The ships allowed to go without a book, by ship path.<br/>
 * Each entry needs its reason written in the header above, the way `abs/ext/star`'s is.
 * @type {string[]}
 */
const SHIPS_WITHOUT_BOOKS = [ 'abs/ext/star' ];

/**
 * Splits a version into its three numbers.<br/>
 * Fails loudly on anything else, since every caller has already been promised that shape.
 * @param {string} version A version of three dotted numbers.
 * @returns {number[]}
 */
function versionParts(version)
{
  const match = VERSION_PATTERN.exec(version);

  // a ship's own version is never checked for shape here, so a bad one surfaces as this error.
  if (match === null)
  {
    throw new Error(`book-freshness: "${version}" is not a version of three dotted numbers`);
  }

  const [ , major, minor, patch ] = match;
  return [ major, minor, patch ].map(Number);
}

/**
 * Compares two versions part by part, numerically, so 1.10.0 comes after 1.9.0.<br/>
 * Answers below zero when the left is older, zero when they match, and above zero when it is newer.
 * @param {string} left A version of three dotted numbers.
 * @param {string} right Another version of three dotted numbers.
 * @returns {number}
 */
function compareVersions(left, right)
{
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);

  // the first part that differs decides it: major before minor, minor before patch.
  for (let partIndex = 0; partIndex < leftParts.length; partIndex++)
  {
    const difference = leftParts[partIndex] - rightParts[partIndex];
    if (difference !== 0) return difference;
  }

  return 0;
}

/**
 * Judges one ship's book against the version the ship ships as.<br/>
 * Answers nothing when the book is in step, and one message saying how to fix it when it is not.
 * @param {{ shipPath: string, pluginName: string, version: string, bookExists: boolean, overviewPath: string,
 *   stamp: string }} ship The ship, its version, and what its book's overview stamps.
 * @returns {string[]}
 */
function judgeShip(ship)
{
  const { shipPath, pluginName, version, bookExists, overviewPath, stamp } = ship;

  // a ship with no book skipped the step entirely, unless it is one of the few allowed to.
  if (bookExists === false)
  {
    if (SHIPS_WITHOUT_BOOKS.includes(shipPath)) return [];

    return [ `${pluginName} (${shipPath}) has no book; its manual belongs in docs/plugins/${shipPath}/` ];
  }

  // a book nobody has claimed for any version yet.
  if (stamp === '')
  {
    return [ `${overviewPath} has no version stamp; add version: "${version}" once it describes ${pluginName} ${version}` ];
  }

  // a stamp that is not three dotted numbers cannot be compared with anything.
  if (VERSION_PATTERN.test(stamp) === false)
  {
    return [ `${overviewPath} stamps version ${stamp}, which is not three dotted numbers; write version: "${version}"` ];
  }

  const comparison = compareVersions(stamp, version);

  // the book describes exactly the version that ships.
  if (comparison === 0) return [];

  // the plugin moved on and its book stayed behind.
  if (comparison < 0)
  {
    return [ `${pluginName} is ${version}, but its book still documents ${stamp}; bring the book up to date, ` +
      `then stamp ${overviewPath} with version: "${version}"` ];
  }

  // the book claims a version the plugin has not reached.
  return [ `${pluginName} is ${version}, but its book claims ${stamp}, a version that does not exist yet; ` +
    `stamp ${overviewPath} with version: "${version}"` ];
}

/**
 * Reads the version stamp off a book's overview.<br/>
 * Answers an empty string when the overview carries none, and the stamp as text otherwise, whatever YAML
 * made of it, so a stamp YAML turned into a number still reaches the shape check instead of slipping past.
 * @param {string} overviewPath The overview page's path, relative to the repository root.
 * @returns {string}
 */
function readStamp(overviewPath)
{
  const text = fs.readFileSync(overviewPath, 'utf8');
  const frontmatter = extractFrontmatter(text, overviewPath);
  const fields = Bun.YAML.parse(frontmatter);

  // a book nobody has stamped yet.
  if (Object.hasOwn(fields, 'version') === false) return '';

  return String(fields.version);
}

/**
 * Gathers what the gate judges about one ship: its name and version from `meta.js`, whether it has a book,
 * and what that book's overview stamps.
 * @param {string} shipDirectory The ship's root directory, relative to the repository root.
 * @returns {Promise<{ shipPath: string, pluginName: string, version: string, bookExists: boolean,
 *   overviewPath: string, stamp: string }>}
 */
async function readShip(shipDirectory)
{
  const shipPath = resolveShipPath(shipDirectory);

  // meta.js is plain ESM, so importing it reads exactly what the build itself reads.
  const metaPath = path.resolve(shipDirectory, '_metadata', 'meta.js');
  const metaUrl = pathToFileURL(metaPath).href;
  const { PLUGIN_NAME, PLUGIN_VERSION } = await import(metaUrl);

  // the overview is where a book says which version it documents.
  const bookDirectory = resolveBookDirectory(shipDirectory);
  const absoluteOverviewPath = path.join(bookDirectory, 'overview.md');
  const overviewPath = path.relative(process.cwd(), absoluteOverviewPath);
  const bookExists = hasBook(shipDirectory);

  return {
    shipPath,
    pluginName: PLUGIN_NAME,
    version: PLUGIN_VERSION,
    bookExists,
    overviewPath,
    stamp: bookExists ? readStamp(overviewPath) : '',
  };
}

/**
 * Finds every ship directory by its vite config, the same discovery rule the build itself uses.
 * @returns {Promise<string[]>}
 */
async function collectShipDirectories()
{
  const configs = await glob(`${SRC_PLUGINS_DIR}/**/vite.config.*.js`);
  const directories = configs.map(configPath => path.dirname(configPath));

  return directories.sort();
}

/**
 * Builds a planted ship for the selftest: a plugin at 1.2.0 whose book is stamped 1.2.0, with whatever the
 * control needs changed.
 * @param {{ shipPath?: string, version?: string, bookExists?: boolean, stamp?: string }} changes What this
 *   control plants differently from a ship that is in step.
 * @returns {{ shipPath: string, pluginName: string, version: string, bookExists: boolean, overviewPath: string,
 *   stamp: string }}
 */
function plantedShip(changes)
{
  return {
    shipPath: 'planted/core',
    pluginName: 'J-Planted',
    version: '1.2.0',
    bookExists: true,
    overviewPath: 'docs/plugins/planted/core/overview.md',
    stamp: '1.2.0',
    ...changes,
  };
}

/**
 * The controls the selftest runs, each a planted ship and the words its one finding must contain.<br/>
 * Every way a book can fall out of step is planted once, beside the near misses that must pass: a stamp that
 * matches, the one ship allowed no book, and a pair of versions that comparing as text would put in the
 * wrong order. An `expect` of null means the ship must pass.
 * @type {{ label: string, ship: { shipPath: string, pluginName: string, version: string, bookExists: boolean,
 *   overviewPath: string, stamp: string }, expect: string|null }[]}
 */
const CONTROLS = [
  { label: 'a stamp that matches its plugin', ship: plantedShip({}), expect: null },
  { label: 'a plugin bumped past its book', ship: plantedShip({ stamp: '1.1.9' }), expect: 'still documents 1.1.9' },
  { label: 'a book stamped ahead of its plugin', ship: plantedShip({ stamp: '1.3.0' }), expect: 'does not exist yet' },
  { label: 'a book with no stamp', ship: plantedShip({ stamp: '' }), expect: 'has no version stamp' },
  { label: 'a stamp YAML read as the number 1.2', ship: plantedShip({ stamp: '1.2' }), expect: 'not three dotted' },
  {
    label: 'a book at 1.9.0 under a plugin at 1.10.0, which text order calls ahead',
    ship: plantedShip({ version: '1.10.0', stamp: '1.9.0' }),
    expect: 'still documents 1.9.0',
  },
  { label: 'a plugin with no book', ship: plantedShip({ bookExists: false, stamp: '' }), expect: 'has no book' },
  {
    label: 'abs/ext/star, the one ship allowed no book',
    ship: plantedShip({ shipPath: 'abs/ext/star', bookExists: false, stamp: '' }),
    expect: null,
  },
];

/**
 * Runs one control and reports how it went.<br/>
 * Answers true when judging the planted ship reported exactly what the control expects.
 * @param {{ label: string, ship: { shipPath: string, pluginName: string, version: string, bookExists: boolean,
 *   overviewPath: string, stamp: string }, expect: string|null }} control The planted ship and its expectation.
 * @returns {boolean}
 */
function runControl(control)
{
  const { label, ship, expect } = control;
  const violations = judgeShip(ship);

  // a near miss must pass clean; a plant must produce exactly one finding, and the right one.
  const passed = expect === null
    ? violations.length === 0
    : violations.length === 1 && violations[0].includes(expect);

  const reported = violations.length === 0 ? 'nothing' : violations.join('; ');
  const style = passed ? LogStyle.brightGreen : LogStyle.brightRed;
  Logger.logAnyway(`  [${passed ? 'PASS' : 'FAIL'}] ${label} -> flagged ${reported}`, style);

  return passed;
}

/**
 * Runs every control, so a green result from the real run means something.<br/>
 * Answers the exit code: 0 when every control behaved, 1 otherwise.
 * @returns {number}
 */
function runSelftest()
{
  const results = CONTROLS.map(runControl);
  const failures = results.filter(passed => passed === false).length;

  if (failures === 0)
  {
    Logger.logAnyway(`book-freshness selftest: OK (${CONTROLS.length} controls).`, LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`book-freshness selftest FAILED: ${failures} of ${CONTROLS.length} controls.`, LogStyle.brightRed);
  return 1;
}

/**
 * Entry point.<br/>
 * Answers the exit code: 0 when every book is in step, 1 when any is not.
 * @returns {Promise<number>}
 */
async function main()
{
  // the selftest judges planted ships only, and never reads a real book.
  if (process.argv.includes('--selftest')) return runSelftest();

  const shipDirectories = await collectShipDirectories();
  const ships = await Promise.all(shipDirectories.map(readShip));
  const violations = ships.flatMap(judgeShip);

  if (violations.length === 0)
  {
    const bookCount = ships.filter(ship => ship.bookExists).length;
    const summary = bookCount === 1
      ? '1 book documents the version its plugin ships as'
      : `${bookCount} books document the version their plugin ships as`;
    Logger.logAnyway(`book-freshness verify: OK (${summary}).`, LogStyle.brightGreen);
    return 0;
  }

  Logger.logAnyway(`book-freshness verify FAILED: ${violations.length} violation(s) found.`, LogStyle.brightRed);
  violations.forEach(message => Logger.logAnyway(`  • ${message}`, LogStyle.brightRed));

  return 1;
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-book-freshness
