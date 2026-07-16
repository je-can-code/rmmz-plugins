//region plugins/abs/core/_component/knockback-amp.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string.
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
 * Builds a plain duck-typed "JABS_Engine" carrying only the knockback-amp methods under test,
 * borrowed directly from the real prototype.
 * @returns {object}
 */
function buildEngine()
{
  return {
    getKnockbackAmplificationPct: globalThis.JABS_Engine.prototype.getKnockbackAmplificationPct,
    getFlatKnockbackAmpPct: globalThis.JABS_Engine.prototype.getFlatKnockbackAmpPct,
    getThisKnockbackAmpPct: globalThis.JABS_Engine.prototype.getThisKnockbackAmpPct,
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
 * Builds a plain duck-typed "JABS_Action" exposing only getBaseSkill().
 * @param {string} skillNote
 * @returns {object}
 */
function buildAction(skillNote = '')
{
  return {
    getBaseSkill: () => buildNoteSource(skillNote),
  };
}

describe('J-ABS knockback amplification (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: globalThis.JABS_AiManager } = await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
    ({ default: globalThis.JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.JABS_AiManager.getOpposingBattlersWithinRange = () => [];
  });

  describe('getFlatKnockbackAmpPct', () =>
  {
    it('returns 0 when the caster has no knockbackAmp tags', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = buildCaster([]);

      // Act
      const result = engine.getFlatKnockbackAmpPct(caster);

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent from a single caster note source', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = buildCaster([ '<knockbackAmp:50>' ]);

      // Act
      const result = engine.getFlatKnockbackAmpPct(caster);

      // Assert
      expect(result).toBe(50);
    });

    it('sums contributions across multiple note sources', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = buildCaster([ '<knockbackAmp:50>', '<knockbackAmp:25>' ]);

      // Act
      const result = engine.getFlatKnockbackAmpPct(caster);

      // Assert
      expect(result).toBe(75);
    });

    it('supports a negative percent to dampen outgoing knockback unconditionally', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = buildCaster([ '<knockbackAmp:-30>' ]);

      // Act
      const result = engine.getFlatKnockbackAmpPct(caster);

      // Assert
      expect(result).toBe(-30);
    });
  });

  describe('getThisKnockbackAmpPct', () =>
  {
    it('returns 0 when the executing skill has no thisKnockbackAmp tag', () =>
    {
      // Arrange
      const engine = buildEngine();
      const action = buildAction('');

      // Act
      const result = engine.getThisKnockbackAmpPct(action);

      // Assert
      expect(result).toBe(0);
    });

    it('returns the configured percent from the executing skill', () =>
    {
      // Arrange
      const engine = buildEngine();
      const action = buildAction('<thisKnockbackAmp:40>');

      // Act
      const result = engine.getThisKnockbackAmpPct(action);

      // Assert
      expect(result).toBe(40);
    });
  });

  describe('getKnockbackAmplificationPct', () =>
  {
    it('returns 0 when nothing is tagged anywhere', () =>
    {
      // Arrange
      const engine = buildEngine();
      const caster = buildCaster([]);
      const action = buildAction('');

      // Act
      const result = engine.getKnockbackAmplificationPct(caster, action);

      // Assert
      expect(result).toBe(0);
    });

    it('sums the flat caster-wide amp, the skill-scoped amp, and the proximity amp together', () =>
    {
      // Arrange- flat 20 + this-skill 10 + proximity (2 enemies * 25%=50) = 80.
      globalThis.JABS_AiManager.getOpposingBattlersWithinRange = () => [ {}, {} ];
      const engine = buildEngine();
      const caster = buildCaster([ '<knockbackAmp:20>', '<proximityKnockback:[4, 25]>' ]);
      const action = buildAction('<thisKnockbackAmp:10>');

      // Act
      const result = engine.getKnockbackAmplificationPct(caster, action);

      // Assert
      expect(result).toBe(80);
    });
  });
});
//endregion plugins/abs/core/_component/knockback-amp.test.js
