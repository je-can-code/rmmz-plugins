//region registerAptParameters
/**
 * Boot-time registration for J-Aptitude parameters in {@link ParameterRegistry}.
 */
class AptParameterRegistration
{
  /**
   * Registers aptitude point gain multiplier with the parameter catalog.
   */
  static registerAll()
  {
    const aptitudeRate = ParameterDefinition.Builder()
      .key('apr')
      .group(ParameterGroups.FATE)
      .sortOrder(7)
      .label(() => TextManager.aptRate())
      .description(() => TextManager.aptRateDescription())
      .iconIndex(() => IconManager.aptRate())
      .format(ParameterFormat.PERCENT_CENTERED)
      .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
      .getValue(battler => battler.apr)
      .sdpBinding(SdpParameterBinding.byKey('apr', () => 1))
      .build();

    ParameterRegistry.register(aptitudeRate);

    // aptitude rate grows against the factor its own tags produce.
    const aptitudeRateNatural = new NaturalParameterBinding(
      J.APT.RegExp.AptRateBuffPlus,
      J.APT.RegExp.AptRateBuffRate,
      J.APT.RegExp.AptRateGrowthPlus,
      J.APT.RegExp.AptRateGrowthRate,
      battler => battler.baseAptFactor());

    ParameterRegistry.bindNatural('apr', aptitudeRateNatural);
  }
}

export default AptParameterRegistration;
//endregion registerAptParameters