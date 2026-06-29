//region ResourceHitManager
/**
 * Manages damage-linked resource mutations for J-Resources-ABS.
 *
 * On-attack effects aggregate tags from both the executing skill and the caster's
 * traited sources (actor/class/equip/states) and apply gains to the caster.
 * When-hit effects aggregate tags from the target's traited sources and apply
 * gains to the target. Negative net totals are clamped by the engine's own
 * gainHp/Mp/Tp calls.
 */
class ResourceHitManager
{
  /**
   * Applies all on-attack resource gains to the caster.
   * Called after a successful hit has been confirmed.
   * Tags are read from both the executing skill and the caster's traited sources
   * (actor/class/equip/states), then summed before being applied.
   * @param {JABS_Action} action The action that landed.
   * @param {JABS_Battler} target The battler that was hit.
   */
  // eslint-disable-next-line no-unused-vars
  static applyOnAttackEffects(action, target)
  {
    const caster = action.getCaster()
      .getBattler();
    const skill = action.getBaseSkill();
    const targetBattler = target.getBattler();
    const result = targetBattler.result();

    let hpGain = ResourceHitManager.onAttackHpGain(caster, skill);
    let mpGain = ResourceHitManager.onAttackMpGain(caster, skill);
    let tpGain = ResourceHitManager.onAttackTpGain(caster, skill);

    // drain stats stack with on-attack skill tags (% of HP damage dealt).
    if (result.hpDamage > 0)
    {
      const damage = result.hpDamage;
      hpGain += Math.floor(damage * caster.lst);
      mpGain += Math.floor(damage * caster.mst);
      tpGain += Math.floor(damage * caster.tst);
    }

    if (hpGain !== 0) caster.gainHpFromResource(hpGain);
    if (mpGain !== 0) caster.gainMpFromResource(mpGain);
    if (tpGain !== 0) caster.gainTpFromResource(tpGain);
  }

  /**
   * Applies all when-hit resource gains to the target.
   * Called after a damaging hit has been confirmed (hpDamage > 0).
   * @param {JABS_Action} action The action that landed.
   * @param {JABS_Battler} target The battler that was hit.
   */
  static applyWhenHitEffects(action, target)
  {
    const targetBattler = target.getBattler();
    const damage = targetBattler.result().hpDamage;

    const hpGain = ResourceHitManager.whenHitHpGain(targetBattler, damage);
    const mpGain = ResourceHitManager.whenHitMpGain(targetBattler, damage);
    const tpGain = ResourceHitManager.whenHitTpGain(targetBattler, damage);

    if (hpGain !== 0) targetBattler.gainHpFromResource(hpGain);
    if (mpGain !== 0) targetBattler.gainMpFromResource(mpGain);
    if (tpGain !== 0) targetBattler.gainTpFromResource(tpGain);
  }

