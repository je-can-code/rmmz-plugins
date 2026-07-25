//region registerCritParameters
/**
 * Boot-time registration for J-Crit parameters in {@link ParameterRegistry}.
 */
class CritParameterRegistration
{
  /**
   * Registers CDM and CTR with the parameter catalog.
   */
  static registerAll()
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('cdm')
        .group(ParameterGroups.PRECISION)
        .sortOrder(6)
        .label(() => TextManager.critParam(0))
        .description(() => TextManager.critParamDescription(0))
        .iconIndex(() => IconManager.critParam(0))
        .format(ParameterFormat.PERCENT_SUFFIX)
        .getValue(battler => battler.cdm)
        .sdpBinding(SdpParameterBinding.byKey(
          'cdm',
          actor => actor.baseCriticalMultiplier()
        ))
        .build()
    );

    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('ctr')
        .group(ParameterGroups.PRECISION)
        .sortOrder(7)
        .label(() => TextManager.critParam(1))
        .description(() => TextManager.critParamDescription(1))
        .iconIndex(() => IconManager.critParam(1))
        .format(ParameterFormat.PERCENT_SUFFIX)
        .getValue(battler => battler.ctr)
        .sdpBinding(SdpParameterBinding.byKey(
          'ctr',
          actor => actor.baseCriticalReduction()
        ))
        .build()
    );
  }
}

export default CritParameterRegistration;
//endregion registerCritParameters