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
    const hpCostReduction = ParameterDefinition.Builder()
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
      .build();

    ParameterRegistry.register(hpCostReduction);

    // life cost grows against the cost factor its own tags produce. Its natural tags move the cost as
    // the status screen shows it, so a negative amount is what makes a skill cheaper.
    const hpCostNatural = new NaturalParameterBinding(
      J.RESOURCES.RegExp.HpCostRateBuffPlus,
      J.RESOURCES.RegExp.HpCostRateBuffRate,
      J.RESOURCES.RegExp.HpCostRateGrowthPlus,
      J.RESOURCES.RegExp.HpCostRateGrowthRate,
      battler => battler.baseHcrFactor());

    ParameterRegistry.bindNatural('hcr', hpCostNatural);
  }
}

export default ResourcesParameterRegistration;
//endregion registerResourcesParameters