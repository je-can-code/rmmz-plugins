//region plugins/passive/core/objects/game-enemy.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from '../../_component/fixtures/install-passive-host-globals.js';

describe('J-Passive Game_Enemy (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPassive();
    await import('../../../../../src/plugins/passive/core/_metadata/initialization.js');

    // passive/core/objects/Game_Enemy.js's onSetup extension only needs Game_Enemy.prototype.onSetup
    // to already exist (aliased at import time)- Game_Battler.js's own patches aren't required here.
    globalThis.Game_Enemy.prototype.onSetup = function() {};
    globalThis.Game_Enemy.prototype.buildTraitObjects = function() { return []; };
    globalThis.Game_Enemy.prototype.getNotesSources = function() { return []; };
    globalThis.Game_Enemy.prototype.getPassiveStates = function() { return []; };
    globalThis.Game_Enemy.prototype.passiveExternalStateSources = function() { return []; };

    // patches globalThis.Game_Enemy.prototype directly, no vm involved.
    await import('../../../../../src/plugins/passive/core/objects/Game_Enemy.js');
  });

  /** Builds a fresh Game_Enemy-shaped instance. */
  function buildEnemy()
  {
    return Object.create(globalThis.Game_Enemy.prototype);
  }

  describe('onSetup (extended)', () =>
  {
    it('refreshes passive states after the base onSetup logic', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      enemy.refreshPassiveStates = vi.fn();
      globalThis.J.PASSIVE.Aliased.Game_Enemy.set('onSetup', vi.fn());

      // Act
      enemy.onSetup(7);

      // Assert
      expect(enemy.refreshPassiveStates).toHaveBeenCalled();
    });
  });

  describe('buildTraitObjects (extended)', () =>
  {
    it('appends the enemy\'s passive states after the base trait objects', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      globalThis.J.PASSIVE.Aliased.Game_Enemy.set('buildTraitObjects', () => [ { id: 'base' } ]);
      enemy.getPassiveStates = () => [ { id: 'passive' } ];

      // Act
      const result = enemy.buildTraitObjects();

      // Assert
      expect(result).toEqual([ { id: 'base' }, { id: 'passive' } ]);
    });
  });

  describe('getNotesSources (extended)', () =>
  {
    it('appends passive external state sources after the base note sources', () =>
    {
      // Arrange
      const enemy = buildEnemy();
      globalThis.J.PASSIVE.Aliased.Game_Enemy.set('getNotesSources', () => [ { id: 'base-note' } ]);
      enemy.passiveExternalStateSources = () => [ { id: 'external' } ];

      // Act
      const result = enemy.getNotesSources();

      // Assert
      expect(result).toEqual([ { id: 'base-note' }, { id: 'external' } ]);
    });
  });
});
//endregion plugins/passive/core/objects/game-enemy.test.js
