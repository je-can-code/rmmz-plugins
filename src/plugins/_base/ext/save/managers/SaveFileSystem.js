//region SaveFileSystem
import SaveStorageError from './../core/SaveStorageError.js';
import SaveManifest from './../core/SaveManifest.js';
import SaveMigrationRegistry from './../core/SaveMigrationRegistry.js';

/**
 * The bottom of the save pipeline: everything about *files*, and nothing about what they mean.
 *
 * A slot is a directory holding several immutable generations and a one-line pointer naming the live
 * one:
 *
 * ```
 * save/file1/current        <- "gen-0007"
 * save/file1/gen-0007/manifest.json, world.json, party.json, actors.json, systems/*.json
 * save/file1/gen-0006/      <- kept for rollback
 * ```
 *
 * **The pointer rename is the only atomic step, and it is the whole design.** A generation is written
 * to a directory nothing is reading, fsynced, and only then does one `rename` make it live. A crash
 * anywhere before that leaves the previous generation untouched and the partial one orphaned, which
 * the next successful save prunes. Nothing here ever overwrites a file the game might still need -
 * which matters more now than it did when a slot was one file, because a directory of a dozen files
 * has a dozen chances to be torn.
 *
 * For contrast, vanilla renames the live file to `.rmmzsave_` before writing over it and then never
 * reads that backup on load. The safety net existed and was connected to nothing.
 *
 * Every filesystem call goes through {@link StorageManager}'s `fs*` helpers rather than `require`ing
 * `fs` here. That is where the engine already put them, and it means the crash-injection tests can
 * make step N of a save fail by stubbing one method on a global they already stub.
 */
class SaveFileSystem
{
  /**
   * The prefix every generation directory name starts with.
   * @type {string}
   */
  static generationPrefix = 'gen-';

  /**
   * How many digits a generation number is padded to, so a directory listing sorts lexically.
   * @type {number}
   */
  static generationDigits = 4;

  /**
   * The file naming the live generation. One line, no newline, no ceremony.
   * @type {string}
   */
  static pointerFileName = 'current';

  /**
   * The scratch name the pointer is written to before being renamed into place.
   * @type {string}
   */
  static pointerTempFileName = 'current.tmp';

  /**
   * The file every generation must carry, listing what else it is made of.
   * @type {string}
   */
  static manifestFileName = 'manifest.json';

  /**
   * How many generations a slot keeps before the oldest are pruned.
   *
   * Three is the default because the failure mode of a bad save should be "you lost the last save",
   * never "you lost the file". Size is not a consideration; see the save rewrite plan.
   * @returns {number}
   */
  static retainedGenerations()
  {
    // never fewer than one: pruning the live generation would delete the save being written.
    return Math.max(1, J.BASE.EXT.SAVE.Metadata.retainedSaveGenerations);
  }

  //region paths
  /**
   * Gets the directory every save file lives under, with its trailing separator.
   * @returns {string}
   */
  static saveDirectory()
  {
    return StorageManager.fileDirectoryPath();
  }

  /**
   * Gets the path of a scope-level document such as `config.json` or `profile.json`.
   * @param {string} fileName The document's file name, extension included.
   * @returns {string}
   */
  static documentPath(fileName)
  {
    return `${this.saveDirectory()}${fileName}`;
  }

  /**
   * Gets the directory one slot lives in.
   * @param {string} slotName The slot's name, ex: `file1`.
   * @returns {string}
   */
  static slotDirectory(slotName)
  {
    return `${this.saveDirectory()}${slotName}/`;
  }

  /**
   * Gets the path of the file naming a slot's live generation.
   * @param {string} slotName The slot's name.
   * @returns {string}
   */
  static pointerPath(slotName)
  {
    return `${this.slotDirectory(slotName)}${this.pointerFileName}`;
  }

  /**
   * Gets the path of the scratch file the pointer is written to before the swap.
   * @param {string} slotName The slot's name.
   * @returns {string}
   */
  static pointerTempPath(slotName)
  {
    return `${this.slotDirectory(slotName)}${this.pointerTempFileName}`;
  }

  /**
   * Gets the directory one generation of one slot lives in.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name, ex: `gen-0007`.
   * @returns {string}
   */
  static generationDirectory(slotName, generationName)
  {
    return `${this.slotDirectory(slotName)}${generationName}/`;
  }

