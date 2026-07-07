//region plugins/abs/core/game-battler-state-immunity.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

const NEGATIVE_STATE_ID = 30;
const POSITIVE_STATE_ID = 31;
const CC_TYPED_STATE_ID = 32;
const DEATH_STATE_ID = 1;

/**
 * Builds a minimal note-source stub carrying the given tag string.
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

/**
 * Registers a state row with the given polarity and type classifiers.
 * @param {object} sandbox
 * @param {number} stateId
 * @param {object} fields
 * @returns {object}
 */
function registerStateRow(sandbox, stateId, fields = {})
{
  const row = Object.create(sandbox.RPG_State.prototype);
  row.id = stateId;
  row.note = fields.note ?? '';
  row.meta = {};
  row.name = `State ${stateId}`;
  row.iconIndex = 0;
  row._original = function() { return this; };

  sandbox.$dataStates[stateId] = row;

  return row;
}

/**
 * Builds a real Game_Battler-backed instance with controllable notes for immunity tests.
 * @param {object} sandbox
 * @param {string[]} notes
 * @returns {object}
 */
function buildBattler(sandbox, notes = [])
{
  const battler = Object.create(sandbox.Game_Battler.prototype);
  battler.initMembers();
  battler._hp = 1;
  battler.getAllNotes = () => notes.map(note => buildNoteSource(sandbox, note));
  battler.deathStateId = () => DEATH_STATE_ID;
  return battler;
}

describe('J-ABS Game_Battler state-application immunity (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);

    // this test VM has no vanilla RMMZ scripts loaded, so the "original" isStateAddable
    // captured at alias time is undefined- stub it so fallthrough tests exercise only the
    // new immunity logic, not vanilla eligibility rules that don't exist in this harness.
    sandbox.J.ABS.Aliased.Game_Battler.set('isStateAddable', () => true);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    sandbox.$dataStates = [ null ];

    registerStateRow(sandbox, NEGATIVE_STATE_ID, { note: '<negative>' });
    registerStateRow(sandbox, POSITIVE_STATE_ID, {});
    registerStateRow(sandbox, CC_TYPED_STATE_ID, { note: '<type:cc>' });
    registerStateRow(sandbox, DEATH_STATE_ID, {});
  });

  describe('isStateAddable priority order', () =>
  {
    it('blocks everything, including the death state, under <immuneToAll>', () =>
    {
      const battler = buildBattler(sandbox, [ '<immuneToAll>' ]);

      expect(battler.isStateAddable(POSITIVE_STATE_ID)).toBe(false);
      expect(battler.isStateAddable(DEATH_STATE_ID)).toBe(false);
    });

    it('blocks everything except the death state under <immuneToStates>', () =>
    {
      const battler = buildBattler(sandbox, [ '<immuneToStates>' ]);

      expect(battler.isStateAddable(POSITIVE_STATE_ID)).toBe(false);
      expect(battler.isStateAddable(NEGATIVE_STATE_ID)).toBe(false);
      expect(battler.isStateAddable(DEATH_STATE_ID)).toBe(true);
    });

    it('blocks only <negative>-tagged states under <immuneToNegatives>', () =>
    {
      const battler = buildBattler(sandbox, [ '<immuneToNegatives>' ]);

      expect(battler.isStateAddable(NEGATIVE_STATE_ID)).toBe(false);
      expect(battler.isStateAddable(POSITIVE_STATE_ID)).toBe(true);
    });

    it('blocks only states carrying a matching type under <stateTypeImmune:TYPE>', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeImmune:cc>' ]);

      expect(battler.isStateAddable(CC_TYPED_STATE_ID)).toBe(false);
      expect(battler.isStateAddable(POSITIVE_STATE_ID)).toBe(true);
      expect(battler.isStateAddable(NEGATIVE_STATE_ID)).toBe(true);
    });

    it('type matching is case-insensitive', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeImmune:CC>' ]);

      expect(battler.isStateAddable(CC_TYPED_STATE_ID)).toBe(false);
    });

    it('falls through to normal eligibility when no immunity tag matches', () =>
    {
      const battler = buildBattler(sandbox, []);

      expect(battler.isStateAddable(POSITIVE_STATE_ID)).toBe(true);
      expect(battler.isStateAddable(NEGATIVE_STATE_ID)).toBe(true);
    });
  });

  describe('stateTypeResistRate', () =>
  {
    it('returns 1.0 (no resistance) when the state has no type classifiers', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeResist:[cc, 50]>' ]);

      expect(battler.stateTypeResistRate(POSITIVE_STATE_ID)).toBe(1.0);
    });

    it('returns 1.0 when no stateTypeResist tags are present', () =>
    {
      const battler = buildBattler(sandbox, []);

      expect(battler.stateTypeResistRate(CC_TYPED_STATE_ID)).toBe(1.0);
    });

    it('reduces the rate by the tagged percent for a matching type', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeResist:[cc, 50]>' ]);

      expect(battler.stateTypeResistRate(CC_TYPED_STATE_ID)).toBeCloseTo(0.5);
    });

    it('stacks additively across multiple tags for the same type', () =>
    {
      const battler = buildBattler(sandbox, [
        '<stateTypeResist:[cc, 40]>\n<stateTypeResist:[cc, 40]>',
      ]);

      expect(battler.stateTypeResistRate(CC_TYPED_STATE_ID)).toBeCloseTo(0.2);
    });

    it('clamps the rate at 0 rather than going negative', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeResist:[cc, 150]>' ]);

      expect(battler.stateTypeResistRate(CC_TYPED_STATE_ID)).toBe(0);
    });

    it('ignores tags for a non-matching type', () =>
    {
      const battler = buildBattler(sandbox, [ '<stateTypeResist:[poison, 50]>' ]);

      expect(battler.stateTypeResistRate(CC_TYPED_STATE_ID)).toBe(1.0);
    });
  });
});
//endregion plugins/abs/core/game-battler-state-immunity.test.js
