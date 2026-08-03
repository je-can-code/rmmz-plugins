//region SaveFileMode
import SaveFileEntry from './SaveFileEntry.js';
import SaveFileEntryMode from './SaveFileEntryMode.js';

/**
 * What selecting a row means.
 *
 * The files scene has one list and four things choosing a row can do to it, which is a strategy object
 * wearing a scene as a disguise - vanilla's own `Scene_Save` and `Scene_Load` differ by six methods and
 * nothing else. Pulling those six out here is what makes the entire feature testable: scenes, windows
 * and sprites are excluded from coverage on purpose, so every policy decision has to live somewhere
 * with no PIXI in it. This is that somewhere.
 *
 * A subclass answers what its command is called, whether the origin offers it, which rows it lists,
 * which of those rows can be chosen, whether choosing one needs confirming, and what choosing one
 * actually does. The scene asks; it never decides.
 */
class SaveFileMode
{
  /**
   * The command symbol this mode is selected by.
   * @returns {string}
   */
  key()
  {
    return String.empty;
  }

  /**
   * The text the command column draws for this mode.
   * @returns {string}
   */
  label()
  {
    return String.empty;
  }

  /**
   * The icon the command column draws beside this mode's label.
   * @returns {number}
   */
  iconIndex()
  {
    return 0;
  }

  /**
   * What the help window says while this mode is highlighted or active.
   * @returns {string}
   */
  helpText()
  {
    return String.empty;
  }

  /**
   * Determines whether this command appears at all, given where the scene was opened from.
   *
   * Every mode answers this the same way, from the single table on {@link SaveFileEntryMode} - the
   * point of that table is that changing what an origin offers is one row in one place rather than a
   * method on each of four classes drifting away from the others.
   * @param {string} entryMode The origin the scene was opened from.
   * @returns {boolean}
   */
  isOfferedFrom(entryMode)
  {
    return SaveFileEntryMode.offers(entryMode, this.key());
  }

  /**
   * Determines whether this command can be chosen right now.
   *
   * Distinct from {@link isOfferedFrom}, and the difference is what the player is told. A command the
   * origin does not offer is absent, because its absence reads as a different screen. A command that is
   * offered but momentarily useless is drawn and greyed, because that says "this exists, there is just
   * nothing for it to do yet" - which is true, and is information.
   * @returns {boolean}
   */
  isEnabled()
  {
    return true;
  }

  /**
   * The rows this mode lists.
   *
   * Slots for three of the four. Rewind overrides this to list the generations within one slot, and
   * that single divergence is the reason this is an overridable member rather than something the scene
   * computes once and shares.
   * @returns {SaveFileEntry[]}
   */
  entries()
  {
    // one row per slot the game renders, in slot order, which is the order a player expects to find
    // them in from one visit to the next.
    return Array.from({ length: DataManager.maxSavefiles() }, (unused, index) => SaveFileEntry.forSlot(index + 1));
  }

  /**
   * Determines whether a given row can be chosen in this mode.
   *
   * Everything but saving needs something already on disk to act on. Save is the one command for which
   * an empty row is the whole point.
   * @param {SaveFileEntry} entry The row being considered.
   * @returns {boolean}
   */
  isEntrySelectable(entry)
  {
    return entry.hasSave();
  }

  /**
   * The line a row leads with in this mode.
   *
   * Where you were is the right answer almost everywhere: a save is a place, and a player scanning a
   * list of them is looking for a place they remember. Rewind is the exception, and it is enough of one
   * to be worth the indirection - see its override.
   * @param {SaveFileEntry} entry The row being described.
   * @returns {string}
   */
  leadText(entry)
  {
    return entry.display().mapName;
  }

  /**
   * Determines whether choosing a row here asks the player to confirm first.
   *
   * Defaults to yes. The single exception is loading from the title screen, where confirming asks the
   * player to agree to the thing they opened the menu to do, and where there is no game in memory for
   * the load to cost them.
   * @param {string} _entryMode The origin the scene was opened from.
   * @returns {boolean}
   */
  requiresConfirmation(_entryMode)
  {
    return true;
  }

  /**
   * The question the confirmation window asks about a given row.
   * @param {SaveFileEntry} _entry The row being confirmed.
   * @returns {string}
   */
  confirmText(_entry)
  {
    return String.empty;
  }

  /**
   * Determines whether the confirmation window opens with the cursor on "no".
   *
   * Only for a command that cannot be taken back. Everywhere else, starting on "no" adds a keypress to
   * the thing the player just asked for.
   * @returns {boolean}
   */
  confirmDefaultsToNo()
  {
    return false;
  }

  /**
   * Determines whether succeeding here puts the player back into the world.
   *
   * Loading and rewinding both end with the scene going away and a map coming up, and they share the
   * whole of `Scene_Load`'s success path to get there. Saving and deleting leave the player exactly
   * where they were, looking at a list that now says something different.
   * @returns {boolean}
   */
  resumesGame()
  {
    return false;
  }

  /**
   * Acknowledges this mode having done its thing.
   *
   * On the mode rather than in the scene because the engine's sounds are named for the actions they
   * belong to, and a scene playing the save chime after a deletion would be quietly lying about what
   * just happened.
   */
  playSuccessSound()
  {
    SoundManager.playOk();
  }

  /**
   * Does the thing.
   *
   * Always a promise, even for the modes whose work is synchronous, so the scene has one success path
   * and one failure path rather than a branch on which command it is running.
   * @param {SaveFileEntry} _entry The row chosen.
   * @returns {Promise<*>}
   */
  execute(_entry)
  {
    return Promise.resolve();
  }
}

export default SaveFileMode;
//endregion SaveFileMode