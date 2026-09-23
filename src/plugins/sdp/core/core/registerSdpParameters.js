//region registerSdpParameters
/**
 * Boot-time registration for J-SDP parameters in {@link ParameterRegistry}.
 */
class SdpParameterRegistration
{
  /**
   * Registers the SDP reward multiplier with the parameter catalog.
   */
  static registerAll()
  {
    const sdpMultiplier = ParameterDefinition.Builder()
      .key('sdr')
      .group(ParameterGroups.FATE)
      .sortOrder(5)
      .label(() => TextManager.sdpMultiplier())
      .description(() => TextManager.sdpMultiplierDescription())
      .iconIndex(() => IconManager.sdpMultiplier())
      .format(ParameterFormat.PERCENT_CENTERED)
      .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
      .getValue(battler => battler.sdpMultiplier)
      .sdpBinding(SdpParameterBinding.byKey('sdr', () => 1))
      .build();

    ParameterRegistry.register(sdpMultiplier);

    // the SDP multiplier grows against the factor its own tags produce.
    const sdpMultiplierNatural = new NaturalParameterBinding(
      J.SDP.RegExp.SdpRateBuffPlus,
      J.SDP.RegExp.SdpRateBuffRate,
      J.SDP.RegExp.SdpRateGrowthPlus,
      J.SDP.RegExp.SdpRateGrowthRate,
      battler => battler.baseSdpMultiplier());

    ParameterRegistry.bindNatural('sdr', sdpMultiplierNatural);
  }
}

export default SdpParameterRegistration;
//endregion registerSdpParameters