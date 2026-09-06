//region plugins/abs/ext/food/models/jabs-food-chain-plan.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food JABS_FoodChainPlan (unit, all downstream dependencies mocked)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainPlan.js').default} */
  let JABS_FoodChainPlan;

  /** duck-typed stand-in for JABS_FoodChainSegment- a trivial field bag, safe to reimplement. */
  class FakeSegment
  {
    constructor(stateId, chainType, frames, color)
    {
      this.stateId = stateId;
      this.chainType = chainType;
      this.frames = frames;
      this.color = color;
    }
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { RegExp: { StateDuration: Symbol('StateDuration'), StateDurationSec: Symbol('StateDurationSec') } } };
    globalThis.RPGManager = { getNumberFromNoteByRegex: vi.fn(() => null) };

    vi.doMock('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainSegment.js', () => ({
      default: FakeSegment,
    }));

    ({ default: JABS_FoodChainPlan } = await import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainPlan.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.getNumberFromNoteByRegex.mockReset().mockReturnValue(null);
  });

  /** Builds a minimal $dataStates-shaped fixture from a plain description object. */
  function buildState(id, { chainType = null, expireStateId = null, frames = 0, color = '#888888', name = `State${id}` } = {})
  {
    return {
      id,
      name,
      jabsFoodChainType: chainType,
      jabsApplyStateOnExpire: expireStateId === null ? null : { stateId: expireStateId },
      jabsStateDurationFrames: frames,
      jabsFoodGroupColor: color,
    };
  }

  describe('buildRegistry / forChainType', () =>
  {
    it('registers a single-segment chain for a state with no expire link', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein' }) ];

      // Act
      JABS_FoodChainPlan.buildRegistry();
      const plan = JABS_FoodChainPlan.forChainType('protein');

      // Assert
      expect(plan.segments).toHaveLength(1);
      expect(plan.segments[0].stateId).toBe(1);
    });

    it('lists every registered chain type and nothing that was only walked through', () =>
    {
      // Arrange- two distinct chains plus a mid-chain state, so a method that reported every
      // food state rather than only the entries would be caught by the extra id.
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein', expireStateId: 2 }),
        buildState(2, { chainType: 'protein' }),
        buildState(3, { chainType: 'vegetable' }),
      ];

      // Act
      JABS_FoodChainPlan.buildRegistry();
      const types = JABS_FoodChainPlan.registeredChainTypes();

      // Assert- one key per chain, not per state.
      expect(types).toEqual([ 'protein', 'vegetable' ]);
    });

    it('walks a multi-state chain following applyStateOnExpire links', () =>
    {
      // Arrange
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein', expireStateId: 2 }),
        buildState(2, { chainType: 'protein', expireStateId: 3 }),
        buildState(3, { chainType: 'protein' }),
      ];

      // Act
      JABS_FoodChainPlan.buildRegistry();
      const plan = JABS_FoodChainPlan.forChainType('protein');

      // Assert
      expect(plan.segments.map(s => s.stateId)).toEqual([ 1, 2, 3 ]);
    });

    it('identifies entry states as those not referenced by any expire link', () =>
    {
      // Arrange- state 2 is referenced by state 1's expire link, so only state 1 is an entry.
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein', expireStateId: 2 }),
        buildState(2, { chainType: 'protein' }),
      ];

      // Act
      JABS_FoodChainPlan.buildRegistry();

      // Assert- only one plan registered (for 'protein'), rooted at state 1.
      expect(JABS_FoodChainPlan.forChainType('protein').getEntry().stateId).toBe(1);
    });

    it('returns null for an unregistered chain type', () =>
    {
      globalThis.$dataStates = [];
      JABS_FoodChainPlan.buildRegistry();
      expect(JABS_FoodChainPlan.forChainType('nonexistent')).toBeNull();
    });

    it('clears any previously-built registry on rebuild', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein' }) ];
      JABS_FoodChainPlan.buildRegistry();
      expect(JABS_FoodChainPlan.forChainType('protein')).not.toBeNull();

      // Act- rebuild with a database that no longer has any protein states.
      globalThis.$dataStates = [];
      JABS_FoodChainPlan.buildRegistry();

      // Assert
      expect(JABS_FoodChainPlan.forChainType('protein')).toBeNull();
    });

    it('throws when two distinct entry states claim the same chain type', () =>
    {
      // Arrange- both state 1 and state 2 are entries (nothing points to either) and share a type.
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein' }),
        buildState(2, { chainType: 'protein' }),
      ];

      // Act / Assert
      expect(() => JABS_FoodChainPlan.buildRegistry()).toThrow(/Duplicate food chain type 'protein'/);
    });

    it('ignores states with no foodChain tag entirely', () =>
    {
      // Arrange- state 1 is the untagged near-miss, and it expires into the genuine food-chain
      // state 2. an untagged state that slipped through the filter would both become an entry
      // itself and demote state 2 out of entry status, so state 2's registration is what proves
      // the filter excluded it.
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: null, expireStateId: 2 }),
        buildState(2, { chainType: 'protein' }),
      ];

      // Act
      JABS_FoodChainPlan.buildRegistry();

      // Assert
      expect(JABS_FoodChainPlan.forChainType('protein').getEntry().stateId).toBe(2);
    });
  });

  describe('_walkChain', () =>
  {
    it('stops the walk cleanly when the entry state id itself is missing from the database', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null ];

      // Act
      const plan = JABS_FoodChainPlan._walkChain(99);

      // Assert
      expect(plan.segments).toHaveLength(0);
    });

    it('stops the walk cleanly when a linked state id is missing from the database', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', expireStateId: 99 }) ];

      // Act
      const plan = JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(plan.segments).toHaveLength(1);
    });

    it('defaults the entry segment\'s chainType to "unknown" when the entry state itself has none', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, buildState(1, { chainType: null }) ];

      // Act
      const plan = JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(plan.segments[0].chainType).toBe('unknown');
    });

    it('stops the walk when the linked state has no food chain type', () =>
    {
      // Arrange
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein', expireStateId: 2 }),
        buildState(2, { chainType: null }),
      ];

      // Act
      const plan = JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(plan.segments).toHaveLength(1);
    });

    it('throws a descriptive error when a cycle is detected', () =>
    {
      // Arrange- state 1 -> 2 -> 1, an infinite loop.
      globalThis.$dataStates = [
        null,
        buildState(1, { chainType: 'protein', expireStateId: 2 }),
        buildState(2, { chainType: 'protein', expireStateId: 1 }),
      ];

      // Act / Assert
      expect(() => JABS_FoodChainPlan._walkChain(1)).toThrow(/Food chain cycle detected/);
    });

    it('caps the walk at 16 segments as a hard ceiling', () =>
    {
      // Arrange- build a chain of 20 states, each expiring into the next.
      const states = [ null ];
      for (let id = 1; id <= 20; id++)
      {
        states.push(buildState(id, { chainType: 'protein', expireStateId: id < 20 ? id + 1 : null }));
      }
      globalThis.$dataStates = states;

      // Act
      const plan = JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(plan.segments).toHaveLength(16);
    });

    it('defaults frames/color/chainType defensively when the state is missing them', () =>
    {
      // Arrange- a state with jabsFoodChainType present (walk requires this) but no
      // duration/color data set.
      globalThis.$dataStates = [
        null,
        { id: 1, name: 'Bare', jabsFoodChainType: 'protein', jabsApplyStateOnExpire: null,
          jabsStateDurationFrames: undefined, jabsFoodGroupColor: undefined },
      ];

      // Act
      const plan = JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(plan.segments[0].frames).toBe(0);
      expect(plan.segments[0].color).toBe('#888888');
    });

    it('warns when a chain state relies on stepsToRemove alone without an explicit duration tag', () =>
    {
      // Arrange
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', frames: 300 }) ];
      globalThis.RPGManager.getNumberFromNoteByRegex.mockReturnValue(null);
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('has <foodChain> but no'));
      console.warn.mockRestore();
    });

    it('does not warn when the frame-based <stateDuration> tag alone is present', () =>
    {
      // Arrange- only the frame tag answers; the seconds tag must stay absent so that this
      // operand of the two-part guard is the only thing suppressing the warning.
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', frames: 300 }) ];
      globalThis.RPGManager.getNumberFromNoteByRegex.mockImplementation(
        (state, regex) => (regex === globalThis.J.ABS.RegExp.StateDuration ? 300 : null));
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });

    it('does not warn when the seconds-based <stateDurationSec> tag alone is present', () =>
    {
      // Arrange- the mirror of the case above, so neither operand of the guard can hide
      // behind the other having already suppressed the warning.
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', frames: 300 }) ];
      globalThis.RPGManager.getNumberFromNoteByRegex.mockImplementation(
        (state, regex) => (regex === globalThis.J.ABS.RegExp.StateDurationSec ? 5 : null));
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });

    it('does not warn when the state carries no step-based duration at all', () =>
    {
      // Arrange- zero frames means there is no mz-capped stepsToRemove value to complain about.
      // both duration tags stay absent, so the frame count is the only suppressing condition.
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', frames: 0 }) ];
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });

    it('does not warn when the duration already exceeds the mz stepsToRemove ceiling', () =>
    {
      // Arrange- above 9999 the value cannot have come from stepsToRemove, so there is nothing
      // to warn about; both duration tags stay absent so the ceiling is the only suppressor.
      globalThis.$dataStates = [ null, buildState(1, { chainType: 'protein', frames: 10000 }) ];
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });

    it('does not warn for a walked state that is not part of the food system', () =>
    {
      // Arrange- an untagged state can be walked as the entry point, but it is not a food-chain
      // row, so the stepsToRemove advice does not apply to it. frames sit inside the warn window
      // and both duration tags stay absent, leaving the foodChain tag as the only suppressor.
      globalThis.$dataStates = [ null, buildState(1, { chainType: null, frames: 300 }) ];
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      JABS_FoodChainPlan._walkChain(1);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();
      console.warn.mockRestore();
    });
  });

  describe('instance methods', () =>
  {
    it('getEntry returns the first segment, or null for an empty plan', () =>
    {
      const plan = new JABS_FoodChainPlan([ new FakeSegment(1, 'protein', 0, '#fff') ]);
      expect(plan.getEntry().stateId).toBe(1);
      expect(new JABS_FoodChainPlan([]).getEntry()).toBeNull();
    });

    it('isEmpty reflects whether the plan has any segments', () =>
    {
      expect(new JABS_FoodChainPlan([]).isEmpty()).toBe(true);
      expect(new JABS_FoodChainPlan([ new FakeSegment(1, 'protein', 0, '#fff') ]).isEmpty()).toBe(false);
    });

    it('indexOfState finds the matching segment index, or -1 when absent', () =>
    {
      const plan = new JABS_FoodChainPlan([
        new FakeSegment(1, 'protein', 0, '#fff'),
        new FakeSegment(2, 'protein', 0, '#fff'),
      ]);
      expect(plan.indexOfState(2)).toBe(1);
      expect(plan.indexOfState(99)).toBe(-1);
    });

    it('phaseAtIndex labels the first segment wellFed, the last tail, and everything else peak', () =>
    {
      const plan = new JABS_FoodChainPlan([
        new FakeSegment(1, 'protein', 0, '#fff'),
        new FakeSegment(2, 'protein', 0, '#fff'),
        new FakeSegment(3, 'protein', 0, '#fff'),
      ]);
      expect(plan.phaseAtIndex(0)).toBe('wellFed');
      expect(plan.phaseAtIndex(1)).toBe('peak');
      expect(plan.phaseAtIndex(2)).toBe('tail');
    });

    it('phaseAtIndex labels a single-segment plan\'s only entry as wellFed (index 0 wins the tie)', () =>
    {
      const plan = new JABS_FoodChainPlan([ new FakeSegment(1, 'protein', 0, '#fff') ]);
      expect(plan.phaseAtIndex(0)).toBe('wellFed');
    });
  });
});
//endregion plugins/abs/ext/food/models/jabs-food-chain-plan.test.js
