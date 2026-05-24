//region JABS_Battler
import JABS_PopupManager from './../managers/JABS_PopupManager.js';

/**
 * Extends {@link #onSlipRegenTick}.<br/>
 * Also shows a slip or regen popup on the battler's character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Battler.set('onSlipRegenTick', JABS_Battler.prototype.onSlipRegenTick);
JABS_Battler.prototype.onSlipRegenTick = function(displayAmount, type, stateId)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Battler.get('onSlipRegenTick')
    .call(this, displayAmount, type, stateId);

  JABS_PopupManager.showSlipPop(displayAmount, type, this, stateId);
};

/**
 * Extends {@link #onItemApplied}.<br/>
 * Also shows the appropriate popup for item tool usage.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Battler.set('onItemApplied', JABS_Battler.prototype.onItemApplied);
JABS_Battler.prototype.onItemApplied = function(gameAction, itemId, target = this)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Battler.get('onItemApplied')
    .call(this, gameAction, itemId, target);

  const toolData = $dataItems.at(itemId);

  if (toolData.sdpKey !== String.empty)
  {
    // show item pickup popup for SDP unlock items used as tools.
    $jabsEngine.onItemPickedUp([ toolData ], this.getCharacter());
    return;
  }

  // show the damage result popup on the caster's character.
  JABS_PopupManager.showItemAppliedPop(gameAction, toolData, this, target);
};
//endregion JABS_Battler