  /**
   * Gets the path of one section file inside one generation.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name.
   * @param {string} sectionName The section's file name, which may carry a subdirectory.
   * @returns {string}
   */
  static sectionPath(slotName, generationName, sectionName)
  {
    return `${this.generationDirectory(slotName, generationName)}${sectionName}`;
  }

  /**
   * Renders a generation number as its directory name.
   * @param {number} generationNumber The generation's number.
   * @returns {string}
   */
  static generationName(generationNumber)
  {
    return `${this.generationPrefix}${String(generationNumber)
      .padStart(this.generationDigits, '0')}`;
  }

  /**
   * Reads the number back out of a generation directory name.
   * @param {string} generationName The generation's directory name.
   * @returns {number} The number, or zero when the name is not one of ours.
   */
  static generationNumber(generationName)
  {
    const parsed = parseInt(generationName.slice(this.generationPrefix.length), 10);

    // a directory that does not carry a number is not one of ours and sorts to the bottom.
    if (Number.isNaN(parsed)) return 0;

    return parsed;
  }
  //endregion paths

  //region reading the slot's shape
  /**
   * Reads the name of the generation a slot's pointer currently names.
   * @param {string} slotName The slot's name.
   * @returns {string} The generation directory name, or an empty string when there is no pointer.
   */
  static currentGenerationName(slotName)
  {
    const pointer = StorageManager.fsReadFile(this.pointerPath(slotName));

    // no pointer at all is the normal shape of an empty slot, not a failure.
    if (pointer === null) return String.empty;

    return pointer.trim();
  }

  /**
   * Lists every generation directory a slot holds, newest first.
   *
   * This is the directory listing rather than the pointer, so it sees orphans - a generation whose
   * write crashed before the pointer swap is here, and is exactly what pruning cleans up.
   * @param {string} slotName The slot's name.
   * @returns {string[]} The generation directory names, newest first.
   */
  static generationNames(slotName)
  {
    const slotDirectory = this.slotDirectory(slotName);

    // a slot that has never been written has no directory, which reads as no generations.
    if (StorageManager.fsExists(slotDirectory) === false) return [];

    return StorageManager.fsReaddir(slotDirectory)
      .filter(entry => entry.startsWith(this.generationPrefix))
      .filter(entry => StorageManager.fsIsDirectory(`${slotDirectory}${entry}`))
      .sort((left, right) => this.generationNumber(right) - this.generationNumber(left));
  }

  /**
   * Builds the order a load should try generations in: the live one, then progressively older ones.
   *
   * The pointer leads even though it is usually also the newest, because the pointer is the
   * authority on which generation completed. Anything newer than it is an orphan from a write that
   * did not finish, and orphans are excluded rather than tried - a torn generation that happens to
   * parse would be worse than no generation at all.
   * @param {string} slotName The slot's name.
   * @returns {string[]} The generations to try, in order.
   */
  static loadOrder(slotName)
  {
    const current = this.currentGenerationName(slotName);

    // with no pointer there is nothing the slot claims is complete.
    if (current === String.empty) return [];

    const currentNumber = this.generationNumber(current);

    return this.generationNames(slotName)
      .filter(name => this.generationNumber(name) <= currentNumber);
  }

  /**
   * Determines whether a slot holds a save the game could load.
   * @param {string} slotName The slot's name.
   * @returns {boolean}
   */
  static slotExists(slotName)
  {
    const current = this.currentGenerationName(slotName);

    if (current === String.empty) return false;

    return StorageManager.fsExists(this.generationDirectory(slotName, current));
  }
  //endregion reading the slot's shape

  //region writing
  /**
   * Writes a complete generation and makes it live.
   *
   * The sequence is the contract, and every step of it is ordered against a crash landing in the
   * middle: sections first, manifest after them so its presence means the set is complete, the
   * directory fsynced so the entries are durable, and only then the pointer swap.
   * @param {string} slotName The slot's name.
   * @param {Object<string, object>} sections The plain data of each section, keyed by file name.
   * @param {SaveManifest} manifest The manifest describing them.
   * @returns {Promise<void>} Resolves once the generation is live.
   */
  static writeSlot(slotName, sections, manifest)
  {
    // the whole pipeline is Promise-shaped because StorageManager's contract is, but the work is
    // synchronous fs calls: this project bans async/await, and a save must not interleave anyway.
    return new Promise((resolve, reject) =>
    {
      try
      {
        this.writeGeneration(slotName, sections, manifest);

        resolve();
      }
      catch (error)
      {
        reject(error);
      }
    });
  }

