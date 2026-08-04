//region plugins/_base/ext/save/save-core-edges.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installFakeSaveFilesystem } from './fixtures/install-fake-save-filesystem.js';

describe('save core edges (direct src import)', () =>
{
  let SaveCodec;
  let SaveDecoder;
  let SaveError;
  let SaveFileEntry;
  let SaveFileSystem;
  let SaveThumbnail;
  let SerializableRegistry;

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the save files read at module scope.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // the crop arithmetic clamps with the engine's own `Number` extension, defined in rmmz_core.
    Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };

    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    ({ default: SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));
    globalThis.SerializableRegistry = SerializableRegistry;

    ({ default: SaveCodec } = await import('../../../../../src/plugins/_base/ext/save/core/SaveCodec.js'));
    ({ default: SaveDecoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveDecoder.js'));
    ({ default: SaveError } = await import('../../../../../src/plugins/_base/ext/save/core/SaveError.js'));
    ({ default: SaveFileEntry } = await import('../../../../../src/plugins/_base/ext/save/core/SaveFileEntry.js'));
    ({ default: SaveFileSystem } = await import(
      '../../../../../src/plugins/_base/ext/save/managers/SaveFileSystem.js'));
    ({ default: SaveThumbnail } = await import('../../../../../src/plugins/_base/ext/save/core/SaveThumbnail.js'));
  });

  //region what a codec remembers
  describe('SaveCodec.aliases()', () =>
  {
    it('hands back the older save ids that still resolve to this type', () =>
    {
      // Arrange
      class Renamed
      {
      }

      SerializableRegistry.register(Renamed, { aliases: [ 'OldName', 'OlderName' ] });
      const declarations = SerializableRegistry.registrations()
        .get(Renamed);

      // Act
      const codec = new SaveCodec(Renamed, declarations);

      // Assert
      expect(codec.aliases()).toEqual([ 'OldName', 'OlderName' ]);
    });
  });

  describe('SaveError.path()', () =>
  {
    it('names the node that failed, which is the whole point of a save error', () =>
    {
      // Arrange
      // Act
      const error = new SaveError('something went wrong', '$.party._actors[0]');

      // Assert
      expect(error.path()).toBe('$.party._actors[0]');
    });
  });

  describe('SaveDecoder.hasDeclarationsBelow()', () =>
  {
    it('answers yes when only the typed tree carries children', () =>
    {
      // Arrange
      const typedChild = { children: new Map([ [ '_lastItem', {} ] ]) };

      // Act
      const hasDeclarations = SaveDecoder.hasDeclarationsBelow(typedChild, null);

      // Assert
      expect(hasDeclarations).toBe(true);
    });

    it('answers yes when only the dictionary-value tree carries children', () =>
    {
      // Arrange
      const typedValuesChild = { children: new Map([ [ 'entries', {} ] ]) };

      // Act
      const hasDeclarations = SaveDecoder.hasDeclarationsBelow(null, typedValuesChild);

      // Assert
      expect(hasDeclarations).toBe(true);
    });

    it('answers no when neither tree has anything below this point', () =>
    {
      // Arrange
      const empty = { children: new Map() };

      // Act
      const hasDeclarations = SaveDecoder.hasDeclarationsBelow(empty, empty);

      // Assert
      expect(hasDeclarations).toBe(false);
    });
  });
  //endregion what a codec remembers

  //region a row with nothing in it
  describe('SaveFileEntry on an empty slot', () =>
  {
    /**
     * The row a slot nobody has saved to produces.
     *
     * Every accessor below has an empty-row arm, and they exist because the list draws all its rows
     * whether or not they hold anything - an empty slot is a row a player can select in save mode, not
     * a row the scene skips.
     * @returns {SaveFileEntry} The empty row.
     */
    const emptyRow = () => new SaveFileEntry(3, 'file3', '', '', null);

    it('draws an empty display block rather than reaching into a manifest that is not there', () =>
    {
      // Arrange
      const entry = emptyRow();

      // Act
      const display = entry.display();

      // Assert
      expect(display).toEqual({});
    });

    it('reports no timestamp', () =>
    {
      // Arrange
      const entry = emptyRow();

      // Act
      const savedAt = entry.savedAt();

      // Assert
      expect(savedAt).toBe('');
    });

    it('reports zero playtime', () =>
    {
      // Arrange
      const entry = emptyRow();

      // Act
      const playtimeFrames = entry.playtimeFrames();

      // Assert
      expect(playtimeFrames).toBe(0);
    });
  });
  //endregion a row with nothing in it

  //region the picture
  describe('SaveThumbnail', () =>
  {
    /**
     * Stands in for the browser canvas the encoder draws into.
     *
     * Only three members are reached - the two dimensions and `getContext` - so this is the whole
     * surface rather than a trimmed-down one.
     * @returns {object} The fake canvas, recording what was drawn onto it.
     */
    const installFakeDocument = () =>
    {
      const canvas = {
        width: 0,
        height: 0,
        drawnWith: null,

        getContext: () => ({
          drawImage: (...args) =>
          {
            canvas.drawnWith = args;
          },
        }),

        toDataURL: format => `data:${format};base64,PICTURE`,
      };

      globalThis.document = { createElement: () => canvas };

      return canvas;
    };

    beforeEach(() =>
    {
      globalThis.$gamePlayer = {
        screenX: () => 400,
        screenY: () => 300,
      };
    });

    it('has nothing to photograph before the player has ever left a map', () =>
    {
      // Arrange
      globalThis.SceneManager = { backgroundBitmap: () => null };

      // Act
      const picture = SaveThumbnail.capture();

      // Assert
      expect(picture).toBe('');
    });

    it('crops around the player and encodes what it kept', () =>
    {
      // Arrange
      const canvas = installFakeDocument();
      const source = { width: 816, height: 624, canvas: 'the-source-canvas' };
      globalThis.SceneManager = { backgroundBitmap: () => source };

      // Act
      const picture = SaveThumbnail.capture();

      // Assert
      expect(picture).toBe('data:image/png;base64,PICTURE');
      expect(canvas.drawnWith[0]).toBe('the-source-canvas');
    });

    it('draws into its own canvas rather than onto the source, sized to the region kept', () =>
    {
      // Arrange
      const canvas = installFakeDocument();
      const source = { width: 816, height: 624, canvas: 'the-source-canvas' };

      // Act
      SaveThumbnail.encode(source, 10, 20, 400, 225);

      // Assert
      expect(canvas.width).toBe(400);
      expect(canvas.height).toBe(225);
      expect(canvas.drawnWith).toEqual([ 'the-source-canvas', 10, 20, 400, 225, 0, 0, 400, 225 ]);
    });
  });
  //endregion the picture

  //region reads and writes that go wrong
  describe('SaveFileSystem failure paths', () =>
  {
    let fake;

    beforeEach(() =>
    {
      fake = installFakeSaveFilesystem();
    });

    it('describes an unreadable manifest in words a load menu can draw', () =>
    {
      // Arrange
      fake.files.set('save/file1/gen-0001/manifest.json', 'not json at all');

      // Act
      const savedAt = SaveFileSystem.savedAtOf('file1', 'gen-0001');

      // Assert
      expect(savedAt).toBe('an unknown time');
    });

    it('rejects rather than throwing when a document write fails', async () =>
    {
      // Arrange
      fake.failOnWrite = 1;

      // Act
      const write = SaveFileSystem.writeDocument('config.json', { alwaysDash: true });

      // Assert
      await expect(write).rejects.toThrow('injected failure on write 1');
    });

    it('rejects rather than throwing when a document will not parse', async () =>
    {
      // Arrange
      fake.files.set('save/config.json', 'not json at all');

      // Act
      const read = SaveFileSystem.readDocument('config.json');

      // Assert
      await expect(read).rejects.toThrow();
    });
  });
  //endregion reads and writes that go wrong

  //region hosts that moved or went away
  describe('SaveSectionRouter host resolution', () =>
  {
    let SaveSectionRouter;

    beforeAll(async () =>
    {
      ({ default: SaveSectionRouter } = await import(
        '../../../../../src/plugins/_base/ext/save/core/SaveSectionRouter.js'));
    });

    it('skips a follower slot the save left empty rather than keying a slice to nothing', () =>
    {
      // Arrange
      const encoded = { player: { _followers: { _data: [ null, { name: 'second' } ] } } };

      // Act
      const hosts = SaveSectionRouter.encodedHosts(encoded);

      // Assert
      expect(hosts.followers['0']).toBeUndefined();
      expect(hosts.followers['1']).toEqual({ name: 'second' });
    });

    it('keys a vehicle by its type, because boat says what it is and zero says where it sat', () =>
    {
      // Arrange
      const encoded = { map: { _vehicles: [ { _type: 'boat' }, { _type: 'ship' } ] } };

      // Act
      const hosts = SaveSectionRouter.encodedHosts(encoded);

      // Assert
      expect(hosts.vehicles.boat).toEqual({ _type: 'boat' });
      expect(hosts.vehicles.ship).toEqual({ _type: 'ship' });
    });

    it('falls back to the position for a vehicle with no type, and skips an absent one', () =>
    {
      // Arrange
      const encoded = { map: { _vehicles: [ null, { name: 'untyped' } ] } };

      // Act
      const hosts = SaveSectionRouter.encodedHosts(encoded);

      // Assert
      expect(hosts.vehicles['0']).toBeUndefined();
      expect(hosts.vehicles['1']).toEqual({ name: 'untyped' });
    });

    it('drops a slice whose whole host kind is absent from the save, and says so once', () =>
    {
      // Arrange
      const encoded = { system: { _j: {} } };
      const section = { plugin: '_sdp', hosts: { enemies: { '3': { points: 12 } } } };
      const warn = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      SaveSectionRouter.placeSystemSlices(encoded, section);

      // Assert
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('enemies.3');

      warn.mockRestore();
    });

    it('places a slice back onto the host it came from when that host is still here', () =>
    {
      // Arrange
      const encoded = { actors: { _data: [ null, { name: 'Jerald' } ] } };
      const section = { plugin: '_sdp', hosts: { actors: { '1': { points: 12 } } } };

      // Act
      SaveSectionRouter.placeSystemSlices(encoded, section);

      // Assert
      expect(encoded.actors._data[1]._j._sdp).toEqual({ points: 12 });
    });
  });
  //endregion hosts that moved or went away

  //region declarations the walkers accept
  describe('SaveCodec seeding', () =>
  {
    it('refuses to seed from an initMembers that takes parameters, since it is a mapper', () =>
    {
      // Arrange
      class MappedFromRow
      {
        /**
         * Reads a database row it is handed, which is nothing a savefile can supply.
         * @param {object} row The row being mapped.
         */
        initMembers(row)
        {
          this.id = row.id;
        }
      }

      SerializableRegistry.register(MappedFromRow);
      const declarations = SerializableRegistry.registrations()
        .get(MappedFromRow);
      const codec = new SaveCodec(MappedFromRow, declarations);
      const instance = Object.create(MappedFromRow.prototype);

      // Act
      const seed = () => codec.seed(instance);

      // Assert
      expect(seed).not.toThrow();
      expect(Object.keys(instance)).toEqual([]);
    });
  });

  describe('SaveEncoder typed-field policing', () =>
  {
    let SaveEncoder;

    beforeAll(async () =>
    {
      ({ default: SaveEncoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    });

    it('accepts a class instance declared as the head of a dictionary-value path', () =>
    {
      // Arrange
      class Held
      {
        constructor()
        {
          this.id = 4;
        }
      }

      class Holder
      {
        constructor()
        {
          this.holder = new Held();
        }
      }

      SerializableRegistry.register(Held);
      SerializableRegistry.register(Holder, { typedValues: { holder: Held } });

      // Act
      const encode = () => SaveEncoder.encode(new Holder(), '$.holder');

      // Assert
      expect(encode).not.toThrow();
    });

    it('stops descending at a null, rather than walking into it looking for the transient below', () =>
    {
      // Arrange
      class NestedHost
      {
        constructor()
        {
          this.nest = null;
        }
      }

      // the waypoint is a dotted transient path, which is the shape every plugin's registration
      // module writes - `_j._tools._grabThrow._grab._wait` and friends.
      SerializableRegistry.register(NestedHost, { transients: { 'nest.deep': () => null } });

      // Act
      const encoded = SaveEncoder.encode(new NestedHost(), '$.nested');

      // Assert
      expect(encoded.nest).toBeNull();
    });

    it('hands a class instance to the general walk when a transient waypoint still sits below it', () =>
    {
      // Arrange
      class Middle
      {
        constructor()
        {
          this.kept = 'yes';
          this.deep = 'a stopwatch';
        }
      }

      class InstanceHost
      {
        constructor()
        {
          this.nest = new Middle();
        }
      }

      SerializableRegistry.register(Middle);
      SerializableRegistry.register(InstanceHost, {
        typed: { nest: Middle },
        transients: { 'nest.deep': () => 'a fresh stopwatch' },
      });

      // Act
      const encoded = SaveEncoder.encode(new InstanceHost(), '$.instanceHost');

      // Assert
      expect(encoded.nest.kept).toBe('yes');
    });

    it('refuses a class instance nothing declared, naming the path and the type', () =>
    {
      // Arrange
      class Undeclared
      {
        constructor()
        {
          this.id = 9;
        }
      }

      class Careless
      {
        constructor()
        {
          this.oops = new Undeclared();
        }
      }

      SerializableRegistry.register(Undeclared);
      SerializableRegistry.register(Careless);

      // Act
      const encode = () => SaveEncoder.encode(new Careless(), '$.careless');

      // Assert
      expect(encode).toThrow(/Undeclared/);
    });
  });
  //endregion declarations the walkers accept

  //region pruning and bare paths
  describe('SaveFileSystem pruning and path edges', () =>
  {
    let fake;

    beforeEach(() =>
    {
      fake = installFakeSaveFilesystem();
    });

    it('deletes nothing from a slot with no pointer, since nothing tells a keeper from an orphan', () =>
    {
      // Arrange
      fake.directories.add('save/file1/gen-0001/');

      // Act
      SaveFileSystem.pruneGenerations('file1', 0);

      // Assert
      expect(fake.directories.has('save/file1/gen-0001/')).toBe(true);
    });

    it('skips creating a parent for a bare file name, which has no directory part', () =>
    {
      // Arrange
      // Act
      SaveFileSystem.writeJson('bare.json', { written: true });

      // Assert
      expect(fake.files.has('bare.json')).toBe(true);
    });

    it('reports a write that failed rather than letting the caller believe it saved', () =>
    {
      // Arrange
      fake.failOnWrite = 1;

      // Act
      const write = () => SaveFileSystem.writeJson('save/file1/world.json', { written: true });

      // Assert
      expect(write).toThrow(/save\/file1\/world.json/);
    });

    it('reads the playthrough a generation belongs to', () =>
    {
      // Arrange
      const manifest = { playthroughId: 'playthrough-a' };
      fake.files.set('save/file1/gen-0001/manifest.json', JSON.stringify(manifest));

      // Act
      const playthroughId = SaveFileSystem.playthroughIdAt('file1', 'gen-0001');

      // Assert
      expect(playthroughId).toBe('playthrough-a');
    });

    it('answers with nothing for a generation written before playthroughs were recorded', () =>
    {
      // Arrange
      fake.files.set('save/file1/gen-0001/manifest.json', JSON.stringify({ savedAt: 'yesterday' }));

      // Act
      const playthroughId = SaveFileSystem.playthroughIdAt('file1', 'gen-0001');

      // Assert
      expect(playthroughId).toBe('');
    });

    it('answers with nothing for a generation that has no manifest at all', () =>
    {
      // Arrange
      // Act
      const playthroughId = SaveFileSystem.playthroughIdAt('file9', 'gen-0001');

      // Assert
      expect(playthroughId).toBe('');
    });

    it('answers with nothing when the manifest will not parse, rather than failing the menu', () =>
    {
      // Arrange
      fake.files.set('save/file1/gen-0001/manifest.json', 'not json at all');

      // Act
      const playthroughId = SaveFileSystem.playthroughIdAt('file1', 'gen-0001');

      // Assert
      expect(playthroughId).toBe('');
    });
  });
  //endregion pruning and bare paths
});
//endregion plugins/_base/ext/save/save-core-edges.test.js