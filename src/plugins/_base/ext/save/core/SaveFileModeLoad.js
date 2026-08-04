//region SaveFileModeLoad
import SaveFileMode from './SaveFileMode.js';
import SaveFileEntryMode from './SaveFileEntryMode.js';

/**
 * Opening a slot and resuming the game inside it.
 *
 * The only mode offered from all three origins, and the only one whose confirmation depends on where
 * the player came from - see {@link requiresConfirmation}, which is the single place in this feature
 * where the origin changes behavior rather than availability.
 */
class SaveFileModeLoad
  extends SaveFileMode
{
  /**
   * Implements {@link SaveFileMode.key}.<br/>
   * @returns {string}
   */
  key()
  {
    return 'load';
  }

  /**
   * Implements {@link SaveFileMode.label}.<br/>
   * @returns {string}
   */
  label()
  {
    return 'Load';
  }

  /**
   * Implements {@link SaveFileMode.helpText}.<br/>
   * @returns {string}
   */
  helpText()
  {
    return TextManager.loadMessage;
  }

  /**
   * Overrides {@link SaveFileMode.requiresConfirmation}.<br/>
   * Skips the question at the title screen, and asks it everywhere else.
   *
   * From the title screen, confirming asks the player to agree to the thing they opened the menu to do,
   * and there is no game in memory for the load to cost them. In-game there is: whatever they have done
   * since their last save goes away, and that is worth one keypress.
   * @param {string} entryMode The origin the scene was opened from.
   * @returns {boolean}
   */
  requiresConfirmation(entryMode)
  {
    return entryMode !== SaveFileEntryMode.Title;
  }

  /**
   * Implements {@link SaveFileMode.confirmText}.<br/>
   * Names the cost rather than the action, since the action is the part the player already knows.
   * @param {SaveFileEntry} entry The row being confirmed.
   * @returns {string}
   */
  confirmText(entry)
  {
    return `Load slot ${entry.savefileId()}?`;
  }

  /**
   * Implements {@link SaveFileMode.confirmDetail}.<br/>
   * @param {SaveFileEntry} _entry The row being asked about.
   * @returns {string}
   */
  confirmDetail(_entry)
  {
    return 'Anything since your last save will be lost.';
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
   * @returns {void}
   */
  playSuccessSound()
  {
    SoundManager.playLoad();
  }

  /**
   * Implements {@link SaveFileMode.execute}.<br/>
   * @param {SaveFileEntry} entry The row chosen.
   * @returns {Promise<void>}
   */
  execute(entry)
  {
    return DataManager.loadGame(entry.savefileId());
  }
}

export default SaveFileModeLoad;
//endregion SaveFileModeLoad