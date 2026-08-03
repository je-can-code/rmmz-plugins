//region registerOmniMonsterSaveCodecs
/**
 * The monsterpedia cache is the same observations as `_monsterpediaObservationsSaveables`, keyed by
 * enemy id for lookup - the whole collection, written to the file a second time.
 *
 * It rebuilds here rather than coming back empty, because nothing reads it through a guard: the
 * lookups call `.get()` on it directly, so an empty cache reads as "this party has observed nothing"
 * rather than as "this has not been built yet". Every saveable it needs has already decoded by the
 * time a transient factory runs.
 *
 * The saveables are a sparse array indexed by enemy id, so the empty slots are skipped rather than
 * keyed to `undefined`.
 */
SerializableRegistry.extend(Game_Party, {
  transients: {
    '_j._omni._monsterpediaObservationsCache': party =>
    {
      const cache = new Map();

      party.getSavedMonsterpediaObservations()
        .forEach((observation, enemyId) =>
        {
          if (!observation) return;

          cache.set(enemyId, observation);
        });

      return cache;
    },
  },
});
//endregion registerOmniMonsterSaveCodecs
