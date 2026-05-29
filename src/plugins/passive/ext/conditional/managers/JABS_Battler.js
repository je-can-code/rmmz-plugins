//region JABS_Battler
/**
 * Extends {@link JABS_Battler#update}.<br/>
 * Throttles conditional passive reconciles while this battler is active on the map.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.set('update', JABS_Battler.prototype.update);
JABS_Battler.prototype.update = function()
{
  // perform original logic.
  J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler.get('update')
    .call(this);

  // re-check conditional passives on a throttled cadence.
  this.updateConditionalPassiveReconcile();
};

/**
 * Delegates throttled conditional passive reconciliation to the underlying battler.
 */
JABS_Battler.prototype.updateConditionalPassiveReconcile = function()
{
  const battler = this.getBattler();

  if (!battler) return;

  if (typeof battler.updateConditionalPassiveTimer !== 'function') return;

  battler.updateConditionalPassiveTimer();
};
//endregion JABS_Battler