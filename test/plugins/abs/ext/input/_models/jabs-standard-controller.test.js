//region plugins/abs/ext/input/_models/jabs-standard-controller.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_StandardController.js is a genuine ES `class` extending the bare-global `JABS_BaseController`
 * (the shipped runtime concatenates core/abs ahead of this ext pack, so it's a bare global here, not
 * an import). JABS_Button is a real, pure, dependency-free import, so it's used for real. `Input` and
 * `JABS_InputAdapter` are also bare globals this file reads- stubbed directly per the unit-tier
 * convention for downstream file-external dependencies.
 */
describe('JABS_StandardController (unit, JABS_BaseController/Input/JABS_InputAdapter stubbed)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/input/_models/JABS_StandardController.js').default} */
  let JABS_StandardController;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          INPUT: {
            Symbols: {
              Quickmenu: 'start',
              PartyCycle: 'select',
              Mainhand: 'ok',
              Offhand: 'cancel',
              Tool: 'tab',
              Dash: 'shift',
              MobilitySkill: 'r2',
              StrafeTrigger: 'l2',
              GuardTrigger: 'pagedown',
              SkillTrigger: 'pageup',
              CombatSkill1: 'combat-skill-1',
              CombatSkill2: 'combat-skill-2',
              CombatSkill3: 'combat-skill-3',
              CombatSkill4: 'combat-skill-4',
            },
          },
        },
      },
    };

    function JABS_BaseController()
    {
      this.battler = null;
      this.register();
    }
    JABS_BaseController.prototype.register = vi.fn();
    JABS_BaseController.prototype.getBattler = function()
    {
      return this.battler;
    };
    JABS_BaseController.prototype.setBattler = function(battler)
    {
      this.battler = battler;
    };
    globalThis.JABS_BaseController = JABS_BaseController;

    globalThis.Input = { isTriggered: vi.fn(() => false), isPressed: vi.fn(() => false) };
    globalThis.JABS_InputAdapter = {
      performMenuAction: vi.fn(),
      performPartyCycling: vi.fn(),
      performMainhandAction: vi.fn(),
      performOffhandAction: vi.fn(),
      performToolAction: vi.fn(),
      performUsableItemAction: vi.fn(),
      performSprint: vi.fn(),
      performDodgeAction: vi.fn(),
      performCombatAction: vi.fn(),
      performStrafe: vi.fn(),
      performRotate: vi.fn(),
      performGuard: vi.fn(),
    };

    ({ default: JABS_StandardController } =
      await import('../../../../../../src/plugins/abs/ext/input/_models/JABS_StandardController.js'));
  });

  beforeEach(() =>
  {
    globalThis.Input.isTriggered.mockReset().mockReturnValue(false);
    globalThis.Input.isPressed.mockReset().mockReturnValue(false);
    Object.values(globalThis.JABS_InputAdapter).forEach(fn => fn.mockClear());
  });

  /**
   * Builds a fake battler test double with sane defaults.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake battler.
   */
  function buildBattler(overrides = {})
  {
    return { isInCombat: () => false, ...overrides };
  }

  describe('constructor/initialize()/initMembers()/initMapping()', () =>
  {
    it('registers with the base controller and seeds default mappings', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.battler).toBeNull();
      expect(controller.inputMapping.get('Main')).toEqual([ 'ok' ]);
      expect(controller.inputMapping.get('Menu')).toEqual([ 'start' ]);
      expect(controller._lastInCombat).toEqual(false);
    });

    it('does not seed a Dodge mapping (Sprint handles mobility contextually)', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.inputMapping.has('Dodge')).toEqual(false);
    });
  });

  describe('buildDefaultMapping()/resetToDefaults()', () =>
  {
    it('builds the default mapping without mutating the live controller', () =>
    {
      const controller = new JABS_StandardController();
      const defaults = controller.buildDefaultMapping();

      expect(defaults.Dodge).toEqual([ 'r2' ]);
      expect(controller.inputMapping.has('Dodge')).toEqual(false);
    });

    it('resets live bindings to the defaults', () =>
    {
      const controller = new JABS_StandardController();
      controller.inputMapping.set('Main', [ 'custom' ]);

      controller.resetToDefaults();

      expect(controller.getInputsForButton('Main')).toEqual([ 'ok' ]);
      expect(controller.getInputsForButton('Dodge')).toEqual([ 'r2' ]);
    });
  });

  describe('getInputsForButton()/getInputForButton()', () =>
  {
    it('returns an empty array for an unmapped button', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.getInputsForButton('Unmapped')).toEqual([]);
      expect(controller.getInputForButton('Unmapped')).toBeUndefined();
    });

    it('returns a copy of an array-mapped button', () =>
    {
      const controller = new JABS_StandardController();
      const inputs = controller.getInputsForButton('Main');
      inputs.push('intruder');

      expect(controller.getInputsForButton('Main')).toEqual([ 'ok' ]);
    });

    it('wraps a bare string mapping into an array', () =>
    {
      const controller = new JABS_StandardController();
      controller.inputMapping.set('Weird', 'bare-string');

      expect(controller.getInputsForButton('Weird')).toEqual([ 'bare-string' ]);
    });

    it('returns the first input for a button', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.getInputForButton('Main')).toEqual('ok');
    });
  });

  describe('setAllInputs()/exportAllInputs()', () =>
  {
    it('applies a Map mapping, normalizing bare strings to arrays', () =>
    {
      const controller = new JABS_StandardController();
      const mapping = new Map([ [ 'Main', 'ok' ], [ 'Offhand', [ 'cancel' ] ] ]);

      controller.setAllInputs(mapping);

      expect(controller.getInputsForButton('Main')).toEqual([ 'ok' ]);
      expect(controller.getInputsForButton('Offhand')).toEqual([ 'cancel' ]);
    });

    it('applies a plain-object mapping', () =>
    {
      const controller = new JABS_StandardController();

      controller.setAllInputs({ Main: [ 'ok' ], Offhand: 'cancel' });

      expect(controller.getInputsForButton('Main')).toEqual([ 'ok' ]);
      expect(controller.getInputsForButton('Offhand')).toEqual([ 'cancel' ]);
    });

    it('coerces a falsy mapping entry to an empty array', () =>
    {
      const controller = new JABS_StandardController();

      controller.setAllInputs({ Main: null });

      expect(controller.getInputsForButton('Main')).toEqual([]);
    });

    it('overwrites Guard with a clone of Rotate after normalization', () =>
    {
      const controller = new JABS_StandardController();

      controller.setAllInputs({ Rotate: [ 'r1' ] });

      expect(controller.getInputsForButton('Guard')).toEqual([ 'r1' ]);
    });

    it('sets Guard to empty when no Rotate mapping is present', () =>
    {
      const controller = new JABS_StandardController();

      controller.setAllInputs({});

      expect(controller.getInputsForButton('Guard')).toEqual([]);
    });

    it('exports a shallow-copied plain object of the current mapping', () =>
    {
      const controller = new JABS_StandardController();
      controller.setAllInputs({ Main: [ 'ok' ] });

      const exported = controller.exportAllInputs();
      exported.Main.push('intruder');

      expect(controller.getInputsForButton('Main')).toEqual([ 'ok' ]);
    });

    it('exports an empty array for a non-array mapping value', () =>
    {
      const controller = new JABS_StandardController();
      controller.inputMapping.set('Weird', 'bare-string');

      expect(controller.exportAllInputs().Weird).toEqual([]);
    });
  });

  describe('isActionTriggered()/isActionPressed()', () =>
  {
    it('returns true when any bound input is triggered', () =>
    {
      globalThis.Input.isTriggered.mockImplementation((s) => s === 'ok');
      const controller = new JABS_StandardController();

      expect(controller.isActionTriggered('Main')).toEqual(true);
    });

    it('returns false when no bound input is triggered', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isActionTriggered('Main')).toEqual(false);
    });

    it('returns true when any bound input is pressed', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'ok');
      const controller = new JABS_StandardController();

      expect(controller.isActionPressed('Main')).toEqual(true);
    });

    it('returns false when no bound input is pressed', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isActionPressed('Main')).toEqual(false);
    });
  });

  describe('update()/canUpdate()', () =>
  {
    it('does nothing when there is no battler', () =>
    {
      const controller = new JABS_StandardController();
      const menuSpy = vi.spyOn(controller, 'updateMenuAction');

      controller.update();

      expect(menuSpy).not.toHaveBeenCalled();
    });

    it('dispatches every sub-update when a battler is present', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      const subUpdates = [
        'updateMenuAction', 'updatePartyCycleAction', 'updateMainhandAction', 'updateOffhandAction',
        'updateToolAction', 'updateUsableItemAction', 'updateSprintCommand', 'updateCombatAction1',
        'updateCombatAction2', 'updateCombatAction3', 'updateCombatAction4', 'updateGuardCommand',
        'updateStrafeCommand', 'updateRotateCommand',
      ];
      const spies = subUpdates.map(name => vi.spyOn(controller, name).mockImplementation(() => {}));

      controller.update();

      spies.forEach(spy => expect(spy).toHaveBeenCalled());
    });
  });

  //region simple triggered/pressed action pairs
  describe.each([
    [ 'Menu', 'isMenuActionTriggered', 'performMenuAction', 'triggered', 'Menu' ],
    [ 'PartyCycle', 'isPartyCycleActionTriggered', 'performPartyCycleAction', 'triggered', 'Select' ],
  ])('%s action', (_label, isTriggeredMethod, performMethod, _kind, button) =>
  {
    it(`is not performed when ${button} is not triggered`, () =>
    {
      const controller = new JABS_StandardController();
      const performSpy = vi.spyOn(controller, performMethod);

      expect(controller[isTriggeredMethod]()).toEqual(false);
      expect(performSpy).not.toHaveBeenCalled();
    });

    it(`is performed when ${button} is triggered`, () =>
    {
      const inputs = new JABS_StandardController().getInputsForButton(button);
      globalThis.Input.isTriggered.mockImplementation((s) => inputs.includes(s));
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(true);
    });
  });

  describe('performMenuAction()/performPartyCycleAction()', () =>
  {
    it('delegates to the input adapter', () =>
    {
      const controller = new JABS_StandardController();

      controller.performMenuAction();
      controller.performPartyCycleAction();

      expect(globalThis.JABS_InputAdapter.performMenuAction).toHaveBeenCalled();
      expect(globalThis.JABS_InputAdapter.performPartyCycling).toHaveBeenCalledWith(false);
    });
  });

  // real (unmocked) dispatch through the updateXAction() wrappers- the tests above only exercised
  // isXTriggered()/performX() in isolation, never the wrapper's own `if (triggered) perform()` glue.
  describe.each([
    [ 'updateMenuAction', 'isMenuActionTriggered', 'performMenuAction' ],
    [ 'updatePartyCycleAction', 'isPartyCycleActionTriggered', 'performPartyCycleAction' ],
    [ 'updateMainhandAction', 'isMainhandActionTriggered', 'performMainhandAction' ],
    [ 'updateOffhandAction', 'isOffhandActionTriggered', 'performOffhandAction' ],
    [ 'updateToolAction', 'isToolActionTriggered', 'performToolAction' ],
    [ 'updateUsableItemAction', 'isUsableItemActionTriggered', 'performUsableItemAction' ],
  ])('%s() real dispatch', (updateMethod, isTriggeredMethod, performMethod) =>
  {
    it('performs the action when triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(true);
      const performSpy = vi.spyOn(controller, performMethod).mockImplementation(() => {});

      controller[updateMethod]();

      expect(performSpy).toHaveBeenCalled();
    });

    it('does not perform the action when not triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(false);
      const performSpy = vi.spyOn(controller, performMethod);

      controller[updateMethod]();

      expect(performSpy).not.toHaveBeenCalled();
    });
  });
  //endregion simple triggered/pressed action pairs

  //region combat-skill-gated triggered actions (mainhand/offhand/tool/usable-item)
  describe.each([
    [ 'isMainhandActionTriggered', 'performMainhandAction', 'Main', 'performMainhandAction' ],
    [ 'isOffhandActionTriggered', 'performOffhandAction', 'Offhand', 'performOffhandAction' ],
    [ 'isToolActionTriggered', 'performToolAction', 'Tool', 'performToolAction' ],
    [ 'isUsableItemActionTriggered', 'performUsableItemAction', 'UsableItem', 'performUsableItemAction' ],
  ])('%s()/%s()', (isTriggeredMethod, performMethod, button, adapterMethod) =>
  {
    it('is suppressed while the combat-skill enabler is held', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pageup');
      const inputs = new JABS_StandardController().getInputsForButton(button);
      globalThis.Input.isTriggered.mockImplementation((s) => inputs.includes(s));
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());

      expect(controller[isTriggeredMethod]()).toEqual(false);
    });

    it('is triggered normally when not gated by the combat-skill enabler', () =>
    {
      const inputs = new JABS_StandardController().getInputsForButton(button);
      globalThis.Input.isTriggered.mockImplementation((s) => inputs.includes(s));
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());

      expect(controller[isTriggeredMethod]()).toEqual(true);
    });

    it('is not triggered when the underlying input is untouched', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(false);
    });

    it('delegates the perform call to the input adapter with this controller\'s battler', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller[performMethod]();

      expect(globalThis.JABS_InputAdapter[adapterMethod]).toHaveBeenCalledWith(battler);
    });
  });
  //endregion combat-skill-gated triggered actions

  //region sprint
  describe('updateSprintCommand()/isSprintActionTriggered()/performSprintAction()/performSprintAlterAction()', () =>
  {
    it('treats sprint as an edge-trigger while in combat', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler({ isInCombat: () => true });
      controller.setBattler(battler);
      globalThis.Input.isTriggered.mockImplementation((s) => s === 'shift');

      expect(controller.isSprintActionTriggered()).toEqual(true);
      expect(controller._lastInCombat).toEqual(true);
    });

    it('treats sprint as a held input while out of combat', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler({ isInCombat: () => false }));
      globalThis.Input.isPressed.mockImplementation((s) => s === 'shift');

      expect(controller.isSprintActionTriggered()).toEqual(true);
      expect(controller._lastInCombat).toEqual(false);
    });

    it('performs dodge and disables exploration sprint when the trigger fires in combat', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler({ isInCombat: () => true });
      controller.setBattler(battler);

      controller.performSprintAction();

      expect(globalThis.JABS_InputAdapter.performSprint).toHaveBeenCalledWith(false, battler);
      expect(globalThis.JABS_InputAdapter.performDodgeAction).toHaveBeenCalledWith(battler);
    });

    it('enables classic sprint when out of combat', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler({ isInCombat: () => false });
      controller.setBattler(battler);

      controller.performSprintAction();

      expect(globalThis.JABS_InputAdapter.performSprint).toHaveBeenCalledWith(true, battler);
      expect(globalThis.JABS_InputAdapter.performDodgeAction).not.toHaveBeenCalled();
    });

    it('does nothing to sprint state while in combat on release', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler({ isInCombat: () => true });
      controller.setBattler(battler);

      controller.performSprintAlterAction();

      expect(globalThis.JABS_InputAdapter.performSprint).not.toHaveBeenCalled();
    });

    it('disables sprint on release while out of combat', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler({ isInCombat: () => false });
      controller.setBattler(battler);

      controller.performSprintAlterAction();

      expect(globalThis.JABS_InputAdapter.performSprint).toHaveBeenCalledWith(false, battler);
    });

    it('performs the primary action when sprint is triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, 'isSprintActionTriggered').mockReturnValue(true);
      const primarySpy = vi.spyOn(controller, 'performSprintAction').mockImplementation(() => {});

      controller.updateSprintCommand();

      expect(primarySpy).toHaveBeenCalled();
    });

    it('performs the alter action when sprint is not triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, 'isSprintActionTriggered').mockReturnValue(false);
      const alterSpy = vi.spyOn(controller, 'performSprintAlterAction').mockImplementation(() => {});

      controller.updateSprintCommand();

      expect(alterSpy).toHaveBeenCalled();
    });
  });
  //endregion sprint

  //region combat skill enabler + combat actions 1-4
  describe('isCombatSkillUsageEnabled()', () =>
  {
    it('is true while SkillTrigger is held', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pageup');
      const controller = new JABS_StandardController();

      expect(controller.isCombatSkillUsageEnabled()).toEqual(true);
    });

    it('is false otherwise', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isCombatSkillUsageEnabled()).toEqual(false);
    });
  });

  describe.each([
    [ 'isCombatAction1Triggered', 'CombatSkill1', 'Main', 'combat-skill-1' ],
    [ 'isCombatAction2Triggered', 'CombatSkill2', 'Offhand', 'combat-skill-2' ],
    [ 'isCombatAction3Triggered', 'CombatSkill3', 'Sprint', 'combat-skill-3' ],
    [ 'isCombatAction4Triggered', 'CombatSkill4', 'Tool', 'combat-skill-4' ],
  ])('%s()', (isTriggeredMethod, _button, chordButton, keyboardSymbol) =>
  {
    it('fires via the L1 chord when the enabler is held and the chord button triggers', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pageup');
      const chordInputs = new JABS_StandardController().getInputsForButton(chordButton);
      globalThis.Input.isTriggered.mockImplementation((s) => chordInputs.includes(s));
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(true);
    });

    it('fires via the direct keyboard shortcut without the enabler held', () =>
    {
      globalThis.Input.isTriggered.mockImplementation((s) => s === keyboardSymbol);
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(true);
    });

    it('does not fire when neither the chord nor the shortcut are used', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(false);
    });

    it('falls through to the keyboard shortcut when the enabler is held but the chord button is not triggered', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pageup');
      globalThis.Input.isTriggered.mockImplementation((s) => s === keyboardSymbol);
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(true);
    });

    // the chord button doubles as an ordinary action button, so pressing it without the enabler
    // must stay with that ordinary action rather than leaking into a combat skill. the keyboard
    // shortcut is deliberately left untriggered here so the enabler is the only thing saying no.
    it('does not fire from the chord button alone when the enabler is not held', () =>
    {
      const chordInputs = new JABS_StandardController().getInputsForButton(chordButton);
      globalThis.Input.isTriggered.mockImplementation((s) => chordInputs.includes(s));
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(false);
    });

    // holding the enabler alone arms the chord without firing it; the chord button is deliberately
    // left untriggered so it is the only thing that can say no.
    it('does not fire when the enabler is held but neither the chord button nor the shortcut trigger', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pageup');
      const controller = new JABS_StandardController();

      expect(controller[isTriggeredMethod]()).toEqual(false);
    });
  });

  describe('performCombatAction()', () =>
  {
    it('delegates to the input adapter with the slot and battler', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performCombatAction('CombatSkill1');

      expect(globalThis.JABS_InputAdapter.performCombatAction).toHaveBeenCalledWith('CombatSkill1', battler);
    });
  });

  describe.each([
    [ 'updateCombatAction1', 'isCombatAction1Triggered', 'CombatSkill1' ],
    [ 'updateCombatAction2', 'isCombatAction2Triggered', 'CombatSkill2' ],
    [ 'updateCombatAction3', 'isCombatAction3Triggered', 'CombatSkill3' ],
    [ 'updateCombatAction4', 'isCombatAction4Triggered', 'CombatSkill4' ],
  ])('%s()', (updateMethod, isTriggeredMethod, slot) =>
  {
    it('performs the combat action for the slot when triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(true);
      const performSpy = vi.spyOn(controller, 'performCombatAction').mockImplementation(() => {});

      controller[updateMethod]();

      expect(performSpy).toHaveBeenCalledWith(slot);
    });

    it('does nothing when not triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(false);
      const performSpy = vi.spyOn(controller, 'performCombatAction');

      controller[updateMethod]();

      expect(performSpy).not.toHaveBeenCalled();
    });
  });
  //endregion combat skill enabler + combat actions 1-4

  //region held-input toggle actions (strafe/rotate/guard)
  describe.each([
    [ 'updateStrafeCommand', 'isStrafeActionTriggered', 'performStrafeAction', 'performStrafeAlterAction' ],
    [ 'updateRotateCommand', 'isRotateActionTriggered', 'performRotateAction', 'performRotateAlterAction' ],
    [ 'updateGuardCommand', 'isGuardActionTriggered', 'performGuardAction', 'performGuardAlterAction' ],
  ])('%s()', (updateMethod, isTriggeredMethod, primaryMethod, alterMethod) =>
  {
    it('performs the primary action when triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(true);
      const primarySpy = vi.spyOn(controller, primaryMethod).mockImplementation(() => {});

      controller[updateMethod]();

      expect(primarySpy).toHaveBeenCalled();
    });

    it('performs the alter action when not triggered', () =>
    {
      const controller = new JABS_StandardController();
      controller.setBattler(buildBattler());
      vi.spyOn(controller, isTriggeredMethod).mockReturnValue(false);
      const alterSpy = vi.spyOn(controller, alterMethod).mockImplementation(() => {});

      controller[updateMethod]();

      expect(alterSpy).toHaveBeenCalled();
    });
  });

  describe('isStrafeActionTriggered()/isRotateActionTriggered()/isGuardActionTriggered()', () =>
  {
    it('strafe reflects the Strafe pressed state', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'l2');
      const controller = new JABS_StandardController();

      expect(controller.isStrafeActionTriggered()).toEqual(true);
    });

    it('strafe is false when Strafe is not pressed', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isStrafeActionTriggered()).toEqual(false);
    });

    it('rotate reflects the Rotate pressed state', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pagedown');
      const controller = new JABS_StandardController();

      expect(controller.isRotateActionTriggered()).toEqual(true);
    });

    it('rotate is false when Rotate is not pressed', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isRotateActionTriggered()).toEqual(false);
    });

    it('guard reflects the Guard pressed state', () =>
    {
      globalThis.Input.isPressed.mockImplementation((s) => s === 'pagedown');
      const controller = new JABS_StandardController();

      expect(controller.isGuardActionTriggered()).toEqual(true);
    });

    it('guard is false when Guard is not pressed', () =>
    {
      const controller = new JABS_StandardController();

      expect(controller.isGuardActionTriggered()).toEqual(false);
    });
  });

  describe('performStrafeAction()/performStrafeAlterAction()', () =>
  {
    it('enables strafe', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performStrafeAction();

      expect(globalThis.JABS_InputAdapter.performStrafe).toHaveBeenCalledWith(true, battler);
    });

    it('disables strafe', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performStrafeAlterAction();

      expect(globalThis.JABS_InputAdapter.performStrafe).toHaveBeenCalledWith(false, battler);
    });
  });

  describe('performRotateAction()/performRotateAlterAction()', () =>
  {
    it('enables rotate and guard together', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performRotateAction();

      expect(globalThis.JABS_InputAdapter.performRotate).toHaveBeenCalledWith(true, battler);
      expect(globalThis.JABS_InputAdapter.performGuard).toHaveBeenCalledWith(true, battler);
    });

    it('disables rotate and guard together', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performRotateAlterAction();

      expect(globalThis.JABS_InputAdapter.performRotate).toHaveBeenCalledWith(false, battler);
      expect(globalThis.JABS_InputAdapter.performGuard).toHaveBeenCalledWith(false, battler);
    });
  });

  describe('performGuardAction()/performGuardAlterAction()', () =>
  {
    it('enables guard', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performGuardAction();

      expect(globalThis.JABS_InputAdapter.performGuard).toHaveBeenCalledWith(true, battler);
    });

    it('disables guard', () =>
    {
      const controller = new JABS_StandardController();
      const battler = buildBattler();
      controller.setBattler(battler);

      controller.performGuardAlterAction();

      expect(globalThis.JABS_InputAdapter.performGuard).toHaveBeenCalledWith(false, battler);
    });
  });
  //endregion held-input toggle actions
});
//endregion plugins/abs/ext/input/_models/jabs-standard-controller.test.js
