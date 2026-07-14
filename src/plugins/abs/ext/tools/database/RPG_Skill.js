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

//region gapCloseAny
/**
 * Whether this skill gap closes to whatever single target it hits, regardless of that target's
 * own gap close key- skips the key-matching gate entirely. A target carrying <blockGapClose>
 * still blocks this, so bosses/environmental holdouts can opt out even of an "any" gapcloser.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGapCloseAny', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapCloseAny);
  },
});
//endregion gapCloseAny

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

//region respectTerrain
/**
 * Whether this skill's gap close should respect terrain passability instead of its default
 * unconditional bypass. When true, the full tile-by-tile path to the target is validated
 * first- if every tile along the way is passable, the caster jumps straight to the target as
 * normal; if any tile blocks the path, the gap close doesn't happen at all.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsRespectTerrain', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.RespectTerrain);
  },
});
//endregion respectTerrain

//region pullForward
/**
 * The number of tiles this skill pulls its target toward the caster, or null if this skill
 * does not pull-forward. The inverse of knockback- the target is dragged toward the caster
 * instead of shoved away, clamped so it can never travel past the caster's own position.
 * @type {number|null}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsPullForward', {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.PullForward, true);
  },
});
//endregion pullForward