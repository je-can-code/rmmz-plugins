//region gapClose
/**
 * Whether or not this skill is designed to gap close.
 * Gap-closing will pull the player to wherever the skill connected.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsGapClose', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.TOOLS.RegExp.GapClose);
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