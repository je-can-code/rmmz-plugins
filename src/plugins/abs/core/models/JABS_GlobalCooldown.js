//region JABS_GlobalCooldown
import JABS_Battler from './JABS_Battler.js';
/**
 * Stateless helpers for the optional battler-wide global cooldown (GCD), similar to MMO-style GCD.
 * Whitelisted skill types share one countdown on the {@link JABS_Battler}; while it runs, other GCD-subject skills are
 * refused by input and AI until the timer clears. Exempt skills (notetags) and non-whitelisted types never stamp or
 * respect this timer. Tool and dodge paths do not use this class.
 */
class JABS_GlobalCooldown
{
  /**
   * Blocks construction so this type stays a pure static namespace.
   * @throws {Error} Always; the class has no instance API.
   */
  constructor()
  {
    throw new Error('JABS_GlobalCooldown is a static class.');
  }

  /**
   * Whether plugin parameters have turned the GCD system on.
   * When false, no skill is treated as GCD-subject and no global timer is applied or checked.
   * @returns {boolean} True when {@link J.ABS.Metadata.EnableGlobalCooldown} is enabled.
   */
  static isSystemEnabled()
  {
    return J.ABS.Metadata.EnableGlobalCooldown === true;
  }

  /**
   * Whether this database skill participates in GCD stamping and blocking.
   * Requires the system to be enabled, a real skill row, a skill type in the configured whitelist, and absence of
   * {@code noGlobalCooldown} / {@code ogcd} exemption notetags.
   * @param {RPG_Skill|null|undefined} skill Skill database entry.
   * @returns {boolean} True when executing this skill should use the global cooldown rules.
   */
  static skillIsSubjectToGlobalCooldown(skill)
  {
    if (JABS_GlobalCooldown.isSystemEnabled() === false) return false;
    if (!skill) return false;
    if (skill.jabsIgnoresGlobalCooldown === true) return false;
    return J.ABS.Metadata.GlobalCooldownSkillTypeSet.has(skill.stypeId);
  }

  /**
   * Frame count to write onto the battler-wide GCD cooldown when a GCD-subject skill is executed.
   * Honors a positive per-skill override from {@code <gcd:N>} when present; otherwise uses the plugin default duration.
   * @param {RPG_Skill|null|undefined} skill Skill database entry (null uses default length only).
   * @returns {number} Whole frames of GCD to apply (at least the plugin default when no valid override).
   */
  static framesForSkill(skill)
  {
    if (!skill) return J.ABS.Metadata.GlobalCooldownFrames;
    const override = skill.jabsGlobalCooldownOverride;
    if (override !== null && override !== undefined)
    {
      const o = Number(override);
      if (Number.isFinite(o) && o > 0)
      {
        return Math.floor(o);
      }
    }
    return J.ABS.Metadata.GlobalCooldownFrames;
  }

  /**
   * Whether the battler's active global cooldown should veto using {@code skillId} right now.
   * Non-subject skills always return false here so oGCD and off-list types never wait on the shared timer.
   * @param {JABS_Battler} jabsBattler Battler whose {@link J.ABS.Globals.GlobalCooldownKey} cooldown is read.
   * @param {number} skillId Database skill id for the attempted action.
   * @returns {boolean} True when GCD is running and this skill is subject to it.
   */
  static isGlobalBlockingSkillId(jabsBattler, skillId)
  {
    const skill = $dataSkills[skillId];
    if (JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(skill) === false) return false;
    const globalCd = jabsBattler.getCooldown(J.ABS.Globals.GlobalCooldownKey);
    if (!globalCd) return false;
    if (globalCd.isBaseReady() === true) return false;
    return true;
  }

  /**
   * Finds the map-driven {@link JABS_Battler} for a party actor (leader or visible follower).
   * Used when only a {@link Game_Actor} id is known—e.g. plugin commands—because GCD state lives on the
   * map entity, not the database actor alone.
   * @param {Game_Actor} actor Party member to resolve.
   * @returns {JABS_Battler|null} Wrapper when that actor is currently the player or a visible follower; otherwise null.
   */
  static jabsBattlerForActor(actor)
  {
    if (!actor) return null;
    const leader = $gameParty.leader();
    if (leader === actor)
    {
      return $gamePlayer.getJabsBattler();
    }
    const vis = $gamePlayer.followers()
      .visibleFollowers();
    for (let i = 0; i < vis.length; i++)
    {
      const follower = vis[i];
      if (follower.actor() === actor)
      {
        return follower.getJabsBattler();
      }
    }
    return null;
  }

  /**
   * Applies the caster's CDR to a base GCD frame count and returns the reduced value.
   * CDR is in percent-point space: 15 CDR → GCD runs at 85% of base; 100 CDR → 0 frames (no GCD).
   * Negative CDR lengthens the GCD. Result is clamped to a minimum of 0 frames.
   * @param {JABS_Battler} jabsBattler The battler whose CDR is applied.
   * @param {number} baseFrames The unmodified GCD frame count.
   * @returns {number} The frame count after CDR is applied.
   */
  static reducedFramesForCaster(jabsBattler, baseFrames)
  {
    const { cdr } = jabsBattler.getBattler();
    return Math.max(0, Math.round(baseFrames * (1 - cdr)));
  }
}

export default JABS_GlobalCooldown;
//endregion JABS_GlobalCooldown