//region plugins/_base/_component/rpg-base-and-traited.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installJabsOnChanceEffectGlobalStub } from './fixtures/install-jabs-onchance-stub.js';
import { installJBaseHostGlobals } from './fixtures/install-j-base-host-globals.js';

describe('RPG_Base / RPG_Traited (direct src import)', () =>
{
  let RPGManager;
  let RPG_Base;
  let RPG_Traited;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    installJabsOnChanceEffectGlobalStub(globalThis);

    // real production code- sets up J.BASE.RegExp.ClassifierType among other tag patterns.
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    globalThis.RPGManager = RPGManager;

    ({ default: RPG_Base } = await import('../../../../src/plugins/_base/database/base/RPG_Base.js'));
    ({ default: RPG_Traited } = await import('../../../../src/plugins/_base/database/base/RPG_Traited.js'));
  });

  beforeEach(() =>
  {
    RPGManager.clearCache();
  });

  function buildRawItem(overrides = {})
  {
    return {
      id: 7,
      name: 'Test Item',
      note: '',
      meta: {},
      description: 'a test item',
      iconIndex: 5,
      traits: [],
      ...overrides,
    };
  }

  describe('RPG_Base', () =>
  {
    describe('constructor', () =>
    {
      it('maps id, meta, name, note, and index from the source object', () =>
      {
        // Arrange
        const raw = buildRawItem({ meta: { foo: 'bar' } });

        // Act
        const base = new RPG_Base(raw, 3);

        // Assert
        expect(base.id).toBe(7);
        expect(base.index).toBe(3);
        expect(base.meta).toEqual({ foo: 'bar' });
        expect(base.name).toBe('Test Item');
        expect(base.note).toBe('');
      });
    });

    describe('_index / _updateIndex', () =>
    {
      it('returns the current index', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act & Assert
        expect(base._index()).toBe(3);
      });

      it('updates the index', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act
        base._updateIndex(9);

        // Assert
        expect(base._index()).toBe(9);
      });
    });

    describe('_key', () =>
    {
      it('defaults to the index', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act & Assert
        expect(base._key()).toBe(3);
      });
    });

    describe('_original', () =>
    {
      it('returns the raw source object passed to the constructor', () =>
      {
        // Arrange
        const raw = buildRawItem();
        const base = new RPG_Base(raw, 3);

        // Act & Assert
        expect(base._original()).toBe(raw);
      });

      it('falls back to itself when constructed via Object.create and the constructor never ran', () =>
      {
        // Arrange- Object.create bypasses the constructor, so no entry was ever stored in the
        // #originals WeakMap for this instance.
        const base = Object.create(RPG_Base.prototype);

        // Act & Assert
        expect(base._original()).toBe(base);
      });
    });

    describe('_clone', () =>
    {
      it('produces a new instance of the same class with the same data', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act
        const clone = base._clone();

        // Assert
        expect(clone).not.toBe(base);
        expect(clone).toBeInstanceOf(RPG_Base);
        expect(clone.id).toBe(base.id);
      });
    });

    describe('_generate', () =>
    {
      it('produces a new instance of the same class from the given overrides and index', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);
        const overrides = buildRawItem({ id: 99 });

        // Act
        const generated = base._generate(overrides, 12);

        // Assert
        expect(generated).toBeInstanceOf(RPG_Base);
        expect(generated.id).toBe(99);
        expect(generated.index).toBe(12);
      });
    });

    describe('type predicates', () =>
    {
      it.each([
        [ 'isActor' ],
        [ 'isClass' ],
        [ 'isEnemy' ],
        [ 'isItem' ],
        [ 'isWeapon' ],
        [ 'isArmor' ],
        [ 'isEquipItem' ],
        [ 'isSkill' ],
        [ 'isState' ],
      ])('%s defaults to false', (method) =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act & Assert
        expect(base[method]()).toBe(false);
      });
    });

    describe('implementationType', () =>
    {
      it('returns "@base"', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem(), 3);

        // Act & Assert
        expect(base.implementationType()).toBe('@base');
      });
    });

    describe('types', () =>
    {
      it('returns every classifier from a <type:VALUE> tag on the notebox', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem({ note: '<type:Beast>\n<type:Flying>' }), 3);

        // Act
        const result = base.types();

        // Assert
        expect(result).toEqual([ 'Beast', 'Flying' ]);
      });

      it('returns an empty array when no <type:VALUE> tag is present', () =>
      {
        // Arrange
        const base = new RPG_Base(buildRawItem({ note: '' }), 3);

        // Act
        const result = base.types();

        // Assert
        expect(result).toEqual([]);
      });
    });
  });

  describe('RPG_Traited', () =>
  {
    afterEach(() =>
    {
      // clears anything stubbed onto RPG_Trait between tests.
    });

    describe('constructor', () =>
    {
      it('maps each raw trait entry into an RPG_Trait instance', async () =>
      {
        // Arrange
        const { default: RPG_Trait } = await import('../../../../src/plugins/_base/database/_data/RPG_Trait.js');
        const raw = buildRawItem({
          traits: [
            { code: 21, dataId: 1, value: 1.5 },
            { code: 22, dataId: 2, value: 0.5 },
          ],
        });

        // Act
        const traited = new RPG_Traited(raw, 4);

        // Assert
        expect(traited.traits).toHaveLength(2);
        expect(traited.traits[0]).toBeInstanceOf(RPG_Trait);
        expect(traited.traits[0].code).toBe(21);
        expect(traited.traits[1].dataId).toBe(2);
      });

      it('maps to an empty traits array when the source has no traits', () =>
      {
        // Arrange
        const raw = buildRawItem({ traits: [] });

        // Act
        const traited = new RPG_Traited(raw, 4);

        // Assert
        expect(traited.traits).toEqual([]);
      });
    });

    describe('implementationType', () =>
    {
      it('appends ":traited" to the parent implementation type', () =>
      {
        // Arrange
        const traited = new RPG_Traited(buildRawItem(), 4);

        // Act
        const result = traited.implementationType();

        // Assert
        expect(result).toBe('@base:traited');
      });
    });
  });
});
//endregion plugins/_base/_component/rpg-base-and-traited.test.js
