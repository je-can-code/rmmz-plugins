//region DistinctStates
/**
 * Reads the states a battler carries with each one listed once, however many stacks of it are applied.<br/>
 * J-ABS hands {@link Game_Battler#states} back with one copy of a stacked state per stack, which is what lets every
 * stack's traits add up. A rule written on a state speaks for that state once, though: a manager reading its rules
 * off each copy would roll a five-stack state's removal chance five times over, from a single execution, and could
 * strip every stack where its rule promised one.
 */
class DistinctStates
{
  /**
   * The states the given battler carries, each listed once.
   * @param {Game_Actor|Game_Enemy} battler The battler whose states are being read.
   * @returns {RPG_State[]}
   */
  static of(battler)
  {
    // keyed by id, so every copy of a stacked state lands on the same entry.
    const statesById = new Map();
    battler.states()
      .forEach(state => statesById.set(state.id, state));

    // one state per id, in the order each first appeared.
    return [ ...statesById.values() ];
  }
}

export default DistinctStates;
//endregion DistinctStates