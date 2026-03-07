//region JABS_Engine
/**
 * Extends {@link #refreshJabsState}.<br/>
 * Also refreshes the shield when a shield state is refreshed.
 */
J.ABS.EXT.SHIELD.Aliased.JABS_Engine.set('refreshJabsState', JABS_Engine.prototype.refreshJabsState);
JABS_Engine.prototype.refreshJabsState = function(jabsState, newJabsState)
{
  // recalculate the shield.
  jabsState.recalculateShield();

  // refresh the shield.
  jabsState.refreshShield();

  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.JABS_Engine.get('refreshJabsState')
    .call(this, jabsState, newJabsState);
};

/**
 * Extends {@link #extendJabsState}.<br/>
 * Also refreshes the shield when a shield state is refreshed.
 */
J.ABS.EXT.SHIELD.Aliased.JABS_Engine.set('extendJabsState', JABS_Engine.prototype.extendJabsState);
JABS_Engine.prototype.extendJabsState = function(jabsState, newJabsState)
{
  // recalculate the shield.
  jabsState.recalculateShield();

  // refresh the shield.
  jabsState.refreshShield();

  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.JABS_Engine.get('extendJabsState')
    .call(this, jabsState, newJabsState);
};

//endregion JABS_Engine