//region Game_Player
/**
 * Extends {@link #isDebugThrough}.<br/>
 * Allows the custom debug button to be pressed while JABS is active.
 */
J.ABS.EXT.INPUT.Aliased.Game_Player.set('isDebugThrough', Game_Player.prototype.isDebugThrough);
Game_Player.prototype.isDebugThrough = function()
{
  // check if JABS is enabled.
  if ($jabsEngine.absEnabled)
  {
    // the debug button is changed while JABS is active.
    return Input.isPressed(J.ABS.EXT.INPUT.Symbols.Debug) && $gameTemp.isPlaytest();
  }
  // JABS is not enabled.
  else
  {
    // perform original logic.
    return J.ABS.EXT.INPUT.Aliased.Game_Player.get('isDebugThrough')
      .call(this);
  }
};
//endregion Game_Player