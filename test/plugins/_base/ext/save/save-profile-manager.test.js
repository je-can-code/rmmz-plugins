//region plugins/_base/ext/save/save-profile-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

describe('ProfileManager (direct src import)', () =>
{
  let ProfileManager;
  let SaveFileSystem;
  let SaveEncoder;
  let fake;

  /**
   * Lets every already-queued microtask run.
   *
   * `ProfileManager.load` deliberately does not hand its promise back - booting must not wait on the
   * profile - so a test has no chain to await. Yielding the microtask queue is what lets the `then`
   * and `catch` bodies run before the assertions read the result.
   * @returns {Promise<void>}
   */
  const flushPendingReads = () => Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());

  /**
   * Writes a profile document straight to the fake disk, bypassing the manager.
   *
   * The manager is what is under test, so seeding through its own `save()` would make every read test
   * depend on the write path being correct first.
   * @param {object} data The profile data to place on disk.
   */
  const placeProfileDocument = data =>
  {
    const encoded = SaveEncoder.encode(data, '$.profile');

    fake.files.set('save/profile.json', JSON.stringify(encoded, null, 2));
  };

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the save files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    // J-Base-Save reads the registry as a hoisted global rather than importing across ships.
    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveFileSystem } = await import(
      '../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveEncoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    ({ default: ProfileManager } = await import(
      '../../../../../src/plugins/_base/ext/save/managers/ProfileManager.js'));
  });

  beforeEach(() =>
  {
    fake = installFakeSaveFilesystem();

    // the manager's state is static and therefore survives between tests; each one starts from an
    // empty registration list rather than inheriting whatever the last test declared.
    ProfileManager.registeredFields()
      .clear();
    ProfileManager.values()
      .clear();
    ProfileManager._loaded = false;
  });

  //region registration
  describe('registerField()', () =>
  {
    it('seeds the field immediately, so a read before the document loads is answerable', () =>
    {
      // Arrange
      // Act
      ProfileManager.registerField('timesFinished', () => 0);

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(0);
    });

    it('calls the factory per registration, so no two fields share one mutable default', () =>
    {
      // Arrange
      const factory = () => [];

      // Act
      ProfileManager.registerField('seenEndings', factory);
      ProfileManager.registerField('seenBosses', factory);

      // Assert
      expect(ProfileManager.get('seenEndings')).not.toBe(ProfileManager.get('seenBosses'));
    });
  });

  describe('set()', () =>
  {
    it('replaces the live value without writing the document', () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);

      // Act
      ProfileManager.set('timesFinished', 4);

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(4);
      expect(fake.files.has('save/profile.json')).toBe(false);
    });
  });
  //endregion registration

  //region the document
  describe('makeData()', () =>
  {
    it('builds a plain object out of every live value', () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 2);
      ProfileManager.registerField('seenEndings', () => [ 'true' ]);

      // Act
      const data = ProfileManager.makeData();

      // Assert
      expect(data).toEqual({
        timesFinished: 2,
        seenEndings: [ 'true' ],
      });
    });
  });

  describe('applyData()', () =>
  {
    it('takes the value the document carries', () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);

      // Act
      ProfileManager.applyData({ timesFinished: 9 });

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(9);
    });

    it('re-seeds a field the document does not carry rather than leaving the last value', () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);
      ProfileManager.set('timesFinished', 9);

      // Act
      ProfileManager.applyData({});

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(0);
    });
  });
  //endregion the document

  //region reading and writing
  describe('load()', () =>
  {
    it('applies the document when one is on disk', async () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);
      placeProfileDocument({ timesFinished: 7 });

      // Act
      ProfileManager.load();
      await flushPendingReads();

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(7);
      expect(ProfileManager.isLoaded())
        .toBe(true);
    });

    it('treats an absent document as a fresh install rather than a failure', async () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);

      // Act
      ProfileManager.load();
      await flushPendingReads();

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(0);
      expect(ProfileManager.isLoaded())
        .toBe(true);
    });

    it('reports itself loaded even when the read fails, so a bad profile cannot block booting', async () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);
      vi.spyOn(SaveFileSystem, 'readDocument')
        .mockReturnValue(Promise.reject(new Error('unreadable')));

      // Act
      ProfileManager.load();
      await flushPendingReads();

      // Assert
      expect(ProfileManager.isLoaded())
        .toBe(true);
      expect(ProfileManager.get('timesFinished')).toBe(0);

      // spies on a bare global object leak into later tests in this file unless restored here.
      SaveFileSystem.readDocument.mockRestore();
    });
  });

  describe('save()', () =>
  {
    it('writes every live value into the profile document', async () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);
      ProfileManager.set('timesFinished', 3);

      // Act
      await ProfileManager.save();

      // Assert
      const written = JSON.parse(fake.files.get('save/profile.json'));
      expect(written.timesFinished).toBe(3);
    });

    it('round-trips through a load, which is the only assertion that proves both halves agree', async () =>
    {
      // Arrange
      ProfileManager.registerField('timesFinished', () => 0);
      ProfileManager.set('timesFinished', 5);
      await ProfileManager.save();
      ProfileManager.set('timesFinished', 0);

      // Act
      ProfileManager.load();
      await flushPendingReads();

      // Assert
      expect(ProfileManager.get('timesFinished')).toBe(5);
    });
  });
  //endregion reading and writing
});
//endregion plugins/_base/ext/save/save-profile-manager.test.js