//region plugins/abs/core/_component/game-battler-state-immunity.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

const NEGATIVE_STATE_ID = 30;
const POSITIVE_STATE_ID = 31;
const CC_TYPED_STATE_ID = 32;
const DEATH_STATE_ID = 1;

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
 * Registers a state row with the given polarity and type classifiers.
 * @param {number} stateId
 * @param {object} fields
 * @returns {object}
 */
function registerStateRow(stateId, fields = {})
{
  const row = Object.create(globalThis.RPG_State.prototype);
  row.id = stateId;
  row.note = fields.note ?? '';
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;
  row._original = function() { return this; };

  globalThis.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a real Game_Battler-backed instance with controllable notes for immunity tests.
 * @param {string[]} notes
 * @returns {object}
 */
function buildBattler(notes = [])
{
  const battler = Object.create(globalThis.Game_Battler.prototype);
  battler.initMembers();
  battler._hp = 1;
  battler.getAllNotes = () => notes.map(note => buildNoteSource(note));
  battler.deathStateId = () => DEATH_STATE_ID;
  return battler;
}

describe('J-ABS Game_Battler state-application immunity (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // patches globalThis.RPG_State.prototype with the isNegativeType method isStateAddable reads.
    await import('../../../../../src/plugins/abs/core/database/RPG_State.js');

    // this test realm has no vanilla RMMZ scripts loaded, so the "original" isStateAddable
    // captured at alias time is undefined- stub it so fallthrough tests exercise only the
    // new immunity logic, not vanilla eligibility rules that don't exist in this harness.
    globalThis.J.ABS.Aliased.Game_Battler.set('isStateAddable', () => true);
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.$dataStates = [ null ];

    registerStateRow(NEGATIVE_STATE_ID, { note: '<type:negative>' });
    registerStateRow(POSITIVE_STATE_ID, {});
    registerStateRow(CC_TYPED_STATE_ID, { note: '<type:cc>' });
    registerStateRow(DEATH_STATE_ID, {});
  });

  describe('isStateAddable priority order', () =>
  {
    it('blocks a positive state under <immuneToAll>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToAll>' ]);

      // Act
      const result = battler.isStateAddable(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('blocks even the death state under <immuneToAll>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToAll>' ]);

      // Act
      const result = battler.isStateAddable(DEATH_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('blocks a positive state under <immuneToStates>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToStates>' ]);

      // Act
      const result = battler.isStateAddable(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('blocks a negative state under <immuneToStates>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToStates>' ]);

      // Act
      const result = battler.isStateAddable(NEGATIVE_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('does not block the death state under <immuneToStates>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToStates>' ]);

      // Act
      const result = battler.isStateAddable(DEATH_STATE_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('blocks a <type:negative>-tagged state under <immuneToNegatives>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToNegatives>' ]);

      // Act
      const result = battler.isStateAddable(NEGATIVE_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('does not block a positive state under <immuneToNegatives>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<immuneToNegatives>' ]);

      // Act
      const result = battler.isStateAddable(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('blocks a state carrying a matching type under <stateTypeImmune:TYPE>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeImmune:cc>' ]);

      // Act
      const result = battler.isStateAddable(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('does not block a state with no matching type under <stateTypeImmune:TYPE>', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeImmune:cc>' ]);

      // Act
      const result = battler.isStateAddable(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('type matching is case-insensitive', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeImmune:CC>' ]);

      // Act
      const result = battler.isStateAddable(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBe(false);
    });

    it('falls through to normal eligibility for a positive state when no immunity tag matches', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act
      const result = battler.isStateAddable(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('falls through to normal eligibility for a negative state when no immunity tag matches', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act
      const result = battler.isStateAddable(NEGATIVE_STATE_ID);

      // Assert
      expect(result).toBe(true);
    });

    it('skips polarity/type-classifier immunity checks for a state id with no database row', () =>
    {
      // Arrange- an out-of-range/bogus state id, so $dataStates[stateId] is undefined.
      const battler = buildBattler([]);

      // Act & Assert
      expect(() => battler.isStateAddable(9999)).not.toThrow();
      expect(battler.isStateAddable(9999)).toBe(true);
    });
  });

  describe('stateTypeResistRate', () =>
  {
    it('returns 1.0 (no resistance) when the state has no type classifiers', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeResist:[cc, 50]>' ]);

      // Act
      const result = battler.stateTypeResistRate(POSITIVE_STATE_ID);

      // Assert
      expect(result).toBe(1.0);
    });

    it('returns 1.0 when no stateTypeResist tags are present', () =>
    {
      // Arrange
      const battler = buildBattler([]);

      // Act
      const result = battler.stateTypeResistRate(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBe(1.0);
    });

    it('reduces the rate by the tagged percent for a matching type', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeResist:[cc, 50]>' ]);

      // Act
      const result = battler.stateTypeResistRate(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBeCloseTo(0.5);
    });

    it('stacks additively across multiple tags for the same type', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeResist:[cc, 40]>\n<stateTypeResist:[cc, 40]>' ]);

      // Act
      const result = battler.stateTypeResistRate(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBeCloseTo(0.2);
    });

    it('clamps the rate at 0 rather than going negative', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeResist:[cc, 150]>' ]);

      // Act
      const result = battler.stateTypeResistRate(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBe(0);
    });

    it('ignores tags for a non-matching type', () =>
    {
      // Arrange
      const battler = buildBattler([ '<stateTypeResist:[poison, 50]>' ]);

      // Act
      const result = battler.stateTypeResistRate(CC_TYPED_STATE_ID);

      // Assert
      expect(result).toBe(1.0);
    });
  });
});
//endregion plugins/abs/core/_component/game-battler-state-immunity.test.js
