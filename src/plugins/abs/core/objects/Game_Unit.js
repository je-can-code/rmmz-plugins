//region Game_Unit
/**
 * Overrides {@link Game_Unit.inBattle}.<br>
 * If JABS is enabled, combat is always active.
 *
 * TODO: update this to be on a timer based on last hit target + any engaged enemies?
 */
J.ABS.Aliased.Game_Unit.set('inBattle', Game_Unit.prototype.inBattle);
Game_Unit.prototype.inBattle = function()
{
  return $jabsEngine.absEnabled
    ? true
    : J.ABS.Aliased.Game_Unit.get('inBattle').call(this);
}
//endregion Game_Unit