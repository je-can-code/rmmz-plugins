//region plugins/drops/_component/rpg-drop-item.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('J-DropsControl RPG_DropItem#toImplementation (direct src import)', () =>
{
  beforeAll(async () =>
  {
    ({ default: globalThis.RPG_DropItem } = await import('../../../../src/plugins/_base/database/_data/RPG_DropItem.js'));

    // patches globalThis.RPG_DropItem.prototype directly, no vm involved.
    await import('../../../../src/plugins/drops/core/database/RPG_DropItem.js');
  });

  afterAll(() =>
  {
    delete globalThis.RPG_DropItem;
    delete globalThis.$dataItems;
    delete globalThis.$dataWeapons;
    delete globalThis.$dataArmors;
  });

  beforeEach(() =>
  {
    globalThis.$dataItems = [ undefined, { id: 1, name: 'Potion' } ];
    globalThis.$dataWeapons = [ undefined, { id: 1, name: 'Sword' } ];
    globalThis.$dataArmors = [ undefined, { id: 1, name: 'Shield' } ];
  });

  it('resolves an item drop from $dataItems', () =>
  {
    // Arrange
    const drop = new globalThis.RPG_DropItem({ dataId: 1, denominator: 1, kind: globalThis.RPG_DropItem.Types.Item });

    // Act
    const implementation = drop.toImplementation();

    // Assert
    expect(implementation).toBe(globalThis.$dataItems[1]);
  });

  it('resolves a weapon drop from $dataWeapons', () =>
  {
    // Arrange
    const drop = new globalThis.RPG_DropItem({ dataId: 1, denominator: 1, kind: globalThis.RPG_DropItem.Types.Weapon });

    // Act
    const implementation = drop.toImplementation();

    // Assert
    expect(implementation).toBe(globalThis.$dataWeapons[1]);
  });

  it('resolves an armor drop from $dataArmors', () =>
  {
    // Arrange
    const drop = new globalThis.RPG_DropItem({ dataId: 1, denominator: 1, kind: globalThis.RPG_DropItem.Types.Armor });

    // Act
    const implementation = drop.toImplementation();

    // Assert
    expect(implementation).toBe(globalThis.$dataArmors[1]);
  });

  it('throws when the drop kind is not a recognized type', () =>
  {
    // Arrange
    const drop = new globalThis.RPG_DropItem({ dataId: 1, denominator: 1, kind: 99 });

    // Act & Assert
    expect(() => drop.toImplementation()).toThrow('This drop item is missing properties to fulfill this request.');
  });
});
//endregion plugins/drops/_component/rpg-drop-item.test.js
