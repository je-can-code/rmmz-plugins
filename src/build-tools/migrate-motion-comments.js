//region migrate-motion-comments
/**
 * Rewrites Chef Adventure's map data from the outgoing motion plugin's comment strings to J-Motion's
 * tag grammar.
 *
 * The outgoing plugin matched bare English phrases written as event comments. J-Motion reads a
 * proper notetag, so every one of those phrases has to be rewritten in place. There are five of
 * them and none carry parameters, which makes this a whole-string swap rather than a parse.
 *
 * Two things this deliberately changes, both settled before it was written:
 *
 * - The outgoing plugin only ever read the FIRST line of a comment block (event command code 108),
 *   so a motion written on any later line (code 408) did nothing at all. J-Motion reads both, as
 *   J-Base's comment reader always has, so those previously-inert lines come alive here.
 * - `breath motion 1` becomes `stretch` and `breath motion 2` becomes `breathe`, which is not their
 *   numeric order. The first moves height alone; the second lengthens as it narrows. The names
 *   describe the motion rather than the order somebody happened to write them in.
 *
 * **The rewrite is textual, on purpose.** RMMZ writes a map as one line per event, and parsing a
 * map and stringifying it back collapses the whole file onto a single line. Nothing at runtime
 * would care, but it turns a 4,180-comment change into a 183-file total rewrite that no human could
 * review. So the file is parsed only to decide *what* to change, and the raw text is edited to
 * actually change it - leaving every byte this migration is not responsible for exactly as it was.
 *
 * The two passes have to agree before anything is written. If the structural pass finds a different
 * number of comments than the textual pass finds spans to replace, some occurrence lives somewhere
 * this was not expecting - a line of dialogue that happens to read `float motion`, most likely - and
 * the migration refuses to run rather than guessing.
 *
 * Usage:
 *   bun src/build-tools/migrate-motion-comments.js            # dry run, writes nothing
 *   bun src/build-tools/migrate-motion-comments.js --apply    # rewrites the files
 */
import * as fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Where Chef Adventure's map data lives.
 * @type {string}
 */
const DATA_DIR = path.resolve('../ca/chef-adventure/data');

/**
 * The event command codes that hold comment text.
 *
 * 108 is the first line of a comment block and 408 is every line after it. Both are comments as far
 * as an author is concerned, and both are read.
 * @type {number[]}
 */
const COMMENT_CODES = [ 108, 408 ];

/**
 * Every outgoing phrase, lowercased, and the tag that replaces it.
 * @type {Map<string, string>}
 */
const REPLACEMENTS = new Map([
  [ 'breath motion 1', '<motion:[stretch]>' ],
  [ 'breath motion 2', '<motion:[breathe]>' ],
  [ 'float motion', '<motion:[float]>' ],
  [ 'swing motion', '<motion:[swing]>' ],
  [ 'ghost motion', '<motion:[ghost]>' ],
]);

/**
 * The replacement tag for a comment, if it is one of the phrases being migrated.
 *
 * Matching is case-insensitive and ignores surrounding whitespace, because the outgoing plugin
 * lower-cased before comparing and the data holds both `float motion` and `Float Motion`.
 * @param {string} comment The comment text as authored.
 * @returns {string|null} The replacement tag, or null when this comment is not one of ours.
 */
const replacementFor = comment =>
{
  const normalized = comment.trim()
    .toLowerCase();

  if (REPLACEMENTS.has(normalized) === false) return null;

  return REPLACEMENTS.get(normalized);
};

/**
 * The exact raw-text span a comment occupies in a map file: the quoted string itself.
 *
 * Deliberately just the quoted value rather than the whole `"parameters":[...]` wrapper it sits in.
 * Most of Chef Adventure's maps are written the way RMMZ writes them, one line per event with no
 * spaces, but two of them - Map046 and Map138 - are pretty-printed, and a wrapper-shaped target
 * matches in the 181 and silently misses the 2. The quoted value is identical in both.
 *
 * On its own this would be a broad target, since a line of dialogue reading `float motion` is the
 * same six-and-a-bit bytes. That is what the per-file count check exists for: the structural pass
 * knows exactly how many comments there are, and any disagreement stops the migration.
 * @param {string} comment The comment text as authored.
 * @returns {string}
 */
const rawSpanFor = comment => `"${comment}"`;

/**
 * Finds every motion comment in one map, without changing anything.
 * @param {Object} map The parsed map data.
 * @returns {Object[]} One record per comment that needs rewriting.
 */
const findMotionComments = map =>
{
  const found = [];

  if (!map.events) return found;

  map.events.forEach(event =>
  {
    if (!event || !event.pages) return;

    event.pages.forEach((page, pageIndex) =>
    {
      page.list.forEach(command =>
      {
        if (COMMENT_CODES.includes(command.code) === false) return;

        const [ comment ] = command.parameters;
        const replacement = replacementFor(comment);

        if (replacement === null) return;

        found.push({
          eventId: event.id,
          page: pageIndex + 1,
          code: command.code,
          from: comment,
          to: replacement,
        });
      });
    });
  });

  return found;
};

