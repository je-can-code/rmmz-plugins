//region registerResourcesAbsParameters
/**
 * Boot-time registration for J-Resources-ABS drain stats in {@link ParameterRegistry}.
 */
class ResourcesAbsParameterRegistration
{
  /**
   * Registers on-attack drain stats with the parameter catalog.
   */
  static registerAll()
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('lst')
        .group(ParameterGroups.COMBAT)
        .sortOrder(4)
        .label(() => TextManager.lst())
        .description(() => TextManager.lstDescription())
        .iconIndex(() => IconManager.lst())
        .format(ParameterFormat.PERCENT_SUFFIX)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.lst)
        .sdpBinding(SdpParameterBinding.byKey('lst', () => 1))
        .build()
    );

    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('mst')
        .group(ParameterGroups.COMBAT)
        .sortOrder(6)
        .label(() => TextManager.mst())
        .description(() => TextManager.mstDescription())
        .iconIndex(() => IconManager.mst())
        .format(ParameterFormat.PERCENT_SUFFIX)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.mst)
        .sdpBinding(SdpParameterBinding.byKey('mst', () => 1))
        .build()
    );

    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('tst')
        .group(ParameterGroups.COMBAT)
        .sortOrder(8)
        .label(() => TextManager.tst())
        .description(() => TextManager.tstDescription())
        .iconIndex(() => IconManager.tst())
        .format(ParameterFormat.PERCENT_SUFFIX)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.tst)
        .sdpBinding(SdpParameterBinding.byKey('tst', () => 1))
        .build()
    );
  }
}

export default ResourcesAbsParameterRegistration;
//endregion registerResourcesAbsParameters