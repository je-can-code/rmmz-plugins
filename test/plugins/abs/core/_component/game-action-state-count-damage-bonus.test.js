//region plugins/abs/core/_component/game-action-state-count-damage-bonus.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal skill/note-source stub with the given notetag string.
 * @param {string} note
 * @returns {object}
 */
function buildSkill(note)
{
  const skill = Object.create(globalThis.RPG_Skill.prototype);
  skill.id = 1;
  skill.note = note;
  skill.meta = {};
  skill._original = function() { return this; };
  return skill;
}

/**
 * Builds a minimal caster stub whose getAllNotes returns the given note sources.
 * @param {object[]} noteSources Objects with a .note string (skills, states, etc.).
 * @param {string} uuid The caster's uuid, used for authorship comparisons.
 * @returns {object}
 */
function buildCaster(noteSources = [], uuid = 'caster')
{
  return {
    getAllNotes()
    {
      return noteSources;
    },
    getUuid()
    {
      return uuid;
    },
  };
}

/**
 * Builds a minimal target stub whose isStateAffected checks the given active state ids.
 * @param {string} uuid The target's uuid, used to key $jabsEngine lookups.
 * @param {number[]} activeStateIds State ids currently active on this target.
 * @returns {object}
 */
function buildTarget(uuid, activeStateIds = [])
{
  return {
    getUuid()
    {
      return uuid;
    },
    isStateAffected(stateId)
    {
      return activeStateIds.includes(stateId);
    },
  };
}

/**
 * Builds a minimal Game_Action stub backed by the given caster and skill.
 * @param {object} caster
 * @param {object} skill
 * @returns {object}
 */
function buildAction(caster, skill)
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.subject = () => caster;
  action.item = () => skill;
  return action;
}

