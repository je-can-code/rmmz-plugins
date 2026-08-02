//region registerPassiveConditionalSaveCodecs
/**
 * The reconcile throttle is a stopwatch measuring how long since this battler's conditional passives
 * were last reconciled, which is a question only the current session can ask - so it is never
 * written, and every loaded actor starts with a fresh one.
 *
 * `Game_Actor` is the only host that reaches a savefile: the field is assigned on `Game_Battler`,
 * but enemies are rebuilt from the troop rather than persisted.
 */
SerializableRegistry.extend(Game_Actor, {
  transients: {
    '_j._passive._conditional._timer': () =>
      new JABS_Timer(J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames || 15),
  },
});
//endregion registerPassiveConditionalSaveCodecs