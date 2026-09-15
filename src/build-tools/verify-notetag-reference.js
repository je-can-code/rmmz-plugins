//region verify-notetag-reference
/**
 * Verifies that every notetag a plugin declares has an entry in `docs/notetag-reference.md`.
 *
 * The reference is the one flat, scannable list of every notetag in the ecosystem, and it is what an
 * author reads instead of chasing a dozen plugins' `_annotations.js`. That only works while it is
 * complete: a reader who has been burned once has to check the source anyway, which is the whole cost
 * the document exists to remove. So `CLAUDE.md` requires the glossary entry to land in the same pull
 * request as the tag.
 *
 * It was the last rule in the repository still running on the honor system, and it is the one whose
 * violation is invisible. A missing method throws. A missing test drops coverage. **A missing glossary
 * entry looks exactly like a tag that does not exist** - nothing is broken, nothing is red, and the
 * only symptom is a person failing to find something and never reporting it.
 *
 * It had drifted, as the shape predicts. At the time this gate was written, thirty-eight tags across
 * five ships had no entry and no family covering them: all twenty-nine of J-Base's `<this{PARAM}>`
 * equipment parameters, five of J-SkillSlots' capacity tags, J-JAFTING-Refine's
 * `<transferrableEffectsBelow>`, J-Passive-Affix's `<affix-tier>`, J-SkillExtend's
 * `<onCastExecuteSkillIfAfflicted>`, and J-JAFTING-Create's `<ingredientType>` - the last of which had
 * no section in the reference at all.
 *
 * ## Why this reads the AST rather than the text
 *
 * Both halves of a naive text implementation are wrong, and each was wrong in a way that produced a
 * confident, plausible, false answer while this was being prototyped.
 *
 * **Grepping for tag declarations reads commented-out code.** Two of the first "findings" against the
 * sibling plugin-parameter check were lines that had been commented out years ago. A regex literal is
 * a node in the AST or it is not there at all, so the question does not arise.
 *
 * **Substring matching against the document silently credits the wrong entry.** `<thisCri>` is
 * undocumented, but asking whether the reference "mentions thisCri" answers yes, because it documents
 * `<thisCritChance>`. That single false negative hid one tag out of twenty-nine and would have hidden
 * the next one too. Membership here is therefore a **full, anchored match** against a heading pattern,
 * never a substring test.
 *
 * ## Families
 *
 * The reference deliberately documents a tag family as one entry with placeholders rather than one
 * entry per variant - `<{unit}RangePage:START-END>` covers ten real tags, and
 * `<(PARAM)(Buff|Growth)(Plus|Rate):[FORMULA]>` covers about a hundred and twenty. A checker that did
 * not understand that would report eighty false positives and be switched off within a day.
 *
 * So the patterns are derived from the `###` headings themselves rather than from a list maintained in
 * here. Two constructs appear in a heading's tag name, and both become a matcher:
 *
 * - `{anything}` - a placeholder, matching any tag-name run
 * - `(ANYTHING)` - the same, in the older parenthesised spelling
 * - `(Buff|Growth)` - an alternation, which stays an alternation
 *
 * There is no vocabulary list in this file to drift out of step with the document, which is the point.
 *
 * **The known cost of that design** is that a loose family pattern credits more than it should:
 * `<this(PARAM)>` will accept any tag beginning `this`. That is a deliberate trade - the alternative is
 * a hand-maintained list of every parameter shorthand, which rots - and `--verbose` prints which
 * heading credited which tag so the crediting can be audited when it matters.
 *
 * ## On trusting a green result
 *
 * A detector reporting "all clear" is indistinguishable from a detector that is quietly broken, so this
 * one states its arithmetic on every run: how many regex literals it found, how many it read as tags,
 * and how many headings it parsed. If the tag count collapses, the extractor broke rather than the tree
 * getting tidier. `--selftest` runs both controls - a planted undocumented tag that must be caught, and
 * a family-covered tag that must be credited - and is the thing to run when a result surprises you.
 *
 * Usage:
 *   node src/build-tools/verify-notetag-reference.js
 *   node src/build-tools/verify-notetag-reference.js --verbose
 *   node src/build-tools/verify-notetag-reference.js --selftest
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as acorn from 'acorn';
import Logger, { LogStyle } from './logger.js';

const SRC_PLUGINS_GLOB = './src/plugins/**/*.js';

const REFERENCE_PATH = './docs/notetag-reference.md';

/**
 * What a placeholder in a heading pattern is allowed to match: one run of tag-name characters.
 *
 * Deliberately excludes `:` and `>`, so a placeholder can never swallow a tag's payload or run past
 * the end of the name and match two tags at once.
 * @type {string}
 */
