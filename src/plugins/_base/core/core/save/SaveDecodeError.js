//region SaveDecodeError
import SaveError from './SaveError.js';

/**
 * Thrown while rebuilding live objects out of the plain data a savefile holds.
 *
 * Every case here means the file and the code disagree about what a node is, and none of them is
 * safely recoverable by guessing: a node whose type cannot be resolved would have to come back as a
 * plain object, and a plain object standing in for a `Game_Actor` fails later, somewhere else,
 * without any trace of where it came from. The loader steps back to an older generation instead, and
 * these errors are what tell it to.
 */
class SaveDecodeError extends SaveError
{
  /**
   * Builds the error for a type tag naming a codec that is not registered.
   *
   * Usually this means a plugin that wrote the save is no longer installed, or a class was renamed
   * without listing its old id in `aliases` - which is exactly what `aliases` is for.
   * @param {string} path The JSON path of the offending node.
   * @param {string} id The unresolvable save id.
   * @returns {SaveDecodeError}
   */
  static unknownSaveId(path, id)
  {
    return new SaveDecodeError(
      'save-decode-unknown-id',
      path,
      `no codec is registered under the save id '${id}'. Either the plugin that wrote it is no `
      + `longer installed, or the class was renamed without adding aliases: [ '${id}' ].`);
  }

  /**
   * Builds the error for a node whose own tag contradicts the type map that expected it.
   *
   * The tag is redundant with the type map by design, and this is the integrity check that
   * redundancy buys: the two disagreeing means the file was written by different code than is
   * reading it, and continuing would put the wrong prototype on a live object.
   * @param {string} path The JSON path of the offending node.
   * @param {string} expectedId The save id the containing type map declared.
   * @param {string} actualId The save id the node's own tag carries.
   * @returns {SaveDecodeError}
   */
  static typeMismatch(path, expectedId, actualId)
  {
    return new SaveDecodeError(
      'save-decode-type-mismatch',
      path,
      `the type map expects '${expectedId}' here but the file says '${actualId}'. The save was `
      + 'written by different code than is reading it; check for a renamed or re-pointed field.');
  }

  /**
   * Builds the error for an untagged node at a position whose declared constructor has no codec.
   *
   * This is the tags-stripped path: with no tag to fall back on, an unregistered declared type
   * leaves nothing to rebuild from at all.
   * @param {string} path The JSON path of the offending node.
   * @param {string} typeName The name of the declared constructor.
   * @returns {SaveDecodeError}
   */
  static unregisteredDeclaredType(path, typeName)
  {
    return new SaveDecodeError(
      'save-decode-unregistered-declared-type',
      path,
      `the type map declares '${typeName}' here, but no codec is registered for it. `
      + `Register it with SerializableRegistry.register(${typeName}).`);
  }

  /**
   * @param {string} kind The stable classification of the failure.
   * @param {string} path The JSON path of the node that failed.
   * @param {string} summary The human-readable explanation.
   */
  constructor(kind, path, summary)
  {
    // perform original logic.
    super(kind, path, summary);

    this.name = 'SaveDecodeError';
  }
}

export default SaveDecodeError;
//endregion SaveDecodeError