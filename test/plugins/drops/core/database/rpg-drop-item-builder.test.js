//region plugins/drops/core/database/rpg-drop-item-builder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * The builder exists so extra drops parsed out of notetags come back shaped exactly like the drop
 * rows RPG Maker's database produces, rather than as loose objects the rest of the pipeline has to
 * special-case. It is reused across a whole parse pass, so the clear-on-build behavior is what
 * stops one drop's leftovers bleeding into the next.
 */
describe('RPG_DropItemBuilder (direct src import)', () =>
{
  let RPG_DropItemBuilder;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPG_DropItem } = await import('../../../../../src/plugins/_base/core/database/_data/RPG_DropItem.js'));

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/database/RPG_DropItem.js');

    ({ default: RPG_DropItemBuilder } = await import('../../../../../src/plugins/drops/core/database/RPG_DropItemBuilder.js'));
  });

  let builder;

  beforeEach(() =>
  {
    builder = new RPG_DropItemBuilder();
  });

  //region typed shorthands
  describe('typed shorthands', () =>
  {
    it('builds an item drop of the item kind', () =>
    {
      // Arrange & Act
      const drop = builder.itemLoot(3, 25);

      // Assert
      expect(drop.kind).toBe(globalThis.RPG_DropItem.Types.Item);
    });

    it('carries the id and chance onto an item drop', () =>
    {
      // Arrange & Act
      const drop = builder.itemLoot(3, 25);

      // Assert
      expect([ drop.dataId, drop.denominator ]).toEqual([ 3, 25 ]);
    });

    it('builds a weapon drop of the weapon kind', () =>
    {
      // Arrange & Act
      const drop = builder.weaponLoot(7, 10);

      // Assert
      expect(drop.kind).toBe(globalThis.RPG_DropItem.Types.Weapon);
    });

    it('carries the id and chance onto a weapon drop', () =>
    {
      // Arrange & Act
      const drop = builder.weaponLoot(7, 10);

      // Assert
      expect([ drop.dataId, drop.denominator ]).toEqual([ 7, 10 ]);
    });

    it('builds an armor drop of the armor kind', () =>
    {
      // Arrange & Act
      const drop = builder.armorLoot(11, 5);

      // Assert
      expect(drop.kind).toBe(globalThis.RPG_DropItem.Types.Armor);
    });

    it('carries the id and chance onto an armor drop', () =>
    {
      // Arrange & Act
      const drop = builder.armorLoot(11, 5);

      // Assert
      expect([ drop.dataId, drop.denominator ]).toEqual([ 11, 5 ]);
    });
  });
  //endregion typed shorthands

  //region reuse
  describe('reuse across builds', () =>
  {
    it('leaves nothing behind from the previous build', () =>
    {
      // Arrange: a single builder walks an entire parse pass, so a second drop must not inherit
      // the first one's id or chance.
      builder.itemLoot(3, 25);

      // Act
      const second = builder.build();

      // Assert
      expect([ second.dataId, second.denominator ]).toEqual([ 0, 0 ]);
    });

    it('retains its values when asked to build without clearing', () =>
    {
      // Arrange: the caller can opt out of the reset when building several drops that differ
      // only in one field.
      builder.itemLoot(3, 25);
      builder.setId(4);
      builder.setChance(50);
      builder.setType(globalThis.RPG_DropItem.Types.Item);

      // Act
      builder.build(false);
      const second = builder.build();

      // Assert
      expect([ second.dataId, second.denominator ]).toEqual([ 4, 50 ]);
    });
  });
  //endregion reuse
});
//endregion plugins/drops/core/database/rpg-drop-item-builder.test.js