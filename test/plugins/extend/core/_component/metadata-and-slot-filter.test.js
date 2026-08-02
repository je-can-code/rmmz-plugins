//region plugins/extend/core/_component/metadata-and-slot-filter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

describe('J-Extend metadata and skill-slot filtering (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it, restored between tests. */
  let realJ;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/managers/TraitResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  describe('version gate', () =>
  {
    beforeEach(async () =>
    {
      // only the J-Extend half of the graph is rebuilt per test; J-Base's bootstrap installs a
      // non-configurable `Array.empty` and cannot be evaluated twice in one realm.
      vi.resetModules();
      globalThis.J = realJ;
      globalThis.J.BASE.Metadata.Version = '3.2.0';
      delete globalThis.J.EXTEND;

      const { default: FreshPluginMetadata } = await import('../../../../../src/plugins/_base/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      setPluginContextToJExtend();
    });

    it('initializes when J-Base satisfies the required version', async () =>
    {
      // Arrange & Act
      await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

      // Assert: the alias surface is declared after the version gate, so its presence is what
      // proves initialization ran all the way through rather than throwing partway.
      expect(Object.keys(globalThis.J.EXTEND.Aliased))
        .toEqual([ 'DataManager', 'Game_Action', 'Game_Actor', 'Game_Enemy', 'Game_Item', 'JABS_SkillSlotManager' ]);
    });

    it('throws when J-Base is below the required version', async () =>
    {
      // Arrange- an out-of-date J-Base cannot supply the helpers this plugin patches against, so
      // failing loudly at boot beats failing mysteriously mid-battle.
      globalThis.J.BASE.Metadata.Version = '1.0.0';

      // Act & Assert
      await expect(import('../../../../../src/plugins/extend/core/_metadata/initialization.js'))
        .rejects.toThrow('Either missing J-Base or has a lower version than the required: 3.2.0');
    });
  });

  describe('registerNonCombiningKey', () =>
  {
    beforeEach(async () =>
    {
      vi.resetModules();
      globalThis.J = realJ;
      globalThis.J.BASE.Metadata.Version = '3.2.0';
      delete globalThis.J.EXTEND;

      const { default: FreshPluginMetadata } = await import('../../../../../src/plugins/_base/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      setPluginContextToJExtend();
      await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');
    });

    it('starts with no keys registered', () =>
    {
      // Arrange & Act & Assert- replacement is the default merge behaviour; combining is opt-in.
      expect(globalThis.J.EXTEND.Metadata.getNonCombiningKeys()).toEqual([]);
    });

    it('derives a lowercase key from a key-value tag regexp', () =>
    {
      // Arrange- registering by regexp rather than by string keeps the key and the parser that reads
      // it from drifting apart.
      const metadata = globalThis.J.EXTEND.Metadata;

      // Act
      metadata.registerNonCombiningKey(/<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/gi);

      // Assert
      expect(metadata.getNonCombiningKeys()).toEqual([ 'onhitselfstate' ]);
    });

    it('derives a key from a boolean tag regexp when told it is boolean', () =>
    {
      // Arrange- boolean tags carry no colon, so the key has to be extracted differently.
      const metadata = globalThis.J.EXTEND.Metadata;

      // Act
      metadata.registerNonCombiningKey(/<direct>/gi, true);

      // Assert
      expect(metadata.getNonCombiningKeys()).toEqual([ 'direct' ]);
    });

    it('does not register the same key twice', () =>
    {
      // Arrange- several plugins may register the same additive tag during boot.
      const metadata = globalThis.J.EXTEND.Metadata;

      // Act
      metadata.registerNonCombiningKey(/<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/gi);
      metadata.registerNonCombiningKey(/<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/gi);

      // Assert
      expect(metadata.getNonCombiningKeys()).toEqual([ 'onhitselfstate' ]);
    });

    it('accumulates several distinct keys', () =>
    {
      // Arrange
      const metadata = globalThis.J.EXTEND.Metadata;

      // Act
      metadata.registerNonCombiningKey(/<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/gi);
      metadata.registerNonCombiningKey(/<onCastSelfState:[ ]?(\[\d+,[ ]?\d+])>/gi);

      // Assert
      expect(metadata.getNonCombiningKeys()).toEqual([ 'onhitselfstate', 'oncastselfstate' ]);
    });
  });

  describe('JABS_SkillSlotManager.filterActionSkills', () =>
  {
    let proto;
    let aliasMap;

    beforeAll(async () =>
    {
      vi.resetModules();
      globalThis.J = realJ;
      globalThis.J.BASE.Metadata.Version = '3.2.0';
      delete globalThis.J.EXTEND;

      const { default: FreshPluginMetadata } = await import('../../../../../src/plugins/_base/models/PluginMetadata.js');
      globalThis.PluginMetadata = FreshPluginMetadata;

      setPluginContextToJExtend();
      await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');
      await import('../../../../../src/plugins/extend/core/managers/JABS_SkillSlotManager.js');

      proto = globalThis.JABS_SkillSlotManager.prototype;
      aliasMap = globalThis.J.EXTEND.Aliased.JABS_SkillSlotManager;
    });

    it('rejects an action the original filter already rejected', () =>
    {
      // Arrange- the extension only ever narrows the original result; it never re-admits anything.
      const realOriginal = aliasMap.get('filterActionSkills');
      aliasMap.set('filterActionSkills', () => false);
      const enemy = { skill: vi.fn() };

      // Act
      const result = proto.filterActionSkills.call({}, enemy, { skillId: 1 });

      // Assert- the database is not even consulted once the original said no.
      expect(result).toBe(false);
      expect(enemy.skill).not.toHaveBeenCalled();

      aliasMap.set('filterActionSkills', realOriginal);
    });

    it('rejects a skill that is itself an extension', () =>
    {
      // Arrange- extension skills exist to modify other skills, so an enemy must never pick one as
      // an action in its own right.
      const realOriginal = aliasMap.get('filterActionSkills');
      aliasMap.set('filterActionSkills', () => true);
      const enemy = { skill: () => ({ isExtension: true }) };

      // Act
      const result = proto.filterActionSkills.call({}, enemy, { skillId: 1 });

      // Assert
      expect(result).toBe(false);

      aliasMap.set('filterActionSkills', realOriginal);
    });

    it('accepts an ordinary skill the original filter allowed', () =>
    {
      // Arrange
      const realOriginal = aliasMap.get('filterActionSkills');
      aliasMap.set('filterActionSkills', () => true);
      const enemy = { skill: () => ({ isExtension: false }) };

      // Act
      const result = proto.filterActionSkills.call({}, enemy, { skillId: 1 });

      // Assert
      expect(result).toBe(true);

      aliasMap.set('filterActionSkills', realOriginal);
    });
  });
});
//endregion plugins/extend/core/_component/metadata-and-slot-filter.test.js
