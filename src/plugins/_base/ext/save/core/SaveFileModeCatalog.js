//region SaveFileModeCatalog
import SaveFileModeSave from './SaveFileModeSave.js';
import SaveFileModeLoad from './SaveFileModeLoad.js';
import SaveFileModeDelete from './SaveFileModeDelete.js';
import SaveFileModeRewind from './SaveFileModeRewind.js';

/**
 * The four things selecting a row can mean, and the order they are offered in.
 *
 * A catalog rather than a static on {@link SaveFileMode} because the base cannot import its own
 * subclasses without a cycle, and rather than a list built inline in the command window because the
 * scene needs the same lookup to run whatever the player chose. One place that knows the roster; two
 * consumers that do not have to.
 *
 * Order is deliberate and not alphabetical: the commands run from most-used to least, and Delete sits
 * last because it is the destructive one and the cursor should not pass through it on the way to
 * anything else.
 */
class SaveFileModeCatalog
{
  /**
   * Builds one instance of every mode.
   *
   * Modes hold no state - they answer questions about entries handed to them - so a caller is free to
   * build its own set rather than share one. Nothing here is a singleton on purpose.
   * @returns {SaveFileMode[]}
   */
  static all()
  {
    return [
      new SaveFileModeSave(),
      new SaveFileModeLoad(),
      new SaveFileModeRewind(),
      new SaveFileModeDelete(),
    ];
  }

  /**
   * Finds the mode a given command symbol names.
   * @param {string} key The command's key, ex: `rewind`.
   * @returns {SaveFileMode|null} The mode, or null for a symbol no mode claims - such as `back`.
   */
  static byKey(key)
  {
    return SaveFileModeCatalog.all()
      .find(mode => mode.key() === key) ?? null;
  }
}

export default SaveFileModeCatalog;
//endregion SaveFileModeCatalog