//region DataManager
import JABS_StandardController from './../_models/JABS_StandardController.js';
/**
 * Extends {@link DataManager.createGameObjects}.<br/>
 * Bootstraps input remap defaults, JABS icon/text registration, and controller 1.
 */
J.ABS.EXT.INPUT.Aliased.DataManager.set('createGameObjects', DataManager.createGameObjects);
DataManager.createGameObjects = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.DataManager.get('createGameObjects')
    .call(this);

  // Ensure engine-wide input remap defaults/labels are bootstrapped once per session.
  Input.ensureRemapBootstrapped();

  // register JABS icons.
  IconManager.registerJabsIcons();
  IconManager.registerJabsInputTexts();

  // initialize controller 1 for JABS.
  if (!$jabsController1)
  {
    // TODO: figure out how to prevent duplicate registration of controllers.
    $jabsController1 = new JABS_StandardController();
  }

  // push the player's stored keybinds onto the controller that was just built. this sits here rather
  // than on the load hook because both new games and loaded ones pass through here, and keybinds
  // belong to neither- they belong to the installation. a loaded save replaces `$gameSystem` after
  // this runs, which costs nothing: the configuration is applied to `Input` and the controllers
  // themselves, and it is read from `ConfigManager` rather than from anything a save carries.
  $gameSystem.applyJabsInputConfiguration();
};
//endregion DataManager