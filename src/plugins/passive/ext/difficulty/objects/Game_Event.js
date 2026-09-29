//region Game_Event
import DifficultyAffixManager from '../managers/DifficultyAffixManager.js';

// the chance resolvers scaled here belong to J-Passive-Affix, so they exist only with it installed.
if (J.PASSIVE.EXT.AFFIX)
{
  /**
   * Extends {@link #getResolvedPassiveAffixPrefixChance}.<br/>
   * Also scales the resolved chance by whatever the difficulty layers in force ask for.
   *
   * Scaling the resolved value rather than the plugin default is deliberate: it composes with the
   * existing precedence chain instead of competing with it, so an event comment or enemy note still
   * decides the baseline and the difficulty only says how much more or less of it applies. A spawn
   * pinned to zero stays at zero, because no multiplier moves zero.
   * @param {RPG_Enemy} enemyData Database enemy row for the spawned troop member.
   * @returns {number}
   */
  J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Event.set(
    'getResolvedPassiveAffixPrefixChance',
    Game_Event.prototype.getResolvedPassiveAffixPrefixChance);
  Game_Event.prototype.getResolvedPassiveAffixPrefixChance = function(enemyData)
  {
    // perform original logic.
    const original = J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Event.get('getResolvedPassiveAffixPrefixChance')
      .call(this, enemyData);

    // read from the cache rather than folded here; this runs once per spawned enemy per slot.
    const factor = DifficultyAffixManager.prefixChanceFactor();

    // clamped here rather than trusted from the original, because the plugin-default branch of the base
    // resolver returns its parameter without clamping and multiplying can leave the range anyway.
    return (original * factor).clamp(0, 100);
  };

  /**
   * Extends {@link #getResolvedPassiveAffixSuffixChance}.<br/>
   * Also scales the resolved chance by whatever the difficulty layers in force ask for.
   * @param {RPG_Enemy} enemyData Database enemy row for the spawned troop member.
   * @returns {number}
   */
  J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Event.set(
    'getResolvedPassiveAffixSuffixChance',
    Game_Event.prototype.getResolvedPassiveAffixSuffixChance);
  Game_Event.prototype.getResolvedPassiveAffixSuffixChance = function(enemyData)
  {
    // perform original logic.
    const original = J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Event.get('getResolvedPassiveAffixSuffixChance')
      .call(this, enemyData);

    // same cached-factor policy as the prefix slot.
    const factor = DifficultyAffixManager.suffixChanceFactor();

    // same clamping policy as the prefix slot.
    return (original * factor).clamp(0, 100);
  };
}
//endregion Game_Event