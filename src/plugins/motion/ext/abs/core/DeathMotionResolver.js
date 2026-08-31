//region DeathMotionResolver
/**
 * Decides how a particular battler dies.
 *
 * Every enemy gets a death animation whether or not anybody authored one, because the alternative
 * is what the game did before this existed: enemies stopped rendering mid-frame. So the question is
 * never "does this thing have a death", only "which one", and the answer comes from three places in
 * a fixed order:
 *
 * 1. **The battler's states**, highest state priority first. Affixes are states, so this is what
 *    lets an elite die harder than the ordinary version of the same creature without either of them
 *    being authored twice.
 * 2. **The enemy's own note**, for a creature whose death is characteristic of the creature.
 * 3. **The configured default**, which is swift, because most things that die are trash.
 *
 * Opting out is separate from choosing, and deliberately outranks everything: a boss that runs its
 * own scripted collapse does not want a generic one layered underneath, and more importantly does
 * not want the corpse held open for the extra frames one would cost.
 */
class DeathMotionResolver
{
  /**
   * Works out which death style a battler should collapse with.
   * @param {Game_Enemy} battler The battler that has been defeated.
   * @returns {string|null} The style name, or null when this battler opts out entirely.
   */
  static resolveStyleFor(battler)
  {
    // anything that says it handles its own death is taken at its word, before anything else.
    if (DeathMotionResolver.hasOptedOut(battler) === true) return null;

    const fromStates = DeathMotionResolver.styleFromStates(battler);

    // a state outranks the creature, which is how an affix makes an ordinary thing die harder.
    if (fromStates !== null) return fromStates;

    const fromEnemy = DeathMotionResolver.styleFromEnemy(battler);
    if (fromEnemy !== null) return fromEnemy;

    return J.MOTION.EXT.ABS.Metadata.defaultDeathStyle;
  }

  /**
   * Determines whether this battler, or anything currently afflicting it, suppresses death motion.
   * @param {Game_Enemy} battler The battler that has been defeated.
   * @returns {boolean}
   */
  static hasOptedOut(battler)
  {
    const { NoDeathMotion } = J.MOTION.EXT.ABS.RegExp;

    const enemyData = battler.databaseData();
    const enemyOptedOut = RPGManager.checkForBooleanFromNoteByRegex(enemyData, NoDeathMotion);
    if (enemyOptedOut === true) return true;

    const states = DeathMotionResolver.deathRelevantStates(battler);

    return states.some(state => RPGManager.checkForBooleanFromNoteByRegex(state, NoDeathMotion));
  }

  /**
   * The death style declared by the highest-priority state carrying one.
   *
   * Priority is the state's own priority as authored in the editor, not the length or drama of the
   * animation it asks for. That keeps this consistent with every other place two states disagree,
   * and it means a designer orders deaths the same way they already order everything else.
   * @param {Game_Enemy} battler The battler that has been defeated.
   * @returns {string|null} The style name, or null when no state asks for one.
   */
  static styleFromStates(battler)
  {
    const { DeathMotion } = J.MOTION.EXT.ABS.RegExp;
    const states = DeathMotionResolver.deathRelevantStates(battler);

    const declaring = states.filter(state => RPGManager.getStringFromNoteByRegex(state, DeathMotion, true) !== null);

    // no affliction has an opinion about how this thing dies.
    if (declaring.length === 0) return null;

    const winner = declaring.reduce(DeathMotionResolver.higherPriorityOf);

    return RPGManager.getStringFromNoteByRegex(winner, DeathMotion, true);
  }

  /**
   * Whichever of two states the editor considers more important.
   *
   * Ties go to the incumbent, so a state that was already winning keeps winning. Nothing meaningful
   * distinguishes two equally-prioritised states, and picking the first keeps the answer stable
   * rather than dependent on the order the engine happened to return them in.
   * @param {RPG_State} incumbent The state currently winning.
   * @param {RPG_State} challenger The state being compared against it.
   * @returns {RPG_State}
   */
  static higherPriorityOf(incumbent, challenger)
  {
    if (challenger.priority > incumbent.priority) return challenger;

    return incumbent;
  }

  /**
   * The death style declared on the enemy itself.
   * @param {Game_Enemy} battler The battler that has been defeated.
   * @returns {string|null} The style name, or null when the creature has no preference.
   */
  static styleFromEnemy(battler)
  {
    const { DeathMotion } = J.MOTION.EXT.ABS.RegExp;
    const enemyData = battler.databaseData();

    return RPGManager.getStringFromNoteByRegex(enemyData, DeathMotion, true);
  }

  /**
   * The states worth consulting about a battler's death.
   *
   * Read through the battler's own accessor rather than the database table, so this sees what is
   * actually afflicting it at the moment it died.
   * @param {Game_Enemy} battler The battler that has been defeated.
   * @returns {RPG_State[]}
   */
  static deathRelevantStates(battler)
  {
    return battler.states();
  }
}

export default DeathMotionResolver;
//endregion DeathMotionResolver