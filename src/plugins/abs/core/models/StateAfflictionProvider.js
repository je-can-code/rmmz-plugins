//region StateAfflictionProvider
import StateAfflictionCollection from './StateAfflictionCollection.js';
import StateAfflictionViewModel from './StateAfflictionViewModel.js';

/**
 * Resolves affliction rows for HUD and map presenters.
 */
class StateAfflictionProvider
{
  /**
   * Collects negative and positive affliction rows for a battler.
   * @param {Game_Battler} battler The afflicted battler.
   * @returns {StateAfflictionCollection}
   */
  static collectForBattler(battler)
  {
    const collection = new StateAfflictionCollection();

    if (StateAfflictionProvider.canCollect() === false)
    {
      return collection;
    }

    if (!battler)
    {
      return collection;
    }

    const uuid = battler.getUuid();
    const negativeTracked = $jabsEngine.getNegativeJabsStatesByUuid(uuid);
    const positiveTracked = $jabsEngine.getPositiveJabsStatesByUuid(uuid);

    for (const trackedState of negativeTracked)
    {
      if (StateAfflictionProvider.qualifies(trackedState, battler) === false)
      {
        continue;
      }

      collection.negative.push(
        StateAfflictionViewModel.fromTrackedState(trackedState, battler, 'negative'),
      );
    }

    for (const trackedState of positiveTracked)
    {
      if (StateAfflictionProvider.qualifies(trackedState, battler) === false)
      {
        continue;
      }

      collection.positive.push(
        StateAfflictionViewModel.fromTrackedState(trackedState, battler, 'positive'),
      );
    }

    return collection;
  }

  /**
   * Whether provider dependencies are available.
   * @returns {boolean}
   */
  static canCollect()
  {
    if (!J.ABS)
    {
      return false;
    }

    if (!$jabsEngine)
    {
      return false;
    }

    return true;
  }

  /**
   * Whether a tracked state should be shown as an affliction row.
   * @param {JABS_State} trackedState The tracked state to evaluate.
   * @param {Game_Battler} battler The afflicted battler.
   * @returns {boolean}
   */
  static qualifies(trackedState, battler)
  {
    if (trackedState.expired === true)
    {
      return false;
    }

    if (trackedState.stateId === battler.deathStateId())
    {
      return false;
    }

    if (J.PASSIVE && battler.isPassiveState(trackedState.stateId) === true)
    {
      return false;
    }

    return true;
  }
}

export default StateAfflictionProvider;
//endregion StateAfflictionProvider