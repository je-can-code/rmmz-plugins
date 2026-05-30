//region registerSpeedParameters
/**
 * Boot-time registration for J-ABS-Speed parameters in {@link ParameterRegistry}.
 */
class SpeedParameterRegistration
{
  /**
   * Registers move speed boost with the parameter catalog.
   */
  static registerAll()
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
}

export default SpeedParameterRegistration;
//endregion registerSpeedParameters