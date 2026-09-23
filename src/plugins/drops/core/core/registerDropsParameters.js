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
    const goldDropRate = ParameterDefinition.Builder()
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
      .build();

    ParameterRegistry.register(goldDropRate);

    // gold rate grows against the multiplier its own tags produce.
    const goldRateNatural = new NaturalParameterBinding(
      J.DROPS.RegExp.GoldRateBuffPlus,
      J.DROPS.RegExp.GoldRateBuffRate,
      J.DROPS.RegExp.GoldRateGrowthPlus,
      J.DROPS.RegExp.GoldRateGrowthRate,
      battler => battler.baseGoldMultiplier());

    ParameterRegistry.bindNatural('gdr', goldRateNatural);

    const dropRate = ParameterDefinition.Builder()
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
      .build();

    ParameterRegistry.register(dropRate);

    // drop rate grows against the multiplier its own tags produce.
    const dropRateNatural = new NaturalParameterBinding(
      J.DROPS.RegExp.DropRateBuffPlus,
      J.DROPS.RegExp.DropRateBuffRate,
      J.DROPS.RegExp.DropRateGrowthPlus,
      J.DROPS.RegExp.DropRateGrowthRate,
      battler => battler.baseDropMultiplier());

    ParameterRegistry.bindNatural('dor', dropRateNatural);
  }
}

export default DropsParameterRegistration;
//endregion registerDropsParameters