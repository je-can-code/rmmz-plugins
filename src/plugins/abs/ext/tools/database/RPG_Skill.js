//region gapClose
/**
 * The gap close key for this skill, or null if this skill does not gap close.
 * A skill gap closes only when its key matches the target's gap close target key.
 * @type {string|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGapClose', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapClose, true);
  },
});
//endregion gapClose

//region gapCloseMode
/**
 * The type of gap close mode this skill uses.
 * If there is no gap close mode available, then it'll be null instead.
 * @type {J.ABS.EXT.TOOLS.GapCloseModes|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGapCloseMode', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapCloseMode, true);
  },
});
//endregion gapCloseMode

//region gapClosePosition
/**
 * The type of gap close position this skill uses.
 * If there is no gap close position available, then it'll be null instead.
 * @type {J.ABS.EXT.TOOLS.GapClosePositions|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGapClosePosition', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapClosePosition, true);
  },
});
//endregion gapClosePosition

//region thisOnGapCloseEnd
/**
 * The skill IDs to force-execute when this skill's gap close lands, sourced only from this skill's note.
 * Returns an empty array if the tag is absent.
 * @type {number[]}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsThisOnGapCloseEnd', {
  get: function()
  {
    return RPGManager.getArrayFromNotesByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapCloseEndThis, true) ?? [];
  },
});
//endregion thisOnGapCloseEnd