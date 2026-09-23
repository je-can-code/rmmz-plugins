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
    const moveSpeedBoost = ParameterDefinition.Builder()
      .key('msb')
      .group(ParameterGroups.SUPPORT)
      .sortOrder(2)
      .label(() => TextManager.movespeed())
      .description(() => TextManager.moveSpeedDescription())
      .iconIndex(() => IconManager.movespeed())
      .format(ParameterFormat.FLAT)
      .getValue(battler => battler.msb)
      .sdpBinding(SdpParameterBinding.byKey('msb', () => 0))
      .build();

    ParameterRegistry.register(moveSpeedBoost);

    // move speed grows against the boost its own tags produce.
    const moveSpeedNatural = new NaturalParameterBinding(
      J.ABS.EXT.SPEED.RegExp.WalkSpeedBoostBuffPlus,
      J.ABS.EXT.SPEED.RegExp.WalkSpeedBoostBuffRate,
      J.ABS.EXT.SPEED.RegExp.WalkSpeedBoostGrowthPlus,
      J.ABS.EXT.SPEED.RegExp.WalkSpeedBoostGrowthRate,
      battler => battler.walkSpeedBoost());

    ParameterRegistry.bindNatural('msb', moveSpeedNatural);
  }
}

export default SpeedParameterRegistration;
//endregion registerSpeedParameters