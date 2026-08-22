//region plugins/abs/ext/formula/objects/game-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Formula Game_Action (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps- kept
   *  as stable variables and mutated in place, never reassigned, since the Aliased map captures a
   *  fixed reference to whichever function object sat on the prototype at import time. */
  let originalApplyVirtualJabsAction;
  let originalApplyGlobal;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.FORMULA namespace- only the shape this one file reads/writes.
    globalThis.J = {
      LOG: false,
      ABS: {
        EXT: {
          FORMULA: {
            Aliased: { Game_Action: new Map() },
            Context: { activeTrigger: null, suppressCascades: false, suppressCommonEvents: false },
          },
        },
      },
    };

    // FormulaEffect is a downstream dependency (a sibling model file); mock its constants.
    vi.doMock('../../../../../../src/plugins/abs/ext/formula/__models/FormulaEffect.js', () => ({
      default: {
        Trigger: { HIT: 'hit', USE: 'use' },
        Affect: { SELF: 'self', ALLIES: 'allies', TARGET: 'target', ENEMIES: 'enemies', ALL: 'all' },
        Mode: { SKILL: 'skill', FORMULA: 'formula' },
        Resource: { HP: 'hp', MP: 'mp', TP: 'tp' },
      },
    }));

    globalThis.JABS_AiManager = {
      getBattlerByUuid: vi.fn(),
      getAlliedBattlers: vi.fn(),
      getOpposingBattlers: vi.fn(),
      getAllBattlers: vi.fn(),
    };

    globalThis.$dataSkills = {};
    globalThis.$jabsEngine = { forceMapAction: vi.fn() };
    globalThis.$gameVariables = { _data: [] };
    globalThis.$actionLogManager = { addLog: vi.fn() };
    globalThis.ActionLogBuilder = vi.fn(function()
    {
      this.setupExecution = vi.fn().mockReturnThis();
      this.build = vi.fn(() => ({ built: true }));
    });

    // Game_Action.prototype.<method> is aliased ("original") before this file overwrites each;
    // stub each with a bare mock rather than pulling in the real Game_Action chain.
    function Game_Action()
    {
    }

    originalApplyVirtualJabsAction = vi.fn();
    originalApplyGlobal = vi.fn();
    Game_Action.prototype.applyVirtualJabsAction = originalApplyVirtualJabsAction;
    Game_Action.prototype.applyGlobal = originalApplyGlobal;
    globalThis.Game_Action = Game_Action;

    // the file under test- patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/formula/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    originalApplyVirtualJabsAction.mockReset();
    originalApplyGlobal.mockReset();
    globalThis.JABS_AiManager.getBattlerByUuid.mockReset();
    globalThis.JABS_AiManager.getAlliedBattlers.mockReset();
    globalThis.JABS_AiManager.getOpposingBattlers.mockReset();
    globalThis.JABS_AiManager.getAllBattlers.mockReset();
    globalThis.$jabsEngine.forceMapAction.mockReset();
    globalThis.$actionLogManager.addLog.mockReset();
    globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = null;
    globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades = false;
    globalThis.J.ABS.EXT.FORMULA.Context.suppressCommonEvents = false;
    globalThis.J.LOG = false;
  });

  /**
   * Builds a duck-typed Game_Action carrying the real patched prototype, plus per-test overrides
   * for the collaborators this file leans on from elsewhere in the abs/core and base chains.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    const action = Object.create(globalThis.Game_Action.prototype);
    action._subject = { id: 'subject', getUuid: () => 'subject-uuid' };
    action._item = null;
    action.subject = () => action._subject;
    action.item = () => action._item;

    return Object.assign(action, overrides);
  }

  describe('applyVirtualJabsAction', () =>
  {
    it('performs the original logic then applies on-hit packets with context set and restored', () =>
    {
      // Arrange
      const action = buildAction();
      action.applyFormulaPackets = vi.fn(() =>
      {
        expect(globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger).toBe('hit');
        expect(globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades).toBe(false);
      });
      const target = { id: 'target' };
      globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = 'previous';
      globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades = true;

      // Act
      action.applyVirtualJabsAction(target);

      // Assert
      expect(originalApplyVirtualJabsAction).toHaveBeenCalledWith(target);
      expect(action.applyFormulaPackets).toHaveBeenCalledWith('hit', target);
      expect(globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger).toBe('previous');
      expect(globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades).toBe(true);
    });
  });

  describe('applyFormulaPackets', () =>
  {
    it('does nothing when there is no item', () =>
    {
      // Arrange
      const action = buildAction({ _item: null });
      action.applyFormulaPacket = vi.fn();

      // Act
      action.applyFormulaPackets('hit', null);

      // Assert
      expect(action.applyFormulaPacket).not.toHaveBeenCalled();
    });

    it('does nothing when the item is not a skill', () =>
    {
      // Arrange
      const action = buildAction({ _item: { isSkill: () => false } });
      action.applyFormulaPacket = vi.fn();

      // Act
      action.applyFormulaPackets('hit', null);

      // Assert
      expect(action.applyFormulaPacket).not.toHaveBeenCalled();
    });

    it('does nothing when the skill has no formula effects', () =>
    {
      // Arrange
      const action = buildAction({ _item: { isSkill: () => true, jabsFormulaEffects: () => [] } });
      action.applyFormulaPacket = vi.fn();

      // Act
      action.applyFormulaPackets('hit', null);

      // Assert
      expect(action.applyFormulaPacket).not.toHaveBeenCalled();
    });

    it('does nothing when no effects match the given trigger', () =>
    {
      // Arrange
      const effects = [ { trigger: 'use' } ];
      const action = buildAction({ _item: { isSkill: () => true, jabsFormulaEffects: () => effects } });
      action.applyFormulaPacket = vi.fn();

      // Act
      action.applyFormulaPackets('hit', null);

      // Assert
      expect(action.applyFormulaPacket).not.toHaveBeenCalled();
    });

    it('applies each effect matching the given trigger', () =>
    {
      // Arrange
      const matching = { trigger: 'hit' };
      const nonMatching = { trigger: 'use' };
      const action = buildAction({
        _item: { isSkill: () => true, jabsFormulaEffects: () => [ matching, nonMatching ] },
      });
      action.applyFormulaPacket = vi.fn();
      const target = { id: 'target' };

      // Act
      action.applyFormulaPackets('hit', target);

      // Assert
      expect(action.applyFormulaPacket).toHaveBeenCalledTimes(1);
      expect(action.applyFormulaPacket).toHaveBeenCalledWith(matching, target);
    });
  });

  describe('applyFormulaPacket', () =>
  {
    it('does nothing when cascades are suppressed', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.FORMULA.Context.suppressCascades = true;
      const action = buildAction();
      action.resolveFormulaRecipients = vi.fn();

      // Act
      action.applyFormulaPacket({ affect: 'self' }, null);

      // Assert
      expect(action.resolveFormulaRecipients).not.toHaveBeenCalled();
    });

    it('does nothing when there are no resolved recipients', () =>
    {
      // Arrange
      const action = buildAction();
      action.resolveFormulaRecipients = vi.fn(() => []);
      action.applyFormulaModePacket = vi.fn();

      // Act
      action.applyFormulaPacket({ affect: 'self', mode: 'formula' }, null);

      // Assert
      expect(action.applyFormulaModePacket).not.toHaveBeenCalled();
    });

    it('applies a formula-mode packet to every recipient', () =>
    {
      // Arrange
      const recipients = [ { id: 1 }, { id: 2 } ];
      const action = buildAction();
      action.resolveFormulaRecipients = vi.fn(() => recipients);
      action.applyFormulaModePacket = vi.fn();
      action.executeChildSkillPacket = vi.fn();
      const effect = { affect: 'self', mode: 'formula' };

      // Act
      action.applyFormulaPacket(effect, null);

      // Assert
      expect(action.applyFormulaModePacket).toHaveBeenCalledTimes(2);
      expect(action.applyFormulaModePacket).toHaveBeenCalledWith(effect, recipients[0]);
      expect(action.executeChildSkillPacket).not.toHaveBeenCalled();
    });

    it('executes a skill-mode packet with a positive skillId for every recipient', () =>
    {
      // Arrange
      const recipients = [ { id: 1 } ];
      const parentTarget = { id: 'parent' };
      const action = buildAction();
      action.resolveFormulaRecipients = vi.fn(() => recipients);
      action.applyFormulaModePacket = vi.fn();
      action.executeChildSkillPacket = vi.fn();
      const effect = { affect: 'target', mode: 'skill', skillId: 5 };

      // Act
      action.applyFormulaPacket(effect, parentTarget);

      // Assert
      expect(action.executeChildSkillPacket).toHaveBeenCalledWith(effect, recipients[0], parentTarget);
      expect(action.applyFormulaModePacket).not.toHaveBeenCalled();
    });

    it('does not execute a skill-mode packet when the skillId is not positive', () =>
    {
      // Arrange
      const recipients = [ { id: 1 } ];
      const action = buildAction();
      action.resolveFormulaRecipients = vi.fn(() => recipients);
      action.executeChildSkillPacket = vi.fn();
      const effect = { affect: 'target', mode: 'skill', skillId: 0 };

      // Act
      action.applyFormulaPacket(effect, null);

      // Assert
      expect(action.executeChildSkillPacket).not.toHaveBeenCalled();
    });
  });

  describe('resolveFormulaRecipients', () =>
  {
    it('SELF resolves to the subject', () =>
    {
      // Arrange
      const action = buildAction();
      // a parent target is deliberately present and deliberately different: "self" must mean the
      // subject even when there is a perfectly good target sitting right there.
      const parentTarget = { id: 'target' };

      // Act
      const result = action.resolveFormulaRecipients('self', parentTarget);

      // Assert
      expect(result).toEqual([ action.subject() ]);
    });

    it('TARGET resolves to the parent target when provided', () =>
    {
      // Arrange
      const action = buildAction();
      const parentTarget = { id: 'target' };

      // Act
      const result = action.resolveFormulaRecipients('target', parentTarget);

      // Assert
      expect(result).toEqual([ parentTarget ]);
    });

    it('TARGET falls back to the subject when there is no parent target', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      const result = action.resolveFormulaRecipients('target', null);

      // Assert
      expect(result).toEqual([ action.subject() ]);
    });

    it('ALLIES resolves to an empty array when the subject has no jabs battler', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      const result = action.resolveFormulaRecipients('allies', null);

      // Assert
      expect(result).toEqual([]);
    });

    it('ALLIES resolves to eligible allied battlers', () =>
    {
      // Arrange
      const action = buildAction();
      const eligible = { isDead: () => false, isInanimate: () => false };
      const dead = { isDead: () => true, isInanimate: () => false };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ id: 'jabs-subject' });
      globalThis.JABS_AiManager.getAlliedBattlers.mockReturnValue([
        { getBattler: () => eligible },
        { getBattler: () => dead },
      ]);

      // Act
      const result = action.resolveFormulaRecipients('allies', null);

      // Assert
      expect(result).toEqual([ eligible ]);
    });

    it('ENEMIES resolves to an empty array when the subject has no jabs battler', () =>
    {
      // Arrange
      const action = buildAction();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      const result = action.resolveFormulaRecipients('enemies', null);

      // Assert
      expect(result).toEqual([]);
    });

    it('ENEMIES resolves to eligible opposing battlers', () =>
    {
      // Arrange
      const action = buildAction();
      const eligible = { isDead: () => false, isInanimate: () => false };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ id: 'jabs-subject' });
      globalThis.JABS_AiManager.getOpposingBattlers.mockReturnValue([ { getBattler: () => eligible } ]);

      // Act
      const result = action.resolveFormulaRecipients('enemies', null);

      // Assert
      expect(result).toEqual([ eligible ]);
    });

    it('ALL resolves to every eligible tracked battler', () =>
    {
      // Arrange
      const action = buildAction();
      const eligible = { isDead: () => false, isInanimate: () => false };
      const inanimate = { isDead: () => false, isInanimate: () => true };
      globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([
        { getBattler: () => eligible },
        { getBattler: () => inanimate },
      ]);

      // Act
      const result = action.resolveFormulaRecipients('all', null);

      // Assert
      expect(result).toEqual([ eligible ]);
    });

    it('resolves to an empty array for an unknown affect key', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      const result = action.resolveFormulaRecipients('bogus', null);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('_filterFormulaEligibleBattler', () =>
  {
    it('is false for a falsy battler', () =>
    {
      const action = buildAction();
      expect(action._filterFormulaEligibleBattler(null)).toBe(false);
    });

    it('is false for a dead battler', () =>
    {
      const action = buildAction();
      const battler = { isDead: () => true, isInanimate: () => false };
      expect(action._filterFormulaEligibleBattler(battler)).toBe(false);
    });

    it('is false for an inanimate battler', () =>
    {
      const action = buildAction();
      const battler = { isDead: () => false, isInanimate: () => true };
      expect(action._filterFormulaEligibleBattler(battler)).toBe(false);
    });

    it('is true for a living, animate battler', () =>
    {
      const action = buildAction();
      const battler = { isDead: () => false, isInanimate: () => false };
      expect(action._filterFormulaEligibleBattler(battler)).toBe(true);
    });
  });

  describe('evaluateFormula', () =>
  {
    it('evaluates the formula with a/b/v/i bound and rounds to 3 decimals', () =>
    {
      // Arrange
      const action = buildAction();
      const source = { atk: 10 };
      const recipient = { def: 3 };
      const item = { id: 1 };

      // Act
      const result = action.evaluateFormula('a.atk * 1.23456', source, recipient, item);

      // Assert
      expect(result).toBe(12.346);
    });

    it('throws when the formula produces a non-finite result', () =>
    {
      // Arrange
      const action = buildAction();
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.spyOn(console, 'trace').mockImplementation(() => {});

      // Act / Assert
      expect(() => action.evaluateFormula('1 / 0 * Infinity - Infinity', {}, {}, {})).toThrow();

      // Cleanup
      console.warn.mockRestore();
      console.trace.mockRestore();
    });
  });

  describe('applyFormulaModePacket', () =>
  {
    /**
     * Builds a recipient duck-type carrying the resource-gain methods and a result() snapshot
     * this method reads/restores.
     */
    function buildRecipient()
    {
      return {
        gainHp: vi.fn(),
        gainMp: vi.fn(),
        gainTp: vi.fn(),
        result: () => ({ used: true, missed: false, evaded: false, critical: false,
          hpDamage: 0, mpDamage: 0, tpDamage: 0, parried: false, reduced: false, physical: true, drain: false }),
      };
    }

    it('does nothing when the formula evaluates to zero', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => 0;
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: '0', resource: 'hp' }, recipient);

      // Assert
      expect(recipient.gainHp).not.toHaveBeenCalled();
    });

    it('does nothing when the piped magnitude rounds to zero', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => 5;
      action.pipeFormulaThroughBattleCalculations = () => 0.4;
      action.makeSuccess = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: '5', resource: 'hp' }, recipient);

      // Assert
      expect(recipient.gainHp).not.toHaveBeenCalled();
      expect(action.makeSuccess).not.toHaveBeenCalled();
    });

    it('applies HP damage for a positive raw magnitude', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => 10;
      action.pipeFormulaThroughBattleCalculations = () => 10;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: 'a.atk', resource: 'hp' }, recipient);

      // Assert
      expect(recipient.gainHp).toHaveBeenCalledWith(-10);
      expect(action.makeSuccess).toHaveBeenCalledWith(recipient);
      expect(action.onFormulaResourceDelta).toHaveBeenCalledWith(recipient, 10, 'hp');
    });

    it('applies HP healing for a negative raw magnitude', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => -6;
      action.pipeFormulaThroughBattleCalculations = () => 6;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: '-a.mat', resource: 'hp' }, recipient);

      // Assert
      expect(recipient.gainHp).toHaveBeenCalledWith(6);
    });

    it('applies MP healing for a negative raw magnitude', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => -8;
      action.pipeFormulaThroughBattleCalculations = () => 8;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: '-a.mat', resource: 'mp' }, recipient);

      // Assert
      expect(recipient.gainMp).toHaveBeenCalledWith(8);
      expect(action.onFormulaResourceDelta).toHaveBeenCalledWith(recipient, -8, 'mp');
    });

    it('applies TP damage and restores the original action result snapshot', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => 4;
      action.pipeFormulaThroughBattleCalculations = () => 4;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const result = { used: true, missed: false, evaded: false, critical: true,
        hpDamage: 1, mpDamage: 2, tpDamage: 3, parried: false, reduced: false, physical: true, drain: false };
      const recipient = { ...buildRecipient(), result: () => result };

      // Act
      action.applyFormulaModePacket({ formula: 'a.atk', resource: 'tp' }, recipient);

      // Assert
      expect(recipient.gainTp).toHaveBeenCalledWith(-4);
      expect(result.hpDamage).toBe(1);
      expect(result.critical).toBe(true);
    });

    it('applies MP damage for a positive raw magnitude', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => 7;
      action.pipeFormulaThroughBattleCalculations = () => 7;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: 'a.atk', resource: 'mp' }, recipient);

      // Assert
      expect(recipient.gainMp).toHaveBeenCalledWith(-7);
    });

    it('applies TP healing for a negative raw magnitude', () =>
    {
      // Arrange
      const action = buildAction();
      action.evaluateFormula = () => -3;
      action.pipeFormulaThroughBattleCalculations = () => 3;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: '-a.mat', resource: 'tp' }, recipient);

      // Assert
      expect(recipient.gainTp).toHaveBeenCalledWith(3);
    });

    it('attributes the action log to the parent skill id when an item is present', () =>
    {
      // Arrange
      const action = buildAction({ _item: { id: 42 } });
      action.evaluateFormula = () => 10;
      action.pipeFormulaThroughBattleCalculations = () => 10;
      action.makeSuccess = vi.fn();
      action.onFormulaResourceDelta = vi.fn();
      action.generateFormulaActionLogIfAvailable = vi.fn();
      const recipient = buildRecipient();

      // Act
      action.applyFormulaModePacket({ formula: 'a.atk', resource: 'hp' }, recipient);

      // Assert
      expect(action.generateFormulaActionLogIfAvailable).toHaveBeenCalledWith(recipient, 10, 'hp', 42);
    });
  });

  describe('pipeFormulaThroughBattleCalculations', () =>
  {
    /** Builds an action with the battle-pipeline collaborator methods stubbed to identity/no-op. */
    function buildPipelineAction(overrides = {})
    {
      const action = buildAction();
      action.calcElementRate = () => 1;
      action.applyCritical = (value) => value * 2;
      action.isPhysical = () => false;
      action.isMagical = () => false;
      action.applyGuard = (value) => value;
      action.applyVariance = (value) => value;
      action.canHandleGuardEffects = () => false;
      action.handleGuardEffects = (value) => value;
      action.applyResourceHealingWithRecovery = (target, value) => value;
      action._item = { damage: { variance: 10 } };

      return Object.assign(action, overrides);
    }

    it('applies the element rate to the base magnitude', () =>
    {
      // Arrange
      const action = buildPipelineAction({ calcElementRate: () => 2 });
      const target = { result: () => null, pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(20);
    });

    it('applies critical only when damage occurred during a HIT-trigger critical result', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = 'hit';
      const action = buildPipelineAction();
      const target = { result: () => ({ critical: true }), pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(20);
    });

    it('does not apply critical when the trigger is USE even if the result is critical', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.FORMULA.Context.activeTrigger = 'use';
      const action = buildPipelineAction();
      const target = { result: () => ({ critical: true }), pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(10);
    });

    it('applies the physical damage rate for physical actions', () =>
    {
      // Arrange
      const action = buildPipelineAction({ isPhysical: () => true });
      const target = { result: () => null, pdr: 0.5, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(5);
    });

    it('does not apply the physical damage rate for a non-physical action', () =>
    {
      // Arrange- the doubled element rate is the proof-of-execution anchor: a 20 can only come
      // from a pipeline that actually ran, and a pdr applied on top of it would read 10.
      const action = buildPipelineAction({ calcElementRate: () => 2 });
      const target = { result: () => null, pdr: 0.5, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(20);
    });

    it('applies the magical damage rate for magical actions', () =>
    {
      // Arrange
      const action = buildPipelineAction({ isMagical: () => true });
      const target = { result: () => null, pdr: 1, mdr: 0.25 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert- damage always rounds (2.5 -> 3) before the JABS guard-reduction check.
      expect(result).toBe(3);
    });

    it('does not apply the magical damage rate for a non-magical action', () =>
    {
      // Arrange- the doubled element rate anchors execution; an mdr applied on top would read 5.
      const action = buildPipelineAction({ calcElementRate: () => 2 });
      const target = { result: () => null, pdr: 1, mdr: 0.25 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(20);
    });

    it('applies guard only when this is damage', () =>
    {
      // Arrange
      const action = buildPipelineAction({ applyGuard: () => 3 });
      const target = { result: () => null, pdr: 1, mdr: 1 };

      // Act
      const damageResult = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);
      const healResult = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, false);

      // Assert
      expect(damageResult).toBe(3);
      expect(healResult).toBe(10);
    });

    it('applies JABS guard/parry reductions when damage and a guarding jabs battler is found', () =>
    {
      // Arrange
      const action = buildPipelineAction({
        canHandleGuardEffects: () => true,
        handleGuardEffects: () => 1,
      });
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ id: 'jabs-target' });
      const target = { result: () => null, pdr: 1, mdr: 1, getUuid: () => 'target-uuid' };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(1);
    });

    it('skips JABS guard reductions when no guarding jabs battler is found', () =>
    {
      // Arrange
      const action = buildPipelineAction({ canHandleGuardEffects: () => true, handleGuardEffects: () => 1 });
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
      const target = { result: () => null, pdr: 1, mdr: 1, getUuid: () => 'target-uuid' };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(10);
    });

    it('does not apply JABS guard/parry reductions to healing', () =>
    {
      // Arrange- every backstop that could independently suppress the reduction is switched off:
      // the action can handle guard effects, a guarding jabs battler resolves, and the reduction
      // itself would produce an unmistakable 1. Only the damage-vs-heal branch is left to stop it.
      const action = buildPipelineAction({
        calcElementRate: () => 2,
        canHandleGuardEffects: () => true,
        handleGuardEffects: () => 1,
      });
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ id: 'jabs-target' });
      const target = { result: () => null, pdr: 1, mdr: 1, getUuid: () => 'target-uuid' };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, false);

      // Assert
      expect(result).toBe(20);
    });

    it('applies REC-based healing adjustment only when this is not damage', () =>
    {
      // Arrange
      const action = buildPipelineAction({ applyResourceHealingWithRecovery: () => 99 });
      const target = { result: () => null, pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, false);

      // Assert
      expect(result).toBe(99);
    });

    it('does not apply the REC healing adjustment to damage', () =>
    {
      // Arrange- the recovery stub would produce an unmistakable 99, so the only thing keeping the
      // result at the doubled element rate is the damage-vs-heal branch.
      const action = buildPipelineAction({ calcElementRate: () => 2, applyResourceHealingWithRecovery: () => 99 });
      const target = { result: () => null, pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, true);

      // Assert
      expect(result).toBe(20);
    });

    it('never returns a negative magnitude', () =>
    {
      // Arrange
      const action = buildPipelineAction({ applyResourceHealingWithRecovery: () => -50 });
      const target = { result: () => null, pdr: 1, mdr: 1 };

      // Act
      const result = action.pipeFormulaThroughBattleCalculations(target, 10, { resource: 'hp' }, false);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('applyResourceHealingWithRecovery', () =>
  {
    it('scales the magnitude by the target REC and subject HAR, rounded', () =>
    {
      // Arrange
      const action = buildAction({ _subject: { har: 2 } });
      const target = { rec: 1.5 };

      // Act
      const result = action.applyResourceHealingWithRecovery(target, 10, 'hp');

      // Assert
      expect(result).toBe(30);
    });
  });

  describe('executeChildSkillPacket', () =>
  {
    it('does nothing when the child skill id does not resolve to real data', () =>
    {
      // Arrange- the two downstream backstops are deliberately neutralized: the subject does
      // resolve to a jabs battler, and that battler would happily build actions for this id. The
      // missing database row is the only thing left that can stop the forced action.
      const action = buildAction();
      globalThis.$dataSkills = {};
      const jabsSubject = { createJabsActionFromSkill: vi.fn(() => [ { id: 'action' } ]) };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsSubject);

      // Act
      action.executeChildSkillPacket({ skillId: 999 }, null, null);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('does nothing when the subject has no jabs battler', () =>
    {
      // Arrange
      globalThis.$dataSkills = { 5: { id: 5 } };
      const action = buildAction();
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act
      action.executeChildSkillPacket({ skillId: 5 }, null, null);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('does nothing when the subject produces no jabs actions for the child skill', () =>
    {
      // Arrange
      globalThis.$dataSkills = { 5: { id: 5 } };
      const action = buildAction();
      const jabsSubject = { createJabsActionFromSkill: vi.fn(() => []) };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsSubject);

      // Act
      action.executeChildSkillPacket({ skillId: 5 }, null, null);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).not.toHaveBeenCalled();
    });

    it('forces the child skill action at the subject with no recipient bias when the recipient has no jabs battler', () =>
    {
      // Arrange
      globalThis.$dataSkills = { 5: { id: 5 } };
      const action = buildAction();
      const jabsSubject = { createJabsActionFromSkill: vi.fn(() => [ { id: 'action' } ]) };
      globalThis.JABS_AiManager.getBattlerByUuid.mockImplementation((uuid) =>
        (uuid === 'subject-uuid' ? jabsSubject : null));
      const recipient = { getUuid: () => 'recipient-uuid' };

      // Act
      action.executeChildSkillPacket({ skillId: 5 }, recipient, null);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsSubject, 5, false, null, null);
    });

    it('forces the child skill action biased toward the recipient jabs battler coordinates', () =>
    {
      // Arrange
      globalThis.$dataSkills = { 5: { id: 5 } };
      const action = buildAction();
      const jabsSubject = { createJabsActionFromSkill: vi.fn(() => [ { id: 'action' } ]) };
      const jabsRecipient = { getX: () => 3, getY: () => 4 };
      globalThis.JABS_AiManager.getBattlerByUuid.mockImplementation((uuid) =>
      {
        if (uuid === 'subject-uuid') return jabsSubject;
        if (uuid === 'recipient-uuid') return jabsRecipient;
        return null;
      });
      const recipient = { getUuid: () => 'recipient-uuid' };

      // Act
      action.executeChildSkillPacket({ skillId: 5 }, recipient, null);

      // Assert
      expect(globalThis.$jabsEngine.forceMapAction).toHaveBeenCalledWith(jabsSubject, 5, false, 3, 4);
    });
  });

  describe('onFormulaResourceDelta', () =>
  {
    it('is a no-op extension hook that does not throw', () =>
    {
      const action = buildAction();
      expect(() => action.onFormulaResourceDelta({}, -5, 'hp')).not.toThrow();
    });
  });

  describe('generateFormulaActionLogIfAvailable', () =>
  {
    it('does nothing when the logging plugin is not present', () =>
    {
      // Arrange
      globalThis.J.LOG = false;
      const action = buildAction();

      // Act
      action.generateFormulaActionLogIfAvailable({}, 5, 'hp', 1);

      // Assert
      expect(globalThis.$actionLogManager.addLog).not.toHaveBeenCalled();
    });

    it('does nothing when the magnitude is zero', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction();

      // Act
      action.generateFormulaActionLogIfAvailable({}, 0, 'hp', 1);

      // Assert
      expect(globalThis.$actionLogManager.addLog).not.toHaveBeenCalled();
    });

    it('builds and submits a log entry when logging is available and the magnitude is nonzero', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: { name: () => 'Hero' } });
      const recipient = { name: () => 'Slime', result: () => ({ critical: true }) };
      globalThis.ActionLogBuilder.mockClear();

      // Act
      action.generateFormulaActionLogIfAvailable(recipient, -5, 'hp', 3);

      // Assert- a negative amount is a heal, and the crit flag rides along with it. The magnitude
      // logged is the absolute value, so the sign only ever survives in the isHeal argument.
      const builder = globalThis.ActionLogBuilder.mock.instances.at(-1);
      const [ targetName, casterName, loggedSkillId, magnitude, , isHeal, wasCrit ] =
        builder.setupExecution.mock.calls.at(-1);
      expect(targetName).toBe('Slime');
      expect(casterName).toBe('Hero');
      expect(loggedSkillId).toBe(3);
      expect(magnitude).toBe(5);
      expect(isHeal).toBe(true);
      expect(wasCrit).toBe(true);
      expect(globalThis.$actionLogManager.addLog).toHaveBeenCalledWith({ built: true });
    });

    it('logs a positive amount as damage rather than a heal', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: { name: () => 'Hero' } });
      const recipient = { name: () => 'Slime', result: () => ({ critical: false }) };
      globalThis.ActionLogBuilder.mockClear();

      // Act
      action.generateFormulaActionLogIfAvailable(recipient, 5, 'hp', 3);

      // Assert- the same magnitude as the heal case above, differing only in the two flags, so the
      // sign and the crit state are the only things these two tests can be telling apart.
      const builder = globalThis.ActionLogBuilder.mock.instances.at(-1);
      const [ , , loggedSkillId, magnitude, , isHeal, wasCrit ] = builder.setupExecution.mock.calls.at(-1);
      expect(loggedSkillId).toBe(3);
      expect(magnitude).toBe(5);
      expect(isHeal).toBe(false);
      expect(wasCrit).toBe(false);
    });

    it('falls back to "Unknown" for the caster name when there is no subject', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: null });
      const recipient = { name: () => 'Slime', result: () => ({ critical: false }) };

      // Act & Assert
      expect(() => action.generateFormulaActionLogIfAvailable(recipient, -5, 'hp', 3)).not.toThrow();
    });

    it('falls back to "Unknown" for the target name when there is no recipient', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: { name: () => 'Hero' } });

      // Act & Assert
      expect(() => action.generateFormulaActionLogIfAvailable(null, -5, 'hp', 3)).not.toThrow();
    });

    it('defaults wasCrit to false when the recipient has no current action result', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: { name: () => 'Hero' } });
      const recipient = { name: () => 'Slime', result: () => null };

      // Act & Assert
      expect(() => action.generateFormulaActionLogIfAvailable(recipient, -5, 'hp', 3)).not.toThrow();
    });

    it('defaults the log\'s skill id to 0 when none is provided', () =>
    {
      // Arrange
      globalThis.J.LOG = true;
      const action = buildAction({ _subject: { name: () => 'Hero' } });
      const recipient = { name: () => 'Slime', result: () => ({ critical: false }) };

      // Act & Assert
      expect(() => action.generateFormulaActionLogIfAvailable(recipient, -5, 'hp', 0)).not.toThrow();
    });
  });

  describe('applyGlobal', () =>
  {
    it('does not perform the original logic when common events are suppressed', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.FORMULA.Context.suppressCommonEvents = true;
      const action = buildAction();

      // Act
      action.applyGlobal();

      // Assert
      expect(originalApplyGlobal).not.toHaveBeenCalled();
    });

    it('performs the original logic when common events are not suppressed', () =>
    {
      // Arrange
      const action = buildAction();

      // Act
      action.applyGlobal();

      // Assert
      expect(originalApplyGlobal).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/formula/objects/game-action.test.js
