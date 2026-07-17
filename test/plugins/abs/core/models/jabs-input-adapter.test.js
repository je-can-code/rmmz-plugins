//region plugins/abs/core/models/jabs-input-adapter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_InputAdapter (direct src import)', () =>
{
  let JABS_InputAdapter;
  let FakeJABSGlobalCooldown;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.JABS_Button = { Mainhand: 'mainhand', Offhand: 'offhand', Tool: 'tool', UsableItem: 'item', Dodge: 'dodge' };

    FakeJABSGlobalCooldown = { isGlobalBlockingSkillId: vi.fn(() => false) };
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_GlobalCooldown.js', () => ({ default: FakeJABSGlobalCooldown }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_BaseController.js', () => ({ default: class {} }));

    ({ default: JABS_InputAdapter } = await import('../../../../../src/plugins/abs/core/models/JABS_InputAdapter.js'));
  });

  beforeEach(() =>
  {
    FakeJABSGlobalCooldown.isGlobalBlockingSkillId.mockReset().mockReturnValue(false);
    JABS_InputAdapter.controllers = [];
    globalThis.$gameMap = { hasInteractableEventInFront: () => false };
    globalThis.$gameParty = { canPartyCycle: () => true, _actors: [ 1, 2 ] };
    globalThis.$jabsEngine = { performPartyCycling: vi.fn(), absPause: false, requestAbsMenu: false };
  });

  function buildAction(overrides = {})
  {
    return {
      setCooldownType: vi.fn(),
      getCastTime: () => 10,
      getBaseSkill: () => ({ id: 5 }),
      ...overrides,
    };
  }

  function buildJabsBattler(overrides = {})
  {
    return {
      canBattlerUseAttacks: () => true,
      canBattlerUseSkills: () => true,
      isSkillTypeCooldownReady: () => true,
      getAttackData: () => [ buildAction() ],
      setDecidedAction: vi.fn(),
      setCastCountdown: vi.fn(),
      resetComboData: vi.fn(),
      isCastingOrChanneling: () => false,
      isGuardSkillByKey: () => false,
      getBattler: () => ({
        getEquippedSkillId: () => 7,
        getSkillSlot: () => ({ isEmpty: () => false }),
      }),
      applyToolItemEffects: vi.fn(),
      applyUsableItemEffects: vi.fn(),
      canBattlerMove: () => true,
      tryDodgeSkill: vi.fn(),
      guarding: () => false,
      executeGuard: vi.fn(),
      getCharacter: () => ({ _dashing: false, setDirectionFix: vi.fn() }),
      setMovementLock: vi.fn(),
      ...overrides,
    };
  }

  describe('register() / hasControllers()', () =>
  {
    it('reports no controllers by default', () =>
    {
      expect(JABS_InputAdapter.hasControllers()).toBe(false);
    });

    it('registers a controller', () =>
    {
      JABS_InputAdapter.register({});
      expect(JABS_InputAdapter.hasControllers()).toBe(true);
    });
  });

  describe('performMainhandAction()', () =>
  {
    it('does nothing when there is a pedestrian blocking the way', () =>
    {
      globalThis.$gameMap.hasInteractableEventInFront = () => true;
      const battler = buildJabsBattler();
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the battler cannot use attacks', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseAttacks: () => false });
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the mainhand cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when there are no mainhand actions', () =>
    {
      const battler = buildJabsBattler({ getAttackData: () => [] });
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the global cooldown blocks the skill', () =>
    {
      FakeJABSGlobalCooldown.isGlobalBlockingSkillId.mockReturnValue(true);
      const battler = buildJabsBattler();
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing while already casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });
      JABS_InputAdapter.performMainhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('decides the mainhand action, sets cast countdown, and resets combo data when everything checks out', () =>
    {
      const action = buildAction();
      const battler = buildJabsBattler({ getAttackData: () => [ action ] });

      JABS_InputAdapter.performMainhandAction(battler);

      expect(action.setCooldownType).toHaveBeenCalledWith(JABS_Button.Mainhand);
      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.setCastCountdown).toHaveBeenCalledWith(10);
      expect(battler.resetComboData).toHaveBeenCalledWith(JABS_Button.Mainhand);
    });
  });

  describe('performOffhandAction()', () =>
  {
    it('does nothing when the offhand slot is actually a guard skill', () =>
    {
      const battler = buildJabsBattler({ isGuardSkillByKey: () => true });
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when there is a pedestrian blocking the way', () =>
    {
      globalThis.$gameMap.hasInteractableEventInFront = () => true;
      const battler = buildJabsBattler();
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the battler cannot use attacks', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseAttacks: () => false });
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the offhand cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when there are no offhand actions', () =>
    {
      const battler = buildJabsBattler({ getAttackData: () => [] });
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the global cooldown blocks the skill', () =>
    {
      FakeJABSGlobalCooldown.isGlobalBlockingSkillId.mockReturnValue(true);
      const battler = buildJabsBattler();
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing while already casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });
      JABS_InputAdapter.performOffhandAction(battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('decides the offhand action, sets cast countdown, and resets combo data when everything checks out', () =>
    {
      const action = buildAction();
      const battler = buildJabsBattler({ getAttackData: () => [ action ] });

      JABS_InputAdapter.performOffhandAction(battler);

      expect(action.setCooldownType).toHaveBeenCalledWith(JABS_Button.Offhand);
      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.resetComboData).toHaveBeenCalledWith(JABS_Button.Offhand);
    });
  });

  describe('performToolAction()', () =>
  {
    it('does nothing when the tool slot is not off cooldown', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performToolAction(battler);
      expect(battler.applyToolItemEffects).not.toHaveBeenCalled();
    });

    it('does nothing when no tool is equipped', () =>
    {
      const battler = buildJabsBattler({ getBattler: () => ({ getEquippedSkillId: () => 0 }) });
      JABS_InputAdapter.performToolAction(battler);
      expect(battler.applyToolItemEffects).not.toHaveBeenCalled();
    });

    it('applies the equipped tool effects', () =>
    {
      const battler = buildJabsBattler({ getBattler: () => ({ getEquippedSkillId: () => 12 }) });
      JABS_InputAdapter.performToolAction(battler);
      expect(battler.applyToolItemEffects).toHaveBeenCalledWith(12, JABS_Button.Tool);
    });
  });

  describe('performUsableItemAction()', () =>
  {
    it('does nothing when the usable-item slot is not off cooldown', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performUsableItemAction(battler);
      expect(battler.applyUsableItemEffects).not.toHaveBeenCalled();
    });

    it('does nothing when no item is equipped', () =>
    {
      const battler = buildJabsBattler({ getBattler: () => ({ getEquippedSkillId: () => 0 }) });
      JABS_InputAdapter.performUsableItemAction(battler);
      expect(battler.applyUsableItemEffects).not.toHaveBeenCalled();
    });

    it('applies the equipped item effects', () =>
    {
      const battler = buildJabsBattler({ getBattler: () => ({ getEquippedSkillId: () => 9 }) });
      JABS_InputAdapter.performUsableItemAction(battler);
      expect(battler.applyUsableItemEffects).toHaveBeenCalledWith(9);
    });
  });

  describe('performDodgeAction()', () =>
  {
    it('does nothing when the dodge skill is not off cooldown', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performDodgeAction(battler);
      expect(battler.tryDodgeSkill).not.toHaveBeenCalled();
    });

    it('does nothing when the battler cannot move', () =>
    {
      const battler = buildJabsBattler({ canBattlerMove: () => false });
      JABS_InputAdapter.performDodgeAction(battler);
      expect(battler.tryDodgeSkill).not.toHaveBeenCalled();
    });

    it('performs the dodge skill', () =>
    {
      const battler = buildJabsBattler();
      JABS_InputAdapter.performDodgeAction(battler);
      expect(battler.tryDodgeSkill).toHaveBeenCalled();
    });
  });

  describe('performCombatAction()', () =>
  {
    it('does nothing when the battler cannot use skills', () =>
    {
      const battler = buildJabsBattler({ canBattlerUseSkills: () => false });
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the slot is empty', () =>
    {
      const battler = buildJabsBattler({
        getBattler: () => ({ getSkillSlot: () => ({ isEmpty: () => true }) }),
      });
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the slot cooldown is not ready', () =>
    {
      const battler = buildJabsBattler({ isSkillTypeCooldownReady: () => false });
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing while casting or channeling', () =>
    {
      const battler = buildJabsBattler({ isCastingOrChanneling: () => true });
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when there is no action data for the slot', () =>
    {
      const battler = buildJabsBattler({ getAttackData: () => [] });
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('does nothing when the global cooldown blocks the skill', () =>
    {
      FakeJABSGlobalCooldown.isGlobalBlockingSkillId.mockReturnValue(true);
      const battler = buildJabsBattler();
      JABS_InputAdapter.performCombatAction('slotA', battler);
      expect(battler.setDecidedAction).not.toHaveBeenCalled();
    });

    it('decides the combat action and sets the cast countdown when everything checks out', () =>
    {
      const action = buildAction();
      const battler = buildJabsBattler({ getAttackData: () => [ action ] });

      JABS_InputAdapter.performCombatAction('slotA', battler);

      expect(battler.setDecidedAction).toHaveBeenCalledWith([ action ]);
      expect(battler.setCastCountdown).toHaveBeenCalledWith(10);
    });
  });

  describe('performSprint()', () =>
  {
    it('drops guard when starting to sprint while guarding', () =>
    {
      const battler = buildJabsBattler({ guarding: () => true });
      JABS_InputAdapter.performSprint(true, battler);
      expect(battler.executeGuard).toHaveBeenCalledWith(false, JABS_Button.Offhand);
    });

    it('does not touch guard when not currently guarding', () =>
    {
      const battler = buildJabsBattler({ guarding: () => false });
      JABS_InputAdapter.performSprint(true, battler);
      expect(battler.executeGuard).not.toHaveBeenCalled();
    });

    it('sets the character dashing flag to match the sprint state', () =>
    {
      const character = { _dashing: false };
      const battler = buildJabsBattler({ getCharacter: () => character });
      JABS_InputAdapter.performSprint(true, battler);
      expect(character._dashing).toBe(true);
    });
  });

  describe('performStrafe()', () =>
  {
    it('sets direction-fix to match the strafing state', () =>
    {
      const setDirectionFix = vi.fn();
      const battler = buildJabsBattler({ getCharacter: () => ({ setDirectionFix }) });
      JABS_InputAdapter.performStrafe(true, battler);
      expect(setDirectionFix).toHaveBeenCalledWith(true);
    });
  });

  describe('performRotate()', () =>
  {
    it('sets the movement lock to match the rotating state', () =>
    {
      const battler = buildJabsBattler();
      JABS_InputAdapter.performRotate(true, battler);
      expect(battler.setMovementLock).toHaveBeenCalledWith(true);
    });
  });

  describe('performGuard()', () =>
  {
    it('does nothing when the offhand slot is not a guard skill', () =>
    {
      const battler = buildJabsBattler({ isGuardSkillByKey: () => false });
      JABS_InputAdapter.performGuard(true, battler);
      expect(battler.executeGuard).not.toHaveBeenCalled();
    });

    it('cancels dashing when starting to guard', () =>
    {
      const character = { _dashing: true };
      const battler = buildJabsBattler({ isGuardSkillByKey: () => true, getCharacter: () => character });
      JABS_InputAdapter.performGuard(true, battler);
      expect(character._dashing).toBe(false);
    });

    it('does not touch dashing when releasing guard', () =>
    {
      const character = { _dashing: true };
      const battler = buildJabsBattler({ isGuardSkillByKey: () => true, getCharacter: () => character });
      JABS_InputAdapter.performGuard(false, battler);
      expect(character._dashing).toBe(true);
    });

    it('executes the guard skill in the offhand slot', () =>
    {
      const battler = buildJabsBattler({ isGuardSkillByKey: () => true });
      JABS_InputAdapter.performGuard(true, battler);
      expect(battler.executeGuard).toHaveBeenCalledWith(true, JABS_Button.Offhand);
    });
  });

  describe('performPartyCycling()', () =>
  {
    it('does nothing when party cycling is disabled and not forced', () =>
    {
      globalThis.$gameParty.canPartyCycle = () => false;
      JABS_InputAdapter.performPartyCycling(false);
      expect(globalThis.$jabsEngine.performPartyCycling).not.toHaveBeenCalled();
    });

    it('cycles anyway when forced, even with party cycling disabled', () =>
    {
      globalThis.$gameParty.canPartyCycle = () => false;
      JABS_InputAdapter.performPartyCycling(true);
      expect(globalThis.$jabsEngine.performPartyCycling).toHaveBeenCalledWith(true);
    });

    it('does nothing when there is only one actor in the party', () =>
    {
      globalThis.$gameParty._actors = [ 1 ];
      JABS_InputAdapter.performPartyCycling(false);
      expect(globalThis.$jabsEngine.performPartyCycling).not.toHaveBeenCalled();
    });

    it('cycles the party when enabled and there are multiple actors', () =>
    {
      JABS_InputAdapter.performPartyCycling(false);
      expect(globalThis.$jabsEngine.performPartyCycling).toHaveBeenCalledWith(false);
    });
  });

  describe('performMenuAction()', () =>
  {
    it('pauses jabs and requests the abs menu', () =>
    {
      JABS_InputAdapter.performMenuAction();
      expect(globalThis.$jabsEngine.absPause).toBe(true);
      expect(globalThis.$jabsEngine.requestAbsMenu).toBe(true);
    });
  });
});
//endregion plugins/abs/core/models/jabs-input-adapter.test.js
