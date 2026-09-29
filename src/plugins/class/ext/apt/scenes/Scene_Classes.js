//region Scene_Classes
import Window_ClassLearnings from '../windows/Window_ClassLearnings.js';

/**
 * Extends {@link #sideWindowDefinitions}.<br/>
 * Also places the highlighted class's learnings beside the parameters, after any window placed before it.
 * @returns {Array<{createWindow: function(Rectangle): Window_Base}>}
 */
J.CLASS.EXT.APT.Aliased.Scene_Classes.set('sideWindowDefinitions', Scene_Classes.prototype.sideWindowDefinitions);
Scene_Classes.prototype.sideWindowDefinitions = function()
{
  // perform original logic.
  const definitions = J.CLASS.EXT.APT.Aliased.Scene_Classes.get('sideWindowDefinitions')
    .call(this);

  // what the class keeps known and what it teaches, and how far along the actor is with each.
  definitions.push({
    createWindow: rectangle => new Window_ClassLearnings(rectangle),
  });

  return definitions;
};
//endregion Scene_Classes