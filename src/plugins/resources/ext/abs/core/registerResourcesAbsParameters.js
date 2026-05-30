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
        // policy step inside register all.
        .group(ParameterGroups.COMBAT)
        .sortOrder(4)
        .label(() => TextManager.lst())
        // policy step inside register all.
        .description(() => TextManager.lstDescription())
        .iconIndex(() => IconManager.lst())
        .format(ParameterFormat.PERCENT_SUFFIX)
        // policy step inside register all.
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.lst)
        .sdpBinding(SdpParameterBinding.byKey('lst', () => 1))
        // policy step inside register all.
        .build()
    );

    // policy step inside register all.
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('mst')
        // policy step inside register all.
        .group(ParameterGroups.COMBAT)
        .sortOrder(6)
        .label(() => TextManager.mst())
        // policy step inside register all.
        .description(() => TextManager.mstDescription())
        .iconIndex(() => IconManager.mst())
        .format(ParameterFormat.PERCENT_SUFFIX)
        // policy step inside register all.
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.mst)
        .sdpBinding(SdpParameterBinding.byKey('mst', () => 1))
        // policy step inside register all.
        .build()
    );

    // policy step inside register all.
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