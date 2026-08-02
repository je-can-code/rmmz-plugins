//region plugins/_base/core/save/save-migration-chain.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import legacyGenerationV1 from './fixtures/legacy-generation-v1.json' with { type: 'json' };
import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

/**
 * The versioning seam, and the property it exists to buy: a slot written by an older build opens in
 * a newer one.
 *
 * The chain is empty in the shipping game and will stay that way until the first schema change, so
 * everything here arranges a chain of its own. That is the point rather than a limitation - a
 * migration written a year from now is only trustworthy if the mechanism it drops into was proven
 * against a committed document from before it existed, which is what
 * `fixtures/legacy-generation-v1.json` is.
 */
describe('save migration chain (direct src import)', () =>
{
  let SaveMigrationRegistry;
  let SaveManifest;
  let SaveFileSystem;
  let fake;
  let shippedSchemaVersion;

  /**
   * Writes a generation into the fake filesystem exactly as the real writer lays one out, without
   * going through the writer - these tests are about what the *reader* does with an old document.
   * @param {string} slotName The slot to seed.
   * @param {object} document The `{ manifest, sections }` pair to lay down.
   */
  const seedGeneration = (slotName, document) =>
  {
    fake.storageManager.fsMkdirRecursive(`save/${slotName}/gen-0001/`);

    Object.keys(document.sections)
      .forEach(sectionName =>
      {
        fake.files.set(
          `save/${slotName}/gen-0001/${sectionName}`,
          JSON.stringify(document.sections[sectionName]));
      });

    fake.files.set(`save/${slotName}/gen-0001/manifest.json`, JSON.stringify(document.manifest));
    fake.files.set(`save/${slotName}/current`, 'gen-0001');
  };

  /**
   * A migration that records having run and stamps the section it touched.
   * @param {string} marker The value to write, so a test can see which steps ran and in what order.
   * @returns {Function} The migration step.
   */
  const stampingMigration = marker => document =>
  {
    document.sections['world.json'].migrations ??= [];
    document.sections['world.json'].migrations.push(marker);

    return document;
  };

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    // J-Base-Save reads the registry as a hoisted global rather than importing across ships.
    ({ default: globalThis.SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    ({ default: SaveManifest } = await import('../../../../../src/plugins/_base/ext/save/core/SaveManifest.js'));
    ({ default: SaveMigrationRegistry } = await import(
      '../../../../../src/plugins/_base/ext/save/core/SaveMigrationRegistry.js'));
    ({ default: SaveFileSystem } = await import('../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));

    shippedSchemaVersion = SaveManifest.schemaVersion;
  });

  beforeEach(() =>
  {
    fake = installFakeSaveFilesystem();
    SaveMigrationRegistry.reset();
    SaveManifest.schemaVersion = shippedSchemaVersion;
  });

  //region registration
  describe('SaveMigrationRegistry.register()', () =>
  {
    it('files a step under the version it reads', () =>
    {
      // Arrange
      const step = document => document;

      // Act
      SaveMigrationRegistry.register(1, step);

      // Assert
      expect(SaveMigrationRegistry.migrations()
        .get(1)).toBe(step);
    });

    it('throws when two steps claim the same version', () =>
    {
      // Arrange
      SaveMigrationRegistry.register(1, document => document);

      // Act
      // Assert
      expect(() => SaveMigrationRegistry.register(1, document => document))
        .toThrow(/already registered/);
    });
  });
  //endregion registration

  //region path checking
  describe('SaveMigrationRegistry.hasPathToCurrent()', () =>
  {
    it('is true for a document already at the current version, with no steps registered', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;

      // Act
      // Assert
      expect(SaveMigrationRegistry.hasPathToCurrent(3)).toBe(true);
    });

    it('is true when every intermediate step exists', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      SaveMigrationRegistry.register(1, document => document);
      SaveMigrationRegistry.register(2, document => document);

      // Act
      // Assert
      expect(SaveMigrationRegistry.hasPathToCurrent(1)).toBe(true);
    });

    it('is false when a step in the middle of the chain is missing', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      SaveMigrationRegistry.register(2, document => document);

      // Act
      // Assert
      expect(SaveMigrationRegistry.hasPathToCurrent(1)).toBe(false);
    });

    it('is false for a document written by a newer build, which no migration can ever reach', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;

      // Act
      // Assert
      expect(SaveMigrationRegistry.hasPathToCurrent(5)).toBe(false);
    });
  });

  describe('SaveMigrationRegistry.firstMissingStep()', () =>
  {
    it('names the earliest version with no step', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 4;
      SaveMigrationRegistry.register(1, document => document);
      SaveMigrationRegistry.register(3, document => document);

      // Act
      // Assert
      expect(SaveMigrationRegistry.firstMissingStep(1)).toBe(2);
    });

    it('answers zero when the chain is complete', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;
      SaveMigrationRegistry.register(1, document => document);

      // Act
      // Assert
      expect(SaveMigrationRegistry.firstMissingStep(1)).toBe(0);
    });
  });
  //endregion path checking

  //region applying
  describe('SaveMigrationRegistry.apply()', () =>
  {
    it('passes a current-version document straight through', () =>
    {
      // Arrange
      const document = { manifest: { schemaVersion: shippedSchemaVersion }, sections: { 'world.json': {} } };

      // Act
      const migrated = SaveMigrationRegistry.apply(document);

      // Assert
      expect(migrated).toBe(document);
    });

    it('runs each step once, in ascending version order', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      SaveMigrationRegistry.register(1, stampingMigration('one-to-two'));
      SaveMigrationRegistry.register(2, stampingMigration('two-to-three'));
      const document = { manifest: { schemaVersion: 1 }, sections: { 'world.json': {} } };

      // Act
      const migrated = SaveMigrationRegistry.apply(document);

      // Assert
      expect(migrated.sections['world.json'].migrations).toEqual([ 'one-to-two', 'two-to-three' ]);
    });

    it('stamps the new version itself, so a step that forgets cannot exist', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      SaveMigrationRegistry.register(1, document => document);
      SaveMigrationRegistry.register(2, document => document);

      // Act
      const migrated = SaveMigrationRegistry.apply({ manifest: { schemaVersion: 1 }, sections: {} });

      // Assert
      expect(migrated.manifest.schemaVersion).toBe(3);
    });

    it('carries a step that replaces the document wholesale rather than mutating it', () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;
      SaveMigrationRegistry.register(1, document => ({
        manifest: { ...document.manifest, sections: [ 'world.json' ] },
        sections: { 'world.json': { renamed: true } },
      }));

      // Act
      const migrated = SaveMigrationRegistry.apply({
        manifest: { schemaVersion: 1, sections: [ 'old.json' ] },
        sections: { 'old.json': {} },
      });

      // Assert
      expect(migrated.sections).toEqual({ 'world.json': { renamed: true } });
    });
  });
  //endregion applying

  //region the real read path
  describe('SaveFileSystem reading an older generation', () =>
  {
    it('refuses a version it has no chain for, naming the missing step', async () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      seedGeneration('file1', legacyGenerationV1);

      // Act
      const failure = await SaveFileSystem.readSlot('file1', sections => sections)
        .catch(error => error);

      // Assert
      expect(failure.message).toMatch(/No migration is registered from version 1/);
    });

    it('says a save is from a newer build rather than naming a step nobody could write', async () =>
    {
      // Arrange
      seedGeneration('file1', {
        ...legacyGenerationV1,
        manifest: { ...legacyGenerationV1.manifest, schemaVersion: shippedSchemaVersion + 4 },
      });

      // Act
      const failure = await SaveFileSystem.readSlot('file1', sections => sections)
        .catch(error => error);

      // Assert
      expect(failure.message).toMatch(/written by a newer build/);
    });

    it('carries a committed version-1 document forward two versions and hands over the result', async () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 3;
      seedGeneration('file1', legacyGenerationV1);

      // the shape of a real migration: rename a field, and let the registry handle the stamp.
      SaveMigrationRegistry.register(1, document =>
      {
        document.sections['party.json'].party._walletGold = document.sections['party.json'].party._gold;
        delete document.sections['party.json'].party._gold;

        return document;
      });
      SaveMigrationRegistry.register(2, document =>
      {
        document.sections['world.json'].system._saveCount += 100;

        return document;
      });

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', (sections, manifest) => ({ sections, manifest }));

      // Assert
      expect(loaded.sections['party.json'].party._walletGold).toBe(412);
      expect(loaded.sections['party.json'].party._gold).toBeUndefined();
      expect(loaded.sections['world.json'].system._saveCount).toBe(103);
      expect(loaded.manifest.schemaVersion).toBe(3);
    });

    it('opens a current-version generation without consulting the chain at all', async () =>
    {
      // Arrange
      seedGeneration('file1', {
        ...legacyGenerationV1,
        manifest: { ...legacyGenerationV1.manifest, schemaVersion: shippedSchemaVersion },
      });

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['party.json'].party._gold).toBe(412);
    });

    it('falls back to an older generation when a migration throws', async () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;
      SaveMigrationRegistry.register(1, () =>
      {
        throw new Error('this migration is broken');
      });

      // the older generation is already at the current version, so it needs no migration to open.
      fake.storageManager.fsMkdirRecursive('save/file1/gen-0001/');
      fake.files.set(
        'save/file1/gen-0001/manifest.json',
        JSON.stringify({ schemaVersion: 2, sections: [ 'world.json' ] }));
      fake.files.set('save/file1/gen-0001/world.json', JSON.stringify({ intact: true }));

      fake.storageManager.fsMkdirRecursive('save/file1/gen-0002/');
      fake.files.set(
        'save/file1/gen-0002/manifest.json',
        JSON.stringify({ schemaVersion: 1, sections: [ 'world.json' ] }));
      fake.files.set('save/file1/gen-0002/world.json', JSON.stringify({ intact: false }));
      fake.files.set('save/file1/current', 'gen-0002');

      // Act
      const loaded = await SaveFileSystem.readSlot('file1', sections => sections);

      // Assert
      expect(loaded['world.json'].intact).toBe(true);
    });

    it('lets the load menu read the manifest of a migratable generation', async () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;
      SaveMigrationRegistry.register(1, document => document);
      seedGeneration('file1', legacyGenerationV1);

      // Act
      const manifest = SaveFileSystem.readManifest('file1');

      // Assert
      expect(manifest.display.leaderName).toBe('Jerald');
    });

    it('hides a generation from the load menu when no chain reaches it', async () =>
    {
      // Arrange
      SaveManifest.schemaVersion = 2;
      seedGeneration('file1', legacyGenerationV1);

      // Act
      const manifest = SaveFileSystem.readManifest('file1');

      // Assert
      expect(manifest).toBe(null);
    });
  });
  //endregion the real read path
});
//endregion plugins/_base/core/save/save-migration-chain.test.js