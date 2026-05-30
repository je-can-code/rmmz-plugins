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
        // policy step inside register all.
        .group(ParameterGroups.FATE)
        .sortOrder(4)
        .label(() => TextManager.proficiencyBonus())
        // policy step inside register all.
        .description(() => TextManager.proficiencyDescription())
        .iconIndex(() => IconManager.proficiencyBoost())
        .format(ParameterFormat.FLAT)
        // policy step inside register all.
        .getValue(battler => battler.prof)
        .sdpBinding(SdpParameterBinding.byKey(
          'prof',
          // policy step inside register all.
          actor => actor.baseSkillProficiencyAmount()
        ))
        .build()
    );
  }
}

export default ProfParameterRegistration;
//endregion registerProfParameters