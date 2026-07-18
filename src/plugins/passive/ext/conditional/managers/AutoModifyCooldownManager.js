//region AutoModifyCooldownManager
import AutoRuleManager from './AutoRuleManager.js';
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';

/**
 * Schedules cooldown modifications from {@link RPG_BaseItem#autoModifyCooldownRules} tuples.
 *
 * Unlike its siblings, the payload isn't a state/skill id- it's a signed modification amount
 * (`tuple[0]`) applied directly to one or more of the battler's own active skill-slot cooldowns.
 * Unit and range/target selection live further down the tuple than the shared dispatch loop ever
 * inspects (`tuple[3]` onward), so this manager parses those slots itself out of the forwarded tuple.
 */
class AutoModifyCooldownManager extends AutoRuleManager
{
  /**
   * The name of the source property that holds auto-modify-cooldown rule tuples.
   * @returns {string} - The property name holding rule tuples on source objects.
   */
  static get rulesProperty() { return 'autoModifyCooldownRules'; }

  /**
   * `tuple[0]` here is a signed modification amount, not a database id- negative values are the
   * normal case (reducing cooldowns), so the base class's positive-id safety net does not apply.
   * @returns {boolean}
   */
  static get requiresPositiveId() { return false; }

  /**
   * Applies a signed modification to one or more of the battler's active skill-slot cooldowns.
   * @param {Game_Actor|Game_Enemy} battler - The battler whose cooldowns are modified.
   * @param {number} amount - The signed modification amount; negative reduces, positive increases.
   * @param {any[]} tuple - The full authored tuple:
   * `[amount, condition, throttleFrames, unit, range?, targetKey?]`.
   * @returns {boolean} - True when at least one active cooldown was modified.
   */
  static dispatch(battler, amount, tuple)
  {
    // parse the unit and range/target payload from beyond the slots the shared loop itself reads.
    const unit = String(tuple[3]);
    const range = tuple.length >= 5 ? String(tuple[4]) : 'all';
    const targetKeyParam = tuple.length >= 6 ? tuple[5] : undefined;

    // only percent/flat are recognized units- anything else cannot be applied safely.
    if (unit !== 'percent' && unit !== 'flat') return false;

    // resolve which skill-slot keys this rule targets.
    const keys = this.resolveKeys(range, targetKeyParam);

    // no valid keys resolved (e.g. a malformed 'single' with no target key) means nothing to do.
    if (keys.length === 0) return false;

    // only touch slots that are both equipped and currently mid-cooldown- a ready slot has nothing
    // to modify, and an unequipped key was never a candidate in the first place.
    const slots = battler.getSkillSlotManager()
      .getEquippedSlots()
      .filter(slot => keys.includes(slot.key) && slot.getCooldown().frames > 0);

    // nothing currently on cooldown among the targeted keys- nothing to modify.
    if (slots.length === 0) return false;

    // apply the modification to every matching, currently-active cooldown.
    slots.forEach(slot =>
    {
      const cooldown = slot.getCooldown();

      // percent is computed against the cooldown's own full duration, not whatever remains right
      // now, so a kill always refunds a consistent, predictable chunk regardless of timing.
      const delta = unit === 'percent'
        ? Math.floor(cooldown.maxFrames * (amount / 100))
        : amount;

      cooldown.modBaseFrames(delta);
    });

    return true;
  }

  /**
   * Resolves a RANGE selector into the concrete set of {@link JABS_Button} keys it targets.
   * @param {string} range - One of `'single'`, `'combat'`, or `'all'`.
   * @param {string|number|undefined} targetKeyParam - The author-facing slot name for `'single'`.
   * @returns {string[]} - The resolved {@link JABS_Button} keys, or an empty array when unresolvable.
   */
  static resolveKeys(range, targetKeyParam)
  {
    switch (range)
    {
      case 'single':
        // a 'single' range with no target key cannot resolve to anything.
        if (targetKeyParam === undefined) return [];
        return [ PassiveRuleJabsAccess.resolveSlotKey(targetKeyParam) ];

      case 'combat':
        return [
          JABS_Button.CombatSkill1, JABS_Button.CombatSkill2,
          JABS_Button.CombatSkill3, JABS_Button.CombatSkill4,
        ];

      case 'all':
        return [
          JABS_Button.Mainhand, JABS_Button.Offhand, JABS_Button.Tool, JABS_Button.Dodge,
          JABS_Button.CombatSkill1, JABS_Button.CombatSkill2,
          JABS_Button.CombatSkill3, JABS_Button.CombatSkill4,
        ];

      default:
        // unrecognized range- nothing to resolve.
        return [];
    }
  }
}

export default AutoModifyCooldownManager;
//endregion AutoModifyCooldownManager
