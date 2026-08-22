//region Game_Battler
/**
 * Gets the gap close target key from this battler's notes, or null if not a gap close target.
 * Searches all note sources (actor/enemy, equipment, states) and returns the first key found.
 * @returns {string|null} The gap close target key, or null if not present.
 */
Game_Battler.prototype.gapCloseKey = function()
{
  // search all note sources for the gap close target tag.
  for (const note of this.getAllNotes())
  {
    // check this note source for the tag and extract its key.
    const key = RPGManager.getStringFromNoteByRegex(note, J.ABS.EXT.TOOLS.RegExp.GapCloseTarget, true);

    // if a key was found, return it immediately — first match wins.
    if (key !== null) return key;
  }

  // no gap close target tag found on any note source.
  return null;
};

/**
 * Whether this battler is immune to gap closing, regardless of the key-matching outcome or
 * whether the initiating skill carries <gapCloseAny>. Checked across all note sources so a
 * state alone can grant temporary immunity (e.g. a boss phase, a hookshot-only chasm guard).
 * @returns {boolean} True if any note source carries the <blockGapClose> tag.
 */
Game_Battler.prototype.isGapCloseBlocked = function()
{
  // a match on any single note source is enough to grant immunity.
  return this.getAllNotes()
    .some(note => RPGManager.checkForBooleanFromNoteByRegex(note, J.ABS.EXT.TOOLS.RegExp.BlockGapClose));
};

/**
 * Collects all skill IDs from the <onGapCloseEnd> tag across all of this battler's note sources.
 * Unlike {@link jabsThisOnGapCloseEnd}, this aggregates across actor/enemy, equipment, and states.
 * @returns {number[]} All gap-close-end skill IDs sourced from notes, or an empty array if none.
 */
Game_Battler.prototype.gapCloseEndSkillIds = function()
{
  // accumulate IDs from every note source that carries the tag.
  const ids = [];

  // iterate all note sources and collect any onGapCloseEnd arrays found.
  for (const note of this.getAllNotes())
  {
    // check this source for the tag and extract its array of IDs.
    const found = RPGManager.getArrayFromNotesByRegex(note, J.ABS.EXT.TOOLS.RegExp.GapCloseEnd, true);

    // skip sources that don't carry the tag.
    if (found === null) continue;

    // merge this source's IDs into the running collection.
    ids.push(...found);
  }

  // return the full merged list across all sources.
  return ids;
};
//endregion Game_Battler