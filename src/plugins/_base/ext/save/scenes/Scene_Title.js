//region Scene_Title
import Scene_Files from './Scene_Files.js';

/**
 * Overwrites {@link #commandContinue}.<br/>
 * Opens the files scene rather than vanilla's load screen.
 *
 * The scene arrives knowing it came from the title, which is what makes it drop Rewind and Save, add
 * Delete, and load without asking the player to confirm the thing they just asked for.
 */
Scene_Title.prototype.commandContinue = function()
{
  this.commandWindow()
    .close();

  Scene_Files.callFromTitle();
};
//endregion Scene_Title