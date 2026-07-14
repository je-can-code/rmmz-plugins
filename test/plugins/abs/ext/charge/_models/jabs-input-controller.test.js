//region plugins/abs/ext/charge/_models/jabs-input-controller.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge JABS_StandardController (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;
  let originalUpdateMainhandAction;
  let originalUpdateOffhandAction;
  let originalUpdateCombatAction1;
  let originalUpdateCombatAction2;
  let originalUpdateCombatAction3;
  let originalUpdateCombatAction4;

  /** duck-typed stand-in for JABS_Timer tracking reset()/update() calls and a controllable complete flag. */
  class FakeTimer
  {
    constructor(max)
    {
      this.max = max;
      this.resetCount = 0;
      this.updateCount = 0;
      this._complete = false;
    }

    reset()
    {
      this.resetCount++;
    }

    update()
    {
      this.updateCount++;
    }

    isTimerComplete()
    {
      return this._complete;
    }
  }

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          CHARGE: { Aliased: { JABS_StandardController: new Map() } },
          INPUT: {
            Symbols: {
              Mainhand: 'A', Offhand: 'B', Dash: 'Shift', Tool: 'Tool',
              CombatSkill1: 'CS1', CombatSkill2: 'CS2', CombatSkill3: 'CS3', CombatSkill4: 'CS4',
            },
          },
        },
      },
    };

    globalThis.JABS_Button = {
      Mainhand: 'mainhand', Offhand: 'offhand',
      CombatSkill1: 'combat1', CombatSkill2: 'combat2', CombatSkill3: 'combat3', CombatSkill4: 'combat4',
    };
    globalThis.JABS_Timer = FakeTimer;
    globalThis.Input = { isPressed: vi.fn(() => false) };
    globalThis.$jabsEngine = { getPlayer1: vi.fn(() => 'player1') };
    globalThis.JABS_InputAdapter = {
      performMainhandActionCharging: vi.fn(),
      performOffhandActionCharging: vi.fn(),
      performCombatSkillCharging: vi.fn(),
    };

    function JABS_StandardController()
    {
    }

    originalInitMembers = vi.fn();
    originalUpdateMainhandAction = vi.fn();
    originalUpdateOffhandAction = vi.fn();
    originalUpdateCombatAction1 = vi.fn();
    originalUpdateCombatAction2 = vi.fn();
    originalUpdateCombatAction3 = vi.fn();
    originalUpdateCombatAction4 = vi.fn();
    JABS_StandardController.prototype.initMembers = originalInitMembers;
    JABS_StandardController.prototype.updateMainhandAction = originalUpdateMainhandAction;
    JABS_StandardController.prototype.updateOffhandAction = originalUpdateOffhandAction;
    JABS_StandardController.prototype.updateCombatAction1 = originalUpdateCombatAction1;
    JABS_StandardController.prototype.updateCombatAction2 = originalUpdateCombatAction2;
    JABS_StandardController.prototype.updateCombatAction3 = originalUpdateCombatAction3;
    JABS_StandardController.prototype.updateCombatAction4 = originalUpdateCombatAction4;
    globalThis.JABS_StandardController = JABS_StandardController;

    await import('../../../../../../src/plugins/abs/ext/charge/_models/JABS_InputController.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
    originalUpdateMainhandAction.mockReset();
    originalUpdateOffhandAction.mockReset();
    originalUpdateCombatAction1.mockReset();
    originalUpdateCombatAction2.mockReset();
    originalUpdateCombatAction3.mockReset();
    originalUpdateCombatAction4.mockReset();
    globalThis.Input.isPressed.mockReset().mockReturnValue(false);
    globalThis.JABS_InputAdapter.performMainhandActionCharging.mockReset();
    globalThis.JABS_InputAdapter.performOffhandActionCharging.mockReset();
    globalThis.JABS_InputAdapter.performCombatSkillCharging.mockReset();
  });

  function buildController(overrides = {})
  {
    const controller = Object.create(globalThis.JABS_StandardController.prototype);
    controller.isMainhandActionTriggered = () => false;
    controller.isOffhandActionTriggered = () => false;
    controller.isCombatAction1Triggered = () => false;
    controller.isCombatAction2Triggered = () => false;
    controller.isCombatAction3Triggered = () => false;
    controller.isCombatAction4Triggered = () => false;
    controller.isCombatSkillUsageEnabled = () => false;
    controller.initMembers();
    return Object.assign(controller, overrides);
  }

  describe('initMembers / initInputDelays', () =>
  {
    it('calls the original then seeds a completed-config timer per slot', () =>
    {
      // Arrange
      const controller = Object.create(globalThis.JABS_StandardController.prototype);

      // Act
      controller.initMembers();

      // Assert
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(controller.getChargeInputDelayAmount()).toBe(24);
      [ 'mainhand', 'offhand', 'combat1', 'combat2', 'combat3', 'combat4' ].forEach(slot =>
      {
        expect(controller.getChargeInputDelayBySlot(slot)).toBeInstanceOf(FakeTimer);
      });
    });
  });

  describe('timer helpers', () =>
  {
    it('updateChargeInputDelayBySlot updates the slot timer', () =>
    {
      const controller = buildController();
      controller.updateChargeInputDelayBySlot('mainhand');
      expect(controller.getChargeInputDelayBySlot('mainhand').updateCount).toBe(1);
    });

    it('resetChargeInputDelayBySlot resets the slot timer', () =>
    {
      const controller = buildController();
      controller.resetChargeInputDelayBySlot('mainhand');
      expect(controller.getChargeInputDelayBySlot('mainhand').resetCount).toBe(1);
    });

    it('isTimerCompleteBySlot reads the slot timer completion flag', () =>
    {
      const controller = buildController();
      expect(controller.isTimerCompleteBySlot('mainhand')).toBe(false);
      controller.getChargeInputDelayBySlot('mainhand')._complete = true;
      expect(controller.isTimerCompleteBySlot('mainhand')).toBe(true);
    });
  });

  describe('mainhand', () =>
  {
    it('updateMainhandAction performs the original logic then handles charging', () =>
    {
      const controller = buildController();
      controller.handleMainhandCharging = vi.fn();
      controller.updateMainhandAction();
      expect(originalUpdateMainhandAction).toHaveBeenCalledTimes(1);
      expect(controller.handleMainhandCharging).toHaveBeenCalledTimes(1);
    });

    it('performs the charge action when the input requirement is met', () =>
    {
      const controller = buildController();
      controller.isMainhandActionCharging = () => true;
      controller.performMainhandChargeAction = vi.fn();
      controller.performMainhandChargeAlterAction = vi.fn();
      controller.handleMainhandCharging();
      expect(controller.performMainhandChargeAction).toHaveBeenCalledTimes(1);
      expect(controller.performMainhandChargeAlterAction).not.toHaveBeenCalled();
    });

    it('performs the alter action when the input requirement is not met', () =>
    {
      const controller = buildController();
      controller.isMainhandActionCharging = () => false;
      controller.performMainhandChargeAction = vi.fn();
      controller.performMainhandChargeAlterAction = vi.fn();
      controller.handleMainhandCharging();
      expect(controller.performMainhandChargeAlterAction).toHaveBeenCalledTimes(1);
      expect(controller.performMainhandChargeAction).not.toHaveBeenCalled();
    });

    it('is not charging when mainhand cannot be charged at all', () =>
    {
      const controller = buildController();
      controller.canChargeMainhandAction = () => false;
      expect(controller.isMainhandActionCharging()).toBe(false);
    });

    it('is not charging when the mainhand button is not held', () =>
    {
      const controller = buildController();
      controller.canChargeMainhandAction = () => true;
      globalThis.Input.isPressed.mockReturnValue(false);
      expect(controller.isMainhandActionCharging()).toBe(false);
    });

    it('is charging when allowed and the mainhand button is held', () =>
    {
      const controller = buildController();
      controller.canChargeMainhandAction = () => true;
      globalThis.Input.isPressed.mockImplementation((sym) => sym === 'A');
      expect(controller.isMainhandActionCharging()).toBe(true);
    });

    it('cannot charge mainhand when the button was just triggered (mashing)', () =>
    {
      const controller = buildController({ isMainhandActionTriggered: () => true });
      expect(controller.canChargeMainhandAction()).toBe(false);
    });

    it('cannot charge mainhand while combat skill usage is enabled', () =>
    {
      const controller = buildController({ isCombatSkillUsageEnabled: () => true });
      expect(controller.canChargeMainhandAction()).toBe(false);
    });

    it('can charge mainhand otherwise', () =>
    {
      const controller = buildController();
      expect(controller.canChargeMainhandAction()).toBe(true);
    });

    it('performMainhandChargeAction starts charging once the delay timer completes', () =>
    {
      const controller = buildController();
      controller.getChargeInputDelayBySlot('mainhand')._complete = true;
      controller.performMainhandChargeAction();
      expect(globalThis.JABS_InputAdapter.performMainhandActionCharging).toHaveBeenCalledWith(true, 'player1');
    });

    it('performMainhandChargeAction ticks the delay timer while it has not yet completed', () =>
    {
      const controller = buildController();
      controller.performMainhandChargeAction();
      expect(globalThis.JABS_InputAdapter.performMainhandActionCharging).not.toHaveBeenCalled();
      expect(controller.getChargeInputDelayBySlot('mainhand').updateCount).toBe(1);
    });

    it('performMainhandChargeAlterAction cancels charging and resets the delay timer', () =>
    {
      const controller = buildController();
      controller.performMainhandChargeAlterAction();
      expect(globalThis.JABS_InputAdapter.performMainhandActionCharging).toHaveBeenCalledWith(false, 'player1');
      expect(controller.getChargeInputDelayBySlot('mainhand').resetCount).toBe(1);
    });
  });

  describe('offhand', () =>
  {
    it('updateOffhandAction performs the original logic then handles charging', () =>
    {
      const controller = buildController();
      controller.handleOffhandCharging = vi.fn();
      controller.updateOffhandAction();
      expect(originalUpdateOffhandAction).toHaveBeenCalledTimes(1);
      expect(controller.handleOffhandCharging).toHaveBeenCalledTimes(1);
    });

    it('performs the charge action when the input requirement is met', () =>
    {
      const controller = buildController();
      controller.isOffhandActionCharging = () => true;
      controller.performOffhandChargeAction = vi.fn();
      controller.performOffhandChargeAlterAction = vi.fn();
      controller.handleOffhandCharging();
      expect(controller.performOffhandChargeAction).toHaveBeenCalledTimes(1);
    });

    it('performs the alter action when the input requirement is not met', () =>
    {
      const controller = buildController();
      controller.isOffhandActionCharging = () => false;
      controller.performOffhandChargeAction = vi.fn();
      controller.performOffhandChargeAlterAction = vi.fn();
      controller.handleOffhandCharging();
      expect(controller.performOffhandChargeAlterAction).toHaveBeenCalledTimes(1);
    });

    it('is charging when allowed and the offhand button is held', () =>
    {
      const controller = buildController();
      controller.canChargeOffhandAction = () => true;
      globalThis.Input.isPressed.mockImplementation((sym) => sym === 'B');
      expect(controller.isOffhandActionCharging()).toBe(true);
    });

    it('cannot charge offhand when the button was just triggered', () =>
    {
      const controller = buildController({ isOffhandActionTriggered: () => true });
      expect(controller.canChargeOffhandAction()).toBe(false);
    });

    it('cannot charge offhand while combat skill usage is enabled', () =>
    {
      const controller = buildController({ isCombatSkillUsageEnabled: () => true });
      expect(controller.canChargeOffhandAction()).toBe(false);
    });

    it('performOffhandChargeAction starts charging once the delay completes', () =>
    {
      const controller = buildController();
      controller.getChargeInputDelayBySlot('offhand')._complete = true;
      controller.performOffhandChargeAction();
      expect(globalThis.JABS_InputAdapter.performOffhandActionCharging).toHaveBeenCalledWith(true, 'player1');
    });

    it('performOffhandChargeAlterAction cancels charging without resetting the timer', () =>
    {
      // this is a deliberate asymmetry from mainhand's alter-action- offhand's does not reset its timer.
      const controller = buildController();
      controller.performOffhandChargeAlterAction();
      expect(globalThis.JABS_InputAdapter.performOffhandActionCharging).toHaveBeenCalledWith(false, 'player1');
      expect(controller.getChargeInputDelayBySlot('offhand').resetCount).toBe(0);
    });
  });

  describe('combat skill 1 (representative of combat skills 1-4)', () =>
  {
    it('updateCombatAction1 performs the original logic then handles charging', () =>
    {
      const controller = buildController();
      controller.handleCombatAction1Charging = vi.fn();
      controller.updateCombatAction1();
      expect(originalUpdateCombatAction1).toHaveBeenCalledTimes(1);
      expect(controller.handleCombatAction1Charging).toHaveBeenCalledTimes(1);
    });

    it('performs the charge action when the input requirement is met', () =>
    {
      const controller = buildController();
      controller.isCombatAction1Charging = () => true;
      controller.performCombatSkillChargeAction = vi.fn();
      controller.performCombatSkillChargeAlterAction = vi.fn();
      controller.handleCombatAction1Charging();
      expect(controller.performCombatSkillChargeAction).toHaveBeenCalledWith('combat1');
    });

    it('performs the alter action when the input requirement is not met', () =>
    {
      const controller = buildController();
      controller.isCombatAction1Charging = () => false;
      controller.performCombatSkillChargeAction = vi.fn();
      controller.performCombatSkillChargeAlterAction = vi.fn();
      controller.handleCombatAction1Charging();
      expect(controller.performCombatSkillChargeAlterAction).toHaveBeenCalledWith('combat1');
    });

    it('cannot charge when combat skill 1 was just triggered', () =>
    {
      const controller = buildController({ isCombatAction1Triggered: () => true });
      expect(controller.canChargeCombatAction1()).toBe(false);
    });

    it('is not charging when combat-skill usage is not enabled at all', () =>
    {
      const controller = buildController();
      expect(controller.isCombatAction1Charging()).toBe(false);
    });

    it('is charging via the mainhand-mirrored button when combat skill usage is enabled', () =>
    {
      const controller = buildController({ isCombatSkillUsageEnabled: () => true });
      globalThis.Input.isPressed.mockImplementation((sym) => sym === 'A');
      expect(controller.isCombatAction1Charging()).toBe(true);
    });

    it('is charging via its own dedicated button when combat skill usage is enabled', () =>
    {
      const controller = buildController({ isCombatSkillUsageEnabled: () => true });
      globalThis.Input.isPressed.mockImplementation((sym) => sym === 'CS1');
      expect(controller.isCombatAction1Charging()).toBe(true);
    });

    it('performCombatSkillChargeAction starts charging once the delay completes', () =>
    {
      const controller = buildController();
      controller.getChargeInputDelayBySlot('combat1')._complete = true;
      controller.performCombatSkillChargeAction('combat1');
      expect(globalThis.JABS_InputAdapter.performCombatSkillCharging).toHaveBeenCalledWith(true, 'player1', 'combat1');
    });

    it('performCombatSkillChargeAction ticks the delay timer while incomplete', () =>
    {
      const controller = buildController();
      controller.performCombatSkillChargeAction('combat1');
      expect(globalThis.JABS_InputAdapter.performCombatSkillCharging).not.toHaveBeenCalled();
      expect(controller.getChargeInputDelayBySlot('combat1').updateCount).toBe(1);
    });

    it('performCombatSkillChargeAlterAction cancels charging and resets the delay timer', () =>
    {
      const controller = buildController();
      controller.performCombatSkillChargeAlterAction('combat1');
      expect(globalThis.JABS_InputAdapter.performCombatSkillCharging).toHaveBeenCalledWith(false, 'player1', 'combat1');
      expect(controller.getChargeInputDelayBySlot('combat1').resetCount).toBe(1);
    });
  });

  describe('combat skills 2-4 (button wiring only- shared branching already covered by combat skill 1)', () =>
  {
    it.each([
      [ 2, 'CS2', 'combat2' ],
      [ 3, 'CS3', 'combat3' ],
      [ 4, 'CS4', 'combat4' ],
    ])('combat skill %i charges via its own dedicated button symbol', (n, symbol, slot) =>
    {
      // Arrange
      const controller = buildController({ isCombatSkillUsageEnabled: () => true });
      globalThis.Input.isPressed.mockImplementation((sym) => sym === symbol);

      // Act / Assert
      expect(controller[`isCombatAction${n}Charging`]()).toBe(true);
      expect(controller[`canChargeCombatAction${n}`]()).toBe(true);

      // Act
      controller[`updateCombatAction${n}`]();

      // Assert
      expect(controller.getChargeInputDelayBySlot(slot)).toBeInstanceOf(FakeTimer);
    });
  });
});
//endregion plugins/abs/ext/charge/_models/jabs-input-controller.test.js
