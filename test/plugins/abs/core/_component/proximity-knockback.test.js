//region plugins/abs/core/_component/proximity-knockback.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string. The regex-parsing helpers
 * this tag relies on (getArraysFromNotesByRegex) only need a `.note` string, not any particular
 * prototype chain, so a plain RPG_Skill-backed stub works fine as a generic note source.
 * @param {string} note
 * @returns {object}
 */
function buildNoteSource(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a plain duck-typed "JABS_Engine" carrying only getProximityKnockbackBonusPct,
 * borrowed directly from the real prototype.
 * @returns {object}
 */
function buildEngine()
{
  return {
    getProximityKnockbackBonusPct: globalThis.JABS_Engine.prototype.getProximityKnockbackBonusPct,
  };
}

/**
 * Builds a plain duck-typed "JABS_Battler" (caster) exposing only getBattler().getAllNotes().
 * @param {string[]} notes
 * @returns {object}
 */
function buildCaster(notes = [])
{
  return {
    getBattler: () => ({
      getAllNotes: () => notes.map(note => buildNoteSource(note)),
    }),
  };
}

/**
 * Stubs JABS_AiManager.getOpposingBattlersWithinRange to report a fixed enemy count for
 * every radius queried, regardless of the caster passed in.
 * @param {number} count
 */
function stubNearbyEnemyCount(count)
{
  globalThis.JABS_AiManager.getOpposingBattlersWithinRange = () => new Array(count).fill({});
}

/**
 * Stubs JABS_AiManager.getOpposingBattlersWithinRange to report a different enemy count
 * per radius, keyed by radius value.
 * @param {Record<number, number>} countsByRadius
 */
function stubNearbyEnemyCountByRadius(countsByRadius)
{
  globalThis.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
    new Array(countsByRadius[radius] ?? 0).fill({});
}

describe('J-ABS proximity knockback (direct src import)', () =>
{
  /** @type {(caster: object, radius: number) => object[]} */
  let originalGetOpposingBattlersWithinRange;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: globalThis.JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    originalGetOpposingBattlersWithinRange = globalThis.JABS_AiManager.getOpposingBattlersWithinRange;
  });

  afterEach(() =>
  {
    globalThis.JABS_AiManager.getOpposingBattlersWithinRange = originalGetOpposingBattlersWithinRange;
  });

  it('returns 0 when the caster has no proximityKnockback tags', () =>
  {
    // Arrange
    stubNearbyEnemyCount(3);
    const engine = buildEngine();
    const caster = buildCaster([]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(0);
  });

  it('returns 0 when tagged but no enemies are nearby', () =>
  {
    // Arrange
    stubNearbyEnemyCount(0);
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[4, 25]>' ]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(0);
  });

  it('scales the percent by the number of nearby enemies', () =>
  {
    // Arrange- 3 enemies * 25% = 75%.
    stubNearbyEnemyCount(3);
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[4, 25]>' ]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(75);
  });

  it('queries the AI manager using the tag\'s own radius', () =>
  {
    // Arrange
    let queriedRadius = null;
    globalThis.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
    {
      queriedRadius = radius;
      return [ {}, {} ];
    };
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[6, 10]>' ]);

    // Act
    engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(queriedRadius).toBe(6);
  });

  it('sums contributions from multiple tags with different radii independently', () =>
  {
    // Arrange- (2 enemies * 10%) + (1 enemy * 50%) = 70%.
    stubNearbyEnemyCountByRadius({ 3: 2, 8: 1 });
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[3, 10]>\n<proximityKnockback:[8, 50]>' ]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(70);
  });

  it('sums contributions across multiple note sources', () =>
  {
    // Arrange- 2 enemies * (25% + 15%) = 80%.
    stubNearbyEnemyCount(2);
    const engine = buildEngine();
    const caster = buildCaster([
      '<proximityKnockback:[4, 25]>',
      '<proximityKnockback:[4, 15]>',
    ]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(80);
  });

  it('supports a negative percent to dampen knockback near enemies', () =>
  {
    // Arrange- 4 enemies * -10% = -40%.
    stubNearbyEnemyCount(4);
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[4, -10]>' ]);

    // Act
    const result = engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(result).toBe(-40);
  });

  it('supports a decimal radius', () =>
  {
    // Arrange
    let queriedRadius = null;
    globalThis.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
    {
      queriedRadius = radius;
      return [ {} ];
    };
    const engine = buildEngine();
    const caster = buildCaster([ '<proximityKnockback:[4.5, 20]>' ]);

    // Act
    engine.getProximityKnockbackBonusPct(caster);

    // Assert
    expect(queriedRadius).toBe(4.5);
  });
});
//endregion plugins/abs/core/_component/proximity-knockback.test.js
