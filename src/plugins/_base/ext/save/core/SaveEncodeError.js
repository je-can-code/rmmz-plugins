//region SaveEncodeError
import SaveError from './SaveError.js';

/**
 * Thrown while turning the live object graph into plain data, when the graph contains something the
 * codec declarations do not describe.
 *
 * Both cases this covers are **declaration bugs, caught at save time**, and that is deliberate. The
 * alternative to throwing is writing a file that decodes into something subtly wrong - an object with
 * no prototype, a field that comes back as a plain `{}` - and discovering it hours later in testplay
 * as a missing method. Failing at the moment of the omission puts the error in front of the person
 * who created it, holding the exact path of the field they forgot.
 */
class SaveEncodeError extends SaveError
{
  /**
   * Builds the error for a class instance that no codec claims.
   *
   * The fix is a `SerializableRegistry.register` call for that class, not a change to the encoder.
   * @param {string} path The JSON path of the offending node.
   * @param {string} typeName The name of the unregistered constructor.
   * @returns {SaveEncodeError}
   */
  static unregisteredType(path, typeName)
  {
    return new SaveEncodeError(
      'save-encode-unregistered',
      path,
      `no codec is registered for '${typeName}'. Register it with SerializableRegistry.register(${typeName}).`);
  }

  /**
   * Builds the error for a field holding a class instance that its owner's type map never declared.
   *
   * The fix is a `typed` entry on the owning codec naming that field and its constructor - the point
   * of the check is that every typed field gets classified deliberately by whoever added it.
   * @param {string} path The JSON path of the offending field.
   * @param {string} ownerId The save id of the codec that should have declared it.
   * @param {string} field The name of the undeclared field.
   * @param {string} typeName The name of the constructor the field holds.
   * @returns {SaveEncodeError}
   */
  static undeclaredTypedField(path, ownerId, field, typeName)
  {
    return new SaveEncodeError(
      'save-encode-undeclared-typed-field',
      path,
      `'${field}' holds a ${typeName}, which the codec for '${ownerId}' does not declare. `
      + `Add it: typed: { ${field}: ${typeName} }.`);
  }

  /**
   * Builds the error for a graph that descends further than the encoder is willing to follow.
   *
   * In practice this means a reference cycle: the walk has no cycle detection, deliberately, because
   * the shapes it encodes are trees. A depth ceiling turns an unreadable stack overflow into a path.
   * @param {string} path The JSON path at which the ceiling was reached.
   * @param {number} maxDepth The ceiling that was exceeded.
   * @returns {SaveEncodeError}
   */
  static tooDeep(path, maxDepth)
  {
    return new SaveEncodeError(
      'save-encode-too-deep',
      path,
      `the object graph is deeper than ${maxDepth} levels, which almost always means a reference `
      + 'cycle. Find the field on this path that points back up the graph.');
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

    this.name = 'SaveEncodeError';
  }
}

export default SaveEncodeError;
//endregion SaveEncodeError