  /**
   * Performs the whole write sequence for one generation.
   * @param {string} slotName The slot's name.
   * @param {Object<string, object>} sections The plain data of each section, keyed by file name.
   * @param {SaveManifest} manifest The manifest describing them.
   */
  static writeGeneration(slotName, sections, manifest)
  {
    // remembered before anything moves, because it is the only way to tell an orphan from a keeper
    // afterwards: once the pointer swings forward, a directory left by a crashed write is
    // indistinguishable from the previous good generation by number alone.
    const orphanCutoff = this.generationNumber(this.currentGenerationName(slotName));

    const generationName = this.generationName(this.nextGenerationNumber(slotName));
    const generationDirectory = this.generationDirectory(slotName, generationName);

    StorageManager.fsMkdirRecursive(generationDirectory);

    // sections before the manifest: the manifest is what declares the set complete, so it must not
    // exist until everything it names does.
    Object.keys(sections)
      .forEach(sectionName =>
      {
        this.writeJson(this.sectionPath(slotName, generationName, sectionName), sections[sectionName]);
      });

    this.writeJson(`${generationDirectory}${this.manifestFileName}`, manifest);

    // make the directory entries themselves durable, not just the file contents.
    StorageManager.fsSyncDirectory(generationDirectory);

    this.swapPointer(slotName, generationName);

    this.pruneGenerations(slotName, orphanCutoff);
  }

  /**
   * Points a slot at a generation, atomically.
   *
   * Writing the name to a scratch file and renaming it over the pointer is the one step that makes a
   * torn write survivable: a rename either happened or it did not, so a crash mid-swap leaves the
   * previous generation live rather than leaving the pointer half-written and the slot unreadable.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to make live.
   */
  static swapPointer(slotName, generationName)
  {
    const temporaryPath = this.pointerTempPath(slotName);

    this.writeSynced(temporaryPath, generationName);

    StorageManager.fsRename(temporaryPath, this.pointerPath(slotName));
  }

  /**
   * Picks the number the next generation gets.
   *
   * It is the highest number the directory holds plus one rather than the pointer's plus one, so an
   * orphan left by a crashed write is stepped over instead of being written into - reusing its name
   * would mean writing into a directory that already has files in it.
   * @param {string} slotName The slot's name.
   * @returns {number}
   */
  static nextGenerationNumber(slotName)
  {
    const existing = this.generationNames(slotName);

    // a slot nobody has saved to yet starts at one.
    if (existing.length === 0) return 1;

    return this.generationNumber(existing[0]) + 1;
  }

  /**
   * Deletes the generations a slot no longer keeps.
   *
   * Two different things get deleted here, and conflating them was a bug worth naming. **Orphans**
   * are directories left by a write that never reached its pointer swap; they are recognized as
   * anything that appeared after the pointer this save started from, and they go regardless of the
   * retention count. **Retired** generations are real, complete ones that have simply fallen off the
   * end of the window.
   *
   * Retention counts generations rather than comparing numbers, because numbers are not dense: a
   * write that steps over an orphan leaves a gap, and a number-based window would read that gap as
   * several generations' worth of age and delete saves that are still the newest ones there are.
   * @param {string} slotName The slot's name.
   * @param {number} orphanCutoff The generation number the pointer held before this save.
   */
  static pruneGenerations(slotName, orphanCutoff)
  {
    const current = this.currentGenerationName(slotName);

    // without a pointer there is no way to tell a keeper from an orphan, so nothing is deleted.
    if (current === String.empty) return;

    const currentNumber = this.generationNumber(current);

    const all = this.generationNames(slotName);

    const orphans = all.filter(name =>
    {
      const number = this.generationNumber(name);

      return number > orphanCutoff && number !== currentNumber;
    });

    // whatever the pointer can still reach, newest first, minus the ones being kept.
    const retired = all.filter(name => this.generationNumber(name) <= currentNumber)
      .slice(this.retainedGenerations());

    orphans.concat(retired)
      .forEach(name => StorageManager.fsRemoveDirectory(this.generationDirectory(slotName, name)));
  }

