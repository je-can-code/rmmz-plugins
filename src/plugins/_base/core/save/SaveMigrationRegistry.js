//region SaveMigrationRegistry
import SaveManifest from './SaveManifest.js';

/**
 * The chain of transformations that carries a slot written at an older schema version forward to the
 * one this build reads.
 *
 * **Why this exists before there is anything for it to do.** A migration cannot be retrofitted onto a
 * version that shipped without a stamp: if a build writes saves and has no notion of versioning, the
 * next build has no way to tell what shape it is looking at, and the only honest options are "guess"
 * or "refuse". The stamp and the seam therefore ship together, empty, and the first real migration
 * drops into a mechanism that already works.
 *
 * Everything about a migration is deliberately narrow:
 *
 * - **It runs on plain data, before the decoder.** A migration is handed the parsed JSON of every
 *   section plus the manifest, and hands back the same shape. It never sees an instance, because by
 *   the time instances exist the seeds have run and the type maps have been consulted - both of which
 *   describe the *current* schema, and neither of which can be told to pretend otherwise. Rewriting
 *   the document first means everything downstream sees a generation indistinguishable from one this
 *   build wrote itself.
 * - **It moves exactly one version.** Registered against the version it reads, producing the next.
 *   Composing two small steps is something the loader can do; splitting a large one apart later is
 *   not.
 * - **It is pure.** No globals, no filesystem, no `$data*`. A migration written a year from now is
 *   verified by running it against a committed fixture of the old document shape, which only works if
 *   the function's whole world arrives in its argument.
 *
 * The version stamp is applied by this registry rather than by each migration, so a step cannot
 * forget to advance it - which also means the chain can never spin without making progress.
 */
class SaveMigrationRegistry
{
  /**
   * The registered steps, keyed by the schema version each one reads.
   * @type {Map<number, Function>}
   */
  static _migrations = new Map();

  /**
   * Gets the registered migration steps, keyed by the version each one reads.
   * @returns {Map<number, Function>} The migrations.
   */
  static migrations()
  {
    // hand back the migrations.
    return this._migrations;
  }

  /**
   * Registers the step that carries a document from one schema version to the next.
   *
   * The function receives `{ manifest, sections }` as plain data and returns the same shape. It must
   * not stamp the new version itself; this registry does that, so a step that forgets cannot exist.
   * @param {number} fromVersion The schema version this step reads.
   * @param {Function} migrate Receives `{ manifest, sections }`, returns the next version's document.
   */
  static register(fromVersion, migrate)
  {
    // two steps claiming the same version is a genuine conflict: the chain would silently take
    // whichever plugin loaded last, and every save older than that version would be transformed by
    // code its author never intended to run.
    if (this.migrations()
      .has(fromVersion))
    {
      throw new Error(
        `a save migration from schema version ${fromVersion} is already registered. `
        + 'Each version may be read by exactly one step.');
    }

    this.migrations()
      .set(fromVersion, migrate);
  }

  /**
   * Determines whether an unbroken chain of steps leads from a version to the one this build reads.
   *
   * Asked before a generation is read rather than during, so the load menu can show a slot it will
   * be able to open and the loader can step past one it cannot.
   * @param {number} fromVersion The schema version the generation claims.
   * @returns {boolean} True when every intermediate step exists.
   */
  static hasPathToCurrent(fromVersion)
  {
    // a version newer than this build's is not a migration problem and never will be - migrations
    // only ever run forward. this is an older build being handed a save from a newer one.
    if (fromVersion > SaveManifest.schemaVersion) return false;

    let version = fromVersion;

    // keep looping while the document is still behind the version this build reads.
    while (version < SaveManifest.schemaVersion)
    {
      if (this.migrations()
        .has(version) === false)
      {
        return false;
      }

      version += 1;
    }

    return true;
  }

  /**
   * Names the first version in a chain that has no step, for an error message that says what to fix.
   * @param {number} fromVersion The schema version the generation claims.
   * @returns {number} The version whose step is missing, or `0` when the chain is complete.
   */
  static firstMissingStep(fromVersion)
  {
    let version = fromVersion;

    // keep looping while the document is still behind the version this build reads.
    while (version < SaveManifest.schemaVersion)
    {
      if (this.migrations()
        .has(version) === false)
      {
        return version;
      }

      version += 1;
    }

    return 0;
  }

  /**
   * Runs the chain over a document until it reads at this build's schema version.
   *
   * A document already at the current version passes through untouched, which is the overwhelmingly
   * common case and costs one comparison.
   * @param {{manifest: object, sections: Object<string, object>}} document The parsed generation.
   * @returns {{manifest: object, sections: Object<string, object>}} The document, brought forward.
   */
  static apply(document)
  {
    let current = document;

    // keep looping while the document is still behind the version this build reads.
    while (current.manifest.schemaVersion < SaveManifest.schemaVersion)
    {
      const fromVersion = current.manifest.schemaVersion;

      const migrate = this.migrations()
        .get(fromVersion);

      current = migrate(current);

      // the registry owns the stamp so the loop always advances and no step has to remember.
      current.manifest.schemaVersion = fromVersion + 1;
    }

    return current;
  }

  /**
   * Empties the chain.
   *
   * Registration happens once at load, at module scope, which leaves a test suite no way to arrange
   * a chain of its own without this. It exists for that and is not called by the running game.
   */
  static reset()
  {
    this.migrations()
      .clear();
  }
}

export default SaveMigrationRegistry;
//endregion SaveMigrationRegistry