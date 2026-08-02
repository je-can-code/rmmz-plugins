//region registerJabsToolsSaveCodecs
/**
 * The grab-and-throw wait timers are stopwatches, not state a player would notice resetting, so
 * neither of them is written to a savefile - and `JABS_Timer` is deliberately left unregistered so
 * that one reaching the encoder is a loud sign a holder was missed rather than a silent write.
 *
 * The declarations name the three character-like hosts individually because a codec is resolved by
 * the exact constructor of the value in front of the encoder. Declaring these on
 * `Game_CharacterBase`, where the fields are actually assigned, would describe a type that never
 * appears in a savefile by itself and would reach none of the types that do.
 *
 * `Game_Event` is absent on purpose: everything at `_j` on an event is dropped wholesale by J-Base's
 * own event codec, since the engine rebuilds every event at the next map setup.
 *
 * The cold values reproduce the construction site in `objects/Game_CharacterBase.js` exactly, which
 * is why they are expressions rather than remembered numbers - a delay that changes there takes
 * effect on the next load rather than being frozen at whatever a save happened to capture.
 */
const jabsToolsTimerTransients = {
  '_j._tools._grabThrow._grab._wait': () => new JABS_Timer(0),
  '_j._tools._grabThrow._throw._wait': () => new JABS_Timer(0),
};

SerializableRegistry.extend(Game_Player, {
  transients: jabsToolsTimerTransients,
});

SerializableRegistry.extend(Game_Follower, {
  transients: jabsToolsTimerTransients,
});

SerializableRegistry.extend(Game_Vehicle, {
  transients: jabsToolsTimerTransients,
});
/**
 * Lifts the tools slice out of its hosts and into a section file of its own.
 */
if (J.BASE.EXT.SAVE)
{
  SaveSectionRouter.registerNamespace('_tools', 'abs-tools');
}
//endregion registerJabsToolsSaveCodecs