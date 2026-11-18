//region SdpBlackoutCache
/**
 * Holds, per actor, whether `<sdpBlackout>` held at its last data change, alongside the notes list it was read from.<br/>
 * Every panel bonus asks on every parameter read, yet the answer can only change when the actor's notes do, and a
 * change to an actor's notes always runs {@link Game_Battler#onBattlerDataChange}. So the reading is taken there,
 * once per change, and every parameter read after it only looks the answer up. That matters most for a stacked
 * actor, whose hundreds of note sources would otherwise be walked dozens of times a frame.<br/>
 * Nothing here is ever filled by a read: {@link record} is the only writer, and it runs from the data-change hook.
 * The readings live in a WeakMap keyed by actor, outside the save: nothing here outlives the session, and an actor
 * nothing references any longer takes its entry with it.
 */
class SdpBlackoutCache
{
  /**
   * Each actor's last reading, alongside the notes list it was taken from.
   * @type {WeakMap<Game_Actor, { notes: RPG_BaseItem[], isBlackedOut: boolean }>}
   */
  static #readingsByActor = new WeakMap();

  /**
   * Records whether the actor's panels are switched off, as just read from the given notes.<br/>
   * Called from the actor's data-change hook, the one moment its notes can have changed.
   * @param {Game_Actor} actor The actor that was just read.
   * @param {RPG_BaseItem[]} notes The notes list the reading was taken from.
   * @param {boolean} isBlackedOut Whether any of those note sources carries the blackout.
   */
  static record(actor, notes, isBlackedOut)
  {
    this.#readingsByActor.set(actor, { notes, isBlackedOut });
  }

  /**
   * Whether the actor's last reading was taken from this very notes list, and so still answers for it.<br/>
   * It is the list's identity that matters: J-Base hands back the same cached list until the actor's data changes,
   * and a new one after.
   * @param {Game_Actor} actor The actor being asked about.
   * @param {RPG_BaseItem[]} notes The notes the actor carries right now.
   * @returns {boolean}
   */
  static isCurrentFor(actor, notes)
  {
    // what was last read for this actor, and from which notes.
    const reading = this.#readingsByActor.get(actor);

    // an actor never read has nothing current.
    if (reading === undefined) return false;

    return reading.notes === notes;
  }

  /**
   * Whether the actor's panels were switched off at its last reading.<br/>
   * Asked only once {@link isCurrentFor} holds for the notes the actor carries, so a reading always exists here.
   * @param {Game_Actor} actor The actor being asked about.
   * @returns {boolean}
   */
  static isBlackedOut(actor)
  {
    return this.#readingsByActor.get(actor).isBlackedOut;
  }
}

export default SdpBlackoutCache;
//endregion SdpBlackoutCache