//region StorageManager
import SaveFileSystem from './SaveFileSystem.js';
import SaveSectionRouter from './../core/save/SaveSectionRouter.js';
import SaveManifest from './../core/save/SaveManifest.js';
import SaveEncoder from './../core/save/SaveEncoder.js';
import SaveDecoder from './../core/save/SaveDecoder.js';

/**
 * The save pipeline, replaced end to end.
 *
 * Vanilla's pipeline is `JsonEx.stringify` into `pako.deflate` into one `.rmmzsave` file, and back.
 * This one encodes through per-type codecs, writes pretty-printed JSON into a directory of sections,
 * and swaps a pointer to make the result live. What the engine calls is unchanged - `saveObject`,
 * `loadObject`, `exists`, `remove` - so `DataManager` and `ConfigManager` keep their shape and the
 * scenes above them notice nothing.
 *
 * **The `localforage` branch is gone rather than abstracted.** `Utils.isLocalMode()` is always true
 * here: this is an NW.js project, external file loading does not work in a browser context, and a
 * second storage backend nobody can reach is a second thing to keep correct. Do not reintroduce it
 * "just in case".
 *
 * **The `pako` branch is gone too.** A savefile being readable by a human is the point of the
 * rewrite, and compression is the one thing that cannot coexist with it. Size is explicitly a
 * non-goal; see the save rewrite plan.
 *
 * Two shapes of thing get saved, and they are told apart by name rather than by a flag:
 *
 * - a **slot** - `file1`, `file2` - is a playthrough, and is written as a generation directory.
 * - a **document** - `config` - is smaller than a slot and has no history worth keeping, so it is
 *   one pretty-printed file swapped atomically into place.
 */

//region filesystem primitives
/**
 * Determines whether a path exists at all, file or directory.
 * @param {string} path The path to test.
 * @returns {boolean}
 */
StorageManager.fsExists = function(path)
{
  const fs = require('fs');

  return fs.existsSync(path);
};

/**
 * Determines whether a path is a directory.
 * @param {string} path The path to test.
 * @returns {boolean}
 */
StorageManager.fsIsDirectory = function(path)
{
  const fs = require('fs');

  return fs.statSync(path)
    .isDirectory();
};

/**
 * Creates a directory and every missing directory above it.
 *
 * The engine's own `fsMkdir` is one level deep, which was enough when every save was a file in one
 * flat directory. A slot is now `save/file1/gen-0007/systems/`, so the recursive form is what this
 * needs.
 * @param {string} path The directory to create.
 */
StorageManager.fsMkdirRecursive = function(path)
{
  const fs = require('fs');

  if (!fs.existsSync(path))
  {
    fs.mkdirSync(path, { recursive: true });
  }
};

/**
 * Lists the entries of a directory.
 * @param {string} path The directory to list.
 * @returns {string[]} The entry names, without their directory.
 */
StorageManager.fsReaddir = function(path)
{
  const fs = require('fs');

  return fs.readdirSync(path);
};

/**
 * Writes a file and does not return until the bytes have reached the disk.
 *
 * `writeFileSync` hands the write to the operating system and returns; a power loss in the window
 * that opens leaves a file that exists and is empty. The explicit fsync closes it, which a save
 * system that promises "it always works" cannot do without.
 * @param {string} path The file to write.
 * @param {string} contents The text to write.
 */
StorageManager.fsWriteFileSynced = function(path, contents)
{
  const fs = require('fs');

  const descriptor = fs.openSync(path, 'w');

  try
  {
    fs.writeSync(descriptor, contents);
    fs.fsyncSync(descriptor);
  }
  finally
  {
    // the descriptor closes whether or not the write worked; leaking one on every failed save would
    // eventually take the process down for a reason that looks nothing like the cause.
    fs.closeSync(descriptor);
  }
};

/**
 * Flushes a directory's own entries to disk, best-effort.
 *
 * Syncing the *files* makes their contents durable; syncing the *directory* is what makes the fact
 * that they exist durable. Both matter for a generation, because a crash could otherwise leave a
 * directory the filesystem has not finished admitting the files into.
 *
 * It is best-effort because Windows refuses to open a directory as a file at all, and CA ships on
 * Windows. Losing this step costs a little durability on one platform; treating it as fatal would
 * cost every save on that platform. The pointer rename is what carries atomicity regardless.
 * @param {string} path The directory to flush.
 */
StorageManager.fsSyncDirectory = function(path)
{
  const fs = require('fs');

  try
  {
    const descriptor = fs.openSync(path, 'r');

    try
    {
      fs.fsyncSync(descriptor);
    }
    finally
    {
      fs.closeSync(descriptor);
    }
  }
  catch
  {
    // a platform that will not let a directory be opened is a platform that does not get this
    // guarantee. it is not a reason to fail the save.
  }
};

/**
 * Deletes a directory and everything inside it.
 * @param {string} path The directory to delete.
 */
StorageManager.fsRemoveDirectory = function(path)
{
  const fs = require('fs');

  if (fs.existsSync(path))
  {
    fs.rmSync(path, { recursive: true, force: true });
  }
};
//endregion filesystem primitives

