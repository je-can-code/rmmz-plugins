//region plugins/abs/core/proximity-knockback.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string. The regex-parsing helpers
 * this tag relies on (getArraysFromNotesByRegex) only need a `.note` string, not any particular
 * prototype chain, so a plain RPG_Skill-backed stub works fine as a generic note source.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildNoteSource(sandbox, note)
{
  const row = Object.create(sandbox.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

describe('J-ABS proximity knockback (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {(caster: object, radius: number) => object[]} */
  let originalGetOpposingBattlersWithinRange;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    originalGetOpposingBattlersWithinRange = sandbox.JABS_AiManager.getOpposingBattlersWithinRange;
  });

  afterEach(() =>
  {
    sandbox.JABS_AiManager.getOpposingBattlersWithinRange = originalGetOpposingBattlersWithinRange;
  });

  /**
   * Builds a plain duck-typed "JABS_Engine" carrying only getProximityKnockbackBonusPct,
   * borrowed directly from the real prototype.
   * @returns {object}
   */
  function buildEngine()
  {
    return {
      getProximityKnockbackBonusPct: sandbox.JABS_Engine.prototype.getProximityKnockbackBonusPct,
    };
  }

  /**
   * Builds a plain duck-typed "JABS_Battler" (caster) exposing only getBattler().getAllNotes().
   * @param {object} sandboxRef
   * @param {string[]} notes
   * @returns {object}
   */
  function buildCaster(sandboxRef, notes = [])
  {
    return {
      getBattler: () => ({
        getAllNotes: () => notes.map(note => buildNoteSource(sandboxRef, note)),
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
    sandbox.JABS_AiManager.getOpposingBattlersWithinRange = () => new Array(count).fill({});
  }

  /**
   * Stubs JABS_AiManager.getOpposingBattlersWithinRange to report a different enemy count
   * per radius, keyed by radius value.
   * @param {Record<number, number>} countsByRadius
   */
  function stubNearbyEnemyCountByRadius(countsByRadius)
  {
    sandbox.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
      new Array(countsByRadius[radius] ?? 0).fill({});
  }

  it('returns 0 when the caster has no proximityKnockback tags', () =>
  {
    stubNearbyEnemyCount(3);
    const engine = buildEngine();
    const caster = buildCaster(sandbox, []);

    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(0);
  });

  it('returns 0 when tagged but no enemies are nearby', () =>
  {
    stubNearbyEnemyCount(0);
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [ '<proximityKnockback:[4, 25]>' ]);

    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(0);
  });

  it('scales the percent by the number of nearby enemies', () =>
  {
    stubNearbyEnemyCount(3);
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [ '<proximityKnockback:[4, 25]>' ]);

    // 3 enemies * 25% = 75%.
    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(75);
  });

  it('queries the AI manager using the tag\'s own radius', () =>
  {
    let queriedRadius = null;
    sandbox.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
    {
      queriedRadius = radius;
      return [ {}, {} ];
    };
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [ '<proximityKnockback:[6, 10]>' ]);

    engine.getProximityKnockbackBonusPct(caster);

    expect(queriedRadius).toBe(6);
  });

  it('sums contributions from multiple tags with different radii independently', () =>
  {
    stubNearbyEnemyCountByRadius({ 3: 2, 8: 1 });
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [
      '<proximityKnockback:[3, 10]>\n<proximityKnockback:[8, 50]>',
    ]);

    // (2 enemies * 10%) + (1 enemy * 50%) = 70%.
    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(70);
  });

  it('sums contributions across multiple note sources', () =>
  {
    stubNearbyEnemyCount(2);
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [
      '<proximityKnockback:[4, 25]>',
      '<proximityKnockback:[4, 15]>',
    ]);

    // 2 enemies * (25% + 15%) = 80%.
    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(80);
  });

  it('supports a negative percent to dampen knockback near enemies', () =>
  {
    stubNearbyEnemyCount(4);
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [ '<proximityKnockback:[4, -10]>' ]);

    // 4 enemies * -10% = -40%.
    expect(engine.getProximityKnockbackBonusPct(caster)).toBe(-40);
  });

  it('supports a decimal radius', () =>
  {
    let queriedRadius = null;
    sandbox.JABS_AiManager.getOpposingBattlersWithinRange = (caster, radius) =>
    {
      queriedRadius = radius;
      return [ {} ];
    };
    const engine = buildEngine();
    const caster = buildCaster(sandbox, [ '<proximityKnockback:[4.5, 20]>' ]);

    engine.getProximityKnockbackBonusPct(caster);

    expect(queriedRadius).toBe(4.5);
  });
});
//endregion plugins/abs/core/proximity-knockback.test.js
