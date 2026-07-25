//region registerProfParameters
/**
 * Boot-time registration for J-Prof parameters in {@link ParameterRegistry}.
 */
class ProfParameterRegistration
{
  /**
   * Registers proficiency bonus with the parameter catalog.
   */
  static registerAll()
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
}

export default ProfParameterRegistration;
//endregion registerProfParameters