/**
 * Rewrites one map's raw text, and confirms it changed exactly as many spans as expected.
 * @param {string} raw The map file's text.
 * @param {Object[]} found The comments the structural pass identified.
 * @returns {Object} The rewritten text and the number of spans replaced.
 */
const rewriteRaw = (raw, found) =>
{
  // group by exact authored spelling, so `Float Motion` and `float motion` are handled separately
  // and each replacement targets a span that genuinely exists in the text.
  const countsBySpelling = new Map();
  found.forEach(record => countsBySpelling.set(record.from, (countsBySpelling.get(record.from) ?? 0) + 1));

  let rewritten = raw;
  let replaced = 0;

  countsBySpelling.forEach((_expectedCount, spelling) =>
  {
    const target = rawSpanFor(spelling);
    const replacement = rawSpanFor(replacementFor(spelling));
    const actualCount = rewritten.split(target).length - 1;

    replaced += actualCount;
    rewritten = rewritten.replaceAll(target, replacement);
  });

  return { rewritten, replaced };
};

/**
 * Runs the migration across every map file.
 * @param {boolean} shouldApply Whether to write the rewritten data back to disk.
 */
const migrate = async shouldApply =>
{
  const entries = await fs.readdir(DATA_DIR);
  const mapFiles = entries.filter(name => /^Map\d+\.json$/.test(name))
    .sort();

  const totalsByPhrase = new Map();
  const totalsByCode = new Map();
  const mismatches = [];
  const samples = [];
  let touchedFileCount = 0;
  let totalRewrites = 0;
  const pendingWrites = [];

  for (const mapFile of mapFiles)
  {
    const fullPath = path.join(DATA_DIR, mapFile);
    const raw = await fs.readFile(fullPath, 'utf8');
    const map = JSON.parse(raw);
    const found = findMotionComments(map);

    if (found.length === 0) continue;

    const { rewritten, replaced } = rewriteRaw(raw, found);

    // the two passes disagreeing means an occurrence lives somewhere unexpected. say so and refuse.
    if (replaced !== found.length)
    {
      mismatches.push(`${mapFile}: structure found ${found.length}, text replaced ${replaced}`);
    }

    touchedFileCount++;
    totalRewrites += found.length;
    pendingWrites.push({ fullPath, rewritten });

    found.forEach(record =>
    {
      const phraseKey = record.from.trim()
        .toLowerCase();
      totalsByPhrase.set(phraseKey, (totalsByPhrase.get(phraseKey) ?? 0) + 1);
      totalsByCode.set(record.code, (totalsByCode.get(record.code) ?? 0) + 1);
    });

    if (samples.length < 10)
    {
      const [ first ] = found;
      samples.push(`${mapFile} ev${first.eventId} pg${first.page} (code ${first.code}): "${first.from}" -> ${first.to}`);
    }
  }

  console.log(shouldApply === true
    ? '=== APPLYING ==='
    : '=== DRY RUN - nothing will be written ===');
  console.log(`map files scanned:  ${mapFiles.length}`);
  console.log(`map files touched:  ${touchedFileCount}`);
  console.log(`comments rewritten: ${totalRewrites}`);
  console.log('');
  console.log('by phrase:');
  REPLACEMENTS.forEach((replacement, phrase) =>
  {
    const count = totalsByPhrase.get(phrase) ?? 0;
    console.log(`  ${phrase.padEnd(18)} -> ${replacement.padEnd(22)} ${count}`);
  });
  console.log('');
  console.log('by event command code:');
  console.log(`  108 (first line of a comment block):  ${totalsByCode.get(108) ?? 0}`);
  console.log(`  408 (a later line, previously inert): ${totalsByCode.get(408) ?? 0}`);
  console.log('');
  console.log('samples:');
  samples.forEach(sample => console.log(`  ${sample}`));
  console.log('');

  if (mismatches.length > 0)
  {
    console.log(`REFUSING TO WRITE - ${mismatches.length} file(s) where the two passes disagree:`);
    mismatches.forEach(mismatch => console.log(`  ${mismatch}`));

    return;
  }

  console.log('structural and textual passes agree on every file.');

  if (shouldApply === false)
  {
    console.log('dry run complete; nothing was written.');

    return;
  }

  for (const { fullPath, rewritten } of pendingWrites)
  {
    await fs.writeFile(fullPath, rewritten, 'utf8');
  }

  console.log(`wrote ${pendingWrites.length} file(s).`);
};

const shouldApply = process.argv.includes('--apply');
await migrate(shouldApply);
//endregion migrate-motion-comments