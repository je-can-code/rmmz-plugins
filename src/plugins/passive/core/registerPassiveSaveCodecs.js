//region registerPassiveSaveCodecs
/**
 * The passive-capable source list is a filtered view of this battler's own sources, rebuilt at the
 * end of every {@link Game_Battler.refreshPassiveStates} so the conditional ext's drift check has a
 * short list to walk. It is derived, so it is never written.
 *
 * It rebuilds itself here rather than coming back empty, because nothing reads it through a guard -
 * {@link Game_Battler.passiveCapableSources} hands the array straight over, so an empty one reads as
 * "this battler has no passive sources" rather than as "this has not been built yet". By the time a
 * transient factory runs, every field the rebuild reads has already decoded.
 *
 * `Game_Actor` is the only host that reaches a savefile: the field is assigned on `Game_Battler`, but
 * enemies are rebuilt from the troop rather than persisted, and declarations do not inherit.
 */
SerializableRegistry.extend(Game_Actor, {
  transients: {
    '_j._passive._passiveSources': battler =>
    {
      battler.cachePassiveCapableSources();

      return battler.passiveSources();
    },
  },
});
/**
 * Lifts the passive slice out of its hosts and into a section file of its own.
 */
if (J.BASE.EXT.SAVE)
{
  SaveSectionRouter.registerNamespace('_passive', 'passive');
}
//endregion registerPassiveSaveCodecs
