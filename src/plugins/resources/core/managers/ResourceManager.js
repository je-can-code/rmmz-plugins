//region ResourceCostManager
class ResourceCostManager
{
  /**
   * Determines the individual cost components for a skill's HP cost.
   * All component values are post-HCR.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {{ flat: number, percent: number, calculatedPercent: number, formula: number }}
   */
  static hpCostBreakdown(battler, skill)
  {
    const flatRaw = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.HpCostFlat);
    const percent = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.HpCostPercent);
    const calculatedPercentRaw = battler.mhp * (percent / 100);
    const formulaRaw = RPGManager.getResultFromNoteByRegex(
      skill,
      J.RESOURCES.RegExp.HpCostFormula,
      (flatRaw + calculatedPercentRaw),
      battler
    );
    const hcr = battler.hcrFactor();
    return {
      flat: flatRaw * hcr,
      percent,
      calculatedPercent: calculatedPercentRaw * hcr,
      formula: formulaRaw * hcr,
    };
  }

  /**
   * Determines the amount of HP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static hpCostBySkill(battler, skill)
  {
    const {
      flat,
      calculatedPercent,
      formula
    } = ResourceCostManager.hpCostBreakdown(battler, skill);

    // if there are no costs, then return 0.
    if (flat === 0 && calculatedPercent === 0 && formula === 0) return 0;

    // return the total cost (all components are already post-HCR from breakdown).
    return flat + calculatedPercent + formula;
  }

  /**
   * Determines the individual extra-tag cost components for a skill's MP cost.
   * All component values are post-MCR.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {{ flat: number, percent: number, calculatedPercent: number, formula: number }}
   */
  static extraMpCostBreakdown(battler, skill)
  {
    const flatRaw = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.MpCostFlat);
    const percent = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.MpCostPercent);
    const calculatedPercentRaw = battler.mmp * (percent / 100);
    const formulaRaw = RPGManager.getResultFromNoteByRegex(
      skill,
      J.RESOURCES.RegExp.MpCostFormula,
      (flatRaw + calculatedPercentRaw),
      battler
    );
    const { mcr } = battler;
    return {
      flat: flatRaw * mcr,
      percent,
      calculatedPercent: calculatedPercentRaw * mcr,
      formula: formulaRaw * mcr,
    };
  }

  /**
   * Determines the additional amount of MP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static extraMpCostBySkill(battler, skill)
  {
    const {
      flat,
      calculatedPercent,
      formula
    } = ResourceCostManager.extraMpCostBreakdown(battler, skill);

    // if there are no costs, then return 0.
    if (flat === 0 && calculatedPercent === 0 && formula === 0) return 0;

    // return the total extra cost.
    return flat + calculatedPercent + formula;
  }

  /**
   * Determines the individual extra-tag cost components for a skill's TP cost.
   * All component values are post-TCR.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {{ flat: number, percent: number, calculatedPercent: number, formula: number }}
   */
  static extraTpCostBreakdown(battler, skill)
  {
    const flatRaw = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.TpCostFlat);
    const percent = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.TpCostPercent);
    const calculatedPercentRaw = battler.mtp * (percent / 100);
    const formulaRaw = RPGManager.getResultFromNoteByRegex(
      skill,
      J.RESOURCES.RegExp.TpCostFormula,
      (flatRaw + calculatedPercentRaw),
      battler
    );
    const { tcr } = battler;
    return {
      flat: flatRaw * tcr,
      percent,
      calculatedPercent: calculatedPercentRaw * tcr,
      formula: formulaRaw * tcr,
    };
  }

  /**
   * Determines the additional amount of TP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static extraTpCostBySkill(battler, skill)
  {
    const {
      flat,
      calculatedPercent,
      formula
    } = ResourceCostManager.extraTpCostBreakdown(battler, skill);

    // if there are no costs, then return 0.
    if (flat === 0 && calculatedPercent === 0 && formula === 0) return 0;

    // return the total extra cost.
    return flat + calculatedPercent + formula;
  }

  /**
   * Calculate the amount of HP gained from a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to gain hp.
   * @param {RPG_Skill} skill The skill to gain hp from.
   * @returns {number}
   */
  static skillGainHp(battler, skill)
  {
    // identify the true form of the skill.
    const battlerSkill = battler.skill(skill.id);

    // extract the gains from the skill's note.
    const flatGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.HpGainFlat);
    const percentGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.HpGainPercent);
    const calculatedPercentGain = battler.mhp * (percentGain / 100);
    const formulaGains = RPGManager.getResultFromNoteByRegex(
      battlerSkill,
      J.RESOURCES.RegExp.HpGainFormula,
      (flatGain + calculatedPercentGain),
      battler
    );

    // if there are no gains, then return 0.
    if (flatGain === 0 && calculatedPercentGain === 0 && formulaGains === 0) return 0;

    // add all the gains together and apply REC.
    const gains = (flatGain + calculatedPercentGain + formulaGains) * battler.rec;

    // return the total gains.
    return gains;
  }

  /**
   * Calculate the amount of MP gained from a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to gain mp.
   * @param {RPG_Skill} skill The skill to gain mp from.
   * @returns {number}
   */
  static skillGainMp(battler, skill)
  {
    // identify the true form of the skill.
    const battlerSkill = battler.skill(skill.id);

    // extract the gains from the skill's note.
    const flatGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.MpGainFlat);
    const percentGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.MpGainPercent);
    const calculatedPercentGain = battler.mmp * (percentGain / 100);
    const formulaGains = RPGManager.getResultFromNoteByRegex(
      battlerSkill,
      J.RESOURCES.RegExp.MpGainFormula,
      (flatGain + calculatedPercentGain),
      battler
    );

    // if there are no gains, then return 0.
    if (flatGain === 0 && calculatedPercentGain === 0 && formulaGains === 0) return 0;

    // add all the gains together and apply REC.
    const gains = (flatGain + calculatedPercentGain + formulaGains) * battler.rec;

    // return the total gains.
    return gains;
  }

  /**
   * Calculate the amount of TP gained from a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to gain tp.
   * @param {RPG_Skill} skill The skill to gain tp from.
   * @returns {number}
   */
  static skillGainTp(battler, skill)
  {
    // identify the true form of the skill.
    const battlerSkill = battler.skill(skill.id);

    // extract the gains from the skill's note.
    const flatGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.TpGainFlat);
    const percentGain = RPGManager.getNumberFromNoteByRegex(battlerSkill, J.RESOURCES.RegExp.TpGainPercent);
    const calculatedPercentGain = battler.mtp * (percentGain / 100);
    const formulaGains = RPGManager.getResultFromNoteByRegex(
      battlerSkill,
      J.RESOURCES.RegExp.TpGainFormula,
      (flatGain + calculatedPercentGain),
      battler
    );

    // if there are no gains, then return 0.
    if (flatGain === 0 && calculatedPercentGain === 0 && formulaGains === 0) return 0;

    // add all the gains together and apply REC.
    const gains = (flatGain + calculatedPercentGain + formulaGains) * battler.rec;

    // return the total gains.
    return gains;
  }
}

export default ResourceCostManager;
//endregion ResourceCostManager