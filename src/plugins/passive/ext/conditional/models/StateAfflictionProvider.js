//region StateAfflictionProvider
/**
 * Extends {@link StateAfflictionProvider.qualifies}.<br/>
 * Also excludes passive states from the affliction strip.
 *
 * A passive is a permanent trait wearing a state's clothing - granted by equipment or a skill and
 * never expiring - so listing one beside poison and paralysis would fill the strip with rows the
 * player can neither wait out nor cure. J-ABS has no notion of a passive state, and the knowledge
 * belongs on this side of the seam: this extension is where passives and JABS already meet.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased.StateAfflictionProvider.set('qualifies', StateAfflictionProvider.qualifies);
StateAfflictionProvider.qualifies = function(trackedState, battler)
{
  // perform original logic.
  const qualifiesNormally = J.PASSIVE.EXT.CONDITIONAL.Aliased.StateAfflictionProvider.get('qualifies')
    .call(this, trackedState, battler);

  // a state the base rules already rejected stays rejected.
  if (qualifiesNormally === false) return false;

  // a passive is not an affliction, however much it looks like one from the outside.
  if (battler.isPassiveState(trackedState.stateId) === true) return false;

  return true;
};
//endregion StateAfflictionProvider
