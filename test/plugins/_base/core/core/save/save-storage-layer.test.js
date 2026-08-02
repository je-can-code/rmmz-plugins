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
   * @returns {object}
   */
  const manifestFor = sections => SaveManifest.create(Object.keys(sections), { title: 'test' }, 100);

  /**
   * Writes one generation of a slot, with whatever sections the caller cares about.
   * @param {string} slotName The slot to write.
   * @param {Object<string, object>=} sections The sections to write.
   * @returns {Promise<void>}
   */
  const writeGeneration = (slotName, sections = { 'world.json': { map: 1 } }) =>
    SaveFileSystem.writeSlot(slotName, sections, manifestFor(sections));

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the save files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // the registry is a real global for these files; nothing here exercises codec behavior.
    globalThis.J = { BASE: { Metadata: { retainedSaveGenerations: 3 } } };

    ({ default: SaveManifest } = await import('../../../../../../src/plugins/_base/core/core/save/SaveManifest.js'));
    ({ default: SaveFileSystem } = await import('../../../../../../src/plugins/_base/core/managers/SaveFileSystem.js'));
    ({ default: SaveDocument } = await import('../../../../../../src/plugins/_base/core/core/save/SaveDocument.js'));
    ({ default: SaveSectionRouter } = await import('../../../../../../src/plugins/_base/core/core/save/SaveSectionRouter.js'));
  });

  beforeEach(() =>
  {
    fake = installFakeSaveFilesystem();
    globalThis.J.BASE.Metadata.retainedSaveGenerations = 3;
  });

  //region writing
  describe('SaveFileSystem.writeSlot()', () =>
  {
    it('writes the first generation as gen-0001 and points the slot at it', async () =>
    {
      // Arrange
      // Act
      await writeGeneration('file1');

      // Assert
      expect(fake.files.get('save/file1/current')).toBe('gen-0001');
      expect(fake.files.has('save/file1/gen-0001/world.json')).toBe(true);
      expect(fake.files.has('save/file1/gen-0001/manifest.json')).toBe(true);
    });

    it('writes each subsequent save as a new generation and repoints the slot', async () =>
    {
      // Arrange
      await writeGeneration('file1');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(fake.files.get('save/file1/current')).toBe('gen-0002');
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
      globalThis.J.BASE.Metadata.retainedSaveGenerations = 0;
      await writeGeneration('file1');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(SaveFileSystem.generationNames('file1')).toEqual([ 'gen-0002' ]);
    });

    it('steps over an orphaned generation rather than writing into it', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.storageManager.fsMkdirRecursive('save/file1/gen-0009/');

      // Act
      await writeGeneration('file1');

      // Assert
      expect(fake.files.get('save/file1/current')).toBe('gen-0010');
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

        outcomes.push(fake.files.get('save/file1/current'));
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

    it('is false when the pointer names a generation that is gone', async () =>
    {
      // Arrange
      await writeGeneration('file1');
      fake.storageManager.fsRemoveDirectory('save/file1/gen-0001/');

      // Act
      const exists = SaveFileSystem.slotExists('file1');

      // Assert
      expect(exists).toBe(false);
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