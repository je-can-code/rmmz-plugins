//region registerResourcesParameters
/**
 * Boot-time registration for J-Resources parameters in {@link ParameterRegistry}.
 */
class ResourcesParameterRegistration
{
  /**
   * Registers Life Cost (HCR) with the parameter catalog.
   */
  static registerAll()
  {
    ParameterRegistry.register(
      ParameterDefinition.Builder()
        .key('hcr')
        // policy step inside register all.
        .group(ParameterGroups.COMBAT)
        .sortOrder(5)
        .label(() => TextManager.hcr())
        // policy step inside register all.
        .description(() => TextManager.hcrDescription())
        .iconIndex(() => IconManager.hcr())
        .format(ParameterFormat.PERCENT_CENTERED)
        // policy step inside register all.
        .displayPolicy(ParameterDisplayPolicy.COST_RATE)
        .getValue(battler => battler.hcrFactor())
        .sdpBinding(SdpParameterBinding.byKey('hcr', () => 100))
        .build()
    );
  }
}

export default ResourcesParameterRegistration;
//endregion registerResourcesParameters