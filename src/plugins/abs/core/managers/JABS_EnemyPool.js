//region JABS_EnemyPool
import JABS_Engine from './JABS_Engine.js';

/**
 * This static class decides who a pooled spot turns out to be each time it is built.
 *
 * A placed event always names its own enemy with `<enemyId:N>`. Adding `<enemyIds:[...]>` gives that
 * spot a pool: every id in the list is a possibility, and each build of the event rolls one. Landing
 * on the event's own enemy changes nothing, so every tag on its page applies exactly as authored.
 * Landing on anyone else swaps in that enemy's page from the enemy map, which is why a pooled enemy
 * brings its own sprite, speed and level rather than borrowing the spot's.
 *
 * Weights resolve as `enemy note < map note`, and the spot's own enemy always counts for the
 * `defaultEnemyPoolHomeWeight` parameter rather than its note. That is what keeps the odds sensible
 * for a spot above the bottom of a ladder: a tier 3 enemy's note says how rare it is among tier 1s,
 * which would make a spot that deliberately holds one mostly roll something else.
 */
class JABS_EnemyPool
{
  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Rolls a pooled spot, choosing who stands there for this build of the event.
   * @param {number} homeId The enemy the event names with `<enemyId:N>`.
   * @param {number[]} enemyIds Every enemy the event's `<enemyIds:[...]>` tag names.
   * @returns {number} The chosen enemy's id, which is the home id when nobody else was chosen.
   */
  static roll(homeId, enemyIds)
  {
    // the enemy map arrives a moment after boot, and a spot built before then simply stays itself.
    if (JABS_Engine.getEnemyCloneList() === null) return homeId;

    // weigh everyone this spot could be.
    const weights = this.weightsFor(homeId, enemyIds);

    // the roll needs the weights' total up front.
    let totalWeight = 0;
    weights.forEach(weight => totalWeight += weight);

    // a pool with nothing drawable in it leaves the spot as authored.
    return RPGManager.weightedMapChoice(weights, totalWeight) ?? homeId;
  }

  /**
   * Builds the weight of everyone in a pool, leaving out anyone with no page to swap in.
   * @param {number} homeId The enemy the event names with `<enemyId:N>`.
   * @param {number[]} enemyIds Every enemy the event's `<enemyIds:[...]>` tag names.
   * @returns {Map<number, number>} Each drawable enemy's id, mapped to its weight.
   */
  static weightsFor(homeId, enemyIds)
  {
    // the current map's opinions apply to every enemy in the pool.
    const overrides = this.mapOverrides();

    // walk the pool and weigh everyone it names.
    const weights = new Map();
    enemyIds.forEach(enemyId =>
    {
      // only the spot's own enemy can stand here without an event on the enemy map to copy.
      if (enemyId !== homeId && !this.hasPage(enemyId))
      {
        Diagnostics.warn(__PLUGIN_NAME__, `enemy pools name enemy [ ${enemyId} ], who has no event on the enemy map.`);
        return;
      }

      // record what this enemy weighs here.
      weights.set(enemyId, this.weightOf(enemyId, homeId, overrides));
    });

    return weights;
  }

  /**
   * Resolves one enemy's weight in a pool: the map's opinion wins, then the spot's own enemy counts
   * for the home weight, and everyone else counts for what their note says.
   * @param {number} enemyId The enemy being weighed.
   * @param {number} homeId The enemy the event names with `<enemyId:N>`.
   * @param {Map<number, number>} overrides The current map's weight overrides.
   * @returns {number} The enemy's weight in this pool.
   */
  static weightOf(enemyId, homeId, overrides)
  {
    // a map may say anything about anyone, the spot's own enemy included.
    if (overrides.has(enemyId)) return overrides.get(enemyId);

    // the spot's own enemy anchors the odds, whichever tier it happens to be.
    if (enemyId === homeId) return J.ABS.Metadata.DefaultEnemyPoolHomeWeight;

    // everyone else is as rare as their note says.
    return $gameEnemies.enemy(enemyId)
      .enemyWeight();
  }

  /**
   * Gets the current map's weight overrides.
   * @returns {Map<number, number>} Each overridden enemy's id, mapped to its weight on this map.
   */
  static mapOverrides()
  {
    // every tag on the map's note is one [ENEMY_ID, WEIGHT] pair, and a Map builds straight from pairs.
    return new Map(RPGManager.getArraysFromNotesByRegex($dataMap, J.ABS.RegExp.EnemyWeightOverride));
  }

  /**
   * Determines whether an enemy has an event on the enemy map for a pooled spot to copy.
   * @param {number} enemyId The enemy to look for.
   * @returns {boolean} True if the enemy map has an event for this enemy, false otherwise.
   */
  static hasPage(enemyId)
  {
    // the enemy map is keyed by event id, and event id is enemy id.
    return !!JABS_Engine.getEnemyCloneList()
      .at(enemyId);
  }

  /**
   * Gets the page a pooled spot wears when it rolls someone other than its own enemy.
   * The enemy map holds exactly one page per enemy, so there is only ever the first to take.
   * @param {number} enemyId The enemy the spot rolled.
   * @returns {RPG_EventPage} That enemy's page from the enemy map.
   */
  static pageOf(enemyId)
  {
    // grab the event this enemy lives on.
    const template = JABS_Engine.getEnemyCloneList()
      .at(enemyId);

    return template.pages.at(0);
  }
}

export default JABS_EnemyPool;
//endregion JABS_EnemyPool