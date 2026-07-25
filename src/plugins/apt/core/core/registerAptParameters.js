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
}

export default AptParameterRegistration;
//endregion registerAptParameters