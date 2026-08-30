//region plugins/_base/core/save/save-storage-layer.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

describe('save storage layer (direct src import)', () =>
{
  let SaveFileSystem;
  let SaveManifest;
  let SaveDocument;
  let SaveSectionRouter;
  let fake;

  /**
   * Builds the manifest a write needs, without going through the encoder- these tests are about
   * files, and the encoder has its own suite.
   * @param {Object<string, object>} sections The sections being written.
   * @param {string=} playthroughId The playthrough to attribute the generation to.
   * @returns {object}
   */
  const manifestFor = (sections, playthroughId = 'playthrough-a') =>
    SaveManifest.create(Object.keys(sections), { title: 'test' }, 100, playthroughId);

  /**
   * Writes one generation of a slot, with whatever sections the caller cares about.
   * @param {string} slotName The slot to write.
   * @param {Object<string, object>=} sections The sections to write.
   * @param {string=} playthroughId The playthrough to attribute the generation to.
   * @returns {Promise<void>}
   */
  const writeGeneration = (slotName, sections = { 'world.json': { map: 1 } }, playthroughId = 'playthrough-a') =>
    SaveFileSystem.writeSlot(slotName, sections, manifestFor(sections, playthroughId));

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the save files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // the registry is a real global for these files; nothing here exercises codec behavior.
    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    // J-Base-Save reads the registry as a hoisted global rather than importing across ships.
    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveManifest } = await import('../../../../../src/plugins/_base/ext/save/core/SaveManifest.js'));
    ({ default: SaveFileSystem } = await import('../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveDocument } = await import('../../../../../src/plugins/_base/ext/save/core/SaveDocument.js'));
    ({ default: SaveSectionRouter } = await import('../../../../../src/plugins/_base/ext/save/core/SaveSectionRouter.js'));
  });

  beforeEach(() =>
  {
    fake = installFakeSaveFilesystem();
    globalThis.J.BASE.EXT.SAVE.Metadata.retainedSaveGenerations = 3;
  });

  //region path and write helpers
  describe('SaveFileSystem.parentDirectory()', () =>
  {
    it('returns the directory portion of a path, with its trailing separator', () =>
    {
      // Arrange & Act & Assert- a path that actually has a parent is the only input that can tell
      // "take the directory part" apart from "always answer nothing".
      expect(SaveFileSystem.parentDirectory('save/slot-a/gen-0001/world.json')).toBe('save/slot-a/gen-0001/');
    });

    it('reads a backslash as a separator too, for the half of a path the engine builds', () =>
    {
      expect(SaveFileSystem.parentDirectory('save\\slot-a\\world.json')).toBe('save\\slot-a\\');
    });

    it('returns an empty string for a bare file name that has no directory part', () =>
    {
      expect(SaveFileSystem.parentDirectory('world.json')).toBe('');
    });
  });

  describe('SaveFileSystem.writeSynced()', () =>
  {
    it('creates the parent directory before writing a path that has one', () =>
    {
      // Arrange- a section name may carry a subdirectory, so the parent may not exist yet.
      // Act
      SaveFileSystem.writeSynced('save/slot-a/nested/world.json', '{}');

      // Assert
      expect(fake.directories.has('save/slot-a/nested/')).toBe(true);
      expect(fake.files.get('save/slot-a/nested/world.json')).toBe('{}');
    });

    it('skips directory creation for a bare file name that has no parent', () =>
    {
      // Arrange- the fake's mkdir is a no-op for an empty path, so the absence has to be observed at
      // the call rather than in the resulting directory set. Restored by hand because a spy left on
      // this object outlives the test.
      const mkdir = vi.spyOn(fake.storageManager, 'fsMkdirRecursive');

      // Act
      SaveFileSystem.writeSynced('world.json', '{}');

      // Assert- the write itself is the proof this ran at all, which is what makes the absence
      // below meaningful rather than vacuous.
      expect(fake.files.get('world.json')).toBe('{}');
      expect(mkdir).not.toHaveBeenCalled();

      mkdir.mockRestore();
    });
  });

  describe('SaveFileSystem.generationNumber()', () =>
  {
    it('reads the number back out of a generation directory name', () =>
    {
      expect(SaveFileSystem.generationNumber('gen-0007')).toBe(7);
    });

    it('answers zero for a directory name that carries no number of ours', () =>
    {
      // a sibling directory that is not a generation must sort to the bottom rather than poisoning
      // every comparison it takes part in, which is what an unguarded NaN would do.
      expect(SaveFileSystem.generationNumber('thumbnails')).toBe(0);
    });
  });
  //endregion path and write helpers

  //region writing
  describe('SaveFileSystem.writeSlot()', () =>
  {
    it('writes the first generation as gen-0001 and points the slot at it', async () =>
    {
      // Arrange
      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.currentGenerationName('file1')).toBe('gen-0001');
      expect(fake.files.has('save/file1/gen-0001/world.json')).toBe(true);
      expect(fake.files.has('save/file1/gen-0001/manifest.json')).toBe(true);
    });

    it('records the playthrough in the pointer, alongside the generation', async () =>
    {
      // Arrange
      // Act
      await writeGeneration('file1', { 'world.json': { map: 1 } }, 'playthrough-z');

      // Assert- the identity rides in the pointer rather than in the manifest, so a generation torn
      // badly enough to be unloadable cannot also take down the slot's answer to "whose is this".
      expect(fake.files.get('save/file1/current')).toBe('gen-0001 playthrough-z');
      expect(SaveFileSystem.currentPlaythroughId('file1')).toBe('playthrough-z');
    });

    it('writes each subsequent save as a new generation and repoints the slot', async () =>
    {
      // Arrange
      await writeGeneration('file1');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.currentGenerationName('file1')).toBe('gen-0002');
      expect(fake.files.has('save/file1/gen-0001/world.json')).toBe(true);
    });

    it('pretty-prints every section rather than minifying it', async () =>
    {
      // Arrange
      // Act
      await writeGeneration('file1', { 'world.json': { map: { id: 4 } } });

      // Assert
      expect(fake.files.get('save/file1/gen-0001/world.json'))
        .toBe('{\n  "map": {\n    "id": 4\n  }\n}');
    });

    it('creates the subdirectory a system section names', async () =>
    {
      // Arrange
      // Act
      await writeGeneration('file1', { 'systems/abs.json': { hosts: {} } });

      // Assert
      expect(fake.files.has('save/file1/gen-0001/systems/abs.json')).toBe(true);
    });

    it('writes the manifest after the sections it names', async () =>
    {
      // Arrange
      const written = [];
      const original = fake.storageManager.fsWriteFileSynced;
      fake.storageManager.fsWriteFileSynced = (path, contents) =>
      {
        written.push(path);
        original(path, contents);
      };

      // Act
      await writeGeneration('file1', { 'world.json': {}, 'party.json': {} });

      // Assert
      expect(written.indexOf('save/file1/gen-0001/manifest.json'))
        .toBeGreaterThan(written.indexOf('save/file1/gen-0001/party.json'));
    });

    it('prunes generations that fall outside the retention window', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      await writeGeneration('file1');
      await writeGeneration('file1');
      await writeGeneration('file1');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.generationNames('file1')).toEqual([ 'gen-0005', 'gen-0004', 'gen-0003' ]);
    });

    it('never prunes below one generation, whatever the parameter says', async () =>
    {
      // Arrange
      globalThis.J.BASE.EXT.SAVE.Metadata.retainedSaveGenerations = 0;
      await writeGeneration('file1');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.generationNames('file1')).toEqual([ 'gen-0002' ]);
    });

    it('reports no generations for a slot that was never written', () =>
    {
      // Arrange- every other case here writes a generation first, so the directory always exists by
      // the time it is read. A slot nobody has saved into has no directory at all, and reading one
      // that is absent throws rather than answering empty.

      // Act
      const generations = SaveFileSystem.generationNames('never-written');

      // Assert
      expect(generations).toEqual([]);
    });

    it('steps over an orphaned generation rather than writing into it', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.storageManager.fsMkdirRecursive('save/file1/gen-0009/');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.currentGenerationName('file1')).toBe('gen-0010');
    });

    it('prunes an orphan left by a write that never reached the pointer', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.storageManager.fsMkdirRecursive('save/file1/gen-0009/');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.generationNames('file1')).not.toContain('gen-0009');
    });

    it('reports a refused write as a storage failure naming the file', async () =>
    {
      // Arrange
      fake.failOnWrite = 1;

      // Act
      const failure = await writeGeneration('file1')
        .catch(error => error);

      // Assert
      expect(failure.kind()).toBe('save-storage-write-failed');
    });
  });
  //endregion writing

  //region crash injection
  describe('SaveFileSystem.pruneGenerations()', () =>
  {
    it('deletes nothing from a slot that holds generations but has lost its pointer', async () =>
    {
      // Arrange- two real generations, then the pointer removed to model a slot whose pointer write
      // never landed. Without a pointer there is no way to tell a keeper from an orphan, so the
      // safe answer is to touch nothing; a cutoff of zero would otherwise sweep both.
      await writeGeneration('slot-a');
      await writeGeneration('slot-a');
      fake.files.delete(SaveFileSystem.pointerPath('slot-a'));

      // Act
      SaveFileSystem.pruneGenerations('slot-a', 0);

      // Assert
      expect(SaveFileSystem.generationNames('slot-a')).toEqual([ 'gen-0002', 'gen-0001' ]);
    });

    it('counts only generations the pointer can still reach toward the retention window', async () =>
    {
      // Arrange- a retention window of one, two real generations, and an orphan numbered ABOVE the
      // pointer. The orphan is the near-miss that matters: it is deleted either way by the orphan
      // pass, so the only thing that distinguishes correct behavior is whether it also consumed the
      // single retention slot and dragged gen-0002 down with it.
      globalThis.J.BASE.EXT.SAVE.Metadata.retainedSaveGenerations = 1;
      await writeGeneration('slot-a');
      await writeGeneration('slot-a');
      fake.directories.add(SaveFileSystem.generationDirectory('slot-a', 'gen-0003'));

      // Act
      SaveFileSystem.pruneGenerations('slot-a', 2);

      // Assert- the live generation survives, the orphan and the aged-out one do not.
      expect(SaveFileSystem.generationNames('slot-a')).toEqual([ 'gen-0002' ]);
    });
  });

  describe('SaveFileSystem crash injection', () =>
  {
    it('leaves the previous generation live when a write fails at any step', async () =>
    {
      // Arrange
      const sections = { 'world.json': { map: 1 }, 'party.json': { gold: 5 }, 'systems/abs.json': { hosts: {} } };
      await writeGeneration('file1', sections);
      const writesPerGeneration = fake.writeCount;

      // Act
      const outcomes = [];
      for (let step = 1; step <= writesPerGeneration; step++)
      {
        fake.writeCount = 0;
        fake.failOnWrite = step;

        // eslint-disable-next-line no-await-in-loop
        await writeGeneration('file1', sections)
          .catch(() => 0);

        outcomes.push(SaveFileSystem.currentGenerationName('file1'));
      }

      // Assert
      expect(outcomes.every(pointer => pointer === 'gen-0001')).toBe(true);
    });

    it('still loads the previous generation after a failed write', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      fake.writeCount = 0;
      fake.failOnWrite = 1;
      await writeGeneration('file1', { 'world.json': { map: 2 } })
        .catch(() => 0);

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });
  });
  //endregion crash injection

  //region reading
  describe('SaveFileSystem.readSlot()', () =>
  {
    it('reads the generation the pointer names', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 7 } });

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 7 });
    });

    it('falls back to the previous generation when the newest manifest will not parse', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/gen-0002/manifest.json', '{ truncated');

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('says so when it steps back, rather than quietly handing over an older save', async () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/gen-0002/manifest.json', '{ truncated');

      // Act
      await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert- the player asked for their newest save and did not get it. unannounced, that reads
      // as "I lost my last ten minutes", which sends anyone debugging it at the save path instead
      // of the load path.
      expect(warn).toHaveBeenCalled();
      expect(warn.mock.calls[0][0]).toContain('gen-0001');

      warn.mockRestore();
    });

    it('stays quiet when the generation the pointer names loads', async () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      await writeGeneration('file1', { 'world.json': { map: 1 } });

      // Act
      await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(warn).not.toHaveBeenCalled();

      warn.mockRestore();
    });

    it('will not step back into a playthrough that merely shares the slot', async () =>
    {
      // Arrange- one game saved twice, then a different game saved over the same slot. all three
      // generations live in the same folder, and only the newest belongs to the game being loaded.
      await writeGeneration('file1', { 'world.json': { map: 1 } }, 'playthrough-a');
      await writeGeneration('file1', { 'world.json': { map: 2 } }, 'playthrough-a');
      await writeGeneration('file1', { 'world.json': { map: 3 } }, 'playthrough-b');
      fake.files.set('save/file1/gen-0003/manifest.json', '{ truncated');

      // Act
      const attempt = SaveFileSystem.readSlot('file1', sections => sections);

      // Assert- counting backwards alone would have landed on map 2: a different party, a different
      // story position, and a load that looks entirely successful. failing is the correct answer.
      await expect(attempt).rejects.toThrow();
    });

    it('steps back through generations that do belong to the same playthrough', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } }, 'playthrough-b');
      await writeGeneration('file1', { 'world.json': { map: 2 } }, 'playthrough-b');
      fake.files.set('save/file1/gen-0002/manifest.json', '{ truncated');

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('treats a slot written before playthrough ids existed as fully reachable', async () =>
    {
      // Arrange- a pointer from before the second field existed names only a generation, so the
      // slot cannot say whose it is and nothing can be ruled out by an id.
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/current', 'gen-0002');
      fake.files.delete('save/file1/gen-0002/world.json');

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('falls back when a section the manifest names is missing', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.delete('save/file1/gen-0002/world.json');

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('falls back when the newest generation parses but will not decode', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections =>
      {
        if (sections['world.json'].map === 2) throw new Error('cannot decode');

        return sections;
      });

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('falls back when the newest generation claims a schema version it does not understand', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      const manifest = JSON.parse(fake.files.get('save/file1/gen-0002/manifest.json'));
      manifest.schemaVersion = 99;
      fake.files.set('save/file1/gen-0002/manifest.json', JSON.stringify(manifest));

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });

    it('fails loudly and names every generation when none of them load', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/gen-0001/manifest.json', 'nope');
      fake.files.set('save/file1/gen-0002/manifest.json', 'nope');

      // Act
      const failure = await SaveFileSystem.readSlot('file1', sections => sections)
        .catch(error => error);

      // Assert
      expect(failure.kind()).toBe('save-storage-no-loadable-generation');
      expect(failure.message).toContain('gen-0002');
      expect(failure.message).toContain('gen-0001');
    });

    it('reports an empty slot as having no generations rather than as a corruption', async () =>
    {
      // Arrange
      // Act
      const failure = await SaveFileSystem.readSlot('file9', sections => sections)
        .catch(error => error);

      // Assert
      expect(failure.kind()).toBe('save-storage-no-generations');
    });

    it('ignores a generation newer than the pointer, since it never completed', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      fake.storageManager.fsMkdirRecursive('save/file1/gen-0007/');
      fake.files.set('save/file1/gen-0007/manifest.json', JSON.stringify({ schemaVersion: 1, sections: [] }));

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json']).toEqual({ map: 1 });
    });
  });

  describe('SaveFileSystem.readManifest()', () =>
  {
    it('reads the display block without opening a single section', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      fake.reads.length = 0;

      // Act
      const manifest = SaveFileSystem.readManifest('file1');

      // Assert
      expect(manifest.display).toEqual({ title: 'test' });
      expect(fake.reads.some(path => path.endsWith('world.json'))).toBe(false);
    });

    it('steps back to an older generation whose manifest does read', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/gen-0002/manifest.json', 'nope');

      // Act
      const manifest = SaveFileSystem.readManifest('file1');

      // Assert
      expect(manifest.playtimeFrames).toBe(100);
    });

    it('answers with null for a slot that holds nothing', () =>
    {
      // Arrange
      // Act
      const manifest = SaveFileSystem.readManifest('file4');

      // Assert
      expect(manifest).toBe(null);
    });
  });

  describe('SaveFileSystem.readableGeneration()', () =>
  {
    it('names the generation the manifest came from', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });

      // Act
      const { generationName, manifest } = SaveFileSystem.readableGeneration('file1');

      // Assert
      expect(generationName).toBe('gen-0002');
      expect(manifest.display).toEqual({ title: 'test' });
    });

    it('names the older generation when the newest one will not read', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.set('save/file1/gen-0002/manifest.json', 'nope');

      // Act
      const { generationName } = SaveFileSystem.readableGeneration('file1');

      // Assert
      expect(generationName).toBe('gen-0001');
    });

    it('answers with nothing at all for a slot that holds nothing', () =>
    {
      // Arrange
      // Act
      const found = SaveFileSystem.readableGeneration('file4');

      // Assert
      expect(found).toEqual({
        generationName: '',
        manifest: null,
      });
    });
  });

  describe('SaveFileSystem.readManifestQuietly()', () =>
  {
    it('answers with the manifest when it reads', async () =>
    {
      // Arrange
      await writeGeneration('file1');

      // Act
      const manifest = SaveFileSystem.readManifestQuietly('file1', 'gen-0001');

      // Assert
      expect(manifest.playtimeFrames).toBe(100);
    });

    it('answers with null rather than throwing when it does not', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.files.set('save/file1/gen-0001/manifest.json', 'not json');

      // Act
      const manifest = SaveFileSystem.readManifestQuietly('file1', 'gen-0001');

      // Assert
      expect(manifest).toBe(null);
    });
  });

  describe('SaveFileSystem.readGenerationAt()', () =>
  {
    it('reads the exact generation asked for rather than the newest one', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });

      // Act
      const sections = await SaveFileSystem.readGenerationAt('file1', 'gen-0001', read => read);

      // Assert
      expect(sections['world.json']).toEqual({ map: 1 });
    });

    it('rejects rather than falling back when the generation asked for is torn', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.files.delete('save/file1/gen-0002/world.json');

      // Act
      const attempt = SaveFileSystem.readGenerationAt('file1', 'gen-0002', read => read);

      // Assert
      await expect(attempt).rejects.toThrow();
    });
  });

  describe('SaveFileSystem thumbnails', () =>
  {
    // a one-pixel PNG is real enough to prove the base64 was decoded rather than stored as text.
    const dataUrl = 'data:image/png;base64,'
      + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGMAAQAABQAB';

    it('writes real bytes rather than the data url text', () =>
    {
      // Arrange
      // Act
      SaveFileSystem.writeThumbnail('file1', 'gen-0001', dataUrl);

      // Assert
      const written = fake.files.get('save/file1/gen-0001/snapshot.png');
      expect(Buffer.isBuffer(written)).toBe(true);

      // the PNG magic number, which the data url text would not have started with.
      expect(written[0]).toBe(0x89);
      expect(written[1]).toBe(0x50);
    });

    it('turns a POSIX save path into a url with the scheme on the front', () =>
    {
      // Arrange
      // Act
      const url = SaveFileSystem.fileUrl('/home/je/games/ca/save/file1/gen-0001/snapshot.jpg');

      // Assert
      expect(url).toBe('file:///home/je/games/ca/save/file1/gen-0001/snapshot.jpg');
    });

    it('turns a Windows save path into a url, which is the whole reason this exists', () =>
    {
      // Arrange
      // `path.join` produces backslashes and a drive letter on Windows, and `<img>` cannot resolve
      // either - it reads the result as relative and quietly fails, on the platform CA ships on.
      // Act
      const url = SaveFileSystem.fileUrl('C:\\Games\\ChefAdventure\\save\\file1\\gen-0001\\snapshot.jpg');

      // Assert
      expect(url).toBe('file:///C:/Games/ChefAdventure/save/file1/gen-0001/snapshot.jpg');
    });

    it('escapes the spaces a game installed under "My Games" puts in every path it builds', () =>
    {
      // Arrange
      // Act
      const url = SaveFileSystem.fileUrl('C:\\My Games\\Chef Adventure\\save\\file1\\snapshot.jpg');

      // Assert
      expect(url).toBe('file:///C:/My%20Games/Chef%20Adventure/save/file1/snapshot.jpg');
    });

    it('escapes a hash, which would otherwise truncate the path into a fragment', () =>
    {
      // Arrange
      // Act
      const url = SaveFileSystem.fileUrl('/home/je/games #2/save/file1/snapshot.jpg');

      // Assert
      expect(url).toBe('file:///home/je/games%20%232/save/file1/snapshot.jpg');
    });

    it('builds a generation\'s picture url through the same conversion', () =>
    {
      // Arrange
      // Act
      const url = SaveFileSystem.thumbnailUrl('file1', 'gen-0003');

      // Assert
      expect(url).toBe('file:///save/file1/gen-0003/snapshot.png');
    });

    it('reports a picture that is there', () =>
    {
      // Arrange
      SaveFileSystem.writeThumbnail('file1', 'gen-0001', dataUrl);

      // Act
      const has = SaveFileSystem.hasThumbnail('file1', 'gen-0001');

      // Assert
      expect(has).toBe(true);
    });

    it('reports a picture that is not', () =>
    {
      // Arrange
      // Act
      const has = SaveFileSystem.hasThumbnail('file1', 'gen-0001');

      // Assert
      expect(has).toBe(false);
    });

    it('writes the picture beside a generation without naming it in the manifest', async () =>
    {
      // Arrange
      const sections = { 'world.json': { map: 1 } };

      // Act
      await SaveFileSystem.writeSlot('file1', sections, manifestFor(sections), dataUrl);

      // Assert
      expect(fake.files.has('save/file1/gen-0001/snapshot.png')).toBe(true);

      // naming it in `sections` would let a lost picture fail the whole generation into a rollback.
      const manifest = SaveFileSystem.readManifest('file1');
      expect(manifest.sections).toEqual([ 'world.json' ]);
    });

    it('writes no picture at all when the save had none to give', async () =>
    {
      // Arrange
      const sections = { 'world.json': { map: 1 } };

      // Act
      await SaveFileSystem.writeSlot('file1', sections, manifestFor(sections), '');

      // Assert
      expect(fake.files.has('save/file1/gen-0001/snapshot.png')).toBe(false);
    });

    it('loads a generation whose picture is missing, since a picture is never part of the set', async () =>
    {
      // Arrange
      const sections = { 'world.json': { map: 1 } };
      await SaveFileSystem.writeSlot('file1', sections, manifestFor(sections), dataUrl);
      fake.files.delete('save/file1/gen-0001/snapshot.png');

      // Act
      const read = await SaveFileSystem.readSlot('file1', loaded => loaded);

      // Assert
      expect(read['world.json']).toEqual({ map: 1 });
    });
  });

  describe('SaveFileSystem.slotExists()', () =>
  {
    it('is true for a slot whose pointer names a generation that is there', async () =>
    {
      // Arrange
      await writeGeneration('file1');

      // Act
      const exists = SaveFileSystem.slotExists('file1');

      // Assert
      expect(exists).toBe(true);
    });

    it('is false for a slot nobody has written', () =>
    {
      // Arrange
      // Act
      const exists = SaveFileSystem.slotExists('file2');

      // Assert
      expect(exists).toBe(false);
    });

    it('is false when the only generation there was is gone', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.storageManager.fsRemoveDirectory('save/file1/gen-0001/');

      // Act
      const exists = SaveFileSystem.slotExists('file1');

      // Assert
      expect(exists).toBe(false);
    });

    it('is true when the pointer names a generation that is gone but older ones remain', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.storageManager.fsRemoveDirectory('save/file1/gen-0002/');

      // Act
      const exists = SaveFileSystem.slotExists('file1');

      // Assert- this is exactly the case rollback exists for, and answering the pointer's question
      // instead of the slot's would grey the row out in the load menu: described, but unopenable.
      expect(exists).toBe(true);
    });

    it('agrees with what a read of the same slot would actually hand back', async () =>
    {
      // Arrange
      await writeGeneration('file1', { 'world.json': { map: 1 } });
      await writeGeneration('file1', { 'world.json': { map: 2 } });
      fake.storageManager.fsRemoveDirectory('save/file1/gen-0002/');

      // Act
      const exists = SaveFileSystem.slotExists('file1');
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(exists).toBe(true);
      expect(loaded['world.json']).toEqual({ map: 1 });
    });
  });

  describe('SaveFileSystem.removeSlot()', () =>
  {
    it('deletes every generation and the pointer with them', async () =>
    {
      // Arrange
      await writeGeneration('file1');

      // Act
      SaveFileSystem.removeSlot('file1');

      // Assert
      expect(fake.files.has('save/file1/current')).toBe(false);
      expect(fake.files.has('save/file1/gen-0001/world.json')).toBe(false);
    });
  });
  //endregion reading

  //region documents
  describe('SaveFileSystem documents', () =>
  {
    it('writes a document through a scratch file so the swap is atomic', async () =>
    {
      // Arrange
      // Act
      await SaveFileSystem.writeDocument('config.json', { alwaysDash: true });

      // Assert
      expect(fake.files.has('save/config.json.tmp')).toBe(false);
      expect(JSON.parse(fake.files.get('save/config.json'))).toEqual({ alwaysDash: true });
    });

    it('reads a document back', async () =>
    {
      // Arrange
      await SaveFileSystem.writeDocument('config.json', { alwaysDash: true });

      // Act
      const data = await SaveFileSystem.readDocument('config.json');

      // Assert
      expect(data).toEqual({ alwaysDash: true });
    });

    it('answers with null for a document a fresh install does not have yet', async () =>
    {
      // Arrange
      // Act
      const data = await SaveFileSystem.readDocument('profile.json');

      // Assert
      expect(data).toBe(null);
    });
  });
  //endregion documents

  //region what a generation claims about itself
  describe('SaveManifest.supportsSchemaVersion()', () =>
  {
    it('accepts a generation written at the version this build ships', () =>
    {
      // Arrange: the literal is the shipped schema version rather than a read of the static, so that
      // bumping the schema is a deliberate edit here instead of a test that agrees with itself.
      // Act
      const supported = SaveManifest.supportsSchemaVersion(1);

      // Assert
      expect(supported).toBe(true);
    });

    it('refuses a generation written at any other version, migration path or not', () =>
    {
      // Arrange
      // Act
      const supported = SaveManifest.supportsSchemaVersion(2);

      // Assert
      expect(supported).toBe(false);
    });
  });
  //endregion what a generation claims about itself

  //region routing
  describe('SaveDocument', () =>
  {
    it('answers with the registered section for a key it knows', () =>
    {
      // Arrange
      // Act
      const section = SaveDocument.sectionFor('party');

      // Assert
      expect(section).toBe('party.json');
    });

    it('answers with the fallback section for a key nobody registered', () =>
    {
      // Arrange
      // Act
      const section = SaveDocument.sectionFor('somePluginKey');

      // Assert
      expect(section).toBe('world.json');
    });
  });

  describe('SaveSectionRouter', () =>
  {
    beforeEach(() =>
    {
      SaveSectionRouter.routedNamespaces()
        .clear();
    });

    it('groups each top-level key into the section its document declares', () =>
    {
      // Arrange
      const contents = { map: { _mapId: 4 }, party: { _gold: 10 }, actors: { _data: [] } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(Object.keys(sections)
        .sort()).toEqual([ 'actors.json', 'party.json', 'world.json' ]);
    });

    it('keeps an unregistered top-level key rather than dropping it', () =>
    {
      // Arrange
      const contents = { time: { _seconds: 3 } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['world.json'].time).toEqual({ _seconds: 3 });
    });

    it('lifts a registered namespace off its hosts into a system file', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { party: { _j: { _abs: { level: 3 } } } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts.party.self).toEqual({ level: 3 });
    });

    it('lifts a namespace off the system singleton, keyed as that host kind\'s single member', () =>
    {
      // Arrange: only the system singleton carries the namespace. the other two singletons are here
      // and carry nothing, because a host being present is not what decides whether anything is
      // lifted off it.
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = {
        system: { _j: { _abs: { chapter: 2 } } },
        player: { _x: 5 },
        map: { _mapId: 4 },
      };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts).toEqual({ system: { self: { chapter: 2 } } });
    });

    it('lifts a namespace off the player singleton, keyed as that host kind\'s single member', () =>
    {
      // Arrange: the near-miss is the other way around this time, so a router that reached for any
      // singleton it found rather than the player specifically would answer with the wrong one.
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = {
        system: { _versionId: 9 },
        player: { _j: { _abs: { facing: 'down' } } },
        map: { _mapId: 4 },
      };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts).toEqual({ player: { self: { facing: 'down' } } });
    });

    it('lifts a namespace off the map itself, which is the host kind easiest to forget', () =>
    {
      // Arrange: the map carries the only `J_Timer` in a whole save, so it is a host in its own right
      // rather than merely the container the vehicles happen to sit in.
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = {
        system: { _versionId: 9 },
        player: { _x: 5 },
        map: { _mapId: 4, _j: { _abs: { region: 7 } } },
      };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts).toEqual({ map: { self: { region: 7 } } });
    });

    it('removes a lifted namespace from the host it came from', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { party: { _j: { _abs: { level: 3 }, _sdp: { points: 1 } } } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['party.json'].party._j).toEqual({ _sdp: { points: 1 } });
    });

    it('writes no system file for a plugin with nothing on any host', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { party: { _j: {} } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json']).toBe(undefined);
    });

    it('keys actor slices by actor id, so a departed actor cannot shift the rest', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { actors: { _data: [ null, null, { _j: { _abs: { hp: 1 } } } ] } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts.actors['2']).toEqual({ hp: 1 });
    });

    it('keys vehicle slices by vehicle type rather than by array position', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { map: { _vehicles: [ { _type: 'boat', _j: { _abs: { hp: 1 } } } ] } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json'].hosts.vehicles.boat).toEqual({ hp: 1 });
    });

    it('never treats a map event as a host', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const contents = { map: { _events: [ { _j: { _abs: { hp: 1 } } } ] } };

      // Act
      const sections = SaveSectionRouter.toSections(contents);

      // Assert
      expect(sections['systems/abs.json']).toBe(undefined);
      expect(sections['world.json'].map._events[0]._j._abs).toEqual({ hp: 1 });
    });

    it('puts a lifted slice back onto its host on the way in', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      const sections = SaveSectionRouter.toSections({ party: { _j: { _abs: { level: 3 } } } });

      // Act
      const contents = SaveSectionRouter.fromSections(sections);

      // Assert
      expect(contents.party._j._abs).toEqual({ level: 3 });
    });

    it('round-trips a document whose hosts carry several namespaces', () =>
    {
      // Arrange
      SaveSectionRouter.registerNamespace('_abs', 'abs');
      SaveSectionRouter.registerNamespace('_sdp', 'sdp');
      const original = {
        party: { _gold: 12, _j: { _abs: { level: 3 }, _sdp: { points: 4 } } },
        actors: { _data: [ null, { _j: { _abs: { hp: 9 } } } ] },
      };

      // Act
      const contents = SaveSectionRouter.fromSections(SaveSectionRouter.toSections(original));

      // Assert
      expect(contents).toEqual(original);
    });

    it('drops a slice whose host is no longer in the save, and says so', () =>
    {
      // Arrange
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() => 0);
      const sections = {
        'actors.json': { actors: { _data: [ null ] } },
        'systems/abs.json': { '@': 'save-section', plugin: '_abs', hosts: { actors: { 5: { hp: 1 } } } },
      };

      // Act
      const contents = SaveSectionRouter.fromSections(sections);

      // Assert
      expect(contents.actors._data[5]).toBe(undefined);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('leaves a host with no slice exactly as the file left it', () =>
    {
      // Arrange
      const sections = {
        'party.json': { party: { _gold: 12 } },
        'systems/abs.json': { '@': 'save-section', plugin: '_abs', hosts: {} },
      };

      // Act
      const contents = SaveSectionRouter.fromSections(sections);

      // Assert
      expect(contents.party).toEqual({ _gold: 12 });
    });
  });
  //endregion routing
});
//endregion plugins/_base/core/save/save-storage-layer.test.js