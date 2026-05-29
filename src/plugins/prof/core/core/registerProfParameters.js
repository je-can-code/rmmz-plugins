//region registerProfParameters
/**
 * Registers proficiency bonus with the parameter catalog.
 */
function registerProfParameters()
{
  ParameterRegistry.register(
    ParameterDefinition.Builder()
      .key('prof')
      .group(ParameterGroups.FATE)
      .sortOrder(4)
      .label(() => TextManager.proficiencyBonus())
      .description(() => TextManager.proficiencyDescription())
      .iconIndex(() => IconManager.proficiencyBoost())
      .format(ParameterFormat.FLAT)
      .getValue(battler => battler.prof)
      .sdpBinding(SdpParameterBinding.byKey(
        'prof',
        actor => actor.baseSkillProficiencyAmount()
      ))
      .build()
  );
}

registerProfParameters();

export default registerProfParameters;
//endregion registerProfParameters
