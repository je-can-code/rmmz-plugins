//region okf-header
/**
 * Builds a ship's MZ plugin header from its OKF book.<br/>
 * A plugin's book under `docs/plugins/<ship path>/` is the source of truth for everything MZ's plugin
 * manager reads: the dependency declarations, the parameters and the plugin commands. The build reads
 * them straight from the book instead of from a hand-written `_annotations.js`, so the two can never
 * disagree, and a ship that has a book carries no annotations file at all.
 *
 * Every piece of the header has exactly one home:
 *
 * - **`@target`, `@author`, `@url`** are identical in every ship, so they live here as constants.
 * - **`@plugindesc`** is assembled from the ship's `meta.js`: its version, its description tag and its
 *   `PLUGIN_DESCRIPTION`. None of it lives in the book.
 * - **`@base` / `@orderAfter`** come from the book's `dependencies` page. In this repository
 *   `@orderAfter` is how an optional dependency gets declared, not only a claim about load order.
 * - **`@help`** is a pointer to the book on GitHub, because the book is the manual now.
 * - **`@param` / `@command`** come from the `plugin-parameter` and `plugin-command` pages, in the order
 *   the book's `index.md` lists them. That is also the order MZ shows them in.
 *
 * The work is split in two on purpose. Rendering is pure: it takes pages that were already parsed and
 * returns text, which is what lets Vitest - running on Node - test every rule here. Reading the book is
 * the thin edge, and it is the only code that touches `Bun.YAML`. The build and the dependency gate both
 * run on Bun, and every `hotfix` exercises that edge for real.
 *
 * Usage: imported by `vite-plugin_rmmz-header-prepender.js` and `verify-declared-dependencies.js`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The engine every ship targets.<br/>
 * Identical in all 97 ships, so no book ever needs to say it.
 * @type {string}
 */
const HEADER_TARGET = 'MZ';

/**
 * The author every ship credits.<br/>
 * Identical in all 97 ships, so no book ever needs to say it.
 * @type {string}
 */
const HEADER_AUTHOR = 'JE';

/**
 * The public repository every ship links to.<br/>
 * Doubles as the base of every book's URL, since the books live in this same repository.
 * @type {string}
 */
const REPOSITORY_URL = 'https://github.com/je-can-code/rmmz-plugins';

/**
 * The branch a book link points at.<br/>
 * The help pointer always leads to the latest version of the book.
 * @type {string}
 */
const BOOK_BRANCH = 'main';

/**
 * The horizontal rule that frames the help pointer.<br/>
 * Seventy-six wide, matching the rule nearly every hand-written header uses.
 * @type {string}
 */
const HELP_RULE = '='.repeat(76);

/**
 * Filenames OKF reserves at every level of a bundle.<br/>
 * They are listings and history rather than concepts, so they carry no frontmatter and are not pages.
 * @type {string[]}
 */
const RESERVED_FILENAMES = [ 'index.md', 'log.md' ];

/**
 * The page types the header is built from.<br/>
 * These are the type names the books themselves use, so renaming one in a book means renaming it here.
 * @type {{ parameter: string, command: string, dependencies: string }}
 */
const PAGE_TYPES = {
  parameter: 'plugin-parameter',
  command: 'plugin-command',
  dependencies: 'dependencies',
};

/**
 * The MZ tags a parameter may set, in the order they are written.<br/>
 * A key outside this list is an error rather than something to skip, so a fact can never quietly fall
 * out of the header.
 * @type {string[]}
 */
const PARAMETER_TAGS = [ 'parent', 'type', 'text', 'desc', 'min', 'max', 'default' ];

/**
 * The MZ tags a plugin command may set, in the order they are written.<br/>
 * Its arguments are written separately, after these.
 * @type {string[]}
 */
const COMMAND_TAGS = [ 'text', 'desc' ];

/**
 * The MZ tags a plugin command's argument may set, in the order they are written.<br/>
 * Same rule as parameters: an unknown key is an error.
 * @type {string[]}
 */
const ARGUMENT_TAGS = [ 'type', 'min', 'max', 'desc', 'default' ];

/**
 * The fields a dependency entry may carry.<br/>
 * `version` is the minimum version the plugin needs; MZ has no tag for it, so it informs readers only.
 * @type {string[]}
 */
