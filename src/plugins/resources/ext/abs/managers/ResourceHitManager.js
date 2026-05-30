//region ResourceHitManager
/**
 * Manages damage-linked resource mutations for J-Resources-ABS.
 *
 * On-attack effects read tags from the skill and apply gains to the caster.
 * When-hit effects aggregate tags from the target's traited sources and apply
 * gains to the target. Negative net totals are clamped by the engine's own
 * gainHp/Mp/Tp calls.
 */
class ResourceHitManager
{
  /**
   * Applies all on-attack resource gains to the caster.
   * Called after a successful hit has been confirmed.
   * @param {JABS_Action} action The action that landed.
   * @param {JABS_Battler} target The battler that was hit.
   */
  // eslint-disable-next-line no-unused-vars
  static applyOnAttackEffects(action, target)
  {
    const caster = action.getCaster()
      .getBattler();
    const skill = action.getBaseSkill();
    // capture target battler for downstream policy in this routine.
    const targetBattler = target.getBattler();
    const result = targetBattler.result();

    // capture hp gain for downstream policy in this routine.
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

    // when hpGain  differs from  0, take this branch.
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

    // capture hp gain for downstream policy in this routine.
    const hpGain = ResourceHitManager.whenHitHpGain(targetBattler, damage);
    const mpGain = ResourceHitManager.whenHitMpGain(targetBattler, damage);
    const tpGain = ResourceHitManager.whenHitTpGain(targetBattler, damage);

    // when hpGain  differs from  0, take this branch.
    if (hpGain !== 0) targetBattler.gainHpFromResource(hpGain);
    if (mpGain !== 0) targetBattler.gainMpFromResource(mpGain);
    if (tpGain !== 0) targetBattler.gainTpFromResource(tpGain);
  }

  //region on-attack
  /**
   * Calculates the HP gain for the caster from a skill's on-attack tags.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackHpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkill(
      caster,
      skill,
      // policy step inside on attack hp gain.
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackHpGainFormula,
      // policy step inside on attack hp gain.
      caster.mhp
    );
  }

  /**
   * Calculates the MP gain for the caster from a skill's on-attack tags.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackMpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkill(
      caster,
      skill,
      // policy step inside on attack mp gain.
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackMpGainFormula,
      // policy step inside on attack mp gain.
      caster.mmp
    );
  }

  /**
   * Calculates the TP gain for the caster from a skill's on-attack tags.
   * @param {Game_Actor|Game_Enemy} caster The caster of the skill.
   * @param {RPG_Skill} skill The skill that landed the hit.
   * @returns {number}
   */
  static onAttackTpGain(caster, skill)
  {
    return ResourceHitManager.#gainBySkill(
      caster,
      skill,
      // policy step inside on attack tp gain.
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFlat,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.OnAttackTpGainFormula,
      // policy step inside on attack tp gain.
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
      // policy step inside when hit hp gain.
      J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitHpGainFormula,
      targetBattler.mhp,
      // policy step inside when hit hp gain.
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
      // policy step inside when hit mp gain.
      J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitMpGainFormula,
      targetBattler.mmp,
      // policy step inside when hit mp gain.
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
      // policy step inside when hit tp gain.
      J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainPercent,
      J.RESOURCES.EXT.ABS.RegExp.WhenHitTpGainFormula,
      targetBattler.mtp,
      // policy step inside when hit tp gain.
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

    // capture total for downstream policy in this routine.
    const total = flat + calculatedPercent + formula;
    if (total === 0) return 0;

    // hand back total * caster.rec to the caller.
    return total * caster.rec;
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

    // capture total flat for downstream policy in this routine.
    const totalFlat = sources.reduce((acc, source) => acc + RPGManager.getNumberFromNoteByRegex(source, flatRegex), 0);

    // capture total percent for downstream policy in this routine.
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

    // capture total for downstream policy in this routine.
    const total = totalFlat + calculatedPercent + totalFormula;
    if (total === 0) return 0;

    // hand back total * targetBattler.rec to the caller.
    return total * targetBattler.rec;
  }

  //endregion private helpers
}

export default ResourceHitManager;
//endregion ResourceHitManager