//region SaveError
/**
 * The base of every error the save pipeline throws.
 *
 * Two things separate these from a bare {@link Error}. The first is the path: a savefile is a deep
 * document, and "cannot encode Foo" is useless without knowing which of the eleven hundred nodes was
 * the Foo. Every save error carries the JSON path of the node that failed, written the way a reader
 * would type it - `$.actors._data[3]._j._abs._equippedSkills`.
 *
 * The second is {@link #kind}. The loader steps back through older generations when a newer one
 * fails, and it has to tell *what* failed apart - a missing section file is recoverable by stepping
 * back, an unregistered codec is not, because every generation will have the same problem. That
 * discrimination cannot be a prototype-chain test, which this codebase bans, so the kind is data
 * carried on the error itself.
 */
class SaveError extends Error
{
  /**
   * A short, stable, machine-readable classification of what went wrong.
   * @type {string}
   */
  #kind = String.empty;

  /**
   * The JSON path of the node that failed, from the root of the document being processed.
   * @type {string}
   */
  #path = String.empty;

  /**
   * @param {string} kind The stable classification of the failure.
   * @param {string} path The JSON path of the node that failed.
   * @param {string} summary The human-readable explanation, which should say what to do about it.
   */
  constructor(kind, path, summary)
  {
    // lead the message with the path- it is the first thing anyone reading this at 2am needs.
    super(`[${kind}] at ${path}: ${summary}`);

    // Error subclasses do not get a useful name for free; the class name is what a console prints.
    this.name = 'SaveError';

    this.#kind = kind;

    this.#path = path;
  }

  /**
   * Gets the stable classification of this failure, for callers deciding whether to recover.
   * @returns {string}
   */
  kind()
  {
    return this.#kind;
  }

  /**
   * Gets the JSON path of the node that failed.
   * @returns {string}
   */
  path()
  {
    return this.#path;
  }
}

export default SaveError;
//endregion SaveError