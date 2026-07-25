//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers the OTIB tab with the passive viewer once the database is available.
 */
J.PASSIVE.EXT.OTIB.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.PASSIVE.EXT.OTIB.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // register the OTIB tab so Scene_Passive can display it.
  Scene_Passive.registerTab({
    key: 'otib',
    label: 'Item Boosts',

    // filter function: a passive state qualifies for this tab if the actor
    // earned it through an OTIB unlock rather than equipment, class, or skills.
    filter: (stateId, actor) => actor.otibPassiveStateIds()
      .includes(stateId),
  });
};
//endregion Scene_Boot