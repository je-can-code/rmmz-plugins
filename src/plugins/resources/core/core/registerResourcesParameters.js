//region registerResourcesParameters
/**
 * Registers Life Cost (HCR) with the parameter catalog.
 */
function registerResourcesParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('hcr')
      .group(ParameterGroups.COMBAT)
      .sortOrder(5)
      .label(() => TextManager.hcr())
      .description(() => TextManager.hcrDescription())
      .iconIndex(() => IconManager.hcr())
      .format(ParameterFormat.PERCENT_CENTERED)
      .displayPolicy(ParameterDisplayPolicy.COST_RATE)
      .getValue(battler => battler.hcrFactor())
      .sdpBinding(SdpParameterBinding.byKey('hcr', () => 100))
      .build()
  );
}

registerResourcesParameters();

export default registerResourcesParameters;
//endregion registerResourcesParameters
