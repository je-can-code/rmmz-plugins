//region StateAfflictionBattlerIdentity
/**
 * Stable sprite-cache identity for any afflicted battler.
 */
class StateAfflictionBattlerIdentity
{
  /**
   * The battler uuid used for cache keys.
   * @type {string}
   */
  uuid = String.empty;

  /**
   * Builds an identity from a battler.
   * @param {Game_Battler} battler The afflicted battler.
   * @returns {StateAfflictionBattlerIdentity}
   */
  static fromBattler(battler)
  {
    const identity = new StateAfflictionBattlerIdentity();

    identity.uuid = battler.getUuid();

    return identity;
  }

  /**
   * Builds the icon sprite cache key for a state id.
   * @param {number} stateId The database state id.
   * @returns {string}
   */
  buildIconKey(stateId)
  {
    return `affliction-icon-${stateId}-${this.uuid}`;
  }

  /**
   * Builds the timer sprite cache key for a state id.
   * @param {number} stateId The database state id.
   * @returns {string}
   */
  buildTimerKey(stateId)
  {
    return `affliction-timer-${stateId}-${this.uuid}`;
  }

  /**
   * Builds the stack sprite cache key for a state id.
   * @param {number} stateId The database state id.
   * @returns {string}
   */
  buildStackKey(stateId)
  {
    return `affliction-stack-${stateId}-${this.uuid}`;
  }
}

export default StateAfflictionBattlerIdentity;
//endregion StateAfflictionBattlerIdentity