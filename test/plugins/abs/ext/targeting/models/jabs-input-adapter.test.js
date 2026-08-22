//region plugins/abs/ext/targeting/models/jabs-input-adapter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_InputAdapter is a bare static object (not a real class instance) that the ext file
 * overwrites methods on directly. A minimal stub with the three methods it aliases is enough-
 * no need to pull in the real core JABS_InputAdapter and its own dependency chain.
 */
describe('J-ABS-Targeting JABS_InputAdapter (direct src import, JABS_TargetingManager mocked)', () =>
{
  let JABS_InputAdapter;
  let FakeJABSTargetingManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TARGETING: { Aliased: { JABS_InputAdapter: new Map() } } } } };
    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand' };

    const originalMainhand = vi.fn();
    const originalOffhand = vi.fn();
    const originalCombat = vi.fn();
    globalThis.JABS_InputAdapter = {
      performMainhandAction: originalMainhand,
      performOffhandAction: originalOffhand,
      performCombatAction: originalCombat,
    };

    FakeJABSTargetingManager = {
      peekTargetedActions: vi.fn(() => []),
      beginTargeting: vi.fn(),
    };
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js', () => ({ default: FakeJABSTargetingManager }));

    await import('../../../../../../src/plugins/abs/ext/targeting/models/JABS_InputAdapter.js');
  });

  beforeEach(() =>
  {
    FakeJABSTargetingManager.peekTargetedActions.mockReset()
      .mockReturnValue([]);
    FakeJABSTargetingManager.beginTargeting.mockReset();
    globalThis.$gameMap = { hasInteractableEventInFront: () => false };
  });

  /**
   * Builds a minimal duck-typed JABS_Battler carrying only what these three methods touch.
   * @param {object} overrides
   * @returns {object}
   */
  function buildJabsBattler(overrides = {})
  {
    return {
      canBattlerUseAttacks: () => true,
      canBattlerUseSkills: () => true,
      isSkillTypeCooldownReady: () => true,
      isCastingOrChanneling: () => false,
      isGuardSkillEquipped: () => false,
      setDecidedAction: vi.fn(),
      setCastCountdown: vi.fn(),
      resetComboData: vi.fn(),
      getBattler: () => ({ getSkillSlot: () => ({ isEmpty: () => false }) }),
      ...overrides,
    };
  }

  /**
   * Builds a minimal committable action.
   * @param {object} overrides
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    return {
      setCooldownType: vi.fn(),
      getCastTime: () => 10,
      ...overrides,
    };
  }

  describe('performMainhandAction', () =>
  {
    it('falls through to original logic when a pedestrian blocks the way', () =>
    {
      globalThis.$gameMap.hasInteractableEventInFront = () => true;
      const battler = buildJabsBattler();

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction'))
        .toHaveBeenCalledWith(battler);
      expect(FakeJABSTargetingManager.peekTargetedActions).not.toHaveBeenCalled();
    });

    it('falls through to original logic when the battler cannot use attacks', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseAttacks: () => false });

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic when the mainhand cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic while casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic when nothing targeted would fire from this slot', () =>
    {
      const battler = buildJabsBattler();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([]);

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('diverts into a targeting session when a targeted attempt is pending', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performMainhandAction(battler);

      expect(FakeJABSTargetingManager.beginTargeting).toHaveBeenCalledWith(battler, [ action ], expect.any(Function));
    });

    it('the targeting session\'s commit callback finalizes the committed actions', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performMainhandAction(battler);
      const [ , , onCommit ] = FakeJABSTargetingManager.beginTargeting.mock.calls.at(-1);
      onCommit([ action ]);

      expect(action.setCooldownType).toHaveBeenCalledWith('mainhand');
      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.setCastCountdown).toHaveBeenCalledWith(10);
      expect(battler.resetComboData).toHaveBeenCalledWith('mainhand');
    });
  });

  describe('performOffhandAction', () =>
  {
    it('falls through to original logic when a pedestrian blocks the way', () =>
    {
      globalThis.$gameMap.hasInteractableEventInFront = () => true;
      const battler = buildJabsBattler();

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction'))
        .toHaveBeenCalledWith(battler);
      // the gate must short-circuit before the peek- every other gate here is satisfied, so a peek
      // happening at all would mean this gate stopped deciding anything.
      expect(FakeJABSTargetingManager.peekTargetedActions).not.toHaveBeenCalled();
    });

    it('falls through to original logic when the battler cannot use attacks', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseAttacks: () => false });

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic when the offhand cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic while casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('falls through to original logic when nothing targeted would fire from this slot', () =>
    {
      const battler = buildJabsBattler();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([]);

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction'))
        .toHaveBeenCalledWith(battler);
    });

    it('diverts into a targeting session when a targeted attempt is pending', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performOffhandAction(battler);

      expect(FakeJABSTargetingManager.beginTargeting).toHaveBeenCalledWith(battler, [ action ], expect.any(Function));
    });

    it('the targeting session\'s commit callback finalizes the committed actions', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performOffhandAction(battler);
      const [ , , onCommit ] = FakeJABSTargetingManager.beginTargeting.mock.calls.at(-1);
      onCommit([ action ]);

      expect(action.setCooldownType).toHaveBeenCalledWith('offhand');
      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.resetComboData).toHaveBeenCalledWith('offhand');
    });
  });

  describe('performCombatAction', () =>
  {
    it('falls through to original logic when the battler cannot use skills', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseSkills: () => false });

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction'))
        .toHaveBeenCalledWith('combat1', battler);
      // the gate must short-circuit before the peek- every other gate here is satisfied, so a peek
      // happening at all would mean this gate stopped deciding anything.
      expect(FakeJABSTargetingManager.peekTargetedActions).not.toHaveBeenCalled();
    });

    it('falls through to original logic when the slot is empty', () =>
    {
      const battler = buildJabsBattler({
        getBattler: () => ({ getSkillSlot: () => ({ isEmpty: () => true }) }),
      });

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction'))
        .toHaveBeenCalledWith('combat1', battler);
    });

    it('falls through to original logic when the slot\'s cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction'))
        .toHaveBeenCalledWith('combat1', battler);
    });

    it('falls through to original logic while casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction'))
        .toHaveBeenCalledWith('combat1', battler);
    });

    it('falls through to original logic when nothing targeted would fire from this slot', () =>
    {
      const battler = buildJabsBattler();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([]);

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(globalThis.J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction'))
        .toHaveBeenCalledWith('combat1', battler);
    });

    it('diverts into a targeting session when a targeted attempt is pending', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);

      expect(FakeJABSTargetingManager.beginTargeting).toHaveBeenCalledWith(battler, [ action ], expect.any(Function));
    });

    it('the targeting session\'s commit callback finalizes the committed actions (no cooldown-type/combo stamping)', () =>
    {
      const battler = buildJabsBattler();
      const action = buildAction();
      FakeJABSTargetingManager.peekTargetedActions.mockReturnValue([ action ]);

      globalThis.JABS_InputAdapter.performCombatAction('combat1', battler);
      const [ , , onCommit ] = FakeJABSTargetingManager.beginTargeting.mock.calls.at(-1);
      onCommit([ action ]);

      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.setCastCountdown).toHaveBeenCalledWith(10);
      expect(action.setCooldownType).not.toHaveBeenCalled();
      expect(battler.resetComboData).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/targeting/models/jabs-input-adapter.test.js
