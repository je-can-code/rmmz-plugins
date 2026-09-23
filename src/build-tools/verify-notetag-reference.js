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
 * ## Tags that carry ids
 *
 * The same pass holds `notetag-id-targets.js` to the reference. A tag whose heading names an id
 * placeholder - `STATE_ID`, `SKILL_IDS`, a bare `ID` - is a pointer into a database table, and Chef
 * Adventure's data validator can only resolve the pointers that table describes. So an id-bearing tag
 * with no entry there fails here, as does an entry for a tag that nothing declares any more. The
 * heading is the trigger because it is the one place every tag's payload is already written down in a
 * shape a machine can read.
 *
 * ## Where declarations come from
 *
 * `notetag-declarations.js` reads the tree, and `generate-manifest` reads it through the same module,
 * so this gate and the manifest Chef Adventure validates against can never disagree about what a tag
 * is. That includes the tags RMMZ parses natively into `.meta`, which declare no regex at all and
 * still need an entry.
 *
 * ## On trusting a green result
 *
 * A detector reporting "all clear" is indistinguishable from a detector that is quietly broken, so this
 * one states its arithmetic on every run: how many regex literals it found, how many it read as tags,
 * and how many headings it parsed. If the tag count collapses, the extractor broke rather than the tree
 * getting tidier. `--selftest` runs the controls - a planted undocumented tag that must be caught, a
 * family-covered tag that must be credited, every declaration style, and an id-bearing tag with no
 * target - and is the thing to run when a result surprises you.
 *
 * Usage:
 *   node src/build-tools/verify-notetag-reference.js
 *   node src/build-tools/verify-notetag-reference.js --verbose
 *   node src/build-tools/verify-notetag-reference.js --selftest
 */
import * as fs from 'fs/promises';
import { glob } from 'glob';
import Logger, { LogStyle } from './logger.js';
import { collectDeclaredTags, collectFromAst, parse, tagNamesFromPattern } from './notetag-declarations.js';
import { IdTables, NotetagIdTargets } from './notetag-id-targets.js';

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
 * Whether a heading's payload names an id, judged by its placeholder words.
 *
 * A placeholder word is an uppercase run, and it names an id when `ID` or `IDS` is one of its
 * underscore-separated parts: `STATE_ID`, `SKILL_IDS`, `ID_OR_NAME` and a bare `ID` all qualify. A word
 * like `VALID` does not, because the test is on whole parts rather than on substrings.
 * @param {string} payload The payload half of a heading span, after the tag name and its colon.
 * @returns {boolean} True when the payload names at least one id.
 */
const payloadNamesAnId = payload => (payload.match(/[A-Z][A-Z_]*/g) ?? [])
  .some(word => word.split('_').some(part => part === 'ID' || part === 'IDS'));

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
 *
 * Each matcher also records whether its span's payload names an id, which is what decides whether the
 * tags it credits owe an entry in `notetag-id-targets.js`.
 * @param {string} referenceText The full reference document.
 * @returns {{heading: string, matcher: RegExp, namesAnId: boolean}[]} One entry per tag name named in
 *   a heading.
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
      // strip the backticks and angle brackets, then split the name from its payload.
      const inner = span.slice(2, -2);
      const [ name, ...payloadParts ] = inner.split(':');
      const payload = payloadParts.join(':');

      matchers.push({
        heading: heading.replace(/^### /, ''),
        matcher: headingNameToMatcher(name),
        namesAnId: payloadNamesAnId(payload),
      });
    }
  }

  return matchers;
}

/**
 * Describes what is wrong with one id target, if anything.
 *
 * The validator on the far side trusts this table completely, so a target it cannot interpret has to
 * fail here, where the person who wrote it is still looking at it.
 * @param {object} target One entry from a tag's target list.
 * @returns {string} What is wrong; empty when the target is well formed.
 */
