//region Scene_Menu (SKS)
import Scene_SkillEquip from './Scene_SkillEquip.js';

/**
 * Extends {@link #createCommandWindow}.</br>
 * Adds a handler for the Skill Equip menu command.
 */
J.SKS.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.SKS.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // set the handler for our custom command.
  this.commandWindow().setHandler('skill-equip', this.commandSkillEquip.bind(this));
};

/**
 * Opens the Skill Equip scene.
 */
Scene_Menu.prototype.commandSkillEquip = function()
{
  // push the new scene onto the stack.
  Scene_SkillEquip.callScene();
};
//endregion Scene_Menu (SKS)
