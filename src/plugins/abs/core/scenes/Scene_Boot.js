//region Scene_Boot
import AbsNotetagDescriptions from './../core/describeAbsNotetags.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Registers CDR and PER with the parameter catalog after vanilla seeding, then describes this plugin's tags once the
 * database they are read from exists.
 */
J.ABS.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.ABS.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // register CDR with the parameter catalog.
  const cooldownReduction = ParameterDefinition.Builder()
    .key('cdr')
    .group(ParameterGroups.SUPPORT)
    .sortOrder(3)
    .label(() => TextManager.cdr())
    .description(() => TextManager.cdrDescription())
    .iconIndex(() => IconManager.cdr())
    .format(ParameterFormat.PERCENT_SUFFIX)
    .getValue(battler => battler.cdr)
    .build();

  ParameterRegistry.register(cooldownReduction);

  // register PER with the parameter catalog.
  const parryExtension = ParameterDefinition.Builder()
    .key('per')
    .group(ParameterGroups.PRECISION)
    .sortOrder(3)
    .label(() => TextManager.per())
    .description(() => TextManager.perDescription())
    .iconIndex(() => IconManager.per())
    .format(ParameterFormat.PERCENT_SUFFIX)
    .getValue(battler => battler.per)
    .build();

  ParameterRegistry.register(parryExtension);

  // describe this plugin's tags, so anything listing what a row does can say what these ones do.
  AbsNotetagDescriptions.registerAll();
};
//endregion Scene_Boot
