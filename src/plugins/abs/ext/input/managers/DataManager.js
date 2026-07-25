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
};
//endregion DataManager