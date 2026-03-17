//region OverlayManager
/**
 * A static class for managing the overlaying of one skill onto another.
 * The methods are divided by the attribute they overlay.
 */
class OverlayManager
{
  /**
   * The line types available for overlaying in the context of a note.
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
     * A tag that isn't supported by this framework at this time.
     * Any tag that is not one of the defined types will qualify as this and not get mutated.
     */
    unsupported: 'unsupported',
  };

  //region caching
  /**
   * A cache for caster-skill extensions.
   * This is effectively a map of maps, where the parent map is keyed by the caster, while the child map is keyed by
   * a combination of the skill id and its extension skill ids.
   * @type {WeakMap<Game_Actor|Game_Enemy, Map<string, RPG_Skill>>}
   */
  static _casterExtendCache = new WeakMap();

  /**
   * The metrics for this manager.
   * @type {{ hits: number, misses: number }}
   */
  static _metrics = {
    hits: 0,
    misses: 0,
  };

  /**
   * Invalidates the cache for the given battler.
   * @param {Game_Actor|Game_Enemy} battler The battler to invalidate the cache for.
   * @returns {boolean} True if the cache was invalidated, false otherwise.
   */
  static invalidate(battler)
  {
    return this._casterExtendCache.delete(battler);
  }

  /**
   * Clears the cache for all objects.
   */
  static clearCache()
  {
    this._casterExtendCache = new WeakMap();
  }

  /**
   * Gets the existing cache of a caster's skill extensions.
   * If a cache does not yet exist for the caster, it'll be created.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @returns {Map<string, RPG_Skill>}
   */
  static getOrCreateCacheForCaster(caster)
  {
    // check if the cache for this caster already exists.
    const cacheHit = this._casterExtendCache.get(caster);

    // if it does exist, return it.
    if (cacheHit) return cacheHit;

    // it doesn't exist yet, so create it.
    const newCasterCache = new Map();
    this._casterExtendCache.set(caster, newCasterCache);

    // return the newly created cache.
    return newCasterCache;
  }

  /**
   * Retrieves a cached value for this caster/key, or computes and stores it.
   *
   * @param {Game_Actor|Game_Enemy} caster - The caster whose cache bucket to use.
   * @param {string} key - Stable key representing the computed value (ex: base skill id + overlay ids).
   * @param {Function} computeFn - A no-arg function that computes the value on a cache miss.
   * @returns {RPG_Skill} - The cached or newly computed extended skill.
   */
  static cached(caster, key, computeFn)
  {
    // get or create the per-caster cache map from the WeakMap.
    const perCaster = this.getOrCreateCacheForCaster(caster);

    // if we already have this key cached, return it and track a hit.
    if (perCaster.has(key))
    {
      // increment metrics for visibility while iterating on this.
      this._metrics.hits++;

      // return the cached value.
      return perCaster.get(key);
    }

    // we do not yet have a cached value; compute it now.
    const value = computeFn();

    // store the computed value in the per-caster cache.
    perCaster.set(key, value);

    // increment miss counter.
    this._metrics.misses++;

    // return the computed value.
    return value;
  }

  //endregion caching

  /**
   * Gets the extended skill based on the caster's learned skills.
   * @param caster {Game_Actor|Game_Enemy} The caster of the skill.
   * @param skillId {number} The base skill to extend.
   * @returns {RPG_Skill}
   */
  static getExtendedSkill(caster, skillId)
  {
    // validate the incoming base id.
    if (skillId <= 0) throw new Error('Invalid skill extension id.');

    // if we don't have a caster for some reason, don't process anything.
    if (!caster) return $dataSkills[skillId];

    // collect all overlay-capable skills for the provided base skill id.
    const overlaySkills = caster.skills()
      .filter(skill => this.#isOverlayForBase(skill, skillId));

    // sort overlays deterministically by their id to ensure stable and predictable results.
    if (overlaySkills.length > 0)
    {
      overlaySkills.sort((a, b) => a.id - b.id);
    }

    // construct a cache key that represents the base skill and the exact overlay set order.
    const overlayKey = `${skillId}|${overlaySkills.map(s => s.id)
      .join(',')}`;

    // fetch from cache or compute the extended skill once for this exact combination.
    return this.cached(
      caster,
      overlayKey,
      () => this.#getExtendedSkill(overlaySkills, skillId)
    );
  }

  /**
   * Checks if a given skill is an extension skill that can overlay the given base skill.
   * @param {RPG_Skill} skill The skill that potentially is the overlay.
   * @param {number} skillId The id of the base skill to check for overlay compatibility.
   * @returns {boolean} Whether or not the skill is an overlay for the base skill.
   */
  static #isOverlayForBase(skill, skillId)
  {
    // if this skill is not an extension skill, then it cannot overlay the base.
    if (skill.isSkillExtension === false) return false;

    // indicate whether or not this skill overlays the base.
    return skill.getSkillExtensions.includes(skillId);
  }

  /**
   * Extends the base skill with the given overlay skills in sequential order.
   * @param {RPG_Skill[]} overlaySkills - The skill overlays to apply.
   * @param {number} skillId - The id of the base skill to extend.
   * @returns {RPG_Skill} The extended skill.
   */
  static #getExtendedSkill(overlaySkills, skillId)
  {
    // if there are no overlays, return the original skill without incurring clone cost.
    if (overlaySkills.length === 0)
    {
      // return the base database skill untouched.
      return $dataSkills[skillId];
    }

    // clone the base skill so overlays can safely mutate the clone without affecting the database.
    const baseClone = $dataSkills[skillId]._clone();

    // apply all overlays in order to produce the final extended skill.
    const extended = overlaySkills
      .reduce((working, overlay) => this.extendSkill(working, overlay), baseClone);

    // return the final extended skill.
    return extended;
  }

  /**
   * Merges the skill overlay onto the base skill and returns the updated base skill.
   * @param baseSkill {RPG_Skill} The base skill to be overlayed.
   * @param skillOverlay {RPG_Skill} The skill to overlay with.
   * @returns {RPG_Skill} The base skill overlayed with the overlay skill.
   */
  static extendSkill(baseSkill, skillOverlay)
  {
    // merge all of the base skill data.
    const updatedBaseSkill = this.extendBaseSkill(baseSkill, skillOverlay);

    // sanitize the skill extends out of the base skill to prevent recursive extensions.
    this.sanitizeExtensions(updatedBaseSkill);

    // return the base skill merged with the overlay.
    return updatedBaseSkill;
  }

  //region extensions
  /**
   * Overlays the base skill data.
   *
   * Effects, meta, note, and repeats are combined.
   *
   * Scope, mpCost, tpCost, and tpGain are replaced.
   * @param baseSkill {RPG_Skill} The base skill.
   * @param skillOverlay {RPG_Skill} The overlay skill.
   * @returns {RPG_Skill} The overlayed base skill.
   */
  static extendBaseSkill(baseSkill, skillOverlay)
  {
    // extend all the sections of the skill with the skill overlay.
    this.extendGeneral(baseSkill, skillOverlay);
    this.extendDamage(baseSkill, skillOverlay);
    this.extendEffects(baseSkill, skillOverlay);
    this.extendInvocation(baseSkill, skillOverlay);
    this.extendMessage(baseSkill, skillOverlay);

    // extend the note and metadata with the skill overlay.
    this.extendMetadata(baseSkill, skillOverlay);

    // return the base skill extended by the overlay.
    return baseSkill;
  }

  /**
   * Extends the general settings section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendGeneral(baseSkill, skillOverlay)
  {
    // overwrite mp costs if not the same.
    if (baseSkill.mpCost !== skillOverlay.mpCost)
    {
      baseSkill.mpCost = skillOverlay.mpCost;
    }

    // overwrite tp costs if not the same.
    if (baseSkill.tpCost !== skillOverlay.tpCost)
    {
      baseSkill.tpCost = skillOverlay.tpCost;
    }

    // overwrite scope if not "none" (0 = default) and not the same.
    const bothHaveScopes = baseSkill.scope !== 0 && skillOverlay.scope !== 0;
    const scopesHaveChanged = baseSkill.scope !== skillOverlay.scope;
    if (bothHaveScopes && scopesHaveChanged)
    {
      baseSkill.scope = skillOverlay.scope;
    }

    // NOTE: not overriding "occasion".
    // NOTE: not overriding "skill type".
  }

  /**
   * Extends the damage section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendDamage(baseSkill, skillOverlay)
  {
    // if the overlay damage type isn't "none", then overlay those values.
    if (!skillOverlay.damage.type)
    {
      return;
    }

    if (baseSkill.damage.critical !== skillOverlay.damage.critical)
    {
      // overwrite the critical toggle.
      baseSkill.damage.critical = skillOverlay.damage.critical;
    }

    if (baseSkill.damage.elementId !== skillOverlay.damage.elementId)
    {
      baseSkill.damage.elementId = skillOverlay.damage.elementId;
    }

    if (baseSkill.damage.type !== skillOverlay.damage.type)
    {
      // allow upgrading hp-damage >> hp-drain.
      if (baseSkill.damage.type === 1 && skillOverlay.damage.type === 5)
      {
        baseSkill.damage.type = 5;
      }
      // allow upgrading mp-damage >> mp-drain.
      else if (baseSkill.damage.type === 2 && skillOverlay.damage.type === 6)
      {
        baseSkill.damage.type = 6;
      }

      // otherwise, overwrite damage type.
      // TODO: when stacking damage types, update here.
    }
    if (baseSkill.damage.variance !== skillOverlay.damage.variance)
    {
      baseSkill.damage.variance = skillOverlay.damage.variance;
    }

    if (skillOverlay.damage.formula && baseSkill.damage.formula !== skillOverlay.damage.formula)
    {
      // overwrite the formula.
      baseSkill.damage.formula = skillOverlay.damage.formula;
    }
  }

  /**
   * Extends the effects section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendEffects(baseSkill, skillOverlay)
  {
    // combine the effects.
    baseSkill.effects = baseSkill.effects.concat(skillOverlay.effects);
  }

  /**
   * Extends the metadata of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendMetadata(baseSkill, skillOverlay)
  {
    // combine the meta together.
    baseSkill.meta = {
      ...baseSkill.meta, ...skillOverlay.meta,
    };

    // merge notes via overwriteNote() instead of blind concatenation.
    baseSkill.note = this.overwriteNote(baseSkill.note, skillOverlay.note);

    // invalidate all cached tag parses for this object (RPGManager WeakMap cache).
    RPGManager.invalidate(baseSkill);
  }

  /**
   * Extends the invocation section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendInvocation(baseSkill, skillOverlay)
  {
    // combine speeds.
    if (skillOverlay.speed !== 0)
    {
      baseSkill.speed += skillOverlay.speed;
    }

    // if they aren't the same, and aren't 100 (default), then add them.
    if (baseSkill.successRate !== skillOverlay.successRate || skillOverlay.successRate !== 100)
    {
      baseSkill.successRate += skillOverlay.successRate;
    }

    // combine repeats if they aren't just 1 (default).
    if (skillOverlay.repeats !== 1)
    {
      baseSkill.repeats += (skillOverlay.repeats - 1);
    }

    // combine the tp gains.
    baseSkill.tpGain += skillOverlay.tpGain;

    // if both hit types are NOT "certain hit" (default), then overwrite them.
    if (baseSkill.hitType && skillOverlay.hitType)
    {
      baseSkill.hitType = skillOverlay.hitType;
    }

    // overwrite the animation if not 0 (default) and it changed.
    if (baseSkill.animationId !== 0 && baseSkill.animationId !== skillOverlay.animationId)
    {
      baseSkill.animationId = skillOverlay.animationId;
    }
  }

  /**
   * Extends the message section of a skill.
   * @param {RPG_Skill} baseSkill The skill being extended.
   * @param {RPG_Skill} skillOverlay The skill extending the base skill.
   */
  static extendMessage(baseSkill, skillOverlay)
  {
    // overwrite message 1.
    if (baseSkill.message1 !== skillOverlay.message1)
    {
      baseSkill.message1 = skillOverlay.message1;
    }

    // overwrite message 2.
    if (baseSkill.message2 !== skillOverlay.message2)
    {
      baseSkill.message2 = skillOverlay.message2;
    }
  }

  /**
   * Purges all references to the skill extend tag from the `baseSkill`.
   * @param baseSkill {RPG_Skill} The base skill.
   * @returns {RPG_Skill} The overlayed base skill.
   */
  static sanitizeExtensions(baseSkill)
  {
    // remove the skill extend from the metadata.
    delete baseSkill.meta['skillExtend'];

    // remove the skill extend from the notedata.
    baseSkill.note = baseSkill.note.replace(J.EXTEND.RegExp.SkillExtend, String.empty);

    // cleanup any duplicate newlines.
    baseSkill.note = baseSkill.note.replace(/\n\n/gmi, '\n');
    baseSkill.note = baseSkill.note.replace(/\r\r/gmi, '\r');

    // we changed the note – invalidate cached parses for this skill.
    RPGManager.invalidate(baseSkill);
  }

  //region extend note
  // TODO: make this configurable.
  /**
   * The list of keys on notes that should never get merged/overridden, but instead appended.
   * @type {string[]}
   */
  static _nonCombiningKeys = [ 'drop' ];

  /**
   * Gets the keys that should never be combined- they will effectively be treated as unsupported.
   * @returns {string[]}
   */
  static getNonCombiningKeys()
  {
    return this._nonCombiningKeys;
  }

  /**
   * Sets the global list of tag keys that should NOT be replaced when merging, but instead combined.
   * This allows multi-instance tags like `drop` to append additional lines from the overlay note.
   * @param {string[]} keys The array of keys that should be non-combining (case-insensitive).
   */
  static setNonCombiningKeys(keys)
  {
    // ensure we store a normalized list of lowercase keys for comparisons.
    this._nonCombiningKeys = Array.isArray(keys)
      ? keys.map(k => String(k)
        .toLowerCase())
      : [];
  }

  /**
   * Merges the overlay note into the base note with key-aware behavior.
   * - For keys not in the exclusions set: replace base lines with overlay lines if overlay provides any.
   * - For keys in the exclusions set: append unique overlay lines after base lines (multi-instance tags like "drop").
   * - Unsupported lines (non-tag text) are preserved from both notes with deduplication; base lines keep priority.
   *
   * Keys are case-insensitive. Tags are those enclosed with angle brackets (e.g., `<key:value>` or `<key>`).
   *
   * @param {string} baseNote The base note content.
   * @param {string} overlayNote The overlay note content.
   * @param {string[]=} nonCombiningKeys Optional keys to merge instead of replace; defaults to configured static list.
   * @returns {string} The merged note text, joined with newlines.
   */
  static overwriteNote(baseNote, overlayNote, nonCombiningKeys)
  {
    // normalize the incoming notes to empty strings if nullish.
    const oldNote = baseNote || String.empty;

    // normalize the overlay note to empty string if nullish.
    const newNote = overlayNote || String.empty;

    // normalize the incoming non-combining keys; fall back to configured static if not provided.
    const exclusions = this._normalizeExclusions(nonCombiningKeys);

    // tokenize both notes into tags and unsupported lines.
    const oldTokens = this._tokenizeNote(oldNote);

    // tokenize the new note into tags and unsupported lines as well.
    const newTokens = this._tokenizeNote(newNote);

    // bucket the tags by key for old note.
    const oldBuckets = this._toKeyBuckets(oldTokens.tags);

    // bucket the tags by key for new note.
    const newBuckets = this._toKeyBuckets(newTokens.tags);

    // merge the buckets based on replace-or-merge rules and exclusions.
    const merged = this._mergeBuckets(oldBuckets, newBuckets, exclusions);

    // merge unsupported lines from old then new with deduplication.
    const mergedUnsupported = this._mergeUnsupported(oldTokens.unsupported, newTokens.unsupported);

    // reconstruct the final note text from unsupported + merged tags in key order.
    const result = this._reconstructNote(mergedUnsupported, merged);

    // return the final merged note string.
    return result;
  }

  /**
   * Normalizes the incoming exclusions array, or falls back to the static configuration.
   * @param {string[]|null|undefined} exclusions The caller-provided keys that should merge instead of replace.
   * @returns {string[]} A lowercase array of keys to treat as non-replacing during merges.
   */
  static _normalizeExclusions(exclusions)
  {
    // determine the base keys list to use.
    const provided = Array.isArray(exclusions)
      ? exclusions
      : this.getNonCombiningKeys();

    // normalize all keys to lowercase for case-insensitive comparisons.
    return provided.map(k => String(k)
      .toLowerCase());
  }

  /**
   * Tokenizes a note text into angle-bracketed tags and unsupported lines.
   * Handles tags concatenated without newlines by regex extraction, and also
   * collects newline-separated content that is not tags.
   * @param {string} note The raw note text.
   * @returns {{tags: string[], unsupported: string[]}} The extracted tags and unsupported lines.
   */
  static _tokenizeNote(note)
  {
    // find angle-bracketed chunks like <key:value> or <key>.
    const tags = note.match(/<[^>]+>/g) || [];

    // split the raw text on newlines to capture any free-form lines.
    const rawLines = (note.split(/[\r\n]+/) || []).filter(l => l.length > 0);

    // build a fast look-up set of exact tag strings.
    const tagSet = new Set(tags);

    // anything that is not an exact tag string is considered unsupported.
    const unsupported = rawLines.filter(l => tagSet.has(l) === false);

    // return the separated collections.
    return {
      tags: tags,
      unsupported: unsupported
    };
  }

  /**
   * Parses a single tag string into a key and type using the existing classifier.
   * @param {string} tag The tag, e.g. "<range:5>" or "<direct>".
   * @returns {{type: string, key: (string|null), line: string}} The parsed record.
   */
  static _parseTag(tag)
  {
    // classify tag or unsupported using existing logic.
    const type = this._classifyLine(tag);

    // unsupported tags simply echo back with null key.
    if (type === OverlayManager.LineType.unsupported)
    {
      // return unsupported tag data.
      return {
        type: type,
        key: null,
        line: tag
      };
    }

    // strip off the leading and trailing angle brackets.
    const inner = tag.substring(1, tag.length - 1);

    // if this is a kvp like <key:value> then split on the first colon.
    if (type === OverlayManager.LineType.kvp)
    {
      // find the first colon index.
      const idx = inner.indexOf(':');

      // extract and normalize the key to lowercase.
      const key = inner.substring(0, idx)
        .trim()
        .toLowerCase();

      // return the parsed kvp.
      return {
        type: type,
        key: key,
        line: tag
      };
    }

    // it must be boolean; use the entire inner content as the key.
    const key = inner.trim()
      .toLowerCase();

    // return the parsed boolean.
    return {
      type: OverlayManager.LineType.boolean,
      key: key,
      line: tag
    };
  }

  /**
   * Determines if the note line is one of our standard key-value pairs separated by a colon.
   * @param {string} line The note line as a string.
   * @returns {boolean} True if it is a conventional <key:value> type of line.
   */
  static _classifyLine(line)
  {
    // must at least start and end with angle brackets.
    if (line.startsWith('<') === false || line.endsWith('>') === false) return OverlayManager.LineType.unsupported;

    // too many angle brackets.
    if ((line.match(/</g) || []).length > 1) return OverlayManager.LineType.unsupported;
    if ((line.match(/>/g) || []).length > 1) return OverlayManager.LineType.unsupported;

    // if a colon exists, then it must be a key-value pair of some kind.
    if (line.includes(':')) return OverlayManager.LineType.kvp;

    // its just a pair of angle brackets, so its a boolean-type tag.
    return OverlayManager.LineType.boolean;
  }

  /**
   * Buckets an array of tag strings by their keys, preserving the first-seen key order
   * and deduping exact duplicate lines within a key.
   * @param {string[]} tags The tag strings to bucket.
   * @returns {{ order: string[], map: Record<string, string[]> }} The ordered keys and per-key lines.
   */
  static _toKeyBuckets(tags)
  {
    // the ordered list of unique keys as encountered.
    const order = [];

    // the key -> array-of-lines mapping.
    const map = Object.create(null);

    // iterate over each tag.
    tags.forEach(tag =>
    {
      // parse the tag into its parts.
      const parsed = this._parseTag(tag);

      // skip unsupported; those are handled elsewhere.
      if (parsed.type === OverlayManager.LineType.unsupported)
      {
        return;
      }

      // if encountering this key for the first time, initialize it.
      if (map[parsed.key] === undefined)
      {
        // initialize the array of lines for this key.
        map[parsed.key] = [];

        // record the encounter order for later reconstruction.
        order.push(parsed.key);
      }

      // dedupe exact duplicate lines for this key.
      if (map[parsed.key].includes(parsed.line) === false)
      {
        // add this unique line.
        map[parsed.key].push(parsed.line);
      }
    });

    // return the buckets.
    return {
      order: order,
      map: map
    };
  }

  /**
   * Merges the old and new buckets according to replacement rules and exclusions.
   * - For keys NOT in exclusions: replace old lines entirely with new lines (if provided), else keep old.
   * - For keys IN exclusions: combine old lines with new lines (append unique new lines), preserving order.
   * - New-only keys are appended in the order they appear in the new note.
   * @param {{order: string[], map: Record<string, string[]>}} oldBuckets The buckets from the base note.
   * @param {{order: string[], map: Record<string, string[]>}} newBuckets The buckets from the overlay note.
   * @param {string[]} exclusions The keys to be combined instead of replaced.
   * @returns {{ order: string[], map: Record<string, string[]> }} The merged buckets.
   */
  static _mergeBuckets(oldBuckets, newBuckets, exclusions)
  {
    // the merged map to accumulate into.
    const mergedMap = Object.create(null);

    // the merged key order to output.
    const mergedOrder = [];

    // helper to append a key with its lines in order while honoring dedupe.
    const appendKey = (key, lines) =>
    {
      // ignore if no lines provided.
      if (!lines || lines.length === 0)
      {
        return;
      }

      // set the lines array as a shallow copy.
      mergedMap[key] = lines.slice(0);

      // record the key order if not already present.
      if (mergedOrder.includes(key) === false)
      {
        // push the key preserving order.
        mergedOrder.push(key);
      }
    };

    // step 1: walk old keys first to preserve their order baseline.
    oldBuckets.order.forEach(key =>
    {
      // determine whether this key is in the exclusions list.
      const isExcluded = exclusions.includes(key);

      // gather the old lines for this key.
      const oldLines = oldBuckets.map[key];

      // gather any new lines for this key, if present.
      const newLines = newBuckets.map[key];

      // if we have new lines and the key is not excluded, then replace.
      if (newLines && newLines.length > 0 && isExcluded === false)
      {
        // replace the old lines entirely with the new lines.
        appendKey(key, newLines);
        return;
      }

      // if the key is excluded and we have new lines, then combine.
      if (isExcluded && newLines && newLines.length > 0)
      {
        // start with a copy of old lines.
        const combined = oldLines.slice(0);

        // append any new unique lines.
        newLines.forEach(line =>
        {
          // only include if not present.
          if (combined.includes(line) === false)
          {
            // add the unique new line.
            combined.push(line);
          }
        });

        // append the combined lines for this key.
        appendKey(key, combined);
        return;
      }

      // otherwise, no new lines or no exclusion behavior; keep old.
      appendKey(key, oldLines);
    });

    // step 2: append any new-only keys at the end in the order they appear in the new note.
    newBuckets.order.forEach(key =>
    {
      // only consider keys we don't already have.
      if (mergedOrder.includes(key) === false)
      {
        // add the new-only key with its lines as-is.
        appendKey(key, newBuckets.map[key]);
      }
    });

    // return the merged buckets for reconstruction.
    return {
      order: mergedOrder,
      map: mergedMap
    };
  }

  /**
   * Merges unsupported lines by appending new unsupported lines that do not already exist.
   * Old unsupported lines retain their relative order.
   * @param {string[]} oldUnsupported The unsupported lines from the base note.
   * @param {string[]} newUnsupported The unsupported lines from the overlay note.
   * @returns {string[]} The merged unsupported lines.
   */
  static _mergeUnsupported(oldUnsupported, newUnsupported)
  {
    // initialize the merged unsupported list honoring old order.
    const merged = [];

    // include all old unsupported while deduping.
    oldUnsupported.forEach(line =>
    {
      // only include if not already added.
      if (merged.includes(line) === false)
      {
        // add the old unsupported line.
        merged.push(line);
      }
    });

    // append any new unsupported lines not already present.
    newUnsupported.forEach(line =>
    {
      // only include if not already present.
      if (merged.includes(line) === false)
      {
        // add the new unsupported line.
        merged.push(line);
      }
    });

    // return the merged unsupported lines.
    return merged;
  }

  /**
   * Reconstructs a note from unsupported lines and merged buckets of tags.
   * Unsupported lines are emitted first, followed by tags grouped by key in key order.
   * @param {string[]} unsupported The unsupported lines to emit first.
   * @param {{order: string[], map: Record<string, string[]>}} buckets The merged buckets.
   * @returns {string} The reconstructed note text.
   */
  static _reconstructNote(unsupported, buckets)
  {
    // initialize an array of parts to join.
    const parts = [];

    // append unsupported lines first, honoring their order.
    unsupported.forEach(line =>
    {
      // push the unsupported line.
      parts.push(line);
    });

    // for each key in order, append its lines in recorded order.
    buckets.order.forEach(key =>
    {
      // retrieve the lines for this key.
      const lines = buckets.map[key];

      // append each tag line.
      lines.forEach(line =>
      {
        // push the tag line.
        parts.push(line);
      });
    });

    // join with newlines to keep readability and stability.
    const result = parts.join('\n');

    // return the reconstructed note.
    return result;
  }

  //endregion extend note
  //endregion extensions
}

//endregion OverlayManager