//region generate-manifest
/**
 * Writes `out/manifest.json`, a description of the build it sits beside.
 *
 * Mirror copies everything in `out/` into each destination, so this file travels with the plugins it
 * describes and needs no copy step of its own. It lands in `project/js/plugins/` here, and in
 * `chef-adventure/js/plugins/j/` in Chef Adventure, whose data validator (`tools/validate`) reads it
 * for two jobs that project cannot do alone:
 *
 * - **Plugin drift.** Every file under `js/plugins/j/` has to be one this build produced, byte for
 *   byte. Mirror copies but never prunes, so a ship that was renamed or retired leaves its old bundle
 *   behind in the game forever - one plugin-manager checkbox away from loading a stale copy of code
 *   that has since moved on. The file list and hashes below are what make that visible.
 * - **Notetags.** Every tag the plugins declare, so a typo'd tag is reported rather than silently
 *   parsed as nothing; which table every id-bearing tag points into, so an id naming a blank row is
 *   reported rather than silently doing nothing; and J-Base's comment-line gate, so a tag on an event
 *   comment line the gate would drop is reported too. They come from `notetag-declarations.js` and
 *   `notetag-id-targets.js`, the same sources `verify-notetag-reference` holds to the glossary.
 *
 * The validator lives in Chef Adventure next to the data it reads, and this repo only publishes what
 * the plugins know. That split is deliberate: no validation logic exists in both repos, and the
 * project's CI never needs a second checkout to learn what a tag means.
 *
 * **The output is deterministic** - sorted throughout, no timestamps, no absolute paths. It is
 * committed under `project/js/plugins/` and held there by `verify:no-build-drift`, so anything that
 * varied between two builds of the same tree would read as drift on every run.
 *
 * Runs after `build:all` and never before, since `clean:out` empties the directory it writes into.
 *
 * Usage:
 *   node src/build-tools/generate-manifest.js
 */
import * as fs from 'fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { glob } from 'glob';
import Logger, { LogStyle } from './logger.js';
import { collectDeclaredTags } from './notetag-declarations.js';
import { IdTables, NotetagIdTargets } from './notetag-id-targets.js';

const OUT_DIR = './out';

const MANIFEST_NAME = 'manifest.json';

const SRC_PLUGINS_GLOB = './src/plugins/**/*.js';

/**
 * The manifest's shape version. The validator refuses any version it was not written for, so change
 * this whenever a field is renamed, removed, or changes meaning - adding a field does not need it.
 * @type {number}
 */
const FORMAT_VERSION = 1;

/**
 * The J-Base pattern every map event comment line must match before any plugin is offered it.
 *
 * `Game_Event` drops a comment line that fails it, silently, so a tag on such a line is never read no
 * matter how well-formed it is. That makes it the third way a tag dies without a sound, beside a typo
 * and a dead id, and the validator can only check it if the pattern travels with the build.
 * @type {string}
 */
const COMMENT_LINE_GATE_LABEL = 'J.BASE.RegExp.ParsableComment';

/**
 * Hashes one built file, ignoring line-ending style.
 *
 * Both repos store LF, but a checkout on a machine configured to convert would otherwise report every
 * file as drifted without a byte of real content having changed.
 * @param {string} filePath The file to hash.
 * @returns {Promise<string>} The hex SHA-256 of the file's LF-normalised content.
 */
async function hashFile(filePath)
{
  const content = await fs.readFile(filePath, 'utf-8');
  const normalised = content.replaceAll('\r\n', '\n');

  return createHash('sha256')
    .update(normalised)
    .digest('hex');
}

/**
 * Every file this build ships, relative to `out/` and in a stable order.
 *
 * Source maps are left out because Mirror never copies them anywhere, and the manifest is left out
 * because it cannot describe its own hash.
 * @returns {Promise<string[]>} The shipped paths, with forward slashes, sorted.
 */
async function listShippedFiles()
{
  const found = await glob('**/*', { cwd: OUT_DIR, nodir: true, posix: true });

  return found
    .filter(file => file.endsWith('.map') === false && file !== MANIFEST_NAME)
    .sort();
}

