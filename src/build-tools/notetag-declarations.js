//region notetag-declarations
/**
 * Reads every notetag the plugin tree declares, straight out of each source file's AST.
 *
 * Two consumers need exactly the same answer to "what is a notetag here": `verify-notetag-reference`,
 * which demands a glossary entry for every one, and `generate-manifest`, which hands the full set to
 * Chef Adventure's data validator so it can recognise a tag it has never seen before. They share this
 * reader so they cannot disagree. If they did, the gate would wave through a tag the validator then
 * rejects as unknown, or the validator would accept a tag the glossary never heard of.
 *
 * ## Where a tag can be declared
 *
 * Three shapes, and all three are in live use:
 *
 * - **one assignment per tag** - `J.SHIP.RegExp.SomeTag = /<someTag>/i`
 * - **a whole table at once** - `J.SHIP.RegExp = { SomeTag: /<someTag>/i }`, including nested
 *   grouping objects and arrays of patterns, such as J-LevelMaster's eight `GrowthCurveByParamId`
 *   regexes indexed by param id
 * - **RMMZ's native meta** - `$dataMap.meta['noToneChange']`. The engine already parses every `<key>`
 *   and `<key:value>` out of a note into `.meta`, so a plugin that reads a key from there has declared
 *   a tag without writing a regex at all
 *
 * The array shape was invisible to this reader until the validator went looking for it: eight of
 * J-LevelMaster's tags were authored on every class in the game and counted by nothing.
 */
import * as fs from 'fs/promises';
import * as acorn from 'acorn';

/**
 * Parses source into an AST with location data.
 * @param {string} source The raw source text.
 * @returns {object} The parsed program.
 */
export const parse = source => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

/**
 * Walks every node of an AST, invoking a visitor with each node.
 * @param {object} node The node to walk.
 * @param {(node: object) => void} visit The visitor.
 */
export function walk(node, visit)
{
  // anything without a type is not a node worth descending into.
  if (!node || !node.type) return;

  visit(node);

  for (const key of Object.keys(node))
  {
    // skip the location bookkeeping acorn hangs off every node.
    if (key === 'loc' || key === 'start' || key === 'end') continue;

    const child = node[key];

    // a node's children arrive either singly or in a list.
    if (Array.isArray(child))
    {
      child.forEach(entry => walk(entry, visit));
    }
    else if (child && child.type)
    {
      walk(child, visit);
    }
  }
}

/**
 * Flattens a member expression into its dotted path segments.
 * @param {object} node The expression forming the left side of an assignment.
 * @returns {string[]} The path segments, outermost last.
 */
function memberPath(node)
{
  const segments = [];

  let current = node;

  // unwind the chain from the tail back toward the root identifier.
  while (current && current.type === 'MemberExpression')
  {
    segments.unshift(current.property.name ?? String(current.property.value));
    current = current.object;
  }

  // the root of a well-formed chain is the namespace identifier itself.
  if (current && current.type === 'Identifier')
  {
    segments.unshift(current.name);
  }

  return segments;
}

/**
 * Whether a node is a regex literal.
 * @param {object} node Any AST node, possibly absent.
 * @returns {boolean} True when the node is a `/pattern/flags` literal.
 */
const isRegexLiteral = node => Boolean(node && node.type === 'Literal' && node.regex);

/**
 * Reads the tag name(s) a notetag regex declares, from the regex's own pattern text.
 *
 * Returns several names for a pattern whose name is an alternation - `<(?:mm|minimap):…>` declares two
 * spellings of one tag, and both need an entry - and none for a regex that is not a notetag at all,
 * such as J-Base's anchored `ParsableComment` structural matcher.
 * @param {string} pattern The regex source text, without delimiters or flags.
 * @returns {string[]} Every tag name the pattern declares; empty when it declares none.
 */
export function tagNamesFromPattern(pattern)
{
  // an anchored pattern is matching the shape of a note line rather than naming a tag.
  if (pattern.startsWith('^')) return [];

  // the opening bracket is sometimes escaped and sometimes not; both spellings are ordinary.
  const body = pattern.replace(/^\\?</, '');

  // the name is unchanged from the pattern text, so a bare name needs no further work.
  const bareName = /^([A-Za-z][A-Za-z0-9-]*)/.exec(body);
  if (bareName) return [ bareName[1] ];

  // a pattern may lead with a non-capturing group listing several spellings of the same tag.
  const alternation = /^\(\?:([A-Za-z][A-Za-z0-9|-]*)\)/.exec(body);
  if (alternation) return alternation[1].split('|');

  return [];
}

/**
 * Reads the key a member expression looks up on RMMZ's native `.meta` object, if it is one.
 *
 * Matches `something.meta['key']` and `something.meta.key`, and nothing else. A bare `meta.key` is
 * deliberately not a match: J-ABS keeps a local variable called `meta` for animation settings, and
 * reading its fields is not reading a note.
 * @param {object} node A member expression.
 * @returns {string} The key being read; empty when this is not a `.meta` lookup.
 */
function metaKeyOf(node)
{
  const owner = node.object;

  // the lookup has to hang off a `.meta` that itself hangs off something.
  if (owner.type !== 'MemberExpression' || owner.computed || owner.property.name !== 'meta') return '';

  // the bracket spelling carries the key as a string literal. A literal that survives being turned
  // into a string unchanged was a string to begin with; `meta[0]` would not, and is no tag name.
  if (node.computed)
  {
    const isStringKey = node.property.type === 'Literal' && node.property.value === String(node.property.value);

    return isStringKey
      ? node.property.value
      : '';
  }

  // the dotted spelling carries it as a plain identifier.
  return node.property.name;
}

