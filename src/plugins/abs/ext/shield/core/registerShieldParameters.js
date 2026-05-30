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
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('sar')
        // policy step inside register all.
        .group(ParameterGroups.SUPPORT)
        .sortOrder(0)
        .label(() => TextManager.sar())
        // policy step inside register all.
        .description(() => TextManager.sarDescription())
        .iconIndex(() => IconManager.sar())
        .format(ParameterFormat.MULTIPLIER_PERCENT)
        // policy step inside register all.
        .getValue(battler => battler.sar)
        .sdpBinding(SdpParameterBinding.byKey('sar', () => 1))
        .build()
    // policy step inside register all.
    );

    // policy step inside register all.
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('ser')
        // policy step inside register all.
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
}

export default ShieldParameterRegistration;
//endregion registerShieldParameters