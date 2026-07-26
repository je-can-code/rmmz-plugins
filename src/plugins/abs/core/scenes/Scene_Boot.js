//region Scene_Boot
/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers CDR and PER with the parameter catalog after vanilla seeding.
 */
J.ABS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.ABS.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // register CDR with the parameter catalog.
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('cdr')
      .group(ParameterGroups.MOBILITY)
      .sortOrder(1)
      .label(() => TextManager.cdr())
      .description(() => TextManager.cdrDescription())
      .iconIndex(() => IconManager.cdr())
      .format(ParameterFormat.PERCENT_SUFFIX)
      .getValue(battler => battler.cdr)
      .build()
  );

  // register PER with the parameter catalog.
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('per')
      .group(ParameterGroups.PRECISION)
      .sortOrder(3)
      .label(() => TextManager.per())
      .description(() => TextManager.perDescription())
      .iconIndex(() => IconManager.per())
      .format(ParameterFormat.PERCENT_SUFFIX)
      .getValue(battler => battler.per)
      .build()
  );
};
//endregion Scene_Boot