function describeTargetProblem(target)
{
  const { position, table, reason, allowZero, acceptsName } = target;

  // a position is a zero-based payload index, or the word that means "every value".
  const isIndex = Number.isInteger(position) && position >= 0;
  if (isIndex === false && position !== 'each') return `position must be a payload index or 'each', not ${position}.`;

  // flags only ever switch something on, so anything but true is a typo waiting to be misread.
  if (allowZero !== undefined && allowZero !== true) return 'allowZero may only be true.';
  if (acceptsName !== undefined && acceptsName !== true) return 'acceptsName may only be true.';

  // an id with no table has to say what it names instead.
  if (table === null)
  {
    return (reason ?? '').length > 0
      ? ''
      : 'a target with no table needs a reason saying what the id names.';
  }

  // the ordinary case: one table, by name.
  if (Object.hasOwn(IdTables, String(table))) return '';

  // the dispatched case: another payload value picks the table from a list of cases.
  const { byPosition, cases } = table;
  if (Number.isInteger(byPosition) === false || byPosition < 0) return 'byPosition must be a payload index.';

  const chosen = Object.values(cases ?? {});
  if (chosen.length === 0) return 'a dispatched table needs at least one case.';

  const unknown = chosen.filter(name => Object.hasOwn(IdTables, name) === false);
  if (unknown.length > 0) return `names table(s) the validator does not know: ${unknown.join(', ')}.`;

  return '';
}

/**
 * Every problem with the id-target table, judged against the tree and the reference.
 *
 * Three ways it can be wrong: an entry for a tag nothing declares any more, an entry the validator
 * could not interpret, and an id-bearing tag with no entry at all. The last is the one that matters,
 * because a tag missing from this table is a pointer nobody will ever resolve.
 * @param {Set<string>} declared Every declared tag name, whether read by regex or through `.meta`.
 * @param {{heading: string, matcher: RegExp, namesAnId: boolean}[]} matchers Every reference matcher.
 * @param {Object<string, object[]>} targets The id-target table.
 * @returns {string[]} One line per problem; empty when the table is complete and well formed.
 */
function findIdTargetProblems(declared, matchers, targets)
{
  const problems = [];

  Object.entries(targets).forEach(([ name, list ]) =>
  {
    // an entry is only as good as the tag it describes still existing.
    if (declared.has(name) === false)
    {
      problems.push(`<${name}> has an id-target entry, but no plugin declares that tag.`);
    }

    // every target in the entry has to be something the validator can act on.
    list.forEach(target =>
    {
      const problem = describeTargetProblem(target);

      if (problem !== '') problems.push(`<${name}> id target: ${problem}`);
    });
  });

  declared.forEach(name =>
  {
    // a tag only owes an entry when the heading documenting it names an id in its payload.
    const namesAnId = matchers.some(entry => entry.namesAnId && entry.matcher.test(name));

    if (namesAnId && Object.hasOwn(targets, name) === false)
    {
      problems.push(`<${name}> names an id in its reference heading, but has no entry in notetag-id-targets.js.`);
    }
  });

  return problems;
}

/**
 * Reports the outcome and returns the process exit code.
 * @param {Map<string, string>} tags Every declared tag, by name, with the file declaring it.
 * @param {Map<string, string>} metaKeys Every tag read through the engine's native `.meta`.
 * @param {{heading: string, matcher: RegExp, namesAnId: boolean}[]} matchers Every reference matcher.
 * @param {number} regexCount How many regex literals were found in `RegExp` tables.
 * @param {string[]} skipped Declarations that named no tag.
 * @param {boolean} verbose Whether to print the heading that credited each documented tag.
 * @returns {number} Exit code - 0 for clean, 1 for undocumented tags or id-target problems.
 */
