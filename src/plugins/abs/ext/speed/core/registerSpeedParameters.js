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
        // policy step inside register all.
        .group(ParameterGroups.MOBILITY)
        .sortOrder(0)
        .label(() => TextManager.movespeed())
        // policy step inside register all.
        .description(() => TextManager.moveSpeedDescription())
        .iconIndex(() => IconManager.movespeed())
        .format(ParameterFormat.FLAT)
        // policy step inside register all.
        .getValue(battler => battler.msb)
        .sdpBinding(SdpParameterBinding.byKey('msb', () => 0))
        .build()
    );
  }
}

export default SpeedParameterRegistration;
//endregion registerSpeedParameters