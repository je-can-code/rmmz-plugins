//region registerRegionSkillsSaveCodecs
/**
 * The region-skills execution timer is a stopwatch and is never written to a savefile; each holder
 * gets a fresh one on load, built from the plugin parameter rather than from whatever delay was
 * configured when the save was written.
 *
 * The three character-like hosts are named individually because a codec is resolved by the exact
 * constructor of the value being encoded, so a declaration on `Game_Character` - where the field is
 * assigned - would reach none of them. Events are absent because J-Base's event codec drops
 * everything at `_j` on an event outright.
 */
const regionSkillsTimerTransients = {
  '_j._regions._skills._timer': () => new JABS_Timer(J.REGIONS.EXT.SKILLS.Metadata.delayBetweenExecutions),
};

SerializableRegistry.extend(Game_Player, {
  transients: regionSkillsTimerTransients,
});

SerializableRegistry.extend(Game_Follower, {
  transients: regionSkillsTimerTransients,
});

SerializableRegistry.extend(Game_Vehicle, {
  transients: regionSkillsTimerTransients,
});
//endregion registerRegionSkillsSaveCodecs