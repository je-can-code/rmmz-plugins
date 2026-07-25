//region JABS_TargetingSession
/**
 * Represents the state of a single in-progress tactical-targeting aim.<br/>
 * Holds the actions that were already fully built (skill resolved, permissions and costs
 * checked) but deliberately not yet committed via `setDecidedAction`, pending the player
 * confirming (or cancelling) a target through the targeting cursor.
 */
class JABS_TargetingSession
{
  /**
   * The battler who initiated this targeting session.
   * @type {JABS_Battler}
   */
  #battler = null;

  /**
   * The fully-built actions awaiting a confirmed target location.
   * @type {JABS_Action[]}
   */
  #actions = [];

  /**
   * The slot-specific commit tail (cooldown type, combo reset, etc.) to run once a target is
   * confirmed. Mirrors whatever the intercepted `JABS_InputAdapter` method would have done
   * after `getAttackData`, since only the caller knows which slot this came from.
   * @type {function(JABS_Action[]): void}
   */
  #onCommit;

  /**
   * Constructor.
   * @param {JABS_Battler} battler The battler who initiated this session.
   * @param {JABS_Action[]} actions The pending actions awaiting a target.
   * @param {function(JABS_Action[]): void} onCommit The slot-specific commit tail to run on confirm.
   */
  constructor(battler, actions, onCommit)
  {
    // stash the battler who is doing the aiming.
    this.#battler = battler;

    // stash the actions that will fire once a target is confirmed.
    this.#actions = actions;

    // stash the slot-specific commit tail to run once a target is confirmed.
    this.#onCommit = onCommit;
  }

  /**
   * Gets the battler who initiated this targeting session.
   * @returns {JABS_Battler}
   */
  getBattler()
  {
    return this.#battler;
  }

  /**
   * Gets the pending actions awaiting a confirmed target location.
   * @returns {JABS_Action[]}
   */
  getActions()
  {
    return this.#actions;
  }

  /**
   * Gets the slot-specific commit tail to run once a target is confirmed.
   * @returns {function(JABS_Action[]): void}
   */
  getOnCommit()
  {
    return this.#onCommit;
  }
}

export default JABS_TargetingSession;
//endregion JABS_TargetingSession
