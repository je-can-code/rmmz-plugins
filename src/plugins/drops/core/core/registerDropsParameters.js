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
        .group(ParameterGroups.FATE)
        .sortOrder(3)
        .label(() => TextManager.goldRate())
        .description(() => TextManager.goldRateDescription())
        .iconIndex(() => IconManager.goldRate())
        .format(ParameterFormat.MULTIPLIER_PERCENT)
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.gdr)
        .sdpBinding(SdpParameterBinding.byKey('gdr', () => 1))
        .build()
    );

    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('dor')
        .group(ParameterGroups.FATE)
        .sortOrder(6)
        .label(() => TextManager.dropRate())
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