//region the pipeline
/**
 * Determines whether a save name refers to a playthrough slot rather than a scope-level document.
 *
 * `DataManager.makeSavename` builds these as `file` followed by the slot number, and that shape is
 * the whole test. Anything else - `config` today, `profile` tomorrow - is a document.
 * @param {string} saveName The name the engine asked for.
 * @returns {boolean}
 */
StorageManager.isSlotName = function(saveName)
{
  return /^file\d+$/.test(saveName);
};

/**
 * Gets the file name a scope-level document is written as.
 * @param {string} saveName The name the engine asked for, ex: `config`.
 * @returns {string}
 */
StorageManager.documentFileName = function(saveName)
{
  return `${saveName}.json`;
};

/**
 * Overwrites {@link StorageManager.saveObject}.<br/>
 * Writes through the codec pipeline instead of `JsonEx` and `pako`.
 * @param {string} saveName The name to save under.
 * @param {object} object The live object graph to persist.
 * @returns {Promise<void>}
 */
StorageManager.saveObject = function(saveName, object)
{
  if (this.isSlotName(saveName)) return this.saveSlot(saveName, object);

  return this.saveDocument(saveName, object);
};

/**
 * Overwrites {@link StorageManager.loadObject}.<br/>
 * Reads through the codec pipeline instead of `pako` and `JsonEx`.
 * @param {string} saveName The name to load.
 * @returns {Promise<object|null>}
 */
StorageManager.loadObject = function(saveName)
{
  if (this.isSlotName(saveName)) return this.loadSlot(saveName);

  return this.loadDocument(saveName);
};

/**
 * Writes one playthrough slot as a new generation.
 * @param {string} saveName The slot's name.
 * @param {object} contents The save contents, as `DataManager.makeSaveContents` builds them.
 * @returns {Promise<void>}
 */
StorageManager.saveSlot = function(saveName, contents)
{
  const sections = SaveSectionRouter.toSections(contents);

  // the manifest names every section so that a generation missing one is detectable before anything
  // is decoded, and carries the display block so the load menu never opens a world to draw a row.
  const manifest = SaveManifest.create(
    Object.keys(sections),
    DataManager.makeSavefileInfo(),
    Graphics.frameCount);

  return SaveFileSystem.writeSlot(saveName, sections, SaveEncoder.encode(manifest, '$.manifest'));
};

/**
 * Reads one playthrough slot, falling back through older generations as needed.
 * @param {string} saveName The slot's name.
 * @returns {Promise<object>} The save contents, ready for `DataManager.extractSaveContents`.
 */
StorageManager.loadSlot = function(saveName)
{
  // the router runs inside the read rather than after it, so a generation that parses as JSON but
  // fails to decode falls back to the previous one exactly like a truncated one does.
  return SaveFileSystem.readSlot(saveName, sections => SaveSectionRouter.fromSections(sections));
};

/**
 * Writes one scope-level document.
 * @param {string} saveName The document's name, ex: `config`.
 * @param {object} object The data to persist.
 * @returns {Promise<void>}
 */
StorageManager.saveDocument = function(saveName, object)
{
  return SaveFileSystem.writeDocument(this.documentFileName(saveName), SaveEncoder.encode(object, `$.${saveName}`));
};

/**
 * Reads one scope-level document.
 * @param {string} saveName The document's name.
 * @returns {Promise<object|null>} The data, or null on a fresh install where the file is absent.
 */
StorageManager.loadDocument = function(saveName)
{
  return SaveFileSystem.readDocument(this.documentFileName(saveName))
    .then(data =>
    {
      // a missing document is the normal shape of a fresh install, and every caller of this already
      // has a "no settings yet" path. handing back null lets them use it.
      if (data === null) return null;

      return SaveDecoder.decode(data, null, `$.${saveName}`);
    });
};

/**
 * Overwrites {@link StorageManager.exists}.<br/>
 * @param {string} saveName The name to test.
 * @returns {boolean}
 */
StorageManager.exists = function(saveName)
{
  if (this.isSlotName(saveName)) return SaveFileSystem.slotExists(saveName);

  return this.fsExists(SaveFileSystem.documentPath(this.documentFileName(saveName)));
};

/**
 * Overwrites {@link StorageManager.remove}.<br/>
 * @param {string} saveName The name to delete.
 */
StorageManager.remove = function(saveName)
{
  if (this.isSlotName(saveName))
  {
    SaveFileSystem.removeSlot(saveName);

    return;
  }

  this.fsUnlink(SaveFileSystem.documentPath(this.documentFileName(saveName)));
};

/**
 * Overwrites {@link StorageManager.filePath}.<br/>
 * Answers with the slot directory or the document file, whichever the name refers to.
 * @param {string} saveName The name to resolve.
 * @returns {string}
 */
StorageManager.filePath = function(saveName)
{
  if (this.isSlotName(saveName)) return SaveFileSystem.slotDirectory(saveName);

  return SaveFileSystem.documentPath(this.documentFileName(saveName));
};
//endregion the pipeline
//endregion StorageManager