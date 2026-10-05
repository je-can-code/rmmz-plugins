//region registerJabsSaveCodecs
/**
 * Keeps the flag {@link Game_Battler#isClearingStates} reads out of every savefile.<br/>
 * It is raised and lowered within a single synchronous {@link Game_Battler#clearStates} call, so it
 * is always false at rest and carries nothing worth surviving a load. Its cold value is false- exactly
 * what a battler that is not partway through that walk reads.
 *
 * `Game_Actor` is the only host that reaches a savefile: the field is assigned on `Game_Battler`, but
 * enemies are rebuilt from the map rather than persisted, and declarations do not inherit.
 *
 * J-Base-Save is the plugin that registers `Game_Actor`, and it is genuinely optional, so the
 * declaration waits on the same namespace check the save routes do.
 */
if (J.BASE.EXT.SAVE)
{
  SerializableRegistry.extend(Game_Actor, {
    transients: {
      '_j._abs._clearingStates': () => false,
    },
  });
}
//endregion registerJabsSaveCodecs