  /**
   * Writes one pretty-printed JSON document durably.
   *
   * Two spaces, and no attempt at compactness: the point of this format is that a developer can open
   * a savefile, read it, edit it, and load the result. Size is explicitly not a consideration.
   * @param {string} filePath The path to write to.
   * @param {*} data The plain data to serialize.
   */
  static writeJson(filePath, data)
  {
    this.writeSynced(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * Writes a file and does not return until the bytes are on the disk.
   *
   * `writeFileSync` returns as soon as the write is handed to the operating system, which is a
   * different thing from durable- a power loss between the two leaves a file that exists and is
   * empty. The fsync is what closes that window, and it is affordable here because a save happens
   * once every few minutes rather than once a frame.
   * @param {string} filePath The path to write to.
   * @param {string} contents The text to write.
   */
  static writeSynced(filePath, contents)
  {
    // a section name may carry a subdirectory - `systems/abs.json` - so the parent is made here
    // rather than assuming the generation directory is flat.
    const parent = this.parentDirectory(filePath);

    if (parent !== String.empty)
    {
      StorageManager.fsMkdirRecursive(parent);
    }

    try
    {
      StorageManager.fsWriteFileSynced(filePath, contents);
    }
    catch (error)
    {
      // a full or locked disk is a real outcome on Windows, and the honest response is to say so and
      // leave the pointer alone. reporting success and losing the save is the one unacceptable one.
      throw SaveStorageError.writeFailed(filePath, error.message);
    }
  }

  /**
   * Gets the directory portion of a path, with its trailing separator.
   *
   * Both separators are considered because the two halves of a save path come from different
   * places: the root comes from the engine's `path.join`, which on Windows produces backslashes,
   * and everything this class appends to it uses forward slashes. Node accepts the mix on every
   * platform; a parser that only knew one of them would not.
   * @param {string} filePath The path to take the parent of.
   * @returns {string} The parent directory, or an empty string when the path has no directory part.
   */
  static parentDirectory(filePath)
  {
    const lastSeparator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));

    // a bare file name has no parent to create, which the caller has to be able to tell apart from
    // a parent of `/`.
    if (lastSeparator === -1) return String.empty;

    return filePath.slice(0, lastSeparator + 1);
  }
  //endregion writing

  //region reading
  /**
   * Reads a slot, stepping back through older generations until one loads.
   *
   * The caller supplies what to do with the sections rather than receiving them, because a
   * generation can fail in ways only the caller can see: a section that parses as JSON but does not
   * decode is just as torn as one that is missing, and both should fall back to the previous
   * generation rather than to an error. Handing the consumer in is what puts decode failures inside
   * the retry loop.
   * @param {string} slotName The slot's name.
   * @param {Function} buildFromSections Receives `(sections, manifest)` and returns the loaded value.
   * @returns {Promise<*>} Whatever `buildFromSections` returned for the newest generation that worked.
   */
  static readSlot(slotName, buildFromSections)
  {
    return new Promise((resolve, reject) =>
    {
      const order = this.loadOrder(slotName);

      if (order.length === 0)
      {
        reject(SaveStorageError.noGenerations(this.slotDirectory(slotName)));

        return;
      }

      const failures = [];

      // an early exit is the entire point of this loop: the first generation that loads wins, and
      // every one after it is work nobody needs done.
      for (const generationName of order)
      {
        try
        {
          resolve(this.readGeneration(slotName, generationName, buildFromSections));

          return;
        }
        catch (error)
        {
          failures.push(`${generationName}: ${error.message}`);
        }
      }

      reject(SaveStorageError.noLoadableGeneration(this.slotDirectory(slotName), failures));
    });
  }

  /**
   * Reads and verifies one generation, then hands its sections to the caller.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to read.
   * @param {Function} buildFromSections Receives `(sections, manifest)` and returns the loaded value.
   * @returns {*} Whatever `buildFromSections` returned.
   */
  static readGeneration(slotName, generationName, buildFromSections)
  {
    const manifest = this.readManifestAt(slotName, generationName);

    const sections = {};

    // the manifest is the completeness check: every file it named has to be here and has to parse
    // before anything is handed on, so a half-written generation fails before it can half-load.
    manifest.sections.forEach(sectionName =>
    {
      sections[sectionName] = this.readJson(this.sectionPath(slotName, generationName, sectionName));
    });

    // migrations run here, on plain data, before anything decodes: the decoder's seeds and type maps
    // describe the current schema and cannot be told to read an older one. Running inside the retry
    // loop is deliberate too - a migration that throws makes its generation fall back like any other
    // unreadable one, rather than taking the whole load down.
    const migrated = SaveMigrationRegistry.apply({
      manifest,
      sections,
    });

    return buildFromSections(migrated.sections, migrated.manifest);
  }

