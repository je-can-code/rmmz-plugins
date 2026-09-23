//region registerShieldParameters
/**
 * Boot-time registration for J-ABS-Shield parameters in {@link ParameterRegistry}.
 */
class ShieldParameterRegistration
{
  /**
   * Registers shield amplification and effectiveness with the parameter catalog.
   */
  static registerAll()
  {
    const shieldAbsorptionRate = ParameterDefinition.Builder()
      .key('sar')
      .group(ParameterGroups.SUPPORT)
      .sortOrder(0)
      .label(() => TextManager.sar())
      .description(() => TextManager.sarDescription())
      .iconIndex(() => IconManager.sar())
      .format(ParameterFormat.MULTIPLIER_PERCENT)
      .getValue(battler => battler.sar)
      .sdpBinding(SdpParameterBinding.byKey('sar', () => 1))
      .build();

    ParameterRegistry.register(shieldAbsorptionRate);

    // shield amplification grows against the factor its own tags produce.
    const shieldAbsorptionNatural = new NaturalParameterBinding(
      J.ABS.EXT.SHIELD.RegExp.ShieldAmplificationBuffPlus,
      J.ABS.EXT.SHIELD.RegExp.ShieldAmplificationBuffRate,
      J.ABS.EXT.SHIELD.RegExp.ShieldAmplificationGrowthPlus,
      J.ABS.EXT.SHIELD.RegExp.ShieldAmplificationGrowthRate,
      battler => battler.baseSarFactor());

    ParameterRegistry.bindNatural('sar', shieldAbsorptionNatural);

    const shieldEfficiencyRate = ParameterDefinition.Builder()
      .key('ser')
      .group(ParameterGroups.SUPPORT)
      .sortOrder(1)
      .label(() => TextManager.ser())
      .description(() => TextManager.serDescription())
      .iconIndex(() => IconManager.ser())
      .format(ParameterFormat.MULTIPLIER_PERCENT)
      .getValue(battler => battler.ser)
      .sdpBinding(SdpParameterBinding.byKey('ser', () => 1))
      .build();

    ParameterRegistry.register(shieldEfficiencyRate);

    // shield effectiveness grows against the factor its own tags produce.
    const shieldEfficiencyNatural = new NaturalParameterBinding(
      J.ABS.EXT.SHIELD.RegExp.ShieldEffectivenessBuffPlus,
      J.ABS.EXT.SHIELD.RegExp.ShieldEffectivenessBuffRate,
      J.ABS.EXT.SHIELD.RegExp.ShieldEffectivenessGrowthPlus,
      J.ABS.EXT.SHIELD.RegExp.ShieldEffectivenessGrowthRate,
      battler => battler.baseSerFactor());

    ParameterRegistry.bindNatural('ser', shieldEfficiencyNatural);
  }
}

export default ShieldParameterRegistration;
//endregion registerShieldParameters