  //region on-attack
  /**
   * Calculates the HP gain for the caster from on-attack tags.
   * Aggregates from both the executing skill and the caster's traited sources.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackHpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkillAndSources(
      caster,
      skill,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFormula,
      caster.mhp
    );
  }

  /**
   * Calculates the MP gain for the caster from on-attack tags.
   * Aggregates from both the executing skill and the caster's traited sources.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackMpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkillAndSources(
      caster,
      skill,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFormula,
      caster.mmp
    );
  }

  /**
   * Calculates the TP gain for the caster from on-attack tags.
   * Aggregates from both the executing skill and the caster's traited sources.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackTpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkillAndSources(
      caster,
      skill,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFormula,
      caster.mtp
    );
  }

  //endregion on-attack

  //region when-hit
  /**
   * Aggregates the HP gain for the target from all traited sources' when-hit tags.
   * @param {Game_Actor|Game_Enemy} targetBattler The battler that was hit.
   * @param {number} damage The raw HP damage dealt (used as `b` in formulas).
   * @returns {number}
   */
  static whenHitHpGain(targetBattler, damage)
  {
    return ResourceHitManager.#gainBySources(
      targetBattler,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainFormula,
      targetBattler.mhp,
      damage
    );
  }

  /**
   * Aggregates the MP gain for the target from all traited sources' when-hit tags.
   * @param {Game_Actor|Game_Enemy} targetBattler The battler that was hit.
   * @param {number} damage The raw HP damage dealt (used as `b` in formulas).
   * @returns {number}
   */
  static whenHitMpGain(targetBattler, damage)
  {
    return ResourceHitManager.#gainBySources(
      targetBattler,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainFormula,
      targetBattler.mmp,
      damage
    );
  }

  /**
   * Aggregates the TP gain for the target from all traited sources' when-hit tags.
   * @param {Game_Actor|Game_Enemy} targetBattler The battler that was hit.
   * @param {number} damage The raw HP damage dealt (used as `b` in formulas).
   * @returns {number}
   */
  static whenHitTpGain(targetBattler, damage)
  {
    return ResourceHitManager.#gainBySources(
      targetBattler,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainFormula,
      targetBattler.mtp,
      damage
    );
  }

  //endregion when-hit

  //region private helpers
  /**
   * Calculates a resource gain from tags on a single skill (on-attack path).
   * The formula receives `a` = caster and `b` = (flat + calculatedPercent).
   * REC is applied to the total before returning.
   * @param {Game_Actor|Game_Enemy} caster The caster driving this step.
   * @param {RPG_Skill} skill The skill driving this step.
   * @param {RegExp} flatRegex The flat regex driving this step.
   * @param {RegExp} percentRegex The percent regex driving this step.
   * @param {RegExp} formulaRegex The formula regex driving this step.
   * @param {number} maxStat The battler's maximum for the relevant resource (mhp/mmp/mtp).
   * @returns {number}
   */
  static #gainBySkill(caster, skill, flatRegex, percentRegex, formulaRegex, maxStat)
  {
    const flat = RPGManager.getNumberFromNoteByRegex(skill, flatRegex);
    const percent = RPGManager.getNumberFromNoteByRegex(skill, percentRegex);
    const calculatedPercent = maxStat * (percent / 100);
    const formula = RPGManager.getResultFromNoteByRegex(skill, formulaRegex, (flat + calculatedPercent), caster);

    const total = flat + calculatedPercent + formula;
    if (total === 0) return 0;

    return total * caster.rec;
  }

  /**
   * Calculates a resource gain for the on-attack path by combining the executing skill's
   * own tags with tags on the caster's traited sources (actor/class/equip/states).
   * REC is applied independently to each component before they are summed.
   * @param {Game_Actor|Game_Enemy} caster The caster driving this step.
   * @param {RPG_Skill} skill The skill driving this step.
   * @param {RegExp} flatRegex The flat regex driving this step.
   * @param {RegExp} percentRegex The percent regex driving this step.
   * @param {RegExp} formulaRegex The formula regex driving this step.
   * @param {number} maxStat The battler's maximum for the relevant resource (mhp/mmp/mtp).
   * @returns {number}
   */
  static #gainBySkillAndSources(caster, skill, flatRegex, percentRegex, formulaRegex, maxStat)
  {
    // read tags from the executing skill itself (fires only for this skill).
    const fromSkill = ResourceHitManager.#gainBySkill(caster, skill, flatRegex, percentRegex, formulaRegex, maxStat);

    // read tags from the caster's traited sources: actor/class/equip/states (fires for all attacks).
    // damage is not available at this point in the pipeline, so pass 0 as the formula's b binding.
    const fromSources = ResourceHitManager.#gainBySources(caster, flatRegex, percentRegex, formulaRegex, maxStat, 0);

    // return the combined total from both sources.
    return fromSkill + fromSources;
  }

  /**
   * Aggregates a resource gain across all of the target's traited sources (when-hit path).
   * Sources are the same set used for HCR (actor/class/equip/states for actors,
   * enemy data/states for enemies).
   * The formula receives `a` = targetBattler and `b` = damage dealt.
   * REC is applied to the total before returning.
   * @param {Game_Actor|Game_Enemy} targetBattler The target battler driving this step.
   * @param {RegExp} flatRegex The flat regex driving this step.
   * @param {RegExp} percentRegex The percent regex driving this step.
   * @param {RegExp} formulaRegex The formula regex driving this step.
   * @param {number} maxStat The battler's maximum for the relevant resource (mhp/mmp/mtp).
   * @param {number} damage The raw HP damage from the action result.
   * @returns {number}
   */
  static #gainBySources(targetBattler, flatRegex, percentRegex, formulaRegex, maxStat, damage)
  {
    const sources = targetBattler.hcrSources();

    const totalFlat = sources.reduce((acc, source) => acc + RPGManager.getNumberFromNoteByRegex(source, flatRegex), 0);

    const totalPercent = sources.reduce((acc, source) => acc + RPGManager.getNumberFromNoteByRegex(
      source,
      percentRegex
    ), 0);
    const calculatedPercent = maxStat * (totalPercent / 100);

    // damage is passed as `b` so formula authors can write e.g. `b * 0.1` for 10% of damage.
    const totalFormula = sources.reduce((acc, source) => acc + RPGManager.getResultFromNoteByRegex(
      source,
      formulaRegex,
      damage,
      targetBattler
    ), 0);

    const total = totalFlat + calculatedPercent + totalFormula;
    if (total === 0) return 0;

    return total * targetBattler.rec;
  }

  //endregion private helpers
}

export default ResourceHitManager;
//endregion ResourceHitManager