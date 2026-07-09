//region plugins/abs/core/channeling-interrupt.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so the new channel/interrupt getters parse for real.
 * @param {object} sandbox
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(sandbox, note)
{
  const row = Object.create(sandbox.RPG_Skill.prototype);
  row.id = 1;
  row.note = note;
  row.meta = {};
  row._original = function() { return this; };
  return row;
}

/**
 * Builds a fake `JABS_Action` exposing only what the channel/interrupt machinery touches.
 * A frozen target location is always supplied so `resolveActionTargetCoordinates` never falls
 * through to the much heavier live-resolution machinery.
 * @param {object} sandbox
 * @param {object} skill The backing skill row.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildAction(sandbox, skill, overrides = {})
{
  return {
    getBaseSkill: () => skill,
    getActionOptions: () => ({
      getTargetLocation: () => ({ getX: () => 7, getY: () => 9 }),
    }),
    getCooldownType: () => 'mainhand',
    getCooldown: () => 100,
    isRetaliation: () => false,
    ...overrides,
  };
}

/**
 * Builds a plain duck-typed "JABS_Battler" carrying only what channeling/interruption touches,
 * borrowing the real prototype methods under test directly from the compiled plugin.
 * @param {object} sandbox
 * @param {string[]} [notes] Battler-wide note sources for immunity checks.
 * @returns {object}
 */
function buildJabsBattler(sandbox, notes = [])
{
  const proto = sandbox.JABS_Battler.prototype;

  return {
    _casting: false,
    _castTimeCountdown: 0,
    _channeling: false,
    _channelSkillId: 0,
    _channelTickCountdown: 0,
    _channelDurationRemaining: 0,
    _channelSourceAction: null,
    _decidedAction: null,
    getUuid: () => 'test-uuid',
    getBattler: () => ({
      getAllNotes: () => notes.map(note => buildSkillRow(sandbox, note)),
      isImmuneToInterrupt: sandbox.Game_Battler.prototype.isImmuneToInterrupt,
    }),
    isCasting: proto.isCasting,
    getCastTimeCountdown: proto.getCastTimeCountdown,
    setCastTimeCountdown: proto.setCastTimeCountdown,
    isChanneling: proto.isChanneling,
    isCastingOrChanneling: proto.isCastingOrChanneling,
    getChannelDurationRemaining: proto.getChannelDurationRemaining,
    getDecidedAction: proto.getDecidedAction,
    setDecidedAction: proto.setDecidedAction,
    clearDecidedAction: proto.clearDecidedAction,
    isActionDecided: proto.isActionDecided,
    resolveActionTargetCoordinates: proto.resolveActionTargetCoordinates,
    hasUninterruptibleMovementLock: proto.hasUninterruptibleMovementLock,
    beginChannel: proto.beginChannel,
    processChannelingTimer: proto.processChannelingTimer,
    executeChannelTick: proto.executeChannelTick,
    onChannelComplete: proto.onChannelComplete,
    endChannel: proto.endChannel,
    interrupt: proto.interrupt,
  };
}

