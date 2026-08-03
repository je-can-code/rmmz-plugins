//region plugins/passive/core/database/rpg-database-extensions.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

describe('J-Passive core database extensions (direct src import)', () =>
{
  let RPG_BaseBattler;
  let RPG_Class;
  let RPG_State;
  let RPG_Actor;
  let RPG_Enemy;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: RPG_BaseBattler } = await import('../../../../../src/plugins/_base/core/database/core/RPG_BaseBattler.js'));
    globalThis.RPG_BaseBattler = RPG_BaseBattler;
    ({ default: RPG_Class } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Class.js'));
    globalThis.RPG_Class = RPG_Class;
    ({ default: RPG_State } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));
    globalThis.RPG_State = RPG_State;
    ({ default: RPG_Actor } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Actor.js'));
    globalThis.RPG_Actor = RPG_Actor;
    ({ default: RPG_Enemy } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Enemy.js'));
    globalThis.RPG_Enemy = RPG_Enemy;

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    await import('../../../../../src/plugins/passive/core/database/RPG_BaseBattler.js');
    await import('../../../../../src/plugins/passive/core/database/RPG_Class.js');
    await import('../../../../../src/plugins/passive/core/database/RPG_State.js');
  });

  describe('RPG_BaseBattler', () =>
  {
    it('reads passiveStateIds from the <passive:[...]> tag', () =>
    {
      // Arrange
      const enemy = Object.create(RPG_Enemy.prototype);
      enemy.note = '<passive:[1, 2]>';

      // Act & Assert
      expect(enemy.passiveStateIds).toEqual([ 1, 2 ]);
    });

    it('reads uniquePassiveStateIds from the <uniquePassive:[...]> tag', () =>
    {
      // Arrange
      const enemy = Object.create(RPG_Enemy.prototype);
      enemy.note = '<uniquePassive:[3]>';

      // Act & Assert
      expect(enemy.uniquePassiveStateIds).toEqual([ 3 ]);
    });

    it('always returns an empty array for equippedPassiveStateIds, since battlers cannot be equipped', () =>
    {
      // Arrange
      const enemy = Object.create(RPG_Enemy.prototype);

      // Act & Assert
      expect(enemy.equippedPassiveStateIds).toEqual(Array.empty);
    });

    it('always returns an empty array for uniqueEquippedPassiveStateIds, since battlers cannot be equipped', () =>
    {
      // Arrange
      const enemy = Object.create(RPG_Enemy.prototype);

      // Act & Assert
      expect(enemy.uniqueEquippedPassiveStateIds).toEqual(Array.empty);
    });
  });

  describe('RPG_Class', () =>
  {
    it('reads passiveStateIds from the <passive:[...]> tag', () =>
    {
      // Arrange
      const classData = Object.create(RPG_Class.prototype);
      classData.note = '<passive:[10]>';

      // Act & Assert
      expect(classData.passiveStateIds).toEqual([ 10 ]);
    });

    it('reads uniquePassiveStateIds from the <uniquePassive:[...]> tag', () =>
    {
      // Arrange
      const classData = Object.create(RPG_Class.prototype);
      classData.note = '<uniquePassive:[11]>';

      // Act & Assert
      expect(classData.uniquePassiveStateIds).toEqual([ 11 ]);
    });

    it('reads equippedPassiveStateIds from the <equippedPassive:[...]> tag', () =>
    {
      // Arrange
      const classData = Object.create(RPG_Class.prototype);
      classData.note = '<equippedPassive:[12]>';

      // Act & Assert
      expect(classData.equippedPassiveStateIds).toEqual([ 12 ]);
    });

    it('reads uniqueEquippedPassiveStateIds from the <uniqueEquippedPassive:[...]> tag', () =>
    {
      // Arrange
      const classData = Object.create(RPG_Class.prototype);
      classData.note = '<uniqueEquippedPassive:[13]>';

      // Act & Assert
      expect(classData.uniqueEquippedPassiveStateIds).toEqual([ 13 ]);
    });
  });

  describe('RPG_State', () =>
  {
    it('hideFromPassiveList is true when the tag is present', () =>
    {
      // Arrange
      const state = Object.create(RPG_State.prototype);
      state.note = '<hideFromPassiveList>';

      // Act & Assert
      expect(state.hideFromPassiveList).toBe(true);
    });

    it('hideFromPassiveList is false when the tag is absent', () =>
    {
      // Arrange
      const state = Object.create(RPG_State.prototype);
      state.note = '';

      // Act & Assert
      expect(state.hideFromPassiveList).toBe(false);
    });
  });
});
//endregion plugins/passive/core/database/rpg-database-extensions.test.js
