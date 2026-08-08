//region NoteResolver
/**
 * Merges one note into another, tag-aware.
 *
 * Notes are J-Base's business: it hydrates every `$data*` row into an `RPG_*` model, {@link RPGManager}
 * reads tags off them, and {@link TraitResolver} merges the structured half of the same problem. The
 * note merger belongs beside them rather than inside whichever plugin happened to need it first.
 *
 * **The policy is a parameter, deliberately.** Which keys accumulate rather than replace is a decision
 * the caller states outright, not something read from a registry populated at boot. That matters because
 * merged notes can outlive the merge: JAFTING replays a refined equip's provenance on every load, so a
 * merge that consulted a global would silently produce different results once another plugin registered
 * a key. Passing the policy in makes the output a function of nothing but its arguments.
 *
 * Two behaviors, and they line up with how the tags are read back:
 * - **replace** (the default) suits a tag read by a scalar reader like
 *   {@link RPGManager.getNumberFromNoteByRegex}, which takes the last match on a note and ignores the
 *   rest. Appending a second one would silently discard the first.
 * - **accumulate** suits a tag read by a collecting reader like
 *   {@link RPGManager.getArraysFromNotesByRegex}, where every occurrence contributes.
 */
class NoteResolver
{
  /**
   * The shapes a note line can take.
   */
  static LineType = {
    /**
     * A "key value pair" tag, such as <key:value>.
     */
    kvp: 'kvp',

    /**
     * A "boolean" tag, such as <key>.
     */
    boolean: 'boolean',

    /**
     * A line this framework has no opinion about - free-form prose, or malformed brackets.
     */
    unsupported: 'unsupported',
  };

  /**
   * Merges the overlay note into the base note, keyed by tag name.
   *
   * Keys absent from `accumulatingKeys` are replaced outright when the overlay offers any line for
   * them, and left alone when it does not. Keys present in it keep the base's lines and gain the
   * overlay's unique ones. Free-form lines survive from both sides, deduplicated, base first.
   *
   * Keys compare case-insensitively; a tag is anything wrapped in angle brackets.
   * @param {string} baseNote The note being merged into.
   * @param {string} overlayNote The note being merged in.
   * @param {string[]} accumulatingKeys Keys that gain the overlay's lines instead of being replaced by
   * them. Empty means every key replaces, which is the conservative reading.
   * @returns {string} The merged note, newline-joined.
   */
  static merge(baseNote, overlayNote, accumulatingKeys = [])
  {
    // database rows routinely carry null notes, so both sides normalize to empty before tokenizing.
    const oldNote = baseNote || String.empty;
    const newNote = overlayNote || String.empty;

    // separate each side into tags and everything else.
    const oldTokens = this._tokenizeNote(oldNote);
    const newTokens = this._tokenizeNote(newNote);

    // group each side's tags under their keys.
    const oldBuckets = this._toKeyBuckets(oldTokens.tags);
    const newBuckets = this._toKeyBuckets(newTokens.tags);

    // apply replace-or-accumulate per key.
    const merged = this._mergeBuckets(oldBuckets, newBuckets, accumulatingKeys);

    // free-form lines are kept from both, base order first.
    const mergedUnsupported = this._mergeUnsupported(oldTokens.unsupported, newTokens.unsupported);

    // rebuild the note text from what survived.
    return this._reconstructNote(mergedUnsupported, merged);
  }

  /**
   * Tokenizes a note into angle-bracketed tags and everything else.
   *
   * Tags are extracted by pattern rather than by line, so several crammed onto one line are still seen
   * individually. Anything that is not itself exactly a tag counts as free-form.
   * @param {string} note The raw note text.
   * @returns {{tags: string[], unsupported: string[]}} The extracted tags and free-form lines.
   */
  static _tokenizeNote(note)
  {
    // find angle-bracketed chunks like <key:value> or <key>.
    const tags = note.match(/<[^>]+>/g) || [];

    // split the raw text on newlines to capture any free-form lines. splitting always yields an
    // array- even an empty string produces a one-element one- so there is nothing to fall back to.
    const rawLines = note.split(/[\r\n]+/)
      .filter(l => l.length > 0);

    // build a fast look-up set of exact tag strings.
    const tagSet = new Set(tags);

    // anything that is not an exact tag string is free-form.
    const unsupported = rawLines.filter(l => tagSet.has(l) === false);

    // return the separated collections.
    return {
      tags: tags,
      unsupported: unsupported,
    };
  }

  /**
   * Parses a single tag into its key and shape.
   * @param {string} tag The tag, e.g. "<range:5>" or "<direct>".
   * @returns {{type: string, key: (string|null), line: string}} The parsed record.
   */
  static _parseTag(tag)
  {
    // classify the shape before trying to read a key out of it.
    const type = this._classifyLine(tag);

    // an unsupported tag has no key to speak of, which is what keeps it out of bucketing.
    if (type === NoteResolver.LineType.unsupported)
    {
      return {
        type: type,
        key: null,
        line: tag,
      };
    }

    // strip off the leading and trailing angle brackets.
    const inner = tag.substring(1, tag.length - 1);

    // a kvp names its key before the first colon; later colons belong to the value.
    if (type === NoteResolver.LineType.kvp)
    {
      const idx = inner.indexOf(':');
      const key = inner.substring(0, idx)
        .trim()
        .toLowerCase();

      return {
        type: type,
        key: key,
        line: tag,
      };
    }

    // it must be boolean, so the whole inner content is the key.
    const key = inner.trim()
      .toLowerCase();

    return {
      type: NoteResolver.LineType.boolean,
      key: key,
      line: tag,
    };
  }

