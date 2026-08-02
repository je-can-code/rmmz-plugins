//region SaveManifest

/**
 * The index of one generation: what it holds, when it was written, and enough about the playthrough
 * to draw a row in the load menu.
 *
 * Two jobs, and both of them are about not decoding a world you do not need:
 *
 * - **`sections` makes a torn write detectable.** A generation is a directory of files, and the only
 *   way to know a crash did not land in the middle of it is for one file to say what the complete
 *   set was. The manifest is written last for exactly this reason.
 * - **`display` makes the load menu cheap.** Vanilla keeps a parallel `global.rmmzsave` holding one
 *   summary per slot, which can and does drift from the slots it describes. Here the summary lives
 *   *inside* the generation it summarizes, so it cannot describe a save that is not there.
 *
 * `display` is deliberately a superset of what vanilla's `DataManager.makeSavefileInfo` produces -
 * `title`, `characters`, `faces`, `playtime`, `timestamp` - because {@link Window_SavefileList} reads
 * those by name and is not being rewritten here. Everything past them is ours.
 *
 * The manifest is read as **plain data**, not decoded: the load menu wants five fields off a small
 * JSON document, and running the decoder over it to hand back an instance would buy nothing.
 */
class SaveManifest
{
  /**
   * The schema version this build writes, and the only one it can read without a migration.
   *
   * Phase 5 turns this into a chain of migrations. Until it does, a mismatch is a hard failure, which
   * is the correct behavior while saves are still disposable and the wrong one the day a player
   * exists - see the versioning phase of the save rewrite plan.
   * @type {number}
   */
  static schemaVersion = 1;

  /**
   * The schema version this generation was written at.
   * @type {number}
   */
  schemaVersion = SaveManifest.schemaVersion;

  /**
   * When the generation was written, as an ISO-8601 timestamp.
   * @type {string}
   */
  savedAt = String.empty;

  /**
   * The playtime at the moment of writing, in frames.
   * @type {number}
   */
  playtimeFrames = 0;

  /**
   * The playthrough this generation belongs to.
   *
   * A slot is a folder, and a folder is not a playthrough. Saving a new game over an old slot leaves
   * both games' generations sitting side by side, so a rollback that only counted backwards could
   * land in a game the player has no relationship to. Every generation records whose it is, and the
   * loader steps back only through generations that answer with the same id.
   *
   * Empty when the generation predates this field, which reads as "unknown" rather than "nobody".
   * @type {string}
   */
  playthroughId = String.empty;

  /**
   * The file name of every section this generation is made of, manifest excluded.
   * @type {string[]}
   */
  sections = [];

  /**
   * Everything the load menu draws, so it never has to open a world.
   * @type {object}
   */
  display = {};

  /**
   * Builds the manifest for a generation about to be written.
   * @param {string[]} sections The file name of every section in the generation, manifest excluded.
   * @param {object} display Everything the load menu needs to draw this slot.
   * @param {number} playtimeFrames The playtime at the moment of writing, in frames.
   * @param {string} playthroughId The playthrough this generation belongs to.
   * @returns {SaveManifest}
   */
  static create(sections, display, playtimeFrames, playthroughId)
  {
    const manifest = new SaveManifest();

    manifest.schemaVersion = SaveManifest.schemaVersion;

    // the clock is read once here rather than by the writer, so every file in one generation agrees.
    manifest.savedAt = new Date().toISOString();

    manifest.playtimeFrames = playtimeFrames;

    manifest.playthroughId = playthroughId;

    manifest.sections = sections;

    manifest.display = display;

    return manifest;
  }

  /**
   * Determines whether a manifest read off disk was written at a version this build can read.
   * @param {number} schemaVersion The version the file claims.
   * @returns {boolean}
   */
  static supportsSchemaVersion(schemaVersion)
  {
    return schemaVersion === SaveManifest.schemaVersion;
  }
}

/**
 * Registered because the manifest is written through the encoder like everything else, which keeps
 * one path to disk rather than two. The read side skips the decoder on purpose; see the class
 * summary.
 */
SerializableRegistry.register(SaveManifest, {
  id: 'save-manifest',
  aliases: [ 'SaveManifest' ],
  seed: instance => Object.assign(instance, new SaveManifest()),
});

export default SaveManifest;
//endregion SaveManifest