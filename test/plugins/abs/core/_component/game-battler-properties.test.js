//region plugins/abs/core/_component/game-battler-properties.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance with a note-source override.
 * @param {string[]} notes Raw note strings, one per source.
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler.__testNoteSources = notes.map(note => ({ note }));
  return battler;
}

describe('J-ABS Game_Battler properties (direct src import)', () =>
{
  let JABS_Battler;
  let JABS_EnemyAI;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // real classes Game_Battler.js's teamId/ai import directly as ES modules (not via globalThis).
    ({ default: JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js'));
    ({ default: JABS_EnemyAI } = await import('../../../../../src/plugins/abs/core/models/JABS_EnemyAI.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('uuid', () =>
  {
    it('getUuid combines the battler name and the generated internal uuid', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.name = () => 'Slime';

      // Act & Assert
      expect(battler.getUuid()).toBe(`Slime_${battler._j._abs._uuid}`);
    });

    it('setUuid overwrites the internal uuid read back by getUuid', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.name = () => 'Slime';

      // Act
      battler.setUuid('custom-uuid');

      // Assert
      expect(battler.getUuid()).toBe('Slime_custom-uuid');
    });
  });

  it('battlerId defaults to 0 at the base Game_Battler level', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act & Assert
    expect(battler.battlerId()).toBe(0);
  });

  it('prepareTime defaults to 180 frames', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act & Assert
    expect(battler.prepareTime()).toBe(180);
  });

  describe('basicAttackSkillId', () =>
  {
    it('returns the dataId of the first Attack Skill trait when one exists', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.databaseData = () => ({
        traits: [
          { code: 999, dataId: 1 },
          { code: J.BASE.Traits.ATTACK_SKILLID, dataId: 42 },
        ],
      });

      // Act & Assert
      expect(battler.basicAttackSkillId()).toBe(42);
    });

    it('returns 0 when no Attack Skill trait exists', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.databaseData = () => ({ traits: [] });

      // Act & Assert
      expect(battler.basicAttackSkillId()).toBe(0);
    });
  });

  describe('default range/timing values', () =>
  {
    it('sightRange defaults to 4', () =>
    {
      expect(buildBattler().sightRange()).toBe(4);
    });

    it('alertedSightBoost defaults to 2', () =>
    {
      expect(buildBattler().alertedSightBoost()).toBe(2);
    });

    it('pursuitRange defaults to 6', () =>
    {
      expect(buildBattler().pursuitRange()).toBe(6);
    });

    it('alertedPursuitBoost defaults to 4', () =>
    {
      expect(buildBattler().alertedPursuitBoost()).toBe(4);
    });

    it('alertDuration defaults to 300', () =>
    {
      expect(buildBattler().alertDuration()).toBe(300);
    });
  });

  describe('getVisionModifier', () =>
  {
    it('computes the constrained multiplier from summed note tags and caches it', () =>
    {
      // Arrange- base 100 + 25 = 125, / 100 = 1.25.
      const battler = buildBattler([ '<visionMultiplier:25>' ]);

      // Act
      const result = battler.getVisionModifier();

      // Assert
      expect(result).toBeCloseTo(1.25);
      expect(battler.getCachedVisionModifier()).toBeCloseTo(1.25);
    });

    it('returns the cached value on a second call without recomputing', () =>
    {
      // Arrange
      const battler = buildBattler([ '<visionMultiplier:25>' ]);
      battler.getVisionModifier();
      battler.__testNoteSources = [ { note: '<visionMultiplier:999>' } ];

      // Act
      const result = battler.getVisionModifier();

      // Assert- still the first-computed value, proving the cache short-circuited.
      expect(result).toBeCloseTo(1.25);
    });

    it('clamps the multiplier to never go below zero', () =>
    {
      // Arrange- base 100 - 200 = -100, clamped to 0.
      const battler = buildBattler([ '<visionMultiplier:-200>' ]);

      // Act
      const result = battler.getVisionModifier();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getProjectileDurationModifier', () =>
  {
    it('computes the constrained multiplier from summed note tags and caches it', () =>
    {
      // Arrange- base 100 + 50 = 150, / 100 = 1.5.
      const battler = buildBattler([ '<projectileDuration:50>' ]);

      // Act
      const result = battler.getProjectileDurationModifier();

      // Assert
      expect(result).toBeCloseTo(1.5);
      expect(battler.getCachedProjectileDurationModifier()).toBeCloseTo(1.5);
    });

    it('returns the cached value on a second call without recomputing', () =>
    {
      // Arrange
      const battler = buildBattler([ '<projectileDuration:50>' ]);
      battler.getProjectileDurationModifier();
      battler.__testNoteSources = [ { note: '<projectileDuration:999>' } ];

      // Act
      const result = battler.getProjectileDurationModifier();

      // Assert
      expect(result).toBeCloseTo(1.5);
    });

    it('clamps the multiplier to never go below zero', () =>
    {
      // Arrange
      const battler = buildBattler([ '<projectileDuration:-200>' ]);

      // Act
      const result = battler.getProjectileDurationModifier();

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('tickSpeedFlatModifier', () =>
  {
    it('sums all flat tick-speed tags across note sources', () =>
    {
      // Arrange
      const battler = buildBattler([ '<tickSpeedFlat:5>', '<tickSpeedFlat:-2>' ]);

      // Act & Assert
      expect(battler.tickSpeedFlatModifier()).toBe(3);
    });

    it('is 0 with no matching tags', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.tickSpeedFlatModifier()).toBe(0);
    });
  });

  describe('tickSpeedPercentModifier', () =>
  {
    it('sums the battler-wide percent tag alone when no types are requested', () =>
    {
      // Arrange
      const battler = buildBattler([ '<tickSpeedPercent:10>' ]);

      // Act & Assert
      expect(battler.tickSpeedPercentModifier()).toBe(10);
    });

    it('layers on type-scoped tuples whose classifier matches a requested type', () =>
    {
      // Arrange
      const battler = buildBattler([
        '<tickSpeedPercent:10>',
        '<tickSpeedTypePercent:[poison, 20]>',
      ]);

      // Act
      const result = battler.tickSpeedPercentModifier([ 'poison' ]);

      // Assert
      expect(result).toBe(30);
    });

    it('excludes type-scoped tuples whose classifier does not match any requested type', () =>
    {
      // Arrange
      const battler = buildBattler([
        '<tickSpeedPercent:10>',
        '<tickSpeedTypePercent:[burn, 20]>',
      ]);

      // Act
      const result = battler.tickSpeedPercentModifier([ 'poison' ]);

      // Assert
      expect(result).toBe(10);
    });
  });

  it('teamId defaults to the JABS enemy team id', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act & Assert
    expect(battler.teamId()).toBe(JABS_Battler.enemyTeamId());
  });

  it('ai returns a fresh JABS_EnemyAI instance', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act
    const ai = battler.ai();

    // Assert
    expect(ai).toBeInstanceOf(JABS_EnemyAI);
  });

  describe('default booleans', () =>
  {
    it('canIdle defaults to true', () =>
    {
      expect(buildBattler().canIdle()).toBe(true);
    });

    it('showHpBar defaults to true', () =>
    {
      expect(buildBattler().showHpBar()).toBe(true);
    });

    it('showStates defaults to true', () =>
    {
      expect(buildBattler().showStates()).toBe(true);
    });

    it('showDangerIndicator defaults to true', () =>
    {
      expect(buildBattler().showDangerIndicator()).toBe(true);
    });

    it('showBattlerName defaults to true', () =>
    {
      expect(buildBattler().showBattlerName()).toBe(true);
    });

    it('isInvincible defaults to false', () =>
    {
      expect(buildBattler().isInvincible()).toBe(false);
    });

    it('isInanimate defaults to false', () =>
    {
      expect(buildBattler().isInanimate()).toBe(false);
    });
  });

  describe('isAggroLocked', () =>
  {
    it('is true when at least one active state carries jabsAggroLock', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.states = () => [ { jabsAggroLock: false }, { jabsAggroLock: true } ];

      // Act & Assert
      expect(battler.isAggroLocked()).toBe(true);
    });

    it('is false when no active state carries jabsAggroLock', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.states = () => [ { jabsAggroLock: false }, {} ];

      // Act & Assert
      expect(battler.isAggroLocked()).toBe(false);
    });

    it('is false with no active states at all', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.states = () => [];

      // Act & Assert
      expect(battler.isAggroLocked()).toBe(false);
    });
  });

  describe('death context', () =>
  {
    it('getDeathContext is null before anything is set', () =>
    {
      expect(buildBattler().getDeathContext()).toBeNull();
    });

    it('setDeathContext assigns the context read back by getDeathContext', () =>
    {
      // Arrange
      const battler = buildBattler();
      const context = { cause: 'skill' };

      // Act
      battler.setDeathContext(context);

      // Assert
      expect(battler.getDeathContext()).toBe(context);
    });

    it('clearDeathContext resets the context back to null', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.setDeathContext({ cause: 'skill' });

      // Act
      battler.clearDeathContext();

      // Assert
      expect(battler.getDeathContext()).toBeNull();
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-properties.test.js
