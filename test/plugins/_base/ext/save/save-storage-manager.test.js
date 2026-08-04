//region plugins/_base/ext/save/save-storage-manager.test.js
import fs from 'node:fs';
import os from 'node:os';
import nodePath from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

describe('StorageManager (direct src import)', () =>
{
  beforeAll(() =>
  {
    // vanilla RMMZ core prototype extensions the save files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };
  });

  //region filesystem primitives
  describe('the filesystem primitives', () =>
  {
    /**
     * A real directory this block owns, removed when it finishes.
     *
     * These six functions exist to delegate to node's `fs`, and they reach it through a bare
     * `require('fs')` inside each body - which resolves to the genuine module in a test realm exactly
     * as it resolves to NW.js's in a shipped plugin. There is no seam to substitute at, and there
     * should not be: a fake `fs` asserting that `mkdirSync` was called with `recursive: true` proves
     * only that the test and the code agree, never that the directory appears. So these run against a
     * real temporary directory, and reach for a spy only where a failure has to be injected.
     * @type {string}
     */
    let temporaryDirectory;

    beforeAll(async () =>
    {
      temporaryDirectory = fs.mkdtempSync(nodePath.join(os.tmpdir(), 'jsave-storage-'));

      globalThis.StorageManager = {};

      // the module augments whichever object is standing there at import time.
      vi.resetModules();

      ({ default: globalThis.SerializableRegistry } = await import(
        '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

      await import('../../../../../src/plugins/_base/ext/save/managers/StorageManager.js');
    });

    afterAll(() =>
    {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    });

    /**
     * Builds a path inside this block's own directory.
     * @param {string} name The entry name.
     * @returns {string} The absolute path.
     */
    const inTemporaryDirectory = name => nodePath.join(temporaryDirectory, name);

    describe('fsExists()', () =>
    {
      it('answers true for a path that is there', () =>
      {
        // Arrange
        const file = inTemporaryDirectory('present.json');
        fs.writeFileSync(file, '{}');

        // Act
        const exists = StorageManager.fsExists(file);

        // Assert
        expect(exists).toBe(true);
      });

      it('answers false for a path that is not', () =>
      {
        // Arrange
        const file = inTemporaryDirectory('absent.json');

        // Act
        const exists = StorageManager.fsExists(file);

        // Assert
        expect(exists).toBe(false);
      });
    });

    describe('fsIsDirectory()', () =>
    {
      it('answers true for a directory', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('a-directory');
        fs.mkdirSync(directory);

        // Act
        const isDirectory = StorageManager.fsIsDirectory(directory);

        // Assert
        expect(isDirectory).toBe(true);
      });

      it('answers false for a file, rather than guessing from the name', () =>
      {
        // Arrange
        const file = inTemporaryDirectory('a-file.json');
        fs.writeFileSync(file, '{}');

        // Act
        const isDirectory = StorageManager.fsIsDirectory(file);

        // Assert
        expect(isDirectory).toBe(false);
      });
    });

    describe('fsMkdirRecursive()', () =>
    {
      it('creates every missing directory above the leaf, which a generation path needs', () =>
      {
        // Arrange
        const deep = inTemporaryDirectory('file1/gen-0007/systems');

        // Act
        StorageManager.fsMkdirRecursive(deep);

        // Assert
        expect(fs.existsSync(deep)).toBe(true);
      });

      it('leaves an existing directory alone rather than asking for it twice', () =>
      {
        // Arrange
        const existing = inTemporaryDirectory('already-here');
        fs.mkdirSync(existing);
        const mkdirSync = vi.spyOn(fs, 'mkdirSync');

        // Act
        StorageManager.fsMkdirRecursive(existing);

        // Assert
        expect(mkdirSync).not.toHaveBeenCalled();

        mkdirSync.mockRestore();
      });
    });

    describe('fsReaddir()', () =>
    {
      it('lists the entries of a directory without their directory', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('listable');
        fs.mkdirSync(directory);
        fs.writeFileSync(nodePath.join(directory, 'gen-0001'), '{}');
        fs.writeFileSync(nodePath.join(directory, 'gen-0002'), '{}');

        // Act
        const entries = StorageManager.fsReaddir(directory);

        // Assert
        expect(entries.sort()).toEqual([ 'gen-0001', 'gen-0002' ]);
      });
    });

    describe('fsWriteFileSynced()', () =>
    {
      it('leaves the bytes on disk, having fsynced them there', () =>
      {
        // Arrange
        const file = inTemporaryDirectory('written.json');

        // Act
        StorageManager.fsWriteFileSynced(file, '{"saved":true}');

        // Assert
        expect(fs.readFileSync(file, 'utf8')).toBe('{"saved":true}');
      });

      it('closes the descriptor even when the write throws, so a failed save leaks nothing', () =>
      {
        // Arrange
        const file = inTemporaryDirectory('doomed.json');
        const writeSync = vi.spyOn(fs, 'writeSync')
          .mockImplementation(() =>
          {
            throw new Error('disk full');
          });
        const closeSync = vi.spyOn(fs, 'closeSync');

        // Act
        const write = () => StorageManager.fsWriteFileSynced(file, '{}');

        // Assert
        expect(write).toThrow('disk full');
        expect(closeSync).toHaveBeenCalledTimes(1);

        writeSync.mockRestore();
        closeSync.mockRestore();
      });
    });

    describe('fsSyncDirectory()', () =>
    {
      it('flushes the directory entries, making the files existing durable too', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('syncable');
        fs.mkdirSync(directory);
        const fsyncSync = vi.spyOn(fs, 'fsyncSync');

        // Act
        StorageManager.fsSyncDirectory(directory);

        // Assert
        expect(fsyncSync).toHaveBeenCalledTimes(1);

        fsyncSync.mockRestore();
      });

      it('swallows a platform that will not open a directory rather than failing the save', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('unopenable');
        fs.mkdirSync(directory);
        const openSync = vi.spyOn(fs, 'openSync')
          .mockImplementation(() =>
          {
            throw new Error('EPERM, as Windows would');
          });

        // Act
        const sync = () => StorageManager.fsSyncDirectory(directory);

        // Assert
        expect(sync).not.toThrow();

        openSync.mockRestore();
      });

      it('still closes the descriptor when the flush itself throws', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('unflushable');
        fs.mkdirSync(directory);
        const fsyncSync = vi.spyOn(fs, 'fsyncSync')
          .mockImplementation(() =>
          {
            throw new Error('EINVAL');
          });
        const closeSync = vi.spyOn(fs, 'closeSync');

        // Act
        StorageManager.fsSyncDirectory(directory);

        // Assert
        expect(closeSync).toHaveBeenCalledTimes(1);

        fsyncSync.mockRestore();
        closeSync.mockRestore();
      });
    });

    describe('fsRemoveDirectory()', () =>
    {
      it('deletes the directory and everything inside it', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('doomed-slot');
        fs.mkdirSync(nodePath.join(directory, 'gen-0001'), { recursive: true });
        fs.writeFileSync(nodePath.join(directory, 'gen-0001', 'world.json'), '{}');

        // Act
        StorageManager.fsRemoveDirectory(directory);

        // Assert
        expect(fs.existsSync(directory)).toBe(false);
      });

      it('does nothing when the directory is already gone', () =>
      {
        // Arrange
        const directory = inTemporaryDirectory('never-existed');
        const rmSync = vi.spyOn(fs, 'rmSync');

        // Act
        StorageManager.fsRemoveDirectory(directory);

        // Assert
        expect(rmSync).not.toHaveBeenCalled();

        rmSync.mockRestore();
      });
    });
  });
  //endregion filesystem primitives

  //region the pipeline
  describe('the pipeline', () =>
  {
    let fake;
    let SaveFileSystem;

    beforeEach(async () =>
    {
      fake = installFakeSaveFilesystem();

      // snapshotted before the import, and this is the whole trick: the fake *is* the global the
      // module is about to augment, so importing overwrites its primitives with the real ones that
      // reach an actual disk. Re-applying from a separate copy afterwards is what puts the in-memory
      // ones back underneath the pipeline; re-applying from the global itself would be a no-op.
      const inMemoryPrimitives = { ...fake.storageManager };

      vi.resetModules();

      ({ default: globalThis.SerializableRegistry } = await import(
        '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

      await import('../../../../../src/plugins/_base/ext/save/managers/StorageManager.js');
      ({ default: SaveFileSystem } = await import(
        '../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));

      Object.assign(globalThis.StorageManager, inMemoryPrimitives);

      // everything `saveSlot` reads to build a manifest, none of which is under test here.
      globalThis.DataManager = { makeSavefileInfo: () => ({ title: 'Chef Adventure' }) };
      globalThis.Graphics = { frameCount: 3600 };
      globalThis.$gameSystem = { playthroughId: () => 'playthrough-a' };
      globalThis.SceneManager = { backgroundBitmap: () => null };
    });

    describe('isSlotName()', () =>
    {
      it('recognizes a playthrough slot by the shape makeSavename builds', () =>
      {
        // Arrange
        // Act
        const isSlot = StorageManager.isSlotName('file12');

        // Assert
        expect(isSlot).toBe(true);
      });

      it('treats anything else as a scope-level document', () =>
      {
        // Arrange
        // Act
        const isSlot = StorageManager.isSlotName('config');

        // Assert
        expect(isSlot).toBe(false);
      });
    });

    describe('documentFileName()', () =>
    {
      it('names a document after itself, so nothing downstream has to know what a file is', () =>
      {
        // Arrange
        // Act
        const fileName = StorageManager.documentFileName('config');

        // Assert
        expect(fileName).toBe('config.json');
      });
    });

    describe('saveObject()', () =>
    {
      it('writes a slot as a generation directory', async () =>
      {
        // Arrange
        // Act
        await StorageManager.saveObject('file1', { system: { name: 'a save' } });

        // Assert
        expect(fake.files.has('save/file1/gen-0001/manifest.json')).toBe(true);
      });

      it('writes a document as one file instead', async () =>
      {
        // Arrange
        // Act
        await StorageManager.saveObject('config', { alwaysDash: true });

        // Assert
        expect(fake.files.has('save/config.json')).toBe(true);
      });
    });

    describe('loadObject()', () =>
    {
      it('reads a slot back through the router', async () =>
      {
        // Arrange
        await StorageManager.saveObject('file1', { system: { name: 'a save' } });

        // Act
        const contents = await StorageManager.loadObject('file1');

        // Assert
        expect(contents.system.name).toBe('a save');
      });

      it('reads a document back through the decoder', async () =>
      {
        // Arrange
        await StorageManager.saveObject('config', { alwaysDash: true });

        // Act
        const config = await StorageManager.loadObject('config');

        // Assert
        expect(config.alwaysDash).toBe(true);
      });
    });

    describe('loadDocument()', () =>
    {
      it('hands back null on a fresh install, which every caller already has a path for', async () =>
      {
        // Arrange
        // Act
        const config = await StorageManager.loadDocument('config');

        // Assert
        expect(config).toBeNull();
      });
    });

    describe('loadGeneration()', () =>
    {
      it('opens the generation it was pointed at rather than the newest one', async () =>
      {
        // Arrange
        await StorageManager.saveObject('file1', { system: { name: 'first' } });
        await StorageManager.saveObject('file1', { system: { name: 'second' } });

        // Act
        const contents = await StorageManager.loadGeneration('file1', 'gen-0001');

        // Assert
        expect(contents.system.name).toBe('first');
      });
    });

    describe('exists()', () =>
    {
      it('asks the generation layer about a slot', async () =>
      {
        // Arrange
        await StorageManager.saveObject('file1', { system: {} });

        // Act
        const exists = StorageManager.exists('file1');

        // Assert
        expect(exists).toBe(true);
      });

      it('asks the filesystem about a document', async () =>
      {
        // Arrange
        await StorageManager.saveObject('config', { alwaysDash: true });

        // Act
        const exists = StorageManager.exists('config');

        // Assert
        expect(exists).toBe(true);
      });

      it('answers false for a slot that was never written', () =>
      {
        // Arrange
        // Act
        const exists = StorageManager.exists('file2');

        // Assert
        expect(exists).toBe(false);
      });
    });

    describe('remove()', () =>
    {
      it('takes a slot and its whole generation history with it', async () =>
      {
        // Arrange
        await StorageManager.saveObject('file1', { system: {} });

        // Act
        StorageManager.remove('file1');

        // Assert
        expect(StorageManager.exists('file1')).toBe(false);
      });

      it('unlinks a document', async () =>
      {
        // Arrange
        await StorageManager.saveObject('config', { alwaysDash: true });

        // Act
        StorageManager.remove('config');

        // Assert
        expect(fake.files.has('save/config.json')).toBe(false);
      });
    });

    describe('filePath()', () =>
    {
      it('resolves a slot to its directory', () =>
      {
        // Arrange
        // Act
        const path = StorageManager.filePath('file1');

        // Assert
        expect(path).toBe(SaveFileSystem.slotDirectory('file1'));
      });

      it('resolves a document to its file', () =>
      {
        // Arrange
        // Act
        const path = StorageManager.filePath('config');

        // Assert
        expect(path).toBe(SaveFileSystem.documentPath('config.json'));
      });
    });
  });
  //endregion the pipeline
});
//endregion plugins/_base/ext/save/save-storage-manager.test.js