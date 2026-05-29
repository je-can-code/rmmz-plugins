//region registerAptParameters
/**
 * Registers aptitude point gain multiplier with the parameter catalog.
 */
function registerAptParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
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
      .build()
  );
}

registerAptParameters();

export default registerAptParameters;
//endregion registerAptParameters