/**
 * The shipped files and their hashes, keyed by path.
 * @param {string[]} files The shipped paths, relative to `out/`.
 * @returns {Promise<Object<string, string>>} Each path's hash, in the same order as the paths.
 */
async function hashShippedFiles(files)
{
  const hashes = {};

  for (const file of files)
  {
    hashes[file] = await hashFile(path.join(OUT_DIR, file));
  }

  return hashes;
}

/**
 * Every regex-declared tag, reduced to what a validator needs to recognise one.
 *
 * The label is kept so a report can name the declaration a malformed tag failed to match; the source
 * file is dropped, since it is a path into a repository the reader of the report may not have.
 * @param {object[]} declarations Every declaration `collectDeclaredTags` found.
 * @returns {{label: string, names: string[], pattern: string, flags: string}[]} Sorted by label.
 */
function describeNotetags(declarations)
{
  // sort on plain code units rather than locale rules, which can differ between two machines.
  const sortKey = ({ label, pattern }) => `${label}\n${pattern}`;

  return declarations
    .map(({ label, names, pattern, flags }) => ({ label, names, pattern, flags }))
    .sort((left, right) =>
    {
      const leftKey = sortKey(left);
      const rightKey = sortKey(right);

      if (leftKey === rightKey) return 0;

      return leftKey < rightKey
        ? -1
        : 1;
    });
}

/**
 * Finds J-Base's comment-line gate among the table entries that name no tag.
 *
 * Looked up by its exact label, and a missing one throws: the validator treats the gate as part of
 * the contract, so a rename here has to be a loud build failure rather than a manifest that quietly
 * stops describing it.
 * @param {object[]} structural Every table entry that names no tag, in full.
 * @returns {{label: string, pattern: string, flags: string}} The gate.
 */
function findCommentLineGate(structural)
{
  const gate = structural.find(entry => entry.label === COMMENT_LINE_GATE_LABEL);

  if (!gate) throw new Error(`${COMMENT_LINE_GATE_LABEL} is gone; the manifest cannot describe J-Base's comment gate.`);

  const { label, pattern, flags } = gate;

  return { label, pattern, flags };
}

/**
 * The id-target table with its tags in alphabetical order.
 *
 * The source groups entries by ship for its readers; the manifest sorts them, so regrouping the source
 * never shows up as a change to what the build publishes.
 * @returns {Object<string, object[]>} The same entries, sorted by tag name.
 */
function sortedIdTargets()
{
  const names = Object.keys(NotetagIdTargets).sort();

  return Object.fromEntries(names.map(name => [ name, NotetagIdTargets[name] ]));
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code - always 0; any failure throws.
 */
async function main()
{
  const files = await listShippedFiles();

  // an empty build is a broken build, and a manifest describing nothing would pass every check.
  if (files.length === 0) throw new Error(`nothing to describe: ${OUT_DIR} holds no built files. Run build:all first.`);

  const pluginFiles = await glob(SRC_PLUGINS_GLOB);
  const { declarations, structural, metaKeys } = await collectDeclaredTags(pluginFiles);

  const manifest = {
    formatVersion: FORMAT_VERSION,
    generatedBy: 'rmmz-plugins src/build-tools/generate-manifest.js - generated, never edit by hand',
    files: await hashShippedFiles(files),
    notetags: describeNotetags(declarations),
    commentLineGate: findCommentLineGate(structural),
    metaTags: [ ...metaKeys.keys() ].sort(),
    idTables: IdTables,
    idTargets: sortedIdTargets(),
  };

  await fs.writeFile(path.join(OUT_DIR, MANIFEST_NAME), JSON.stringify(manifest, null, 2));

  Logger.logAnyway(
    `manifest: ${files.length} shipped file(s), ${manifest.notetags.length} tag declaration(s), `
    + `${manifest.metaTags.length} meta tag(s), ${Object.keys(manifest.idTargets).length} id-bearing tag(s).`,
    LogStyle.brightCyan);

  return 0;
}

const exitCode = await main();
process.exit(exitCode);
//endregion generate-manifest