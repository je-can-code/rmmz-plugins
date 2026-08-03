//region SaveFileEntry
import SaveFileSystem from './../managers/SaveFileSystem.js';

/**
 * One row of the files list, whether that row is a whole slot or a single generation within one.
 *
 * Three of the four commands list slots and the fourth lists generations, but a row draws the same way
 * either way - a picture, where you were, who was leading, how long you had played. Modelling both as
 * one thing is what lets a single list window serve every mode instead of branching on which one is
 * active.
 *
 * **Everything drawable is read once, here, off the manifest.** A row must never reach for `$gameParty`
 * or `$gameActors`: the files scene is reachable from the title screen, where a throwaway new game is
 * already standing (`Scene_Boot.startNormalGame` calls `DataManager.setupNewGame`, which calls
 * `createGameObjects`). Reading a live global there would not throw - it would quietly draw the wrong
 * party over the right thumbnail, which is worse.
 *
 * The manifest is captured at construction rather than re-read per frame, so entries are cheap to draw
 * and stale by design: the scene rebuilds them after anything that changes the disk.
 */
class SaveFileEntry
{
  /**
   * The savefile id this row belongs to.
   * @type {number}
   */
  _savefileId = 0;

  /**
   * The slot's directory name, ex: `file1`.
   * @type {string}
   */
  _slotName = String.empty;

  /**
   * The generation this row names, or an empty string when the row is a whole slot.
   * @type {string}
   */
  _generationName = String.empty;

  /**
   * The generation this row's manifest and picture actually came from.
   * @type {string}
   */
  _sourceGenerationName = String.empty;

  /**
   * The manifest describing what this row holds, or null when there is nothing to describe.
   * @type {object|null}
   */
  _manifest = null;

  /**
   * @constructor
   * @param {number} savefileId The savefile id this row belongs to.
   * @param {string} slotName The slot's directory name.
   * @param {string} generationName The generation named, or an empty string for a whole slot.
   * @param {string} sourceGenerationName The generation the manifest and picture came from.
   * @param {object|null} manifest The manifest describing the row, or null when there is none.
   */
  constructor(savefileId, slotName, generationName, sourceGenerationName, manifest)
  {
    this._savefileId = savefileId;
    this._slotName = slotName;
    this._generationName = generationName;
    this._sourceGenerationName = sourceGenerationName;
    this._manifest = manifest;
  }

  /**
   * Builds the row describing a whole slot, as the save, load and delete lists show them.
   *
   * The manifest comes from {@link SaveFileSystem.readableGeneration}, which steps past a generation
   * whose newest write was torn - so a slot that lost its newest save still describes itself with the
   * one the loader would actually open, rather than reading as empty. That is also why the source
   * generation is remembered: the picture has to come from the same place the words did, or a slot in
   * rollback shows a snapshot of a save it can no longer open.
   * @param {number} savefileId The slot's id, one-based.
   * @returns {SaveFileEntry}
   */
  static forSlot(savefileId)
  {
    const slotName = DataManager.makeSavename(savefileId);

    const { generationName, manifest } = SaveFileSystem.readableGeneration(slotName);

    return new SaveFileEntry(savefileId, slotName, String.empty, generationName, manifest);
  }

  /**
   * Builds the row describing one generation within a slot, as the rewind list shows them.
   * @param {number} savefileId The slot's id, one-based.
   * @param {string} generationName The generation's directory name, ex: `gen-0007`.
   * @returns {SaveFileEntry}
   */
  static forGeneration(savefileId, generationName)
  {
    const slotName = DataManager.makeSavename(savefileId);

    const manifest = SaveFileSystem.readManifestQuietly(slotName, generationName);

    return new SaveFileEntry(savefileId, slotName, generationName, generationName, manifest);
  }

  /**
   * Gets the savefile id this row belongs to.
   * @returns {number}
   */
  savefileId()
  {
    return this._savefileId;
  }

  /**
   * Gets the slot's directory name.
   * @returns {string}
   */
  slotName()
  {
    return this._slotName;
  }

  /**
   * Gets the generation this row names, empty when the row describes a whole slot.
   * @returns {string}
   */
  generationName()
  {
    return this._generationName;
  }

  /**
   * Gets the generation this row's manifest and picture came from.
   * @returns {string}
   */
  sourceGenerationName()
  {
    return this._sourceGenerationName;
  }

  /**
   * Gets the manifest describing this row.
   * @returns {object|null} The manifest, or null when this row has nothing in it.
   */
  manifest()
  {
    return this._manifest;
  }

  /**
   * Determines whether this row names one generation rather than a whole slot.
   * @returns {boolean}
   */
  isGeneration()
  {
    return this.generationName() !== String.empty;
  }

  /**
   * Determines whether this row has anything in it worth drawing or loading.
   * @returns {boolean}
   */
  hasSave()
  {
    return this.manifest() !== null;
  }

  /**
   * Gets everything the row draws: map name, leader, level, gold, playtime, timestamp.
   * @returns {object} The display block, or an empty object for a row with nothing in it.
   */
  display()
  {
    // an empty slot draws its number and nothing else, so an empty block is the honest answer.
    if (this.hasSave() === false) return {};

    return this.manifest().display;
  }

  /**
   * Gets when this row's generation was written, as an ISO-8601 timestamp.
   * @returns {string} The timestamp, or an empty string for a row with nothing in it.
   */
  savedAt()
  {
    if (this.hasSave() === false) return String.empty;

    return this.manifest().savedAt;
  }

  /**
   * Gets the playtime this row was written at, in frames.
   * @returns {number} The frame count, or zero for a row with nothing in it.
   */
  playtimeFrames()
  {
    if (this.hasSave() === false) return 0;

    return this.manifest().playtimeFrames;
  }

  /**
   * Determines whether this row has a picture on disk to draw.
   * @returns {boolean}
   */
  hasThumbnail()
  {
    // a row with nothing in it names no generation, so there is nowhere for a picture to be.
    if (this.hasSave() === false) return false;

    return SaveFileSystem.hasThumbnail(this.slotName(), this.sourceGenerationName());
  }

  /**
   * Gets the url this row's picture loads through.
   *
   * A url rather than the path it is built from, because `Bitmap.load` hands its argument to an
   * `<img>` and a Windows path is not something an `<img>` can resolve.
   * @returns {string}
   */
  thumbnailUrl()
  {
    return SaveFileSystem.thumbnailUrl(this.slotName(), this.sourceGenerationName());
  }
}

export default SaveFileEntry;
//endregion SaveFileEntry