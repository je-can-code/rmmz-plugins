//region SaveFileModeRewind
import SaveFileMode from './SaveFileMode.js';
import SaveFileEntry from './SaveFileEntry.js';
import SaveFileSystem from './../managers/SaveFileSystem.js';

/**
 * Stepping back to an older generation of the slot currently being played.
 *
 * **Rewinding is loading, not deleting.** The pointer stays where it is and the next save writes a new
 * generation on top, so the state rewound away from remains on disk until retention retires it
 * normally - which makes rewinding itself undoable. Delete is the only destructive command in this
 * scene, and it is the only one that says so.
 *
 * **There is no slot picker.** The rows are the generations of the slot the player is already in,
 * newest first. This is the one mode whose {@link entries} returns generations rather than slots, and
 * it is the entire reason that member is overridable.
 */
class SaveFileModeRewind
  extends SaveFileMode
{
  /**
   * Implements {@link SaveFileMode.key}.<br/>
   * @returns {string}
   */
  key()
  {
    return 'rewind';
  }

  /**
   * Implements {@link SaveFileMode.label}.<br/>
   * @returns {string}
   */
  label()
  {
    return 'Rewind';
  }

  /**
   * Implements {@link SaveFileMode.helpText}.<br/>
   * @returns {string}
   */
  helpText()
  {
    return 'Step back to an earlier save in this file. Nothing is deleted.';
  }

  /**
   * Overrides {@link SaveFileMode.isEnabled}.<br/>
   * A playthrough with one save in it has nothing to step back to.
   *
   * Two halves, and they pull in opposite directions, which is why neither alone is the test:
   *
   * - `$gameSystem.savefileId()` is the only thing that knows which slot is being played, since there
   *   is no picker to ask.
   * - It cannot decide availability by itself, because `DataManager.selectSavefileForNewGame` stamps it
   *   at New Game with a *guessed* empty slot, before anything has been written. It is non-zero for a
   *   playthrough that has never saved once.
   *
   * So the id names the slot and the slot's own history answers the question. More than one reachable
   * generation means there is somewhere to go.
   * @returns {boolean}
   */
  isEnabled()
  {
    const savefileId = $gameSystem.savefileId();

    // no slot claimed at all means nothing has been played into one.
    if (savefileId === 0) return false;

    return SaveFileSystem.loadOrder(DataManager.makeSavename(savefileId)).length > 1;
  }

  /**
   * Overrides {@link SaveFileMode.entries}.<br/>
   * Lists the generations of the slot being played, newest first.
   * @returns {SaveFileEntry[]}
   */
  entries()
  {
    const savefileId = $gameSystem.savefileId();

    // `loadOrder` already answers newest-first and already excludes orphans and other playthroughs'
    // generations, so the order it hands back is the order to show.
    return SaveFileSystem.loadOrder(DataManager.makeSavename(savefileId))
      .map(generationName => SaveFileEntry.forGeneration(savefileId, generationName));
  }

  /**
   * Overrides {@link SaveFileMode.leadText}.<br/>
   * Leads with how long ago, because that is how people actually navigate their own history.
   *
   * Every row here is the same slot, usually the same map, often the same room - so the map name that
   * distinguishes one *slot* from another distinguishes nothing at all between generations. "Reload to
   * five minutes ago" is the sentence a player is thinking, so that is the number the row leads with.
   * The place still rides along underneath as the confirmation.
   * @param {SaveFileEntry} entry The row being described.
   * @returns {string}
   */
  leadText(entry)
  {
    return this.elapsedTextFor(entry);
  }

  /**
   * Implements {@link SaveFileMode.confirmText}.<br/>
   * Says what survives, because the word "rewind" invites the assumption that something does not.
   * @param {SaveFileEntry} _entry The row being confirmed.
   * @returns {string}
   */
  confirmText(_entry)
  {
    return 'Step back to this save?';
  }

  /**
   * Implements {@link SaveFileMode.confirmDetail}.<br/>
   * @param {SaveFileEntry} _entry The row being asked about.
   * @returns {string}
   */
  confirmDetail(_entry)
  {
    return 'Nothing is deleted and you can step forward again.';
  }

  /**
   * Overrides {@link SaveFileMode.resumesGame}.<br/>
   * @returns {boolean}
   */
  resumesGame()
  {
    return true;
  }

  /**
   * Overrides {@link SaveFileMode.playSuccessSound}.<br/>
   * Rewinding is loading, so it sounds like loading.
   * @returns {void}
   */
  playSuccessSound()
  {
    SoundManager.playLoad();
  }

  /**
   * Implements {@link SaveFileMode.execute}.<br/>
   * Loads the exact generation chosen, with no fallback to a newer one.
   * @param {SaveFileEntry} entry The row chosen.
   * @returns {Promise<void>}
   */
  execute(entry)
  {
    return DataManager.loadGeneration(entry.savefileId(), entry.generationName());
  }

  //region elapsed time
  /**
   * How much wall-clock time may pass before it stops being the useful number.
   *
   * Elapsed wall-clock time is what people actually navigate a rewind list by - "reload to five minutes
   * ago" - but it is only meaningful within a single session. A player who loaded a three-day-old save
   * and immediately opened Rewind would otherwise see "3 days ago" on every row: three identical labels
   * carrying no information at all.
   *
   * Two hours is comfortably longer than any single sitting's worth of generations and comfortably
   * shorter than the gap between sittings, so a live session reads in wall-clock and a resumed one
   * falls back.
   * @returns {number} The threshold, in milliseconds.
   */
  elapsedThresholdMs()
  {
    return 2 * 60 * 60 * 1000;
  }

  /**
   * How many frames the engine counts per second of playtime.
   * @returns {number}
   */
  framesPerSecond()
  {
    return 60;
  }

  /**
   * Describes how long ago a row's save happened, in whichever clock still means something.
   *
   * Past the threshold this switches to the *playtime* delta, which is the number that survives being
   * put down and picked up again - `Graphics.frameCount` is restored by `Game_System.onAfterLoad`, so
   * it is a continuous measure of time spent playing rather than time elapsed in the world.
   * @param {number} elapsedMs How long ago the row was written, in wall-clock milliseconds.
   * @param {number} playtimeFrameDelta How much playtime has passed since, in frames.
   * @returns {string}
   */
  describeElapsed(elapsedMs, playtimeFrameDelta)
  {
    // within a session, wall-clock is what the player is actually thinking in.
    if (elapsedMs <= this.elapsedThresholdMs()) return `${this.humanizeDuration(elapsedMs)} ago`;

    // past it, only the play clock still distinguishes one row from another.
    const playtimeMs = (playtimeFrameDelta / this.framesPerSecond()) * 1000;

    return `${this.humanizeDuration(playtimeMs)} of play earlier`;
  }

  /**
   * Renders a duration at the coarsest unit that still says something.
   *
   * One unit only. "1 hour, 4 minutes and 12 seconds ago" is a worse answer to "how far back is this"
   * than "1 hour ago", because the question is about choosing between rows rather than about accuracy.
   * @param {number} milliseconds The duration to describe.
   * @returns {string}
   */
  humanizeDuration(milliseconds)
  {
    const seconds = Math.floor(milliseconds / 1000);

    // anything inside a minute is, for the purpose of picking a row, the same instant.
    if (seconds < 60) return 'moments';

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return this.pluralize(minutes, 'minute');

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return this.pluralize(hours, 'hour');

    return this.pluralize(Math.floor(hours / 24), 'day');
  }

  /**
   * Renders a count with its unit, pluralized.
   * @param {number} count How many of the unit there are.
   * @param {string} unit The singular form of the unit.
   * @returns {string}
   */
  pluralize(count, unit)
  {
    if (count === 1) return `1 ${unit}`;

    return `${count} ${unit}s`;
  }

  /**
   * Describes how long ago one row's save happened, measured against right now.
   *
   * The thin wrapper over {@link describeElapsed} that reads the two live clocks, kept separate so the
   * rule itself stays a pure function of two numbers.
   * @param {SaveFileEntry} entry The row being described.
   * @returns {string}
   */
  elapsedTextFor(entry)
  {
    const elapsedMs = Date.now() - Date.parse(entry.savedAt());

    const playtimeFrameDelta = Graphics.frameCount - entry.playtimeFrames();

    return this.describeElapsed(elapsedMs, playtimeFrameDelta);
  }
  //endregion elapsed time
}

export default SaveFileModeRewind;
//endregion SaveFileModeRewind