const DEPENDENCY_FIELDS = [ 'key', 'version', 'base', 'orderAfter' ];

/**
 * The `meta.js` exports a ship with a book must provide.<br/>
 * Ships without a book never reach this check, so the rest of the fleet needs no `PLUGIN_DESCRIPTION`.
 * @type {string[]}
 */
const REQUIRED_META_FIELDS = [ 'PLUGIN_NAME', 'PLUGIN_VERSION', 'PLUGIN_DESC_TAG', 'PLUGIN_DESCRIPTION' ];

/**
 * Pulls the frontmatter block off the top of a page.<br/>
 * Every OKF page has one, and a page without it cannot say what kind of page it is.
 * @param {string} text The full text of a markdown page.
 * @param {string} pagePath The page's path inside its book, for the error message.
 * @returns {string}
 */
export function extractFrontmatter(text, pagePath)
{
  // the frontmatter is a YAML block fenced by '---' lines at the very top of the page.
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);

  // a page that opens with anything else has no frontmatter at all.
  if (match === null)
  {
    throw new Error(`okf-header: ${pagePath} has no frontmatter block`);
  }

  const [ , frontmatter ] = match;
  return frontmatter;
}

/**
 * Lists the pages a book's index links to, in the order the index lists them.<br/>
 * That order is load-bearing: it is the order parameters and commands are written into the header.
 * @param {string} indexText The text of the book's `index.md`.
 * @returns {string[]}
 */
export function readIndexOrder(indexText)
{
  // every index entry is a markdown link whose target is a page path relative to the book's root.
  const links = [ ...indexText.matchAll(/\]\(([^)]+)\)/g) ];

  // normalized, so "./overview.md" and "overview.md" name the same page.
  return links.map(([ , target ]) => path.posix.normalize(target));
}

/**
 * Picks out a book's pages of one type, ordered the way its index lists them.
 * @param {{ path: string, data: object }[]} pages Every parsed page in the book.
 * @param {string[]} indexOrder The page paths the book's index links to, in order.
 * @param {string} pageType The type of page to pick out.
 * @returns {{ path: string, data: object }[]}
 */
export function orderPagesOfType(pages, indexOrder, pageType)
{
  const pagesOfType = pages.filter(page => page.data.type === pageType);

  // the index decides the order, so a page it does not list has no place in the header at all.
  const unlisted = pagesOfType.filter(page => indexOrder.includes(page.path) === false);
  if (unlisted.length > 0)
  {
    const unlistedPaths = unlisted.map(page => page.path)
      .join(', ');
    throw new Error(`okf-header: index.md does not list ${unlistedPaths}, so the header cannot place it`);
  }

  // a sorted copy, so the caller's list keeps its own order.
  return [ ...pagesOfType ].sort((left, right) =>
  {
    return indexOrder.indexOf(left.path) - indexOrder.indexOf(right.path);
  });
}

/**
 * Fails loudly when a frontmatter block carries a key the header does not know how to write.<br/>
 * Skipping it instead would let a fact silently vanish from the plugin.
 * @param {object} fields The frontmatter block being checked.
 * @param {string[]} allowedKeys Every key this kind of block may carry.
 * @param {string} location Where the block lives, for the error message.
 */
function assertKnownKeys(fields, allowedKeys, location)
{
  const unknownKeys = Object.keys(fields)
    .filter(fieldKey => allowedKeys.includes(fieldKey) === false);

  // every key accounted for; nothing would be lost.
  if (unknownKeys.length === 0) return;

  throw new Error(`okf-header: ${location} has unknown key(s): ${unknownKeys.join(', ')}`);
}

/**
 * Fails loudly when a block has no `key`.<br/>
 * The key is the name MZ knows the parameter, command, argument or plugin by, so every block needs one.
 * @param {object} fields The frontmatter block being checked.
 * @param {string} location Where the block lives, for the error message.
 */
function assertHasKey(fields, location)
{
  // a real name is present; the block can be written.
  if (fields.key !== undefined && fields.key !== '') return;

  throw new Error(`okf-header: ${location} is missing its key`);
}

/**
 * Writes the MZ tag lines a block sets, in the given order, skipping the tags it leaves out.
 * @param {object} fields The block's frontmatter fields.
 * @param {string[]} tagOrder The tags this kind of block may set, in the order they are written.
 * @returns {string[]}
 */
