//region registerSdpParameters
/**
 * Registers the SDP reward multiplier with the parameter catalog.
 */
function registerSdpParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
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
      .build()
  );
}

registerSdpParameters();

export default registerSdpParameters;
//endregion registerSdpParameters
