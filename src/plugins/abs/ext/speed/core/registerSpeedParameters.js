//region registerSpeedParameters
/**
 * Registers move speed boost with the parameter catalog.
 */
function registerSpeedParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('msb')
      .group(ParameterGroups.MOBILITY)
      .sortOrder(0)
      .label(() => TextManager.movespeed())
      .description(() => TextManager.moveSpeedDescription())
      .iconIndex(() => IconManager.movespeed())
      .format(ParameterFormat.FLAT)
      .getValue(battler => battler.msb)
      .sdpBinding(SdpParameterBinding.byKey('msb', () => 0))
      .build()
  );
}

registerSpeedParameters();

export default registerSpeedParameters;
//endregion registerSpeedParameters
