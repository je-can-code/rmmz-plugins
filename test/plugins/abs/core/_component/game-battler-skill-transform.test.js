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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Battler.js');

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

  describe('getSlotTransformSkillId', () =>
  {
    /**
     * Builds a battler whose transform sources are exactly the given note-bearing objects.
     * @param {object[]} sources The ordered sources to expose.
     * @returns {object}
     */
    function buildBattlerWithSources(sources)
    {
      const battler = buildBattler();
      battler.getSkillTransformSources = () => sources;
      return battler;
    }

    it('returns 0 when no slot key is supplied', () =>
    {
      // Arrange- a source that would match anything it was asked about, so only the guard
      // can produce the zero.
      const battler = buildBattlerWithSources([ { jabsSlotTransforms: [ [ 'UsableItem', 512 ] ] } ]);

      // Act
      const result = battler.getSlotTransformSkillId('');

      // Assert
      expect(result).toBe(0);
    });

    it('skips sources carrying no slot transforms at all', () =>
    {
      // Arrange- a null source, an empty-array source, and a bare object precede the real one.
      const battler = buildBattlerWithSources([
        null,
        { jabsSlotTransforms: [] },
        { id: 'no-tags-at-all' },
        { jabsSlotTransforms: [ [ 'UsableItem', 512 ] ] },
      ]);

      // Act
      const result = battler.getSlotTransformSkillId('UsableItem');

      // Assert
      expect(result).toBe(512);
    });

    it('matches the slot key without regard to casing', () =>
    {
      // Arrange
      const battler = buildBattlerWithSources([ { jabsSlotTransforms: [ [ 'usable-ITEM', 512 ] ] } ]);

      // Act
      const result = battler.getSlotTransformSkillId('Usable-Item');

      // Assert
      expect(result).toBe(512);
    });

    it('returns the first matching source when several define the same slot', () =>
    {
      // Arrange- the loser also matches, so returning "a match" is not enough to pass; only
      // returning the *first* one is.
      const battler = buildBattlerWithSources([
        { jabsSlotTransforms: [ [ 'UsableItem', 512 ] ] },
        { jabsSlotTransforms: [ [ 'UsableItem', 999 ] ] },
      ]);

      // Act
      const result = battler.getSlotTransformSkillId('UsableItem');

      // Assert
      expect(result).toBe(512);
    });

    it('returns 0 when a source has slot transforms but none name this slot', () =>
    {
      // Arrange- a near-miss sibling that must not be selected.
      const battler = buildBattlerWithSources([ { jabsSlotTransforms: [ [ 'Dodge', 512 ] ] } ]);

      // Act
      const result = battler.getSlotTransformSkillId('UsableItem');

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getResolvedSkillId', () =>
  {
    /**
     * Builds a battler with no transform sources of any kind, which is the baseline the
     * pre-existing skill-transform behavior was written against.
     * @returns {object}
     */
    function buildUntransformedBattler()
    {
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [];
      return battler;
    }

    it('returns the raw equipped id for the tool slot, bypassing transform resolution', () =>
    {
      // Arrange
      const battler = buildUntransformedBattler();
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
      const battler = buildUntransformedBattler();
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
      const battler = buildUntransformedBattler();
      battler.getEquippedSkillId = () => 10;
      battler.resolveEquippedSkillId = baseSkillId => baseSkillId + 1;

      // Act & Assert
      expect(battler.getResolvedSkillId('mainhand')).toBe(11);
    });

    it('returns the slot transform target for an item slot, which skill transforms cannot reach', () =>
    {
      // Arrange- the slot holds an item id, and that id is deliberately different from the
      // transform target so "returned the stored contents" cannot pass as success.
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [ { jabsSlotTransforms: [ [ 'item', 512 ] ] } ];
      battler.getEquippedSkillId = () => 6;

      // Act
      const result = battler.getResolvedSkillId('item');

      // Assert
      expect(result).toBe(512);
    });

    it('returns the slot transform target for an empty slot', () =>
    {
      // Arrange- nothing equipped anywhere, which is what a food slot looks like once the last
      // dish is gone; the transform is the only thing that can supply a skill here.
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [ { jabsSlotTransforms: [ [ 'item', 512 ] ] } ];
      battler.getEquippedSkillId = () => 0;

      // Act
      const result = battler.getResolvedSkillId('item');

      // Assert
      expect(result).toBe(512);
    });

    it('prefers the slot transform over a skill transform on the same slot', () =>
    {
      // Arrange- both kinds of transform are live and they disagree; the slot-keyed one names
      // the slot explicitly, so it is the more specific statement and wins.
      const battler = buildBattler();
      battler.getSkillTransformSources = () => [ { jabsSlotTransforms: [ [ 'mainhand', 512 ] ] } ];
      battler.getEquippedSkillId = () => 10;
      battler.resolveEquippedSkillId = () => 777;

      // Act
      const result = battler.getResolvedSkillId('mainhand');

      // Assert
      expect(result).toBe(512);
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