const PLACEHOLDER_MATCHER = '[A-Za-z0-9-]+';

/**
 * Parses source into an AST with location data.
 * @param {string} source The raw source text.
 * @returns {object} The parsed program.
 */
const parse = source => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', locations: true });

/**
 * Walks every node of an AST, invoking a visitor with each node.
 * @param {object} node The node to walk.
 * @param {(node: object) => void} visit The visitor.
 */
function walk(node, visit)
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
 * Reads the tag name(s) a notetag regex declares, from the regex's own pattern text.
 *
 * Returns several names for a pattern whose name is an alternation - `<(?:mm|minimap):…>` declares two
 * spellings of one tag, and both need an entry - and none for a regex that is not a notetag at all,
 * such as J-Base's anchored `ParsableComment` structural matcher.
 * @param {string} pattern The regex source text, without delimiters or flags.
 * @returns {string[]} Every tag name the pattern declares; empty when it declares none.
 */
function tagNamesFromPattern(pattern)
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
 * Every notetag declared anywhere in the plugin tree.
 * @param {string[]} filePaths The plugin source files to scan.
 * @returns {Promise<{tags: Map<string, string>, regexCount: number, skipped: string[]}>} The tags by
 * name with the file each was declared in, how many regex literals were seen, and the declarations
 * that named no tag.
 */
async function collectDeclaredTags(filePaths)
{
  const tags = new Map();
  const skipped = [];

  let regexCount = 0;

  for (const filePath of filePaths)
  {
    const ast = parse(await fs.readFile(filePath, 'utf-8'));

    const found = collectFromAst(ast, filePath);

    regexCount += found.regexCount;
    skipped.push(...found.skipped);

    // first declaration wins; the file is only ever used to tell the author where to look.
    found.tags.forEach((declaredIn, name) =>
    {
      if (tags.has(name) === false) tags.set(name, declaredIn);
    });
  }

  return { tags, regexCount, skipped };
}

/**
 * Reads every notetag one parsed file declares.
 *
 * Split out from the file walk above so `--selftest` can feed it synthetic source and prove the
 * extractor handles both declaration styles - the miss that shape produced was silent, tripled the
 * real tag count when fixed, and is exactly the failure a green run cannot be distinguished from.
 * @param {object} ast The parsed source.
 * @param {string} filePath The path to attribute declarations to.
 * @returns {{tags: Map<string, string>, regexCount: number, skipped: string[]}} What the file declares.
 */
function collectFromAst(ast, filePath)
{
  const tags = new Map();
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

    const names = tagNamesFromPattern(literal.regex.pattern);

    // a regex in the table that names no tag is reported rather than dropped, so the arithmetic
    // below stays checkable by a reader who suspects the extractor rather than the tree.
    if (names.length === 0)
    {
      skipped.push(`${label} (${filePath}:${literal.loc.start.line})`);

      return;
    }

    // first declaration wins; the file is only ever used to tell the author where to look.
    names.forEach(name =>
    {
      if (tags.has(name) === false) tags.set(name, filePath);
    });
  };

  walk(ast, node =>
  {
    if (node.type !== 'AssignmentExpression') return;

    const path = memberPath(node.left);

    // every notetag in this repo is declared into a `RegExp` table on its ship's namespace, so
    // anything assigned elsewhere is some other kind of pattern and none of this gate's business.
    const isTableMember = path.length >= 2 && path[path.length - 2] === 'RegExp';
    const isWholeTable = path.length >= 1 && path[path.length - 1] === 'RegExp';

    // style one: `J.SHIP.RegExp.SomeTag = /<someTag>/i` - one assignment per tag.
    if (isTableMember && node.right && node.right.type === 'Literal' && node.right.regex)
    {
      record(node.right, path.join('.'));

      return;
    }

    // style two: `J.SHIP.RegExp = { SomeTag: /<someTag>/i, … }` - the whole table at once. Both
    // spellings are in live use across the tree, and a checker that knew only the first would
    // silently ignore entire ships while still reporting a confident green.
    if (isWholeTable && node.right && node.right.type === 'ObjectExpression')
    {
      // nested grouping objects are walked too, so the shape of the table cannot hide a tag.
      walk(node.right, inner =>
      {
        if (inner.type !== 'Property') return;
        if (!inner.value || inner.value.type !== 'Literal' || !inner.value.regex) return;

        const key = inner.key.name ?? String(inner.key.value);

        record(inner.value, `${path.join('.')}.${key}`);
      });
    }
  });

  return { tags, regexCount, skipped };
}

