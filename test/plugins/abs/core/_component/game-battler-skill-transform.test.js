//region plugins/abs/core/_component/game-battler-skill-transform.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a real Game_Battler-backed instance.
 * @returns {object}
 */
function buildBattler()
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  return battler;
}

describe('J-ABS Game_Battler skill transform resolution (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    globalThis.JABS_Button = { Tool: 'tool', UsableItem: 'item' };

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_Battler.js');

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');
  });

  describe('getSkillTransformSources', () =>
  {
    it('orders active states by descending priority ahead of the battler\'s own database row', () =>
    {
      // Arrange
      const battler = buildBattler();
      const dbRow = { id: 'db-row' };
      const lowPriority = { id: 'low', priority: 1 };
      const highPriority = { id: 'high', priority: 9 };
      battler.states = () => [ lowPriority, highPriority ];
      battler.databaseData = () => dbRow;

      // Act
      const sources = battler.getSkillTransformSources();

      // Assert
      expect(sources).toEqual([ highPriority, lowPriority, dbRow ]);
    });

    it('does not mutate the live states array while sorting', () =>
    {
      // Arrange
      const battler = buildBattler();
      const lowPriority = { id: 'low', priority: 1 };
      const highPriority = { id: 'high', priority: 9 };
      const liveStates = [ lowPriority, highPriority ];
      battler.states = () => liveStates;
      battler.databaseData = () => ({});

      // Act
      battler.getSkillTransformSources();

      // Assert- the original array order is untouched.
      expect(liveStates).toEqual([ lowPriority, highPriority ]);
    });
  });

  describe('resolveEquippedSkillId', () =>
  {
    it('returns 0 unchanged for an empty slot (id 0)', () =>
    {
      // Arrange
      const battler = buildBattler();

      // Act & Assert
      expect(battler.resolveEquippedSkillId(0)).toBe(0);
    });

    it('returns the base id unchanged when no source defines a matching transform', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [ { jabsSkillTransforms: [] }, {} ];

      // Act & Assert
      expect(battler.resolveEquippedSkillId(10)).toBe(10);
    });

    it('skips sources with no transform tags at all', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [
        null,
        { jabsSkillTransforms: undefined },
        { jabsSkillTransforms: [] },
        { jabsSkillTransforms: [ [ 10, 20 ] ] },
      ];

      // Act & Assert
      expect(battler.resolveEquippedSkillId(10)).toBe(20);
    });

    it('returns the first matching source\'s transformed id, even when a later source also matches', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [
        { jabsSkillTransforms: [ [ 10, 20 ] ] },
        { jabsSkillTransforms: [ [ 10, 999 ] ] },
      ];

      // Act & Assert
      expect(battler.resolveEquippedSkillId(10)).toBe(20);
    });

    it('returns the base id unchanged when a source has transforms but none match the base id', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [ { jabsSkillTransforms: [ [ 99, 20 ] ] } ];

      // Act & Assert
      expect(battler.resolveEquippedSkillId(10)).toBe(10);
    });
  });

  describe('getResolvedSkillId', () =>
  {
    it('returns the raw equipped id for the tool slot, bypassing transform resolution', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getEquippedSkillId = () => 5;
      const resolveSpy = vi.spyOn(battler, 'resolveEquippedSkillId');

      // Act
      const result = battler.getResolvedSkillId('tool');

      // Assert
      expect(result).toBe(5);
      expect(resolveSpy).not.toHaveBeenCalled();
      resolveSpy.mockRestore();
    });

    it('returns the raw equipped id for the usable-item slot, bypassing transform resolution', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getEquippedSkillId = () => 6;
      const resolveSpy = vi.spyOn(battler, 'resolveEquippedSkillId');

      // Act
      const result = battler.getResolvedSkillId('item');

      // Assert
      expect(result).toBe(6);
      expect(resolveSpy).not.toHaveBeenCalled();
      resolveSpy.mockRestore();
    });

    it('resolves the transformed skill id for any other slot', () =>
    {
      // Arrange
      const battler = buildBattler();
      battler.getEquippedSkillId = () => 10;
      battler.resolveEquippedSkillId = baseSkillId => baseSkillId + 1;

      // Act & Assert
      expect(battler.getResolvedSkillId('mainhand')).toBe(11);
    });
  });

  it('regenerateAll disables native regeneration by doing nothing', () =>
  {
    // Arrange
    const battler = buildBattler();

    // Act & Assert
    expect(() => battler.regenerateAll()).not.toThrow();
  });
});
//endregion plugins/abs/core/_component/game-battler-skill-transform.test.js