  /**
   * Reads the manifest of one generation and verifies this build can understand it.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to read the manifest of.
   * @returns {object} The manifest, as plain data.
   */
  static readManifestAt(slotName, generationName)
  {
    const manifestPath = `${this.generationDirectory(slotName, generationName)}${this.manifestFileName}`;
    const manifest = this.readJson(manifestPath);

    // an older generation is readable when a chain of migrations reaches this build's version. this
    // is checked before the sections are opened so the load menu can tell a slot it will be able to
    // open from one it cannot, without parsing a world to find out.
    const understood = SaveManifest.supportsSchemaVersion(manifest.schemaVersion)
      || SaveMigrationRegistry.hasPathToCurrent(manifest.schemaVersion);

    if (understood === false)
    {
      throw SaveStorageError.unsupportedSchemaVersion(
        manifestPath,
        manifest.schemaVersion,
        SaveManifest.schemaVersion,
        SaveMigrationRegistry.firstMissingStep(manifest.schemaVersion));
    }

    return manifest;
  }

  /**
   * Reads the manifest of the newest generation that has one, for the load menu.
   *
   * This is the cheap path, and it is cheap on purpose: drawing a row of the load menu opens one
   * small JSON document and never touches a world.
   * @param {string} slotName The slot's name.
   * @returns {object|null} The manifest as plain data, or null when the slot has nothing readable.
   */
  static readManifest(slotName)
  {
    const order = this.loadOrder(slotName);

    // an empty slot is the normal case here - the load menu asks about every slot, every time.
    let manifest = null;

    order.some(generationName =>
    {
      try
      {
        manifest = this.readManifestAt(slotName, generationName);

        return true;
      }
      catch
      {
        // a generation whose manifest will not read is one the loader would step over too, so the
        // menu steps over it as well rather than showing the slot as broken.
        return false;
      }
    });

    return manifest;
  }

  /**
   * Reads one JSON file, failing loudly about which file and why when it cannot.
   * @param {string} filePath The path to read.
   * @returns {object} The parsed plain data.
   */
  static readJson(filePath)
  {
    const contents = StorageManager.fsReadFile(filePath);

    if (contents === null) throw SaveStorageError.missingSection(filePath);

    try
    {
      return JSON.parse(contents);
    }
    catch (error)
    {
      throw SaveStorageError.malformedSection(filePath, error.message);
    }
  }
  //endregion reading

  //region documents
  /**
   * Writes a scope-level document - `config.json`, `profile.json` - atomically.
   *
   * A single document does not need generations; it needs the same rename that makes a generation
   * swap safe, so a crash mid-write cannot leave the player's settings half-written.
   * @param {string} fileName The document's file name.
   * @param {*} data The plain data to write.
   * @returns {Promise<void>} Resolves once the document is on disk.
   */
  static writeDocument(fileName, data)
  {
    return new Promise((resolve, reject) =>
    {
      try
      {
        const filePath = this.documentPath(fileName);
        const temporaryPath = `${filePath}.tmp`;

        this.writeJson(temporaryPath, data);

        StorageManager.fsRename(temporaryPath, filePath);

        resolve();
      }
      catch (error)
      {
        reject(error);
      }
    });
  }

  /**
   * Reads a scope-level document.
   * @param {string} fileName The document's file name.
   * @returns {Promise<object|null>} The parsed data, or null when the document does not exist yet.
   */
  static readDocument(fileName)
  {
    return new Promise((resolve, reject) =>
    {
      const filePath = this.documentPath(fileName);

      // a fresh install has no documents at all, and that is a value rather than a failure: every
      // scope has to produce sane defaults from nothing.
      if (StorageManager.fsExists(filePath) === false)
      {
        resolve(null);

        return;
      }

      try
      {
        resolve(this.readJson(filePath));
      }
      catch (error)
      {
        reject(error);
      }
    });
  }
  //endregion documents

  /**
   * Deletes a slot and everything in it.
   * @param {string} slotName The slot's name.
   */
  static removeSlot(slotName)
  {
    StorageManager.fsRemoveDirectory(this.slotDirectory(slotName));
  }
}

export default SaveFileSystem;
//endregion SaveFileSystem