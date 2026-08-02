//region plugins/drops/core/database/rpg-enemy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installDropsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJDrops,
} from '../../_component/fixtures/install-drops-host-globals.js';

/**
 * RPG Maker pads every enemy's drop list out to a fixed number of slots and leaves the unused ones
 * as blank placeholders, so the raw list is mostly noise. This filter is what separates an actual
 * authored drop from a slot the editor merely reserved, and getting it wrong either loses real
 * drops or feeds empty rows into the reward pipeline.
 */
describe('J-DropsControl RPG_Enemy drop filter (direct src import)', () =>
{
  let RPG_Enemy;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: RPG_Enemy } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Enemy = RPG_Enemy;

    setPluginContextToJDrops();
    await import('../../../../../src/plugins/drops/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/drops/core/database/RPG_Enemy.js');
  });

  /**
   * Builds a bare enemy row to invoke the filter against.
   * @returns {RPG_Enemy}
   */
  function makeEnemyRow()
  {
    return Object.assign(Object.create(RPG_Enemy.prototype), { id: 1, name: 'Testy', note: '' });
  }

  it('accepts a fully populated drop', () =>
  {
    // Arrange
    const enemyRow = makeEnemyRow();

    // Act
    const result = enemyRow.validDropItemFilter({ kind: 1, dataId: 3, denominator: 25 });

    // Assert
    expect(result).toBe(true);
  });

  it('rejects a missing drop entry outright', () =>
  {
    // Arrange
    const enemyRow = makeEnemyRow();

    // Act
    const result = enemyRow.validDropItemFilter(null);

    // Assert
    expect(result).toBe(false);
  });

  it('rejects a drop pointing at no database row', () =>
  {
    // Arrange: an unset id is how the editor leaves a reserved-but-unused slot.
    const enemyRow = makeEnemyRow();

    // Act
    const result = enemyRow.validDropItemFilter({ kind: 1, dataId: 0, denominator: 25 });

    // Assert
    expect(result).toBe(false);
  });

  it('rejects a drop with no type selected', () =>
  {
    // Arrange: kind zero is the editor's "None" entry, which names no database table to look in.
    const enemyRow = makeEnemyRow();

    // Act
    const result = enemyRow.validDropItemFilter({ kind: 0, dataId: 3, denominator: 25 });

    // Assert
    expect(result).toBe(false);
  });
});
//endregion plugins/drops/core/database/rpg-enemy.test.js