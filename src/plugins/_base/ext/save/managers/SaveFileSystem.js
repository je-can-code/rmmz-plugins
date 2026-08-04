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
   * The picture taken of the map at the moment a generation was written.
   *
   * Deliberately absent from a manifest's `sections`: that array is the torn-write completeness check,
   * so naming the picture there would let a missing image fail an otherwise perfect generation into a
   * rollback. Losing a picture must never cost somebody a save.
   * @type {string}
   */
  static thumbnailFileName = 'snapshot.png';

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
    return this.pointerFields(slotName)[0] ?? String.empty;
  }

  /**
   * Reads which playthrough a slot currently belongs to.
   *
   * This lives in the pointer rather than in the newest manifest, and the difference matters exactly
   * when it is hardest to see. A manifest sits inside the generation it describes, so a generation
   * torn badly enough to be unloadable also takes its own identity down with it - and the moment the
   * slot cannot say whose it is, stepping back has nothing to check against and walks straight into
   * whatever playthrough happened to occupy the slot before. The pointer is the one write already
   * proven atomic, so putting the identity there means a torn generation loses its data and nothing
   * else.
   *
   * Empty for a slot written before ids existed, which reads as "unknown" rather than "nobody".
   * @param {string} slotName The slot's name.
   * @returns {string} The playthrough id, or an empty string when the pointer does not name one.
   */
  static currentPlaythroughId(slotName)
  {
    return this.pointerFields(slotName)[1] ?? String.empty;
  }

  /**
   * Splits a slot's pointer into the fields it carries.
   *
   * The pointer is one line of whitespace-separated fields - the live generation, then the
   * playthrough it belongs to - so a pointer from before the second field existed still parses, and
   * still answers the question it was originally written to answer.
   * @param {string} slotName The slot's name.
   * @returns {string[]} The fields, or an empty array when the slot has no pointer.
   */
  static pointerFields(slotName)
  {
    const pointer = StorageManager.fsReadFile(this.pointerPath(slotName));

    // no pointer at all is the normal shape of an empty slot, not a failure.
    if (pointer === null) return [];

    return pointer.trim()
      .split(/\s+/);
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

    const candidates = this.generationNames(slotName)
      .filter(name => this.generationNumber(name) <= currentNumber);

    const playthroughId = this.currentPlaythroughId(slotName);

    // a slot written before playthrough ids existed cannot say whose it is, so nothing can be ruled
    // out and the whole history stays eligible - which is what this did before ids existed.
    if (playthroughId === String.empty) return candidates;

    // stepping back is meant to reach an earlier point in *this* game. a slot that was saved over by
    // a different playthrough still holds the old one's generations, and counting backwards alone
    // would walk straight into them: a different party, a different story position, and a load that
    // looks entirely successful.
    //
    // only a generation that positively claims someone else is ruled out. one that cannot say - a
    // manifest torn or missing - is left in to be tried and fail on its own, because dropping it
    // here would turn "this generation is broken" into "this slot has nothing", which is both less
    // true and less useful to whoever reads the error.
    return candidates.filter(name =>
    {
      const claimed = this.playthroughIdAt(slotName, name);

      return claimed === String.empty || claimed === playthroughId;
    });
  }

  /**
   * Reads which playthrough a generation claims, without decoding anything.
   *
   * A generation whose manifest is missing or torn answers with nothing rather than throwing. It is
   * unloadable either way, and failing here would take down the listing that exists to route around
   * it- the caller's job is to choose what to try, not to discover what is broken.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to ask, ex: `gen-0007`.
   * @returns {string} The playthrough id, or an empty string when it cannot be read.
   */
  static playthroughIdAt(slotName, generationName)
  {
    const manifestPath = `${this.generationDirectory(slotName, generationName)}${this.manifestFileName}`;

    if (StorageManager.fsExists(manifestPath) === false) return String.empty;

    try
    {
      const manifest = this.readJson(manifestPath);

      return manifest.playthroughId ?? String.empty;
    }
    catch
    {
      return String.empty;
    }
  }

  /**
   * Determines whether a slot holds a save the game could load.
   * @param {string} slotName The slot's name.
   * @returns {boolean}
   */
  static slotExists(slotName)
  {
    // this answers for the whole slot, not for the generation on top of it. asking whether the
    // pointer's directory is present sounds equivalent and is not: a slot whose newest generation
    // was lost still holds every older one, and answering "no" for it greys the slot out in the load
    // menu - which puts the rollback the entire generation scheme exists for out of reach at the one
    // moment it was built for. `readManifest` already walks the same order to draw the row, so
    // anything else here lets the menu describe a save it refuses to open.
    return this.loadOrder(slotName).length > 0;
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
   * @param {string=} thumbnail The picture of where the player was; defaults to none.
   * @returns {Promise<void>} Resolves once the generation is live.
   */
  static writeSlot(slotName, sections, manifest, thumbnail = String.empty)
  {
    // the whole pipeline is Promise-shaped because StorageManager's contract is, but the work is
    // synchronous fs calls: this project bans async/await, and a save must not interleave anyway.
    return new Promise((resolve, reject) =>
    {
      try
      {
        this.writeGeneration(slotName, sections, manifest, thumbnail);

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
   *
   * The picture is passed in rather than taken here, and it has to be: the generation's directory name
   * is worked out inside this method, so nothing upstream knows where to put a file. Taking it here
   * instead would mean reaching into the running scene from the filesystem layer.
   * @param {string} slotName The slot's name.
   * @param {Object<string, object>} sections The plain data of each section, keyed by file name.
   * @param {SaveManifest} manifest The manifest describing them.
   * @param {string=} thumbnail The picture of where the player was; defaults to none.
   */
  static writeGeneration(slotName, sections, manifest, thumbnail = String.empty)
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

    // the picture goes in with the sections rather than after the manifest, so a crash mid-save
    // orphans it along with everything else in the directory. It is still deliberately absent from the
    // manifest's `sections`, so a *missing* one can never fail an otherwise complete generation.
    if (thumbnail !== String.empty)
    {
      this.writeThumbnail(slotName, generationName, thumbnail);
    }

    this.writeJson(`${generationDirectory}${this.manifestFileName}`, manifest);

    // make the directory entries themselves durable, not just the file contents.
    StorageManager.fsSyncDirectory(generationDirectory);

    this.swapPointer(slotName, generationName, manifest.playthroughId ?? String.empty);

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
   * @param {string} playthroughId The playthrough that generation belongs to.
   */
  static swapPointer(slotName, generationName, playthroughId)
  {
    const temporaryPath = this.pointerTempPath(slotName);

    // the id rides along with the generation name so the two can never disagree: they become live in
    // the same rename, which is the same reason the generation name is here rather than inferred.
    const pointer = playthroughId === String.empty
      ? generationName
      : `${generationName} ${playthroughId}`;

    this.writeSynced(temporaryPath, pointer);

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
   * @param {object} data The plain data to serialize.
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
   * @returns {Promise<object>} Whatever `buildFromSections` returned for the newest generation that worked.
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
      const current = this.currentGenerationName(slotName);

      // an early exit is the entire point of this loop: the first generation that loads wins, and
      // every one after it is work nobody needs done.
      for (const generationName of order)
      {
        try
        {
          const loaded = this.readGeneration(slotName, generationName, buildFromSections);

          // the test is what was asked for versus what was handed back, not whether anything threw
          // along the way - a generation ruled out before it was ever tried leaves no failure behind
          // and still costs the player everything after it. stepping back is a silent success
          // otherwise, and the symptom of that silence is "somehow I lost the last ten minutes",
          // which reads as a bug in saving rather than as the recovery it actually is.
          if (generationName !== current)
          {
            this.announceGenerationFallback(slotName, current, generationName, failures);
          }

          resolve(loaded);

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
   * Reports that a load stepped back past the generation the slot pointed at.
   *
   * The timestamp is what makes the message actionable- "an older one" tells the player nothing,
   * while the moment it was written tells them exactly how much they are about to replay.
   * @param {string} slotName The slot's name.
   * @param {string} current The generation the slot's pointer names.
   * @param {string} generationName The generation that actually loaded.
   * @param {string[]} failures Why each newer generation was passed over, newest first.
   */
  static announceGenerationFallback(slotName, current, generationName, failures)
  {
    const savedAt = this.savedAtOf(slotName, generationName);

    console.warn(
      `[save] ${slotName}: ${current} could not be loaded, so ${generationName} (saved ${savedAt}) `
      + 'was loaded instead. Anything after that point is not in this file.');

    failures.forEach(failure => console.warn(`[save] ${slotName}: skipped ${failure}`));
  }

  /**
   * Reads when a generation was written, for reporting rather than for logic.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to ask, ex: `gen-0007`.
   * @returns {string} The ISO-8601 timestamp, or `an unknown time` when it cannot be read.
   */
  static savedAtOf(slotName, generationName)
  {
    const manifestPath = `${this.generationDirectory(slotName, generationName)}${this.manifestFileName}`;

    try
    {
      return this.readJson(manifestPath).savedAt;
    }
    catch
    {
      return 'an unknown time';
    }
  }

  /**
   * Reads one named generation and nothing else.
   *
   * This is the front door {@link readSlot} deliberately is not. `readSlot` always takes the newest
   * generation that works, because a player asking to load a slot wants the best save in it. A player
   * stepping back through a slot's history has already looked at a list and pointed at one row, and
   * silently handing them a different generation is precisely the failure the whole scene exists to
   * make visible - "reload to five minutes ago" landing somewhere else is worse than not landing at
   * all. **There is no fallback here, on purpose.**
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to read, ex: `gen-0007`.
   * @param {Function} buildFromSections Receives `(sections, manifest)` and returns the loaded value.
   * @returns {Promise<object>} Whatever `buildFromSections` returned, or a rejection carrying why not.
   */
  static readGenerationAt(slotName, generationName, buildFromSections)
  {
    return new Promise((resolve, reject) =>
    {
      try
      {
        resolve(this.readGeneration(slotName, generationName, buildFromSections));
      }
      catch (error)
      {
        reject(error);
      }
    });
  }

  /**
   * Reads and verifies one generation, then hands its sections to the caller.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to read.
   * @param {Function} buildFromSections Receives `(sections, manifest)` and returns the loaded value.
   * @returns {object} Whatever `buildFromSections` returned.
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
    return this.readableGeneration(slotName).manifest;
  }

  /**
   * Finds the newest generation of a slot that describes itself, and hands back both halves.
   *
   * The name matters as much as the manifest to anything that reads more than one file per
   * generation- a picture beside a save, say. Answering with only the manifest would leave the caller
   * guessing which generation it came from, and the obvious guess (the pointer's) is wrong in exactly
   * the case this walk exists for: a slot whose newest write was torn describes itself with an older
   * generation, and everything else about that row has to come from the same one.
   * @param {string} slotName The slot's name.
   * @returns {{generationName: string, manifest: object|null}} The generation and its manifest, or
   * empty and null when the slot has nothing readable.
   */
  static readableGeneration(slotName)
  {
    // an empty slot is the normal case here - the load menu asks about every slot, every time.
    let found = {
      generationName: String.empty,
      manifest: null,
    };

    this.loadOrder(slotName)
      .some(generationName =>
      {
        const manifest = this.readManifestQuietly(slotName, generationName);

        // a generation whose manifest will not read is one the loader would step over too, so the
        // menu steps over it as well rather than showing the slot as broken.
        if (manifest === null) return false;

        found = {
          generationName,
          manifest,
        };

        return true;
      });

    return found;
  }

  /**
   * Reads one generation's manifest without letting an unreadable one take a listing down.
   *
   * {@link readManifestAt} throws for a manifest that is missing, malformed, or written at a schema
   * this build cannot reach, and all three are real states for a generation a menu is asked to show-
   * `loadOrder` deliberately leaves in a generation that cannot say whose it is, so it can fail on its
   * own terms rather than vanishing from the history. A row that cannot describe itself should draw as
   * empty; it should not stop the other rows from drawing.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation to read the manifest of.
   * @returns {object|null} The manifest as plain data, or null when it cannot be read.
   */
  static readManifestQuietly(slotName, generationName)
  {
    try
    {
      return this.readManifestAt(slotName, generationName);
    }
    catch
    {
      return null;
    }
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
   * @param {object} data The plain data to write.
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

  //region thumbnails
  /**
   * Gets the path of the picture belonging to one generation.
   *
   * The name is fixed rather than recorded anywhere, because there is exactly one per generation and a
   * field naming it could only ever disagree with the file it names.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name.
   * @returns {string}
   */
  static thumbnailPath(slotName, generationName)
  {
    return `${this.generationDirectory(slotName, generationName)}${this.thumbnailFileName}`;
  }

  /**
   * Writes the picture taken at the moment a generation was saved.
   *
   * The data URL is decoded to real bytes first, so what lands on disk is a genuine JPEG that opens in
   * any image viewer. Writing the `data:image/jpeg;base64,...` text under a `.jpg` name would produce
   * a file that lies about what it is, which is precisely the opposite of the premise this save format
   * was built on. No new filesystem primitive is needed for it: `writeSynced` is contents-agnostic and
   * Node's `writeSync` is overloaded for a string or a Buffer.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name.
   * @param {string} dataUrl The picture, as `canvas.toDataURL` produced it.
   */
  static writeThumbnail(slotName, generationName, dataUrl)
  {
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');

    this.writeSynced(this.thumbnailPath(slotName, generationName), bytes);
  }

  /**
   * Gets the url a picture can actually be loaded through.
   *
   * There is no reader to pair with the writer, because `Bitmap.load` assigns its argument straight
   * onto an `<img>`'s `src` and an `<img>` opens a local file itself - so the only thing needed on the
   * way back in is a url rather than an operating system path. **Those are not the same string**, and
   * the difference does not show up on the machine this was written on:
   *
   * - `StorageManager.fileDirectoryPath` builds the save root with Node's `path.join`, so on Linux it
   *   produces `/home/…/save/` and on Windows `C:\Games\…\save\`.
   * - A POSIX absolute path resolves correctly against the `file:///` origin an NW.js game runs under,
   *   so it loads with no scheme at all and everything looks finished.
   * - A Windows one does not. `C:\Games\…` is not a valid url, so it is treated as relative, resolved
   *   against the game's own directory, and fails - leaving a row that draws nothing, on the platform
   *   CA ships on and not on the one it is developed on.
   *
   * Hence the explicit scheme, the separator normalization, and the escaping: a game installed under
   * `My Games` has a space in every path it builds.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name.
   * @returns {string}
   */
  static thumbnailUrl(slotName, generationName)
  {
    return this.fileUrl(this.thumbnailPath(slotName, generationName));
  }

  /**
   * Renders a local file path as a url an `<img>` will accept.
   * @param {string} filePath The path to render.
   * @returns {string}
   */
  static fileUrl(filePath)
  {
    const normalized = filePath.replace(/\\/g, '/');

    // the scheme supplies the leading separator, so a POSIX path must not also bring its own - while a
    // Windows path opens on its drive letter and has none to drop.
    const rooted = normalized.replace(/^\/+/, '');

    // `#` and `?` are legal in a directory name on both platforms and would otherwise be read as the
    // start of a fragment or a query, silently truncating the path. `encodeURI` leaves both alone.
    const escaped = encodeURI(rooted)
      .replace(/#/g, '%23')
      .replace(/\?/g, '%3F');

    return `file:///${escaped}`;
  }

  /**
   * Determines whether a generation has a picture beside it.
   *
   * Absent simply means "no image" - a lost picture must never cost somebody a save, which is also why
   * the manifest's `sections` array never names it.
   * @param {string} slotName The slot's name.
   * @param {string} generationName The generation's directory name.
   * @returns {boolean}
   */
  static hasThumbnail(slotName, generationName)
  {
    return StorageManager.fsExists(this.thumbnailPath(slotName, generationName));
  }
  //endregion thumbnails

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