function renderTagLines(fields, tagOrder)
{
  return tagOrder
    .filter(tag => fields[tag] !== undefined)
    .map(tag => `@${tag} ${fields[tag]}`);
}

/**
 * Writes one plugin parameter's annotation block from its page.
 * @param {{ path: string, data: object }} page A `plugin-parameter` page.
 * @returns {string[]}
 */
export function renderParameterBlock(page)
{
  const { param } = page.data;
  const location = `${page.path} (param)`;

  // a parameter page without its block has nothing for MZ to show.
  if (param === undefined)
  {
    throw new Error(`okf-header: ${page.path} has no param block`);
  }

  assertKnownKeys(param, [ 'key', ...PARAMETER_TAGS ], location);
  assertHasKey(param, location);

  const tagLines = renderTagLines(param, PARAMETER_TAGS);
  return [ `@param ${param.key}`, ...tagLines ];
}

/**
 * Writes one plugin command's annotation block from its page, arguments included.
 * @param {{ path: string, data: object }} page A `plugin-command` page.
 * @returns {string[]}
 */
export function renderCommandBlock(page)
{
  const { command } = page.data;
  const location = `${page.path} (command)`;

  // a command page without its block has nothing for MZ to show.
  if (command === undefined)
  {
    throw new Error(`okf-header: ${page.path} has no command block`);
  }

  assertKnownKeys(command, [ 'key', 'args', ...COMMAND_TAGS ], location);
  assertHasKey(command, location);

  const tagLines = renderTagLines(command, COMMAND_TAGS);
  const lines = [ `@command ${command.key}`, ...tagLines ];

  // a command that takes nothing simply has no args list.
  if (command.args === undefined) return lines;

  // each argument is written after the command's own tags, in the order the page lists them.
  command.args.forEach((argument, argumentIndex) =>
  {
    const argumentLocation = `${page.path} (args[${argumentIndex}])`;
    assertKnownKeys(argument, [ 'key', ...ARGUMENT_TAGS ], argumentLocation);
    assertHasKey(argument, argumentLocation);

    const argumentTagLines = renderTagLines(argument, ARGUMENT_TAGS);
    lines.push(`@arg ${argument.key}`, ...argumentTagLines);
  });

  return lines;
}

/**
 * Writes the dependency declarations from a book's dependencies page.<br/>
 * Every `@base` comes first and every `@orderAfter` after it, each in the order the page lists them.
 * @param {{ path: string, data: object }[]} pages Every parsed page in the book.
 * @returns {string[]}
 */
export function renderDependencyLines(pages)
{
  const dependencyPages = pages.filter(page => page.data.type === PAGE_TYPES.dependencies);

  // a plugin with no dependencies page declares nothing.
  if (dependencyPages.length === 0) return [];

  // the declarations live in exactly one place, so a second page would make them ambiguous.
  if (dependencyPages.length > 1)
  {
    const dependencyPaths = dependencyPages.map(page => page.path)
      .join(', ');
    throw new Error(`okf-header: a book has one dependencies page, but this one has ${dependencyPaths}`);
  }

  const [ dependencyPage ] = dependencyPages;
  const { dependencies } = dependencyPage.data;

  // a dependencies page with no list, like the one J-Base would have, declares nothing.
  if (dependencies === undefined) return [];

  // every entry must be fully understood before any of it is written.
  dependencies.forEach((dependency, dependencyIndex) =>
  {
    const location = `${dependencyPage.path} (dependencies[${dependencyIndex}])`;
    assertKnownKeys(dependency, DEPENDENCY_FIELDS, location);
    assertHasKey(dependency, location);
  });

  // a hard requirement is a base; a plugin this one uses whenever it is present is an orderAfter.
  const baseLines = dependencies
    .filter(dependency => dependency.base === true)
    .map(dependency => `@base ${dependency.key}`);
  const orderAfterLines = dependencies
    .filter(dependency => dependency.orderAfter === true)
    .map(dependency => `@orderAfter ${dependency.key}`);

  return [ ...baseLines, ...orderAfterLines ];
}

/**
 * Builds the GitHub URL of a ship's book.<br/>
 * Points at the book's `index.md`, because GitHub only renders a folder's README on its own, and the
 * index is the book's table of contents.
 * @param {string} shipPath The ship's path under `src/plugins`, such as `apt/core`.
 * @returns {string}
 */
