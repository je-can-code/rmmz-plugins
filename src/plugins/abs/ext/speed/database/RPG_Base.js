//region RPG_Base
/**
 * The movement speed modifier from this from database object.
 * @type {number|null}
 */
Object.defineProperty(RPG_Base.prototype, "jabsSpeedBoost", {
  get: function()
  {
    return RPGManager.getNumberFromNoteByRegex(this, J.ABS.EXT.SPEED.RegExp.WalkSpeedBoost, true);
  },
});
//endregion RPG_Base