//region Game_Battler
/**
 * A no-op base implementation of the OTIB unlock handler for non-actor battlers.
 * Enemies and other non-actor battlers do not participate in the OTIB system,
 * so consuming an item on their behalf never triggers an unlock.
 * @param {RPG_Item} item The item that was consumed.
 */
// eslint-disable-next-line no-unused-vars
Game_Battler.prototype.handleOtibUnlock = function(item)
{
};

/**
 * Extends {@link #consumeItem}.<br>
 * After the item is consumed, gives this battler a chance to handle any OTIB unlock.
 * Actors override {@link #handleOtibUnlock} with the real unlock logic; all others no-op.
 * @param {RPG_Item} item The item being consumed.
 */
J.PASSIVE.EXT.OTIB.Aliased.Game_Battler.set('consumeItem', Game_Battler.prototype.consumeItem);
Game_Battler.prototype.consumeItem = function(item)
{
  // perform original logic.
  J.PASSIVE.EXT.OTIB.Aliased.Game_Battler.get('consumeItem')
    .call(this, item);

  // delegate to the battler-type-specific OTIB handler.
  this.handleOtibUnlock(item);
};
//endregion Game_Battler