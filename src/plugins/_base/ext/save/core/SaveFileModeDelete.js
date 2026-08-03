//region SaveFileModeDelete
import SaveFileMode from './SaveFileMode.js';

/**
 * Destroying a slot and every generation inside it.
 *
 * The one irreversible command in this scene, and the reason it is offered only from the title screen.
 * Nobody sets out to destroy a file while standing in a dungeon, and arriving with nothing loaded means
 * deleting can never interact with the game currently in memory - which removes a whole category of
 * question about what happens if you delete the slot you are playing.
 *
 * It takes the whole slot, pointer first. Deleting a single generation would be a way to make a slot's
 * history lie about itself for no benefit anybody asked for.
 */
class SaveFileModeDelete
  extends SaveFileMode
{
  /**
   * Implements {@link SaveFileMode.key}.<br/>
   * @returns {string}
   */
  key()
  {
    return 'delete';
  }

  /**
   * Implements {@link SaveFileMode.label}.<br/>
   * @returns {string}
   */
  label()
  {
    return 'Delete';
  }

  /**
   * Implements {@link SaveFileMode.helpText}.<br/>
   * @returns {string}
   */
  helpText()
  {
    return 'Which file would you like to delete? This cannot be undone.';
  }

  /**
   * Implements {@link SaveFileMode.confirmText}.<br/>
   * Says permanent out loud, because every other command in this scene is recoverable and this one is
   * not - including Rewind, which players may reasonably assume this resembles.
   * @param {SaveFileEntry} entry The row being confirmed.
   * @returns {string}
   */
  confirmText(entry)
  {
    return `Permanently delete slot ${entry.savefileId()}?`;
  }

  /**
   * Implements {@link SaveFileMode.confirmDetail}.<br/>
   * @param {SaveFileEntry} _entry The row being asked about.
   * @returns {string}
   */
  confirmDetail(_entry)
  {
    return 'This cannot be undone.';
  }

  /**
   * Overrides {@link SaveFileMode.confirmDefaultsToNo}.<br/>
   * The only command here that cannot be undone is the only one that opens on the safe answer.
   * @returns {boolean}
   */
  confirmDefaultsToNo()
  {
    return true;
  }

  /**
   * Implements {@link SaveFileMode.execute}.<br/>
   * Removes the slot, then rebuilds the index the title screen reads.
   *
   * `DataManager._globalInfo` is an in-memory array built once when the load menu opens, so deleting a
   * slot leaves it describing a save that is no longer there. That matters immediately and visibly:
   * the title screen's Continue command is enabled from `isAnySavefileExists`, which reads that array -
   * so deleting the last remaining save without rebuilding it leaves Continue lit up and pointing at
   * nothing.
   * @param {SaveFileEntry} entry The row chosen.
   * @returns {Promise<*>}
   */
  execute(entry)
  {
    StorageManager.remove(entry.slotName());

    DataManager.loadGlobalInfo();

    return Promise.resolve();
  }
}

export default SaveFileModeDelete;
//endregion SaveFileModeDelete