export function buildBookUrl(shipPath)
{
  return `${REPOSITORY_URL}/blob/${BOOK_BRANCH}/docs/plugins/${shipPath}/index.md`;
}

/**
 * Writes the help block.<br/>
 * The book is the manual, so all the plugin manager shows is where to find it.
 * @param {string} pluginName The plugin's name, as `meta.js` gives it.
 * @param {string} shipPath The ship's path under `src/plugins`, such as `apt/core`.
 * @returns {string[]}
 */
function renderHelpLines(pluginName, shipPath)
{
  const bookUrl = buildBookUrl(shipPath);

  return [
    '@help',
    HELP_RULE,
    `Please refer to ${pluginName}'s book for more details:`,
    bookUrl,
    HELP_RULE,
  ];
}

/**
 * Fails loudly when `meta.js` lacks something the header is built from.
 * @param {Record<string, string>} meta The exports of the ship's `meta.js`.
 * @param {string} shipPath The ship's path under `src/plugins`, for the error message.
 */
function assertCompleteMeta(meta, shipPath)
{
  const missingFields = REQUIRED_META_FIELDS
    .filter(field => meta[field] === undefined || meta[field] === '');

  // everything the header needs is present.
  if (missingFields.length === 0) return;

  throw new Error(`okf-header: ${shipPath}'s meta.js is missing ${missingFields.join(', ')}, which a ship ` +
    'with a book needs');
}

/**
 * Renders a ship's complete MZ header from its parsed book and its `meta.js`.<br/>
 * The result has the same shape every hand-written `_annotations.js` has, region markers included, so a
 * ship built from a book reads the same as any other in the built output.
 * @param {{ indexText: string, pages: { path: string, data: object }[] }} book The ship's parsed book.
 * @param {Record<string, string>} meta The exports of the ship's `meta.js`.
 * @param {string} shipPath The ship's path under `src/plugins`, such as `apt/core`.
 * @returns {string}
 */
export function renderHeader(book, meta, shipPath)
{
  assertCompleteMeta(meta, shipPath);

  const { indexText, pages } = book;
  const { PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESC_TAG, PLUGIN_DESCRIPTION } = meta;
  const indexOrder = readIndexOrder(indexText);
  const dependencyLines = renderDependencyLines(pages);
  const helpLines = renderHelpLines(PLUGIN_NAME, shipPath);

  // the plugin's identity comes first, in the order every hand-written header uses.
  const identityLines = [
    `@target ${HEADER_TARGET}`,
    '@plugindesc',
    `[v${PLUGIN_VERSION} ${PLUGIN_DESC_TAG}] ${PLUGIN_DESCRIPTION}`,
    `@author ${HEADER_AUTHOR}`,
    `@url ${REPOSITORY_URL}`,
    ...dependencyLines,
    ...helpLines,
  ];

  // then every parameter, then every command, each its own block in the order the index lists them.
  const parameterPages = orderPagesOfType(pages, indexOrder, PAGE_TYPES.parameter);
  const commandPages = orderPagesOfType(pages, indexOrder, PAGE_TYPES.command);
  const parameterBlocks = parameterPages.map(renderParameterBlock);
  const commandBlocks = commandPages.map(renderCommandBlock);
  const blocks = [ identityLines, ...parameterBlocks, ...commandBlocks ];

  // blocks are separated by an empty comment line, the way every hand-written header reads.
  const bodyLines = blocks.flatMap((blockLines, blockIndex) =>
  {
    if (blockIndex === 0) return blockLines;
    return [ '', ...blockLines ];
  });

  // every line sits inside the one comment block MZ parses, with empty lines left bare.
  const commentLines = bodyLines.map(line =>
  {
    if (line === '') return ' *';
    return ` * ${line}`;
  });

  return [ '//region annotations', '/*:', ...commentLines, ' */', '//endregion annotations' ].join('\n');
}

/**
 * Splits a ship's directory into the repository root and the ship's path under `src/plugins`.<br/>
 * Books mirror ships, so that path is also where the ship's book lives under `docs/plugins`.
 * @param {string} shipDirectory The ship's root directory, absolute or relative to the working directory.
 * @returns {{ repositoryRoot: string, shipPath: string }}
 */
