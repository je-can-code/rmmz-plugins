//region SaveStorageError
import SaveError from './SaveError.js';

/**
 * Thrown while reading or writing the files a slot is made of.
 *
 * These are the failures that have nothing to do with what the document *means*: a pointer naming a
 * generation that is not there, a manifest that will not parse, a section the manifest promised and
 * the directory does not hold, a disk that refused a write. The loader treats most of them as a
 * reason to step back to an older generation, which is exactly why they carry a `kind` - see
 * {@link SaveError}.
 *
 * The path on a storage error is a file path rather than a JSON path, because that is the thing a
 * reader would go look at.
 */
class SaveStorageError extends SaveError
{
  /**
   * Builds the error for a slot with no generations at all.
   *
   * This is the "no such savefile" case, and it is normal: an empty slot in the load menu reaches it
   * every time the player looks at one.
   * @param {string} slotPath The directory the slot would live in.
   * @returns {SaveStorageError}
   */
  static noGenerations(slotPath)
  {
    return new SaveStorageError(
      'save-storage-no-generations',
      slotPath,
      'the slot holds no generations, so there is nothing to load.');
  }

  /**
   * Builds the error for a generation missing a file its manifest promised.
   * @param {string} filePath The path of the absent file.
   * @returns {SaveStorageError}
   */
  static missingSection(filePath)
  {
    return new SaveStorageError(
      'save-storage-missing-section',
      filePath,
      'the manifest lists this section but the file is not there. The generation is incomplete, '
      + 'which is what a torn write looks like.');
  }

  /**
   * Builds the error for a file that is present but is not valid JSON.
   * @param {string} filePath The path of the unreadable file.
   * @param {string} reason Whatever `JSON.parse` said about it.
   * @returns {SaveStorageError}
   */
  static malformedSection(filePath, reason)
  {
    return new SaveStorageError(
      'save-storage-malformed-section',
      filePath,
      `the file is present but did not parse as JSON: ${reason}`);
  }

  /**
   * Builds the error for a generation written by a schema version this code does not understand.
   * @param {string} filePath The path of the manifest carrying the version.
   * @param {number} found The schema version the file claims.
   * @param {number} supported The schema version this code writes.
   * @returns {SaveStorageError}
   */
  static unsupportedSchemaVersion(filePath, found, supported)
  {
    return new SaveStorageError(
      'save-storage-unsupported-schema-version',
      filePath,
      `the generation was written at schema version ${found}, and this build understands `
      + `${supported}. A migration is needed before it can be read.`);
  }

  /**
   * Builds the error for a slot where every generation failed, naming what was wrong with each.
   *
   * This is the end of the line for a load: stepping back further is not possible, so the message
   * has to carry the whole story rather than only the last thing that went wrong.
   * @param {string} slotPath The directory the slot lives in.
   * @param {string[]} failures One line per generation tried, newest first.
   * @returns {SaveStorageError}
   */
  static noLoadableGeneration(slotPath, failures)
  {
    return new SaveStorageError(
      'save-storage-no-loadable-generation',
      slotPath,
      `every generation failed to load. Newest first:\n  ${failures.join('\n  ')}`);
  }

  /**
   * Builds the error for a write the filesystem refused.
   *
   * A full, locked, or permission-denied disk is real on Windows and is more likely now that a slot
   * is a directory of files rather than one. The pointer is deliberately left alone when this
   * happens, so the previous generation stays live and the player loses nothing but the new save.
   * @param {string} filePath The path being written when it failed.
   * @param {string} reason Whatever the filesystem said.
   * @returns {SaveStorageError}
   */
  static writeFailed(filePath, reason)
  {
    return new SaveStorageError(
      'save-storage-write-failed',
      filePath,
      `the filesystem refused the write: ${reason}. The previous generation is untouched and is `
      + 'still the live one.');
  }

  /**
   * @param {string} kind The stable classification of the failure.
   * @param {string} path The file path that failed.
   * @param {string} summary The human-readable explanation.
   */
  constructor(kind, path, summary)
  {
    // perform original logic.
    super(kind, path, summary);

    this.name = 'SaveStorageError';
  }
}

export default SaveStorageError;
//endregion SaveStorageError