/**
 * Reads every notetag one parsed file declares.
 *
 * Split out from the file walk below so `--selftest` in the reference gate can feed it synthetic source
 * and prove each declaration style is seen - a missed style is silent, and a checker that only knew
 * one of them once reported a confident green over two thirds of the tree.
 * @param {object} ast The parsed source.
 * @param {string} filePath The path to attribute declarations to.
 * @returns {{tags: Map<string, string>, declarations: object[], structural: object[], metaKeys: Map<string, string>,
 *   regexCount: number, skipped: string[]}} What the file declares. `structural` holds the table entries
 *   that name no tag, in full, since one of them - J-Base's comment gate - is something a validator needs.
 */
export function collectFromAst(ast, filePath)
{
  const tags = new Map();
  const declarations = [];
  const structural = [];
  const metaKeys = new Map();
  const skipped = [];

  let regexCount = 0;

  /**
   * Records one regex literal found in a `RegExp` table.
   * @param {object} literal The regex literal node.
   * @param {string} label How to name this declaration if it has to be reported.
   */
  const record = (literal, label) =>
  {
    regexCount++;

    const { pattern, flags } = literal.regex;
    const names = tagNamesFromPattern(pattern);

    // a regex in the table that names no tag is reported rather than dropped, so the arithmetic stays
    // checkable by a reader who suspects the extractor rather than the tree.
    if (names.length === 0)
    {
      skipped.push(`${label} (${filePath}:${literal.loc.start.line})`);
      structural.push({ label, pattern, flags, filePath, line: literal.loc.start.line });

      return;
    }

    declarations.push({ label, names, pattern, flags, filePath, line: literal.loc.start.line });

    // first declaration wins; the file is only ever used to tell the author where to look.
    names.forEach(name =>
    {
      if (tags.has(name) === false) tags.set(name, filePath);
    });
  };

  /**
   * Records a value found in a `RegExp` table, which is a single pattern or an array of them.
   * @param {object} value The assigned or property value node.
   * @param {string} label How to name this declaration if it has to be reported.
   */
  const recordValue = (value, label) =>
  {
    // the ordinary case: one tag, one pattern.
    if (isRegexLiteral(value))
    {
      record(value, label);

      return;
    }

    // a list of patterns, each one its own tag, labelled by its position in the list.
    if (value && value.type === 'ArrayExpression')
    {
      value.elements.forEach((element, index) =>
      {
        if (isRegexLiteral(element)) record(element, `${label}[${index}]`);
      });
    }
  };

  walk(ast, node =>
  {
    // a native meta lookup declares a tag wherever it appears, not only in a table.
    if (node.type === 'MemberExpression')
    {
      const key = metaKeyOf(node);

      if (key !== '' && metaKeys.has(key) === false) metaKeys.set(key, filePath);

      return;
    }

    if (node.type !== 'AssignmentExpression') return;

    const path = memberPath(node.left);

    // every regex-declared notetag in this repo lives in a `RegExp` table on its ship's namespace, so
    // anything assigned elsewhere is some other kind of pattern and none of this reader's business.
    const isTableMember = path.length >= 2 && path[path.length - 2] === 'RegExp';
    const isWholeTable = path.length >= 1 && path[path.length - 1] === 'RegExp';

    // style one: `J.SHIP.RegExp.SomeTag = /<someTag>/i` - one assignment per tag.
    if (isTableMember)
    {
      recordValue(node.right, path.join('.'));

      return;
    }

    // style two: `J.SHIP.RegExp = { SomeTag: /<someTag>/i, … }` - the whole table at once. Nested
    // grouping objects are walked too, so the shape of the table cannot hide a tag.
    if (isWholeTable && node.right && node.right.type === 'ObjectExpression')
    {
      walk(node.right, inner =>
      {
        if (inner.type !== 'Property') return;

        const key = inner.key.name ?? String(inner.key.value);

        recordValue(inner.value, `${path.join('.')}.${key}`);
      });
    }
  });

  return { tags, declarations, structural, metaKeys, regexCount, skipped };
}

/**
 * Every notetag declared anywhere in the plugin tree.
 * @param {string[]} filePaths The plugin source files to scan.
 * @returns {Promise<{tags: Map<string, string>, declarations: object[], structural: object[],
 *   metaKeys: Map<string, string>, regexCount: number, skipped: string[]}>} The tags by name with the file
 *   each was declared in, every tag declaration in full, every table entry that names no tag in full,
 *   the meta keys read natively, how many regex literals were seen, and a one-line label for each
 *   declaration that named no tag.
 */
export async function collectDeclaredTags(filePaths)
{
  const tags = new Map();
  const declarations = [];
  const structural = [];
  const metaKeys = new Map();
  const skipped = [];

  let regexCount = 0;

  // sorted, so every consumer sees the same first declaration no matter how the glob happened to walk.
  const orderedPaths = [ ...filePaths ].sort();

  for (const filePath of orderedPaths)
  {
    const ast = parse(await fs.readFile(filePath, 'utf-8'));

    const found = collectFromAst(ast, filePath);

    regexCount += found.regexCount;
    skipped.push(...found.skipped);
    declarations.push(...found.declarations);
    structural.push(...found.structural);

    // first declaration wins; the file is only ever used to tell the author where to look.
    found.tags.forEach((declaredIn, name) =>
    {
      if (tags.has(name) === false) tags.set(name, declaredIn);
    });

    found.metaKeys.forEach((readIn, key) =>
    {
      if (metaKeys.has(key) === false) metaKeys.set(key, readIn);
    });
  }

  return { tags, declarations, structural, metaKeys, regexCount, skipped };
}
//endregion notetag-declarations