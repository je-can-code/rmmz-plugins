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
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('sdr')
        // policy step inside register all.
        .group(ParameterGroups.FATE)
        .sortOrder(5)
        .label(() => TextManager.sdpMultiplier())
        // policy step inside register all.
        .description(() => TextManager.sdpMultiplierDescription())
        .iconIndex(() => IconManager.sdpMultiplier())
        .format(ParameterFormat.PERCENT_CENTERED)
        // policy step inside register all.
        .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
        .getValue(battler => battler.sdpMultiplier)
        .sdpBinding(SdpParameterBinding.byKey('sdr', () => 1))
        .build()
    );
  }
}

export default SdpParameterRegistration;
//endregion registerSdpParameters