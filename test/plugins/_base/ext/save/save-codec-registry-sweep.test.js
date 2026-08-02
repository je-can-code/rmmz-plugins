//region plugins/_base/core/save/save-codec-registry-sweep.test.js
import { beforeAll, describe, expect, it } from 'vitest';

import { installRealRmmzEngine } from '../../../../setup/rmmz-engine-loader.js';

/**
 * Two fixture-driven sweeps over the whole registry, rather than one test per type.
 *
 * The reason they are sweeps is the failure mode they are aimed at. The encoder's completeness
 * assertion only fires on a path testplay actually walks - a vehicle nobody boards, an actor never
 * mid-turn, a picture never shown - so a type map with a hole in it can reach a player unnoticed. And
 * a seed that misses a field does not fail loudly at all: it hands back `undefined` at a path a guard
 * reads with a strict `!== null`, which is a wrong answer rather than a crash.
 *
 * Enumerating {@link SerializableRegistry.codecsByType} means a type registered next year is covered
 * the day it is registered, without anybody remembering to add a case for it.
 */
describe('save codec registry sweeps (direct src import)', () =>
{
  let SerializableRegistry;
  let SaveEncoder;
  let SaveDecoder;

  /**
   * The native collections are registered as codecs so the walkers can dispatch on them, but they
   * are not classes with fields and a seed - their whole contract is the encode/decode override.
   * @type {Function[]}
   */
  let nativeCollections;

  /**
   * Every codec the sweeps apply to: registered, and describing something with fields.
   * @returns {Array<[Function, object]>} Constructor/codec pairs.
   */
  const sweepableCodecs = () => [ ...SerializableRegistry.codecsByType()
    .entries() ]
    .filter(([ type ]) => nativeCollections.includes(type) === false);

  /**
   * Builds a bare instance and runs only its seed over it, which is exactly what a decode does
   * before any field from a file lands.
   * @param {Function} type The constructor to seed.
   * @param {object} codec The codec describing it.
   * @returns {object} The seeded instance.
   */
  const seeded = (type, codec) =>
  {
    const instance = Object.create(type.prototype);

    codec.seed(instance);

    return instance;
  };

  /**
   * Names every own enumerable field of an object that holds `undefined`.
   * @param {object} instance The object to inspect.
   * @returns {string[]} The offending field names.
   */
  const undefinedFields = instance => Object.keys(instance)
    .filter(key => instance[key] === undefined);

  beforeAll(async () =>
  {
    installRealRmmzEngine();

    globalThis.window = globalThis;
    globalThis.location = { search: '' };

    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    globalThis.$dataSystem = {
      optFollowers: true,
      boat: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
      ship: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
      airship: { characterName: '', characterIndex: 0, startMapId: 0, startX: 0, startY: 0, bgm: {} },
    };
    globalThis.ImageManager = {
      reserveCharacter: () => ({}),
      loadCharacter: () => ({}),
      isObjectCharacter: () => false,
      isBigCharacter: () => false,
    };
    globalThis.J = { BASE: { EXT: { SAVE: { Metadata: { retainedSaveGenerations: 3 } } } } };

    // `Game_Player.initMembers` - which is that class's derived seed - constructs a
    // `Game_Followers`, whose own `setup()` sizes itself from `$gameParty.maxBattleMembers()`. A
    // real decode always has that global, because `DataManager.createGameObjects` runs before
    // `extractSaveContents` does, so this reproduces the precondition rather than inventing a
    // stricter one. It is still a seed reaching a global, which the seed contract forbids; that is
    // recorded as an open finding in the save-rewrite plan rather than fixed here, because the fix
    // is to `Game_Player`'s seed and it must not break the `initMembers` chain every plugin's `_j`
    // namespace is built by.
    globalThis.$gameParty = { maxBattleMembers: () => 4 };

    // the `Game_Event` codec declares `_j` transient with a factory that hands back whatever the
    // seed built, and it is plugins aliasing `initMembers` that build it - vanilla has no `_j` at
    // all. This stands in for one, so the sweep measures the shape a real install has. Without it
    // the factory returns `undefined` and the decoder mints an own key holding it, which is the one
    // configuration where that transient is not a complete answer: a J-Base-only install.
    const vanillaEventInitMembers = globalThis.Game_Event.prototype.initMembers;
    globalThis.Game_Event.prototype.initMembers = function()
    {
      vanillaEventInitMembers.call(this);
      this._j = {};
    };

    ({ default: SerializableRegistry } = await import(
      '../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));

    // the walkers live in J-Base-Save and read the registry as a hoisted global, because it belongs
    // to J-Base and a ship may never import across into another. This reproduces that at test time.
    globalThis.SerializableRegistry = SerializableRegistry;
    ({ default: SaveEncoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveEncoder.js'));
    ({ default: SaveDecoder } = await import('../../../../../src/plugins/_base/ext/save/core/SaveDecoder.js'));

    await import('../../../../../src/plugins/_base/ext/save/core/registerEngineSaveCodecs.js');
    await import('../../../../../src/plugins/_base/ext/save/core/SaveManifest.js');

    nativeCollections = [ Map, Set ];
  });

  //region the sweep itself
  describe('coverage of the sweep', () =>
  {
    it('has codecs to sweep, so a registration failure cannot pass as a clean run', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(sweepableCodecs().length).toBeGreaterThan(15);
    });
  });
  //endregion the sweep itself

  //region seeds
  describe('every registered codec seeds every field it establishes', () =>
  {
    it('leaves no field holding undefined after seeding', () =>
    {
      // Arrange
      // Act
      const offenders = sweepableCodecs()
        .map(([ type, codec ]) => [ codec.id(), undefinedFields(seeded(type, codec)) ])
        .filter(([ , fields ]) => fields.length > 0);

      // Assert
      expect(offenders).toEqual([]);
    });

    it('leaves no field holding undefined after decoding a payload with nothing in it', () =>
    {
      // Arrange
      // Act
      const offenders = sweepableCodecs()
        .map(([ , codec ]) =>
        {
          const decoded = SaveDecoder.decode({ '@': codec.id() }, null, `$.${codec.id()}`);

          return [ codec.id(), undefinedFields(decoded) ];
        })
        .filter(([ , fields ]) => fields.length > 0);

      // Assert
      expect(offenders).toEqual([]);
    });

    it('produces a fresh object graph per seed rather than handing out a shared default', () =>
    {
      // Arrange
      // the merge writes into the seeded object in place, so a seed assigning a shared constant
      // would have that constant corrupted on every load, for every other instance of the type.
      // Act
      const shared = sweepableCodecs()
        .map(([ type, codec ]) =>
        {
          const first = seeded(type, codec);
          const second = seeded(type, codec);

          const aliased = Object.keys(first)
            .filter(key => first[key] !== null)
            .filter(key => Object(first[key]) === first[key])
            .filter(key => first[key] === second[key]);

          return [ codec.id(), aliased ];
        })
        .filter(([ , keys ]) => keys.length > 0);

      // Assert
      expect(shared).toEqual([]);
    });
  });
  //endregion seeds

  //region type maps
  describe('every registered codec declares the fields that hold instances', () =>
  {
    it('covers every instance-valued field a seed establishes', () =>
    {
      // Arrange
      // Act
      const undeclared = sweepableCodecs()
        .map(([ type, codec ]) =>
        {
          const instance = seeded(type, codec);

          const missing = Object.keys(instance)
            .filter(key => instance[key] !== null)
            .filter(key => Object(instance[key]) === instance[key])
            .filter(key => SerializableRegistry.codecForInstance(instance[key]) !== null)
            .filter(key => codec.typedTree()
              .children.has(key) === false);

          return [ codec.id(), missing ];
        })
        .filter(([ , keys ]) => keys.length > 0);

      // Assert
      expect(undeclared).toEqual([]);
    });

    it('encodes every seeded instance without the completeness assertion firing', () =>
    {
      // Arrange
      // Act
      const failures = sweepableCodecs()
        .map(([ type, codec ]) =>
        {
          try
          {
            SaveEncoder.encode(seeded(type, codec), `$.${codec.id()}`);

            return null;
          }
          catch (error)
          {
            return `${codec.id()}: ${error.message}`;
          }
        })
        .filter(failure => failure !== null);

      // Assert
      expect(failures).toEqual([]);
    });
  });
  //endregion type maps

  //region identity
  describe('every registered codec is addressable by what it writes', () =>
  {
    it('writes a tag that resolves back to the same codec', () =>
    {
      // Arrange
      // Act
      const unresolvable = sweepableCodecs()
        .map(([ , codec ]) => codec.id())
        .filter(id => SerializableRegistry.codecById(id) === null);

      // Assert
      expect(unresolvable).toEqual([]);
    });

    it('answers to its class name as well as its save id, so an engine-written file still resolves', () =>
    {
      // Arrange
      // Act
      const unreachable = sweepableCodecs()
        .filter(([ type ]) => SerializableRegistry.codecById(type.name) === null)
        .map(([ type ]) => type.name);

      // Assert
      expect(unreachable).toEqual([]);
    });

    it('round-trips a seeded instance back to its own prototype', () =>
    {
      // Arrange
      // Act
      const broken = sweepableCodecs()
        .map(([ type, codec ]) =>
        {
          const encoded = SaveEncoder.encode(seeded(type, codec), `$.${codec.id()}`);
          const decoded = SaveDecoder.decode(encoded, null, `$.${codec.id()}`);

          return Object.getPrototypeOf(decoded) === type.prototype
            ? null
            : codec.id();
        })
        .filter(id => id !== null);

      // Assert
      expect(broken).toEqual([]);
    });
  });
  //endregion identity
});
//endregion plugins/_base/core/save/save-codec-registry-sweep.test.js