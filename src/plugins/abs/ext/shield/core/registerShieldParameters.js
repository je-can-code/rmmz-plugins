//region registerShieldParameters
/**
 * Registers shield amplification and effectiveness with the parameter catalog.
 */
function registerShieldParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('sar')
      .group(ParameterGroups.SUPPORT)
      .sortOrder(0)
      .label(() => TextManager.sar())
      .description(() => TextManager.sarDescription())
      .iconIndex(() => IconManager.sar())
      .format(ParameterFormat.MULTIPLIER_PERCENT)
      .getValue(battler => battler.sar)
      .sdpBinding(SdpParameterBinding.byKey('sar', () => 1))
      .build()
  );

  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('ser')
      .group(ParameterGroups.SUPPORT)
      .sortOrder(1)
      .label(() => TextManager.ser())
      .description(() => TextManager.serDescription())
      .iconIndex(() => IconManager.ser())
      .format(ParameterFormat.MULTIPLIER_PERCENT)
      .getValue(battler => battler.ser)
      .sdpBinding(SdpParameterBinding.byKey('ser', () => 1))
      .build()
  );
}

registerShieldParameters();

export default registerShieldParameters;
//endregion registerShieldParameters