/**
 * Turns one heading's tag name into an anchored matcher.
 *
 * Placeholders become a tag-name run; alternations stay alternations; everything else is literal text
 * and is escaped so a hyphenated tag name cannot be read as a regex range.
 * @param {string} headingName The tag name half of a heading, with its angle brackets already removed.
 * @returns {RegExp} A matcher anchored to both ends of a tag name.
 */
function headingNameToMatcher(headingName)
{
  let source = '';

  // consume the heading one construct at a time; a construct is a placeholder, an alternation, or a
  // literal run leading up to the next of either.
  const constructs = headingName.match(/\{[^}]*}|\([^)]*\)|[^{(]+/g) ?? [];

  for (const construct of constructs)
  {
    // the brace spelling of a placeholder is always a placeholder.
    if (construct.startsWith('{'))
    {
      source += PLACEHOLDER_MATCHER;
    }
    // the parenthesised spelling is a placeholder unless it lists alternatives.
    else if (construct.startsWith('('))
    {
      const inner = construct.slice(1, -1);

      source += inner.includes('|')
        ? `(?:${inner})`
        : PLACEHOLDER_MATCHER;
    }
    // anything else is literal heading text.
    else
    {
      source += construct.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  return new RegExp(`^${source}$`, 'i');
}

/**
 * Every tag-name matcher the reference document publishes, by the heading it came from.
 * @param {string} referenceText The full reference document.
 * @returns {{heading: string, matcher: RegExp}[]} One entry per tag name named in a heading.
 */
function collectReferenceMatchers(referenceText)
{
  const matchers = [];

  // only third-level headings name tags; the section headings above them name ships.
  const headings = referenceText.match(/^### .*$/gm) ?? [];

  for (const heading of headings)
  {
    // one heading may name several tags, each in its own backticked span.
    const spans = heading.match(/`<[^`]*>`/g) ?? [];

    for (const span of spans)
    {
      // strip the backticks and angle brackets, then drop the payload so only the name remains.
      const inner = span.slice(2, -2);
      const [ name ] = inner.split(':');

      matchers.push({ heading: heading.replace(/^### /, ''), matcher: headingNameToMatcher(name) });
    }
  }

  return matchers;
}

/**
 * Reports the outcome and returns the process exit code.
 * @param {Map<string, string>} tags Every declared tag, by name.
 * @param {{heading: string, matcher: RegExp}[]} matchers Every matcher the reference publishes.
 * @param {number} regexCount How many regex literals were found in `RegExp` tables.
 * @param {string[]} skipped Declarations that named no tag.
 * @param {boolean} verbose Whether to print the heading that credited each documented tag.
 * @returns {number} Exit code - 0 for clean, 1 for undocumented tags.
 */
function report(tags, matchers, regexCount, skipped, verbose)
{
  const undocumented = [];
  const credits = [];

  for (const [ name, filePath ] of tags)
  {
    const credit = matchers.find(entry => entry.matcher.test(name));

    if (credit)
    {
      credits.push(`  • <${name}> -> ${credit.heading}`);
    }
    else
    {
      undocumented.push({ name, filePath });
    }
  }

  Logger.logAnyway(
    `notetag-reference verify: ${regexCount} regex(es) in RegExp tables, ${tags.size} tag name(s) read, `
    + `${skipped.length} non-tag, ${matchers.length} reference matcher(s).`,
    LogStyle.brightCyan);

  // the skipped list is short and stable, so printing it costs nothing and keeps the arithmetic honest.
  skipped.forEach(entry => Logger.logAnyway(`  - not a notetag, ignored: ${entry}`, LogStyle.brightBlack));

  if (verbose) credits.forEach(entry => Logger.logAnyway(entry, LogStyle.brightBlack));

  if (undocumented.length === 0)
  {
    Logger.logAnyway('notetag-reference verify: OK (every declared tag has an entry).', LogStyle.brightGreen);

    return 0;
  }

  Logger.logAnyway(
    `notetag-reference verify FAILED: ${undocumented.length} tag(s) have no entry.`,
    LogStyle.brightRed);
  Logger.logAnyway('  A tag nobody can find is a tag that does not exist. Add an entry to', LogStyle.brightYellow);
  Logger.logAnyway(`  ${REFERENCE_PATH} in this same change - what it applies to, when it fires,`, LogStyle.brightYellow);
  Logger.logAnyway('  what it does, and a real example. Several variants of one tag share one entry.', LogStyle.brightYellow);

  undocumented.forEach(({ name, filePath }) =>
  {
    Logger.logAnyway(`  • <${name}> declared in ${filePath}`, LogStyle.brightRed);
  });

  return 1;
}

/**
 * Proves the detector can both catch and clear, using controls rather than the live tree.
 *
 * A gate that only ever reports "clean" against a clean tree has demonstrated nothing, so this plants a
 * tag that must be caught and a tag that must be credited, and fails if either verdict is wrong.
 * @param {{heading: string, matcher: RegExp}[]} matchers Every matcher the reference publishes.
 * @returns {number} Exit code - 0 when both controls behave, 1 otherwise.
 */
function selftest(matchers)
{
  const failures = [];

  // the reference has to have parsed at all; every control below is meaningless if it did not.
  if (matchers.length === 0)
  {
    Logger.logAnyway('selftest FAILED: no matchers parsed from the reference at all.', LogStyle.brightRed);

    return 1;
  }

  // control one: a tag nothing documents must be reported.
  const inventedTag = 'zzzDefinitelyUndocumentedTag';
  if (matchers.some(entry => entry.matcher.test(inventedTag)))
  {
    failures.push(`a tag no entry describes (<${inventedTag}>) was credited to an entry anyway.`);
  }

  // control two: a tag covered only by a family entry must be credited, since that is the case a
  // naive checker gets wrong and the one that would bury the real findings in false positives.
  const familyTag = 'thisAtk';
  if (matchers.some(entry => entry.matcher.test(familyTag)) === false)
  {
    failures.push(`a family-covered tag (<${familyTag}>) was reported as undocumented.`);
  }

  // control three: the substring trap that hid a real tag while this was being written. `<thisCri>`
  // and `<thisCritChance>` are different tags, and a checker that asks whether the document "mentions
  // thisCri" answers yes for the wrong reason. It belongs to whichever entry also covers `<thisAtk>`,
  // so the control asserts that rather than naming a heading that can be reworded.
  const substringTag = 'thisCri';
  const creditsFor = name => matchers.filter(entry => entry.matcher.test(name)).map(entry => entry.heading);
  const sharedHeading = creditsFor(substringTag).some(heading => creditsFor(familyTag).includes(heading));
  if (sharedHeading === false)
  {
    failures.push(`<${substringTag}> is not credited to the same entry as <${familyTag}>.`);
  }

  // control four: both declaration styles must be seen. Reading only the one-assignment-per-tag
  // spelling found a third of the tree's tags and reported a confident green over the rest, which is
  // the single worst outcome available to a checker like this one.
  const styles = [
    { label: 'per-tag assignment', source: 'J.SHIP.RegExp.Thing = /<styleOneTag: ?(\\d+)>/i;' },
    { label: 'whole-table literal', source: 'J.SHIP.RegExp = { Thing: /<styleTwoTag: ?(\\d+)>/i };' },
  ];

  styles.forEach(({ label, source }) =>
  {
    const { tags } = collectFromAst(parse(source), 'selftest');

    // the expected name differs per style, so read whatever single tag came back and check it landed.
    if (tags.size !== 1)
    {
      failures.push(`the ${label} style yielded ${tags.size} tag(s), expected exactly 1.`);
    }
  });

  // control five: the extractor must read a name out of each regex shape the tree actually uses.
  const extractions = [
    { pattern: '<thisAtk: ?(-?\\d+)>', expected: [ 'thisAtk' ] },
    { pattern: '<(?:mm|minimap):(npc|loot)>', expected: [ 'mm', 'minimap' ] },
    { pattern: '^<[\\w]+>$', expected: [] },
  ];

  extractions.forEach(({ pattern, expected }) =>
  {
    const actual = tagNamesFromPattern(pattern);

    if (actual.join(',') !== expected.join(','))
    {
      failures.push(`extractor read /${pattern}/ as [${actual}], expected [${expected}].`);
    }
  });

  if (failures.length === 0)
  {
    Logger.logAnyway('notetag-reference selftest: OK (catches the undocumented, credits the families).',
      LogStyle.brightGreen);

    return 0;
  }

  Logger.logAnyway('notetag-reference selftest FAILED:', LogStyle.brightRed);
  failures.forEach(failure => Logger.logAnyway(`  • ${failure}`, LogStyle.brightRed));

  return 1;
}

/**
 * Entry point.
 * @returns {Promise<number>} Exit code - 0 for clean, 1 for violations found.
 */
async function main()
{
  const referenceText = await fs.readFile(REFERENCE_PATH, 'utf-8');
  const matchers = collectReferenceMatchers(referenceText);

  if (process.argv.includes('--selftest')) return selftest(matchers);

  const filePaths = await glob(SRC_PLUGINS_GLOB);
  const { tags, regexCount, skipped } = await collectDeclaredTags(filePaths);

  return report(tags, matchers, regexCount, skipped, process.argv.includes('--verbose'));
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-notetag-reference