//region plugins/abs/core/_component/game-battler-bonus-hits-cache.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override. Rows are backed by
 * the real RPG_State prototype (not plain `{note}` objects) since getBonusHitsFromSources reads
 * the jabsBonusHitsScope* getters, which live on RPG_Traited/RPG_State's real prototype chain.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note =>
  {
    const row = Object.create(globalThis.RPG_State.prototype);
    row.id = 1;
    row.note = note;
    row.meta = {};
    row._original = function() { return this; };
    return row;
  });
  return battler;
}

describe('J-ABS Game_Battler bonus hits cache (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    // RPG_TraitItem.js patches this bare global's prototype- must be the same module instance
    // RPG_State extends, so the jabsBonusHitsScope* getters land on RPG_State's real prototype chain.
    ({ default: globalThis.RPG_Traited } = await import('../../../../../src/plugins/_base/database/base/RPG_Traited.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.RPG_Traited.prototype with jabsBonusHitsScopeGlobal/Basic/Skill getters.
    await import('../../../../../src/plugins/abs/core/database/RPG_TraitItem.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('cached total getters/setters', () =>
  {
    it('getBonusHitsGlobal/setBonusHitsGlobal round-trip the cached total', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setBonusHitsGlobal(3);

      // Assert
      expect(battler.getBonusHitsGlobal()).toBe(3);
    });

    it('getBonusHitsBasic/setBonusHitsBasic round-trip the cached total', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setBonusHitsBasic(4);

      // Assert
      expect(battler.getBonusHitsBasic()).toBe(4);
    });

    it('getBonusHitsSkill/setBonusHitsSkill round-trip the cached total', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act
      battler.setBonusHitsSkill(5);

      // Assert
      expect(battler.getBonusHitsSkill()).toBe(5);
    });
  });

  it('getBonusHitsSources returns a single collection built from getAllNotes', () =>
  {
    // Arrange
    const battler = buildBattler([ '<bonus-hits-global:1>' ]);

    // Act
    const sources = battler.getBonusHitsSources();

    // Assert
    expect(sources).toEqual([ battler.getAllNotes() ]);
  });

  describe('refreshBonusHits', () =>
  {
    it('sums bonus hits across every source collection and caches each scope total', () =>
    {
      // Arrange
      const battler = buildBattler([ '<bonus-hits-global:1>\n<bonus-hits-basic:2>\n<bonus-hits-skill:3>' ]);

      // Act
      battler.refreshBonusHits();

      // Assert
      expect(battler.getBonusHitsGlobal()).toBe(1);
      expect(battler.getBonusHitsBasic()).toBe(2);
      expect(battler.getBonusHitsSkill()).toBe(3);
    });

    it('resets every scope to zero when no note sources grant any bonus hits', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setBonusHitsGlobal(9);
      battler.setBonusHitsBasic(9);
      battler.setBonusHitsSkill(9);

      // Act
      battler.refreshBonusHits();

      // Assert
      expect(battler.getBonusHitsGlobal()).toBe(0);
      expect(battler.getBonusHitsBasic()).toBe(0);
      expect(battler.getBonusHitsSkill()).toBe(0);
    });

    it('sums across multiple source collections when getBonusHitsSources returns more than one', () =>
    {
      // Arrange
      const battler = buildBattler([ '<bonus-hits-global:1>' ]);
      const secondRow = Object.create(globalThis.RPG_State.prototype);
      secondRow.id = 2;
      secondRow.note = '<bonus-hits-global:2>';
      secondRow.meta = {};
      secondRow._original = function() { return this; };
      battler.getBonusHitsSources = () => [ battler.getAllNotes(), [ secondRow ] ];

      // Act
      battler.refreshBonusHits();

      // Assert
      expect(battler.getBonusHitsGlobal()).toBe(3);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-bonus-hits-cache.test.js
