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
//endregion registerOmniQuestSaveCodecs