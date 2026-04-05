//region ResourceCostManager
class ResourceCostManager
{
  /**
   * Determines the amount of HP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static hpCostBySkill(battler, skill)
  {
    // extract the costs from the skill's note.
    const flatCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.HpCostFlat);
    const percentCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.HpCostPercent);
    const calculatedPercentCost = battler.mhp * (percentCost / 100);
    const formulaCosts = RPGManager.getResultFromNoteByRegex(
      skill,
      J.RESOURCES.RegExp.HpCostFormula,
      (flatCost + calculatedPercentCost),
      battler
    );

    // if there are no costs, then return 0.
    if (flatCost === 0 && calculatedPercentCost === 0 && formulaCosts === 0) return 0;

    // add all the costs together.
    const sumCost = flatCost + calculatedPercentCost + formulaCosts;

    // determine how the cost reduction applies to the skill cost.
    const totalCost = battler.hcrFactor() * sumCost;

    // return the total cost.
    return totalCost;
  }

  /**
   * Determines the additional amount of MP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static extraMpCostBySkill(battler, skill)
  {
    // extract the costs from the skill's note.
    const flatCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.MpCostFlat);
    const percentCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.MpCostPercent);
    const calculatedPercentCost = battler.mmp * (percentCost / 100);
    const formulaCosts = RPGManager.getResultFromNoteByRegex(
      skill,
      J.RESOURCES.RegExp.MpCostFormula,
      (flatCost + calculatedPercentCost),
      battler
    );

    // if there are no costs, then return 0.
    if (flatCost === 0 && calculatedPercentCost === 0 && formulaCosts === 0) return 0;

    // add all the costs together.
    const sumCost = flatCost + calculatedPercentCost + formulaCosts;

    // determine how the cost reduction applies to the skill cost.
    const totalCost = battler.mcr * sumCost;

    // return the total cost.
    return totalCost;
  }

  /**
   * Determines the additional amount of TP cost for a skill.
   * @param {Game_Actor|Game_Enemy} battler The battler to check.
   * @param {RPG_Skill} skill The skill to check.
   * @returns {number}
   */
  static extraTpCostBySkill(battler, skill)
  {
    // extract the costs from the skill's note.
    const flatCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.TpCostFlat);
    const percentCost = RPGManager.getNumberFromNoteByRegex(skill, J.RESOURCES.RegExp.TpCostPercent);
    const calculatedPercentCost = battler.mtp * (percentCost / 100);
    const formulaCosts = RPGManager.getResultFromNoteByRegex(
      skill ,
      J.RESOURCES.RegExp.TpCostFormula,
      (flatCost + calculatedPercentCost),
      battler
    );

    // if there are no costs, then return 0.
    if (flatCost === 0 && calculatedPercentCost === 0 && formulaCosts === 0) return 0;

    // add all the costs together.
    const sumCost = flatCost + calculatedPercentCost + formulaCosts;

    // determine how the cost reduction applies to the skill cost.
    const totalCost = battler.tcr * sumCost;

    // return the total cost.
    return totalCost;
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

//endregion ResourceCostManager