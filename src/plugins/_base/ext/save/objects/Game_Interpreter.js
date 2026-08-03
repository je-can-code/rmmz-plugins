//region Game_Interpreter
import Scene_Files from './../scenes/Scene_Files.js';

/**
 * Overwrites {@link #command352}.<br/>
 * Opens the files scene instead of vanilla's save screen.
 *
 * All 34 of CA's save platforms call the same common event, and that common event ends in this command
 * - so intercepting the command covers every platform in the game without touching a single map. That
 * is the entire reason the entry point is here rather than in map data.
 *
 * Overwritten rather than aliased because the original body is one line that pushes the scene this one
 * replaces; calling it as well would open both.
 */
Game_Interpreter.prototype.command352 = function()
{
  Scene_Files.callFromSavePoint();

  return true;
};
//endregion Game_Interpreter