describe('J-ABS channeling and interruption (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);

    // the real plugin script declares `$jabsEngine` itself (starting out null), clobbering
    // whatever the harness's stub set it to- so (re)build the whole global fresh per test with
    // call-tracking mocks for everything channeling/interruption touches.
    sandbox.$jabsEngine = {
      __forceMapActionCalls: [],
      forceMapAction(caster, skillId, isRetaliation, targetX, targetY)
      {
        sandbox.$jabsEngine.__forceMapActionCalls.push({ skillId, targetX, targetY });
      },

      __paySkillCostsCalls: [],
      paySkillCosts(caster, action)
      {
        sandbox.$jabsEngine.__paySkillCostsCalls.push(action);
      },

      __logSkillExecutionCalls: [],
      logSkillExecution(uuid, skillId, stypeId)
      {
        sandbox.$jabsEngine.__logSkillExecutionCalls.push({ uuid, skillId, stypeId });
      },

      __applyCooldownCountersCalls: [],
      applyCooldownCounters(caster, action)
      {
        sandbox.$jabsEngine.__applyCooldownCountersCalls.push(action);
      },

      __applyCooldownValueForSkillCalls: [],
      applyCooldownValueForSkill(caster, action, cooldownValue)
      {
        sandbox.$jabsEngine.__applyCooldownValueForSkillCalls.push({ action, cooldownValue });
      },
    };
  });

  describe('RPG_Skill/RPG_UsableItem tag getters', () =>
  {
    it('jabsChannel parses the [skillId, duration] pair', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>');

      expect(skill.jabsChannel).toEqual([ 25, 180 ]);
    });

    it('jabsChannel defaults to an empty array when absent', () =>
    {
      const skill = buildSkillRow(sandbox, '<castTime:60>');

      expect(skill.jabsChannel).toEqual([]);
    });

    it('jabsChannelTickSpeed reads an explicit override', () =>
    {
      const skill = buildSkillRow(sandbox, '<channelTickSpeed:15>');

      expect(skill.jabsChannelTickSpeed).toBe(15);
    });

    it('jabsChannelTickSpeed falls back to the plugin default when omitted', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>');

      expect(skill.jabsChannelTickSpeed).toBe(sandbox.J.ABS.Metadata.DefaultChannelTickSpeed);
    });

    it('jabsOnChannelComplete parses one or more skill ids', () =>
    {
      const single = buildSkillRow(sandbox, '<onChannelComplete:[36]>');
      const multiple = buildSkillRow(sandbox, '<onChannelComplete:[36, 37, 38]>');

      expect(single.jabsOnChannelComplete).toEqual([ 36 ]);
      expect(multiple.jabsOnChannelComplete).toEqual([ 36, 37, 38 ]);
    });

    it('jabsOnChannelComplete defaults to an empty array when absent', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>');

      expect(skill.jabsOnChannelComplete).toEqual([]);
    });

    it('jabsCannotMoveToInterrupt and jabsThisCannotBeInterrupted are true only when tagged', () =>
    {
      expect(buildSkillRow(sandbox, '<cannotMoveToInterrupt>').jabsCannotMoveToInterrupt).toBe(true);
      expect(buildSkillRow(sandbox, '<castTime:60>').jabsCannotMoveToInterrupt).toBe(false);
      expect(buildSkillRow(sandbox, '<thisCannotBeInterrupted>').jabsThisCannotBeInterrupted).toBe(true);
      expect(buildSkillRow(sandbox, '<castTime:60>').jabsThisCannotBeInterrupted).toBe(false);
    });

    it('jabsInterruptMagnifier reads the percent, defaulting to 0 (no interrupt capability)', () =>
    {
      expect(buildSkillRow(sandbox, '<interrupt:200>').jabsInterruptMagnifier).toBe(200);
      expect(buildSkillRow(sandbox, '<knockback:4>').jabsInterruptMagnifier).toBe(0);
    });
  });

  describe('Game_Battler.isImmuneToInterrupt', () =>
  {
    it('is true when any note source carries <cannotBeInterrupted>', () =>
    {
      const notes = [ buildSkillRow(sandbox, '<cannotBeInterrupted>') ];
      const battler = { getAllNotes: () => notes };

      expect(sandbox.Game_Battler.prototype.isImmuneToInterrupt.call(battler)).toBe(true);
    });

    it('is false when no note source carries the tag', () =>
    {
      const notes = [ buildSkillRow(sandbox, '<knockback:4>') ];
      const battler = { getAllNotes: () => notes };

      expect(sandbox.Game_Battler.prototype.isImmuneToInterrupt.call(battler)).toBe(false);
    });
  });

  describe('beginChannel', () =>
  {
    it('pays cost once, logs the execution, and begins channeling without firing an immediate tick', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);

      battler.beginChannel(action);

      expect(sandbox.$jabsEngine.__paySkillCostsCalls).toHaveLength(1);
      expect(sandbox.$jabsEngine.__logSkillExecutionCalls).toHaveLength(1);
      expect(battler.isChanneling()).toBe(true);
      expect(battler.getChannelDurationRemaining()).toBe(180);
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(0);
    });
  });

  describe('processChannelingTimer', () =>
  {
    it('fires the child skill only after the tick interval elapses, not on the first frame', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      // 29 frames: not yet a tick.
      for (let i = 0; i < 29; i++) battler.processChannelingTimer();
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(0);

      // the 30th frame fires the first tick, targeting the frozen location.
      battler.processChannelingTimer();
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
      ]);
    });

    it('fires exactly floor(duration / tickSpeed) ticks over the full duration', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      for (let i = 0; i < 180; i++) battler.processChannelingTimer();

      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(6);
      expect(battler.isChanneling()).toBe(false);
    });

    it('fires the <onChannelComplete> payoff exactly once, only on natural completion', () =>
    {
      const skill = buildSkillRow(
        sandbox,
        '<channel:[25, 60]>\n<channelTickSpeed:30>\n<onChannelComplete:[36]>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      for (let i = 0; i < 60; i++) battler.processChannelingTimer();

      // 2 ticks of skill 25, then 1 payoff execution of skill 36.
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
        { skillId: 25, targetX: 7, targetY: 9 },
        { skillId: 36, targetX: 7, targetY: 9 },
      ]);
      expect(sandbox.$jabsEngine.__applyCooldownCountersCalls).toHaveLength(1);
    });

    it('does not fire any payoff when the skill omits <onChannelComplete>', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 30]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      for (let i = 0; i < 30; i++) battler.processChannelingTimer();

      expect(sandbox.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
      ]);
    });
  });

  describe('interrupt', () =>
  {
    it('does nothing when the battler is neither casting nor channeling', () =>
    {
      const battler = buildJabsBattler(sandbox);

      battler.interrupt(200, false);

      expect(sandbox.$jabsEngine.__applyCooldownValueForSkillCalls).toHaveLength(0);
    });

    it('self-interrupt (moving) applies the full effective cooldown, regardless of magnifier', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill, { getCooldown: () => 75 });
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      battler.interrupt(200, true);

      expect(battler.isChanneling()).toBe(false);
      expect(sandbox.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 75 },
      ]);
      // no payoff, no further ticks: interrupting is not natural completion.
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(0);
      expect(sandbox.$jabsEngine.__applyCooldownCountersCalls).toHaveLength(0);
    });

    it('external interrupt scales the cooldown penalty by the magnifier (75 * 200% = 150)', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill, { getCooldown: () => 75 });
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      battler.interrupt(200, false);

      expect(sandbox.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 150 },
      ]);
    });

    it('interrupting a cast discards the decided action so it never executes', () =>
    {
      const skill = buildSkillRow(sandbox, '<castTime:60>');
      const action = buildAction(sandbox, skill, { getCooldown: () => 40 });
      const battler = buildJabsBattler(sandbox);
      battler._casting = true;
      battler._castTimeCountdown = 30;
      battler.setDecidedAction([ action ]);

      battler.interrupt(100, false);

      expect(battler.isCasting()).toBe(false);
      expect(battler.isActionDecided()).toBe(false);
      expect(sandbox.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 40 },
      ]);
    });

    it('already-fired ticks stand when a channel is interrupted mid-way', () =>
    {
      const skill = buildSkillRow(sandbox, '<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(sandbox, skill);
      const battler = buildJabsBattler(sandbox);
      battler.beginChannel(action);

      for (let i = 0; i < 30; i++) battler.processChannelingTimer();
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(1);

      battler.interrupt(100, true);

      // the one tick that already fired is not undone, but no more follow.
      expect(sandbox.$jabsEngine.__forceMapActionCalls).toHaveLength(1);
    });
  });

  describe('JABS_Engine.checkInterrupt', () =>
  {
    /**
     * Builds a duck-typed "engine" exposing only the method under test.
     * @returns {object}
     */
    function buildEngine()
    {
      return { checkInterrupt: sandbox.JABS_Engine.prototype.checkInterrupt };
    }

    /**
     * Builds a duck-typed interrupt target with controllable busy/immunity/interrupt tracking.
     * @param {object} [options]
     * @returns {object}
     */
    function buildTarget(options = {})
    {
      const {
        busy = true,
        inFlightSkill = buildSkillRow(sandbox, '<castTime:60>'),
        immune = false,
      } = options;

      const calls = [];
      return {
        isCastingOrChanneling: () => busy,
        getDecidedAction: () => (inFlightSkill ? [ { getBaseSkill: () => inFlightSkill } ] : null),
        getBattler: () => ({ isImmuneToInterrupt: () => immune }),
        interrupt(magnifier, isSelf)
        {
          calls.push({ magnifier, isSelf });
        },
        __interruptCalls: calls,
      };
    }

    it('does nothing when the target is not casting or channeling', () =>
    {
      const engine = buildEngine();
      const target = buildTarget({ busy: false });
      const action = buildAction(sandbox, buildSkillRow(sandbox, '<interrupt:200>'));

      engine.checkInterrupt(action, target);

      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('does nothing when the attacking skill carries no <interrupt> tag', () =>
    {
      const engine = buildEngine();
      const target = buildTarget();
      const action = buildAction(sandbox, buildSkillRow(sandbox, '<knockback:4>'));

      engine.checkInterrupt(action, target);

      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('interrupts with the attacking skill\'s magnifier when nothing blocks it', () =>
    {
      const engine = buildEngine();
      const target = buildTarget();
      const action = buildAction(sandbox, buildSkillRow(sandbox, '<interrupt:200>'));

      engine.checkInterrupt(action, target);

      expect(target.__interruptCalls).toEqual([ { magnifier: 200, isSelf: false } ]);
    });

    it('is blocked by <thisCannotBeInterrupted> on the target\'s own in-flight skill', () =>
    {
      const engine = buildEngine();
      const target = buildTarget({ inFlightSkill: buildSkillRow(sandbox, '<thisCannotBeInterrupted>') });
      const action = buildAction(sandbox, buildSkillRow(sandbox, '<interrupt:200>'));

      engine.checkInterrupt(action, target);

      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('is blocked by battler-wide <cannotBeInterrupted> immunity', () =>
    {
      const engine = buildEngine();
      const target = buildTarget({ immune: true });
      const action = buildAction(sandbox, buildSkillRow(sandbox, '<interrupt:200>'));

      engine.checkInterrupt(action, target);

      expect(target.__interruptCalls).toHaveLength(0);
    });
  });
});
//endregion plugins/abs/core/channeling-interrupt.test.js
