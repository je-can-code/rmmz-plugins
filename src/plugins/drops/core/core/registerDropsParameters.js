//region registerDropsParameters
/**
 * Boot-time registration for J-Drops parameters in {@link ParameterRegistry}.
 */
class DropsParameterRegistration
{
  /**
   * Registers gold and drop rate multipliers with the parameter catalog.
   */
  static registerAll()
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('gdr')
        // policy step inside register all.
        .group(ParameterGroups.FATE)
        .sortOrder(3)
        .label(() => TextManager.goldRate())
        // policy step inside register all.
        .description(() => TextManager.goldRateDescription())
        .iconIndex(() => IconManager.goldRate())
        .format(ParameterFormat.MULTIPLIER_PERCENT)
        // policy step inside register all.
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.gdr)
        .sdpBinding(SdpParameterBinding.byKey('gdr', () => 1))
        // policy step inside register all.
        .build()
    );

    // policy step inside register all.
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('dor')
        // policy step inside register all.
        .group(ParameterGroups.FATE)
        .sortOrder(6)
        .label(() => TextManager.dropRate())
        // policy step inside register all.
        .description(() => TextManager.dropRateDescription())
        .iconIndex(() => IconManager.dropRate())
        .format(ParameterFormat.MULTIPLIER_PERCENT)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.dor)
        .sdpBinding(SdpParameterBinding.byKey('dor', () => 1))
        .build()
    );
  }
}

export default DropsParameterRegistration;
//endregion registerDropsParameters