function splitShipDirectory(shipDirectory)
{
  const absoluteDirectory = path.resolve(shipDirectory);
  const marker = `${path.sep}src${path.sep}plugins${path.sep}`;
  const markerIndex = absoluteDirectory.lastIndexOf(marker);

  // a directory outside src/plugins is not a ship, so it has no book to find.
  if (markerIndex === -1)
  {
    throw new Error(`okf-header: ${shipDirectory} is not inside src/plugins`);
  }

  const repositoryRoot = absoluteDirectory.slice(0, markerIndex);
  const nativeShipPath = absoluteDirectory.slice(markerIndex + marker.length);

  // the ship path doubles as a URL segment, so it always uses forward slashes.
  const shipPath = nativeShipPath.split(path.sep)
    .join('/');

  return { repositoryRoot, shipPath };
}

/**
 * Finds a ship's path under `src/plugins`, such as `apt/core`.
 * @param {string} shipDirectory The ship's root directory, absolute or relative to the working directory.
 * @returns {string}
 */
export function resolveShipPath(shipDirectory)
{
  const { shipPath } = splitShipDirectory(shipDirectory);
  return shipPath;
}

/**
 * Finds the directory a ship's book lives in, whether or not it exists yet.
 * @param {string} shipDirectory The ship's root directory, absolute or relative to the working directory.
 * @returns {string}
 */
export function resolveBookDirectory(shipDirectory)
{
  const { repositoryRoot, shipPath } = splitShipDirectory(shipDirectory);
  const shipSegments = shipPath.split('/');
  return path.join(repositoryRoot, 'docs', 'plugins', ...shipSegments);
}

/**
 * Decides whether a ship has a book.<br/>
 * A book is a folder with an `index.md`, so a folder still being drafted without one does not count yet.
 * @param {string} shipDirectory The ship's root directory, absolute or relative to the working directory.
 * @returns {boolean}
 */
export function hasBook(shipDirectory)
{
  const bookDirectory = resolveBookDirectory(shipDirectory);
  const indexPath = path.join(bookDirectory, 'index.md');
  return fs.existsSync(indexPath);
}

/**
 * Reads and parses every page of a book.<br/>
 * This is the only code that touches `Bun.YAML`, so nothing a test imports ever needs Bun to load.
 * @param {string} bookDirectory The book's root directory.
 * @returns {{ indexText: string, pages: { path: string, data: object }[] }}
 */
export function readBook(bookDirectory)
{
  const indexPath = path.join(bookDirectory, 'index.md');
  const indexText = fs.readFileSync(indexPath, 'utf8');

  // every markdown file in the book is a page, except the listings and histories OKF reserves.
  const pageFiles = fs.readdirSync(bookDirectory, { recursive: true })
    .filter(entry => entry.endsWith('.md'))
    .filter(entry => RESERVED_FILENAMES.includes(path.basename(entry)) === false)
    .sort();

  const pages = pageFiles.map(entry =>
  {
    // page paths are written the way the index links to them, with forward slashes.
    const pagePath = entry.split(path.sep)
      .join('/');
    const pageFile = path.join(bookDirectory, entry);
    const text = fs.readFileSync(pageFile, 'utf8');
    const frontmatter = extractFrontmatter(text, pagePath);

    return { path: pagePath, data: Bun.YAML.parse(frontmatter) };
  });

  return { indexText, pages };
}

/**
 * Generates a ship's complete MZ header from its book and its `meta.js`.
 * @param {string} shipDirectory The ship's root directory, absolute or relative to the working directory.
 * @returns {Promise<string>}
 */
export async function generateShipHeader(shipDirectory)
{
  const shipPath = resolveShipPath(shipDirectory);
  const bookDirectory = resolveBookDirectory(shipDirectory);

  // meta.js is plain ESM, so importing it reads exactly what the build itself reads.
  const absoluteShipDirectory = path.resolve(shipDirectory);
  const metaPath = path.join(absoluteShipDirectory, '_metadata', 'meta.js');
  const metaUrl = pathToFileURL(metaPath).href;
  const meta = await import(metaUrl);

  const book = readBook(bookDirectory);
  return renderHeader(book, meta, shipPath);
}
//endregion okf-header