function report(tags, metaKeys, matchers, regexCount, skipped, verbose)
{
  const undocumented = [];
  const credits = [];

  // a meta-read tag is a tag like any other, and owes the glossary an entry just the same.
  const everyTag = new Map([ ...metaKeys, ...tags ]);

  for (const [ name, filePath ] of everyTag)
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

  const idProblems = findIdTargetProblems(new Set(everyTag.keys()), matchers, NotetagIdTargets);

  Logger.logAnyway(
    `notetag-reference verify: ${regexCount} regex(es) in RegExp tables, ${tags.size} tag name(s) read, `
    + `${metaKeys.size} read through .meta, ${skipped.length} non-tag, ${matchers.length} reference matcher(s), `
    + `${Object.keys(NotetagIdTargets).length} id-bearing tag(s) mapped.`,
    LogStyle.brightCyan);

  // the skipped list is short and stable, so printing it costs nothing and keeps the arithmetic honest.
  skipped.forEach(entry => Logger.logAnyway(`  - not a notetag, ignored: ${entry}`, LogStyle.brightBlack));

  if (verbose) credits.forEach(entry => Logger.logAnyway(entry, LogStyle.brightBlack));

  if (undocumented.length === 0 && idProblems.length === 0)
  {
    Logger.logAnyway('notetag-reference verify: OK (every declared tag has an entry, every id has a table).',
      LogStyle.brightGreen);

    return 0;
  }

  if (undocumented.length > 0)
  {
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
  }

  if (idProblems.length > 0)
  {
    Logger.logAnyway(
      `notetag-reference verify FAILED: ${idProblems.length} id-target problem(s).`,
      LogStyle.brightRed);
    Logger.logAnyway('  An id nobody can resolve is a reference nothing checks. Say which table it points', LogStyle.brightYellow);
    Logger.logAnyway('  into in src/build-tools/notetag-id-targets.js, or why it points at none.', LogStyle.brightYellow);

    idProblems.forEach(problem => Logger.logAnyway(`  • ${problem}`, LogStyle.brightRed));
  }

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

  // control four: every declaration style must be seen. Reading only the one-assignment-per-tag
  // spelling found a third of the tree's tags and reported a confident green over the rest, which is
  // the single worst outcome available to a checker like this one. The array style hid eight tags
  // authored on every class in Chef Adventure until a data validator went looking for them.
  const styles = [
    { label: 'per-tag assignment', source: 'J.SHIP.RegExp.Thing = /<styleOneTag: ?(\\d+)>/i;', expected: 1 },
    { label: 'whole-table literal', source: 'J.SHIP.RegExp = { Thing: /<styleTwoTag: ?(\\d+)>/i };', expected: 1 },
    { label: 'array of patterns', source: 'J.SHIP.RegExp = { Things: [ /<oneOf:(\\d+)>/i, /<twoOf:(\\d+)>/i ] };', expected: 2 },
  ];

  styles.forEach(({ label, source, expected }) =>
  {
    const { tags } = collectFromAst(parse(source), 'selftest');

    // the names differ per style, so count what came back and check every one of them landed.
    if (tags.size !== expected)
    {
      failures.push(`the ${label} style yielded ${tags.size} tag(s), expected exactly ${expected}.`);
    }
  });

  // control five: a native meta read is a tag declaration, and a local variable called `meta` is not.
  const metaSource = 'if ($dataMap.meta[\'plantedMetaTag\']) {} const x = meta.notATag;';
  const { metaKeys } = collectFromAst(parse(metaSource), 'selftest');
  if (metaKeys.size !== 1 || metaKeys.has('plantedMetaTag') === false)
  {
    failures.push(`meta reads yielded [${[ ...metaKeys.keys() ]}], expected exactly [plantedMetaTag].`);
  }

  // control six: an id-bearing tag with no target must be caught, and a mapped one must not be. The
  // planted heading stands in for a real one so the control cannot pass on the strength of the live
  // table happening to be complete.
  const plantedMatchers = collectReferenceMatchers('### `<plantedIdTag:[STATE_ID, CHANCE]>`\n### `<plantedPlainTag:VAL>`');
  const plantedDeclared = new Set([ 'plantedIdTag', 'plantedPlainTag' ]);
  const unmapped = findIdTargetProblems(plantedDeclared, plantedMatchers, {});
  const mapped = findIdTargetProblems(plantedDeclared, plantedMatchers, { plantedIdTag: [ { position: 0, table: 'States' } ] });
  if (unmapped.length !== 1 || unmapped[0].includes('<plantedIdTag>') === false)
  {
    failures.push(`an unmapped id-bearing tag produced [${unmapped}], expected one problem naming <plantedIdTag>.`);
  }

  if (mapped.length !== 0)
  {
    failures.push(`a correctly mapped id-bearing tag still produced [${mapped}].`);
  }

  // control seven: a target naming a table the validator does not know must be refused.
  const unknownTable = describeTargetProblem({ position: 0, table: 'Nonsense' });
  if (unknownTable === '')
  {
    failures.push('a target naming an unknown table was accepted.');
  }

  // control eight: the extractor must read a name out of each regex shape the tree actually uses.
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
  const { tags, metaKeys, regexCount, skipped } = await collectDeclaredTags(filePaths);

  return report(tags, metaKeys, matchers, regexCount, skipped, process.argv.includes('--verbose'));
}

const exitCode = await main();
process.exit(exitCode);
//endregion verify-notetag-reference