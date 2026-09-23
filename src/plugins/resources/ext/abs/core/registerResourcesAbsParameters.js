//region registerResourcesAbsParameters
/**
 * Boot-time registration for J-Resources-ABS drain stats in {@link ParameterRegistry}.
 */
class ResourcesAbsParameterRegistration
{
  /**
   * Registers on-attack drain stats with the parameter catalog.
   */
  static registerAll()
  {
    const lifeSteal = ParameterDefinition.Builder()
      .key('lst')
      .group(ParameterGroups.COMBAT)
      .sortOrder(4)
      .label(() => TextManager.lst())
      .description(() => TextManager.lstDescription())
      .iconIndex(() => IconManager.lst())
      .format(ParameterFormat.PERCENT_SUFFIX)
      .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
      .getValue(battler => battler.lst)
      .sdpBinding(SdpParameterBinding.byKey('lst', () => 1))
      .build();

    ParameterRegistry.register(lifeSteal);

    // lifesteal grows against the rate its own tags produce.
    const lifeStealNatural = new NaturalParameterBinding(
      J.RESOURCES.EXT.ABS.RegExp.LifestealBuffPlus,
      J.RESOURCES.EXT.ABS.RegExp.LifestealBuffRate,
      J.RESOURCES.EXT.ABS.RegExp.LifestealGrowthPlus,
      J.RESOURCES.EXT.ABS.RegExp.LifestealGrowthRate,
      battler => battler.baseLstRate());

    ParameterRegistry.bindNatural('lst', lifeStealNatural);

    const magiSteal = ParameterDefinition.Builder()
      .key('mst')
      .group(ParameterGroups.COMBAT)
      .sortOrder(6)
      .label(() => TextManager.mst())
      .description(() => TextManager.mstDescription())
      .iconIndex(() => IconManager.mst())
      .format(ParameterFormat.PERCENT_SUFFIX)
      .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
      .getValue(battler => battler.mst)
      .sdpBinding(SdpParameterBinding.byKey('mst', () => 1))
      .build();

    ParameterRegistry.register(magiSteal);

    // manasteal grows against the rate its own tags produce.
    const magiStealNatural = new NaturalParameterBinding(
      J.RESOURCES.EXT.ABS.RegExp.ManastealBuffPlus,
      J.RESOURCES.EXT.ABS.RegExp.ManastealBuffRate,
      J.RESOURCES.EXT.ABS.RegExp.ManastealGrowthPlus,
      J.RESOURCES.EXT.ABS.RegExp.ManastealGrowthRate,
      battler => battler.baseMstRate());

    ParameterRegistry.bindNatural('mst', magiStealNatural);

    const techSteal = ParameterDefinition.Builder()
      .key('tst')
      .group(ParameterGroups.COMBAT)
      .sortOrder(8)
      .label(() => TextManager.tst())
      .description(() => TextManager.tstDescription())
      .iconIndex(() => IconManager.tst())
      .format(ParameterFormat.PERCENT_SUFFIX)
      .displayPolicy(ParameterDisplayPolicy.REWARD_RATE)
      .getValue(battler => battler.tst)
      .sdpBinding(SdpParameterBinding.byKey('tst', () => 1))
      .build();

    ParameterRegistry.register(techSteal);

    // techsteal grows against the rate its own tags produce.
    const techStealNatural = new NaturalParameterBinding(
      J.RESOURCES.EXT.ABS.RegExp.TechstealBuffPlus,
      J.RESOURCES.EXT.ABS.RegExp.TechstealBuffRate,
      J.RESOURCES.EXT.ABS.RegExp.TechstealGrowthPlus,
      J.RESOURCES.EXT.ABS.RegExp.TechstealGrowthRate,
      battler => battler.baseTstRate());

    ParameterRegistry.bindNatural('tst', techStealNatural);
  }
}

export default ResourcesAbsParameterRegistration;
//endregion registerResourcesAbsParameters