  /**
   * Determines which shape a note line takes.
   * @param {string} line The note line to classify.
   * @returns {string} One of {@link NoteResolver.LineType}.
   */
  static _classifyLine(line)
  {
    // must at least start and end with angle brackets.
    if (line.startsWith('<') === false || line.endsWith('>') === false) return NoteResolver.LineType.unsupported;

    // too many angle brackets. the check above already established that the line opens with `<` and
    // closes with `>`, so both of these matches are guaranteed to find at least one occurrence-
    // there is no null result here to guard against.
    if (line.match(/</g).length > 1) return NoteResolver.LineType.unsupported;
    if (line.match(/>/g).length > 1) return NoteResolver.LineType.unsupported;

    // if a colon exists, then it must be a key-value pair of some kind.
    if (line.includes(':')) return NoteResolver.LineType.kvp;

    // its just a pair of angle brackets, so its a boolean-type tag.
    return NoteResolver.LineType.boolean;
  }

  /**
   * Groups tags under their keys, keeping first-seen key order and dropping exact duplicate lines.
   * @param {string[]} tags The tag strings to bucket.
   * @returns {{ order: string[], map: Record<string, string[]> }} The ordered keys and per-key lines.
   */
  static _toKeyBuckets(tags)
  {
    // the ordered list of unique keys as encountered.
    const order = [];

    // the key -> array-of-lines mapping.
    const map = Object.create(null);

    tags.forEach(tag =>
    {
      const parsed = this._parseTag(tag);

      // free-form content is handled separately.
      if (parsed.type === NoteResolver.LineType.unsupported) return;

      // first sighting of this key establishes its bucket and its place in the order.
      if (map[parsed.key] === undefined)
      {
        map[parsed.key] = [];
        order.push(parsed.key);
      }

      // an identical line twice says nothing twice.
      if (map[parsed.key].includes(parsed.line) === false)
      {
        map[parsed.key].push(parsed.line);
      }
    });

    return {
      order: order,
      map: map,
    };
  }

  /**
   * Applies replace-or-accumulate across two sets of buckets.
   *
   * Base key order is the baseline, so a merge never reshuffles what was already there. Keys only the
   * overlay has arrive afterwards, in its own order.
   * @param {{order: string[], map: Record<string, string[]>}} oldBuckets The base note's buckets.
   * @param {{order: string[], map: Record<string, string[]>}} newBuckets The overlay note's buckets.
   * @param {string[]} accumulatingKeys Keys that gain the overlay's lines rather than being replaced.
   * @returns {{ order: string[], map: Record<string, string[]> }} The merged buckets.
   */
  static _mergeBuckets(oldBuckets, newBuckets, accumulatingKeys)
  {
    const mergedMap = Object.create(null);
    const mergedOrder = [];

    /**
     * Records a key's finished lines, ignoring a key that ended up with none.
     * @param {string} key The tag key.
     * @param {string[]} lines The lines that survived for it.
     */
    const appendKey = (key, lines) =>
    {
      if (!lines || lines.length === 0) return;

      mergedMap[key] = lines.slice(0);

      // no membership check is needed: step 1 walks a key list that is itself free of repeats, and
      // step 2 already establishes that a key is absent before appending it.
      mergedOrder.push(key);
    };

    // step 1: walk old keys first to preserve their order baseline.
    oldBuckets.order.forEach(key =>
    {
      const accumulates = accumulatingKeys.includes(key);
      const oldLines = oldBuckets.map[key];
      const newLines = newBuckets.map[key];
      const overlayHasAny = newLines && newLines.length > 0;

      // a replacing key hands the whole bucket over to the overlay.
      if (overlayHasAny && accumulates === false)
      {
        appendKey(key, newLines);

        return;
      }

      // an accumulating key keeps what it had and takes what is new to it.
      if (accumulates && overlayHasAny)
      {
        const combined = oldLines.slice(0);

        newLines.forEach(line =>
        {
          if (combined.includes(line) === false) combined.push(line);
        });

        appendKey(key, combined);

        return;
      }

      // the overlay said nothing about this key, so it stands.
      appendKey(key, oldLines);
    });

    // step 2: append any keys only the overlay had, in its own order.
    newBuckets.order.forEach(key =>
    {
      if (mergedOrder.includes(key) === false) appendKey(key, newBuckets.map[key]);
    });

    return {
      order: mergedOrder,
      map: mergedMap,
    };
  }

  /**
   * Merges free-form lines, base order first, without duplicates.
   * @param {string[]} oldUnsupported The base note's free-form lines.
   * @param {string[]} newUnsupported The overlay note's free-form lines.
   * @returns {string[]} The merged lines.
   */
  static _mergeUnsupported(oldUnsupported, newUnsupported)
  {
    const merged = [];

    oldUnsupported.forEach(line =>
    {
      if (merged.includes(line) === false) merged.push(line);
    });

    newUnsupported.forEach(line =>
    {
      if (merged.includes(line) === false) merged.push(line);
    });

    return merged;
  }

  /**
   * Rebuilds note text from free-form lines and merged tag buckets.
   *
   * Free-form content leads, then tags grouped by key in key order, so the result is stable enough to
   * diff between two merges of the same inputs.
   * @param {string[]} unsupported The free-form lines to emit first.
   * @param {{order: string[], map: Record<string, string[]>}} buckets The merged buckets.
   * @returns {string} The reconstructed note text.
   */
  static _reconstructNote(unsupported, buckets)
  {
    const parts = [];

    unsupported.forEach(line => parts.push(line));

    buckets.order.forEach(key =>
    {
      buckets.map[key].forEach(line => parts.push(line));
    });

    // newline-joined to keep it readable and stable.
    return parts.join('\n');
  }
}

export default NoteResolver;
//endregion NoteResolver