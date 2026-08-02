//region registerOmniQuestSaveCodecs
/**
 * The destination timer throttles how often the questopedia checks the player's coordinates against
 * a tracked destination. It measures nothing the player can observe, so it is never written and the
 * map gets a fresh one on load.
 *
 * `Game_Map` is the host, which is easy to miss: this is the one plugin slice living on the map
 * object itself rather than on the system, the party, or a character.
 */
SerializableRegistry.extend(Game_Map, {
  transients: {
    '_j._omni._quest._destinationTimer': () => new J_Timer(15),
  },
});

/**
 * The questopedia cache is the same entries as `_questopediaSaveables`, keyed for lookup - the whole
 * collection, written to the file a second time. It was the single largest thing in a savefile.
 *
 * It rebuilds here rather than coming back empty, because nothing reads it through a guard: the
 * lookups call `.get()` on it directly, so an empty cache reads as "this party knows no quests"
 * rather than as "this has not been built yet". Every saveable it needs has already decoded by the
 * time a transient factory runs.
 */
SerializableRegistry.extend(Game_Party, {
  transients: {
    '_j._omni._questopediaCache': party => new Map(
      party.getSavedQuestopediaEntries()
        .map(entry => [ entry.key, entry ])),
  },
});
//endregion registerOmniQuestSaveCodecs