//region registerCritParameters
/**
 * Boot-time registration for J-Crit parameters in {@link ParameterRegistry}.
 */
class CritParameterRegistration
{
  /**
   * Registers CDM and CDR with the parameter catalog.
   */
  static registerAll()
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('cdm')
        // policy step inside register all.
        .group(ParameterGroups.PRECISION)
        .sortOrder(6)
        .label(() => TextManager.critParam(0))
        // policy step inside register all.
        .description(() => TextManager.critParamDescription(0))
        .iconIndex(() => IconManager.critParam(0))
        .format(ParameterFormat.PERCENT_SUFFIX)
        // policy step inside register all.
        .getValue(battler => battler.cdm)
        .sdpBinding(SdpParameterBinding.byKey(
          'cdm',
          // policy step inside register all.
          actor => actor.baseCriticalMultiplier()
        ))
        .build()
    // policy step inside register all.
    );

    // policy step inside register all.
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('cdr')
        // policy step inside register all.
        .group(ParameterGroups.PRECISION)
        .sortOrder(7)
        .label(() => TextManager.critParam(1))
        // policy step inside register all.
        .description(() => TextManager.critParamDescription(1))
        .iconIndex(() => IconManager.critParam(1))
        .format(ParameterFormat.PERCENT_SUFFIX)
        .getValue(battler => battler.cdr)
        .sdpBinding(SdpParameterBinding.byKey(
          'cdr',
          actor => actor.baseCriticalReduction()
        ))
        .build()
    );
  }
}

export default CritParameterRegistration;
//endregion registerCritParameters