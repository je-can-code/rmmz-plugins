//region plugins/passive/ext/conditional/managers/move-state-removal-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('MoveStateRemovalManager (direct src import)', () =>
{
  let MoveStateRemovalManager;
  let FakeAutoApplyStateManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeAutoApplyStateManager = {
      buildRuleKey: vi.fn((source, tupleIndex, id, condition) => `${source.constructor.name}:${tupleIndex}:${id}:${condition}`),
    };
    vi.doMock('../../../../../../src/plugins/passive/ext/conditional/managers/AutoApplyStateManager.js', () => ({ default: FakeAutoApplyStateManager }));

    ({ default: MoveStateRemovalManager } = await import('../../../../../../src/plugins/passive/ext/conditional/managers/MoveStateRemovalManager.js'));
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.Graphics = { frameCount: 500 };
    globalThis.$dataStates = {};
  });

  function makeBattler(overrides = {})
  {
    return {
      allStates: vi.fn().mockReturnValue([]),
      decrementStateStacks: vi.fn(),
      setAutoApplyLastFrame: vi.fn(),
      getUuid: vi.fn().mockReturnValue('battler-uuid'),
      ...overrides,
    };
  }

  describe('process', () =>
  {
    it('does nothing when there is no JABS engine', () =>
    {
      // Arrange
      globalThis.$jabsEngine = null;
      const battler = makeBattler();

      // Act/Assert (no throw)
      expect(() => MoveStateRemovalManager.process(battler)).not.toThrow();
      expect(battler.allStates).not.toHaveBeenCalled();
    });

    it('does nothing when JABS is disabled', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: false };
      const battler = makeBattler();

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.allStates).not.toHaveBeenCalled();
    });

    it('skips a null state entry in allStates()', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ null ]) });

      // Act/Assert (no throw)
      expect(() => MoveStateRemovalManager.process(battler)).not.toThrow();
      expect(battler.decrementStateStacks).not.toHaveBeenCalled();
    });

    it('does nothing for a state with no removeStateOnMoveRules', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true };
      const state = { constructor: { name: 'RPG_State' }, removeStateOnMoveRules: [] };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.decrementStateStacks).not.toHaveBeenCalled();
    });

    it('skips a rule tuple with an invalid or zero state id', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true };
      const state = { constructor: { name: 'RPG_State' }, removeStateOnMoveRules: [ [ 0 ] ] };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.decrementStateStacks).not.toHaveBeenCalled();
    });

    it('decrements one stack by default when the state does not force full removal', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: vi.fn() };
      globalThis.$dataStates = { 5: { jabsLoseAllStacksAtOnce: false } };
      const state = { constructor: { name: 'RPG_State' }, removeStateOnMoveRules: [ [ 5 ] ], autoApplyStateRules: [] };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.decrementStateStacks).toHaveBeenCalledWith(5, 1);
    });

    it('decrements 1 stack when the state row is missing from $dataStates', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.$dataStates = {};
      const state = { constructor: { name: 'RPG_State' }, removeStateOnMoveRules: [ [ 5 ] ], autoApplyStateRules: [] };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.decrementStateStacks).toHaveBeenCalledWith(5, 1);
    });

    it('decrements the full tracked stack count when the state forces loseAllStacksAtOnce and a tracked state exists', () =>
    {
      // Arrange
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStateByUuidAndStateId: vi.fn().mockReturnValue({ stackCount: 4 }),
      };
      globalThis.$dataStates = { 5: { jabsLoseAllStacksAtOnce: true } };
      const state = { constructor: { name: 'RPG_State' }, removeStateOnMoveRules: [ [ 5 ] ], autoApplyStateRules: [] };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.decrementStateStacks).toHaveBeenCalledWith(5, 4);
    });

    it('resets the matching stand-condition autoApplyState cooldown after peeling stacks', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: vi.fn() };
      globalThis.$dataStates = { 5: {} };
      const state = {
        constructor: { name: 'RPG_State' },
        removeStateOnMoveRules: [ [ 5 ] ],
        autoApplyStateRules: [ [ 5, 'stand' ], [ 5, 'battle' ], [ 6, 'stand' ] ],
      };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.setAutoApplyLastFrame).toHaveBeenCalledTimes(1);
      expect(battler.setAutoApplyLastFrame).toHaveBeenCalledWith(expect.any(String), 500);
    });

    it('does not reset a cooldown for a non-stand condition tuple matching the same state id', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: vi.fn() };
      globalThis.$dataStates = { 5: {} };
      const state = {
        constructor: { name: 'RPG_State' },
        removeStateOnMoveRules: [ [ 5 ] ],
        autoApplyStateRules: [ [ 5, 'battle' ] ],
      };
      const battler = makeBattler({ allStates: vi.fn().mockReturnValue([ state ]) });

      // Act
      MoveStateRemovalManager.process(battler);

      // Assert
      expect(battler.setAutoApplyLastFrame).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/passive/ext/conditional/managers/move-state-removal-manager.test.js
