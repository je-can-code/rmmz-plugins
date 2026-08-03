//region SaveFileModeSave
import SaveFileMode from './SaveFileMode.js';

/**
 * Writing the running game into a slot.
 *
 * The only mode for which an empty row is the point rather than a dead end, and the only one that
 * leaves the player exactly where they were when it succeeds. Vanilla pops the scene after a save; this
 * deliberately does not, because the player is standing on a save platform and may well want to look at
 * something else while they are here.
 */
class SaveFileModeSave
  extends SaveFileMode
{
  /**
   * Implements {@link SaveFileMode.key}.<br/>
   * @returns {string}
   */
  key()
  {
    return 'save';
  }

  /**
   * Implements {@link SaveFileMode.label}.<br/>
   * Uses the engine's own term, since saving is a thing the database already has a word for.
   * @returns {string}
   */
  label()
  {
    return TextManager.save;
  }

  /**
   * Implements {@link SaveFileMode.helpText}.<br/>
   * @returns {string}
   */
  helpText()
  {
    return TextManager.saveMessage;
  }

  /**
   * Overrides {@link SaveFileMode.isEntrySelectable}.<br/>
   * Every row can be saved to, because an empty slot is exactly where a first save goes.
   * @param {SaveFileEntry} _entry The row being considered.
   * @returns {boolean}
   */
  isEntrySelectable(_entry)
  {
    return true;
  }

  /**
   * Implements {@link SaveFileMode.confirmText}.<br/>
   * Names overwriting explicitly, because that is the one outcome a player might not have intended.
   * @param {SaveFileEntry} entry The row being confirmed.
   * @returns {string}
   */
  confirmText(entry)
  {
    if (entry.hasSave()) return `Overwrite the save in slot ${entry.savefileId()}?`;

    return `Save to slot ${entry.savefileId()}?`;
  }

  /**
   * Overrides {@link SaveFileMode.playSuccessSound}.<br/>
   * @returns {void}
   */
  playSuccessSound()
  {
    SoundManager.playSave();
  }

  /**
   * Implements {@link SaveFileMode.execute}.<br/>
   * Follows vanilla's own save sequence, which several plugins hang state-flushing off.
   * @param {SaveFileEntry} entry The row chosen.
   * @returns {Promise<*>}
   */
  execute(entry)
  {
    // the slot being written becomes the slot this playthrough belongs to, which is what rewinding
    // later reads to know whose history it is walking.
    $gameSystem.setSavefileId(entry.savefileId());

    // a great deal of plugin state is flushed into its owners here, so it must happen before the
    // contents are gathered rather than after.
    $gameSystem.onBeforeSave();

    return DataManager.saveGame(entry.savefileId());
  }
}

export default SaveFileModeSave;
//endregion SaveFileModeSave