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

  // if the source state suppresses popups for this resource, skip the pop.
  if (this.canShowSlipPop(type, stateId) === false) return;

  // show the slip or regen popup on this battler's character.
  JABS_PopupManager.showSlipPop(displayAmount, type, this, stateId);
};

/**
 * Determines whether a slip popup should be shown for the given resource type and source state.
 * Returns false if the state carries a suppression tag for this resource or for all slip popups.
 * @param {0|1|2} type Resource index: 0 = HP, 1 = MP, 2 = TP.
 * @param {number} stateId The database id of the state driving this slip tick.
 * @returns {boolean}
 */
JABS_Battler.prototype.canShowSlipPop = function(type, stateId)
{
  // grab the state data from the battler.
  const state = this.getBattler().state(stateId);

  // if the state suppresses all slip popups, we cannot show one.
  if (state.popupsNoAnySlip === true) return false;

  // if the state suppresses the popup for this specific resource type, we cannot show one.
  if (type === 0 && state.popupsNoHpSlip === true) return false;
  if (type === 1 && state.popupsNoMpSlip === true) return false;
  if (type === 2 && state.popupsNoTpSlip === true) return false;

  // we can show the popup.
  return true;
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