describe('J-ABS Game_Action state-count damage bonus (direct src import)', () =>
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

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  describe('calculatePerStateStackPct (bonusDamagePerStateStack)', () =>
  {
    it('returns 0 when the caster has no bonusDamagePerStateStack tags', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14 ]);

      // Act
      const result = action.calculatePerStateStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the tagged state is not active on the target', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', []);

      // Act
      const result = action.calculatePerStateStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('returns 0 when the state is flagged active but has no live tracked entry', () =>
    {
      // Arrange
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14 ]);
      globalThis.$jabsEngine = { getJabsStateByUuidAndStateId: () => undefined };

      // Act
      const result = action.calculatePerStateStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('multiplies the tag percent by the target state tracker stack count', () =>
    {
      // Arrange- 2% per stack * 50 stacks = 100%.
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14 ]);
      globalThis.$jabsEngine = {
        getJabsStateByUuidAndStateId: (uuid, stateId) =>
        {
          expect(uuid).toBe('target');
          expect(stateId).toBe(14);
          return { stackCount: 50 };
        },
      };

      // Act
      const result = action.calculatePerStateStackPct(target);

      // Assert
      expect(result).toBe(100);
    });

    it('stacks additively across multiple tags for different states', () =>
    {
      // Arrange- (2% * 10) + (5% * 4) = 20 + 20 = 40.
      const passiveNote = buildSkill('<bonusDamagePerStateStack:[14, 2]>\n<bonusDamagePerStateStack:[20, 5]>');
      const caster = buildCaster([ passiveNote ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 14, 20 ]);
      const stackCounts = { 14: 10, 20: 4 };
      globalThis.$jabsEngine = {
        getJabsStateByUuidAndStateId: (uuid, stateId) => ({ stackCount: stackCounts[stateId] }),
      };

      // Act
      const result = action.calculatePerStateStackPct(target);

      // Assert
      expect(result).toBe(40);
    });
  });

  describe('calculateBonusForMyStateCountPct (bonusDamageForMyStateCount, caster notes)', () =>
  {
    it('returns 0 when the caster has no bonusDamageForMyStateCount tags', () =>
    {
      // Arrange
      const caster = buildCaster([ buildSkill('') ]);
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target');
      globalThis.$jabsEngine = { getJabsStatesByUuid: () => new Map() };

      // Act
      const result = action.calculateBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('counts only states authored by this caster, ignoring states authored by others', () =>
    {
      // Arrange- states 10 and 12 are authored by the caster; state 11 is not.
      const passiveNote = buildSkill('<bonusDamageForMyStateCount:5>');
      const caster = buildCaster([ passiveNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 10, 11, 12 ]);
      const trackedStates = new Map([
        [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
        [ 11, { stateId: 11, source: { getUuid: () => 'someone-else' } } ],
        [ 12, { stateId: 12, source: { getUuid: () => 'caster' } } ],
      ]);
      globalThis.$jabsEngine = { getJabsStatesByUuid: () => trackedStates };

      // Act
      const result = action.calculateBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(10);
    });

    it('skips trackers whose state is not currently affecting the target', () =>
    {
      // Arrange- state 10 is tracked but no longer actually affecting the target (lingering tracker).
      const passiveNote = buildSkill('<bonusDamageForMyStateCount:5>');
      const caster = buildCaster([ passiveNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', []);
      const trackedStates = new Map([
        [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
      ]);
      globalThis.$jabsEngine = { getJabsStatesByUuid: () => trackedStates };

      // Act
      const result = action.calculateBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('calculateThisBonusForMyStateCountPct (thisBonusDamageForMyStateCount, skill note only)', () =>
  {
    it('returns 0 when the skill has no thisBonusDamageForMyStateCount tag', () =>
    {
      // Arrange
      const caster = buildCaster([], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target');
      globalThis.$jabsEngine = { getJabsStatesByUuid: () => new Map() };

      // Act
      const result = action.calculateThisBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('does not read the tag from caster notes, only from the skill', () =>
    {
      // Arrange
      const casterNote = buildSkill('<thisBonusDamageForMyStateCount:5>');
      const caster = buildCaster([ casterNote ], 'caster');
      const action = buildAction(caster, buildSkill(''));
      const target = buildTarget('target', [ 10 ]);
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
        ]),
      };

      // Act
      const result = action.calculateThisBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('multiplies the tag percent by the count of distinct states authored by the caster', () =>
    {
      // Arrange- 5% * 2 authored states = 10.
      const skill = buildSkill('<thisBonusDamageForMyStateCount:5>');
      const caster = buildCaster([], 'caster');
      const action = buildAction(caster, skill);
      const target = buildTarget('target', [ 10, 11 ]);
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: { getUuid: () => 'caster' } } ],
          [ 11, { stateId: 11, source: { getUuid: () => 'caster' } } ],
        ]),
      };

      // Act
      const result = action.calculateThisBonusForMyStateCountPct(target);

      // Assert
      expect(result).toBe(10);
    });
  });

  describe('calculateAuthoredVulnerabilityStackPct (vulnerabilityPerAuthoredStateStack, read from each tracker\'s author)', () =>
  {
    it('returns 0 when the target has no tracked states', () =>
    {
      // Arrange
      const action = buildAction(buildCaster([], 'caster'), buildSkill(''));
      const target = buildTarget('target');
      globalThis.$jabsEngine = { getJabsStatesByUuid: () => new Map() };

      // Act
      const result = action.calculateAuthoredVulnerabilityStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('skips a tracker whose state is not currently affecting the target', () =>
    {
      // Arrange- tracker 10 lingers post-expiration; the target no longer carries state 10.
      const action = buildAction(buildCaster([], 'caster'), buildSkill(''));
      const target = buildTarget('target', []);
      const author = buildCaster([ buildSkill('<vulnerabilityPerAuthoredStateStack:10>') ], 'author');
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: author, stackCount: 3 } ],
        ]),
      };

      // Act
      const result = action.calculateAuthoredVulnerabilityStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('skips a tracker with no discernible author', () =>
    {
      // Arrange- source is falsy, so no author notes can be consulted.
      const action = buildAction(buildCaster([], 'caster'), buildSkill(''));
      const target = buildTarget('target', [ 10 ]);
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: null, stackCount: 3 } ],
        ]),
      };

      // Act
      const result = action.calculateAuthoredVulnerabilityStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('skips a tracker whose author carries no vulnerabilityPerAuthoredStateStack tag', () =>
    {
      // Arrange- the author has notes, but none of them carry the vulnerability tag.
      const action = buildAction(buildCaster([], 'caster'), buildSkill(''));
      const target = buildTarget('target', [ 10 ]);
      const author = buildCaster([ buildSkill('') ], 'author');
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: author, stackCount: 3 } ],
        ]),
      };

      // Act
      const result = action.calculateAuthoredVulnerabilityStackPct(target);

      // Assert
      expect(result).toBe(0);
    });

    it('multiplies each authored tracker\'s per-stack percent by its stack count, summed across every attacker\'s trackers', () =>
    {
      // Arrange- the bonus is read from each tracker's own author, not from this action's caster,
      // so it applies no matter who is currently attacking with this action.
      const attacker = buildCaster([], 'attacker');
      const action = buildAction(attacker, buildSkill(''));
      const target = buildTarget('target', [ 10, 11 ]);
      const authorA = buildCaster([ buildSkill('<vulnerabilityPerAuthoredStateStack:10>') ], 'author-a');
      const authorB = buildCaster([ buildSkill('<vulnerabilityPerAuthoredStateStack:5>') ], 'author-b');
      globalThis.$jabsEngine = {
        getJabsStatesByUuid: () => new Map([
          [ 10, { stateId: 10, source: authorA, stackCount: 2 } ],
          [ 11, { stateId: 11, source: authorB, stackCount: 4 } ],
        ]),
      };

      // Act
      const result = action.calculateAuthoredVulnerabilityStackPct(target);

      // Assert- (10% * 2 stacks) + (5% * 4 stacks) = 40.
      expect(result).toBe(40);
    });
  });
});
//endregion plugins/abs/core/_component/game-action-state-count-damage-bonus.test.js
