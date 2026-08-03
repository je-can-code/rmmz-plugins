//region Game_Screen
/**
 * Gets the tone the screen is currently moving toward.
 *
 * Vanilla exposes {@link Game_Screen.tone} but nothing for the destination, and the two answer very
 * different questions. A tint runs over a duration, so partway through a fade the current tone is a
 * value nobody asked for - an interpolation between where it was and where it is going. Anything
 * deciding *who set the tint* has to compare against the destination; comparing against the current
 * value reads any in-progress fade as belonging to nobody.
 * @returns {[number, number, number, number]}
 */
Game_Screen.prototype.toneTarget = function()
{
  return this._toneTarget;
};
//endregion Game_Screen
