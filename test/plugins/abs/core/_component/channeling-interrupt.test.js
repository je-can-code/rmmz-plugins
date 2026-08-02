//region plugins/abs/core/_component/channeling-interrupt.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal note-source stub carrying the given tag string, backed by the real
 * RPG_Skill prototype so the channel/interrupt getters parse for real.
 * @param {string} note
 * @returns {object}
 */
function buildSkillRow(note)
{
  const row = Object.create(globalThis.RPG_Skill.prototype);
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
 * @param {object} skill The backing skill row.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildAction(skill, overrides = {})
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
 * borrowing the real prototype methods under test directly from the real class.
 * @param {string[]} [notes] Battler-wide note sources for immunity checks.
 * @returns {object}
 */
function buildJabsBattler(notes = [])
{
  const proto = globalThis.JABS_Battler.prototype;

  return {
    _casting: false,
    _castTimeCountdown: 0,
    _channeling: false,
    _channelSkillId: 0,
    _channelTickCountdown: 0,
    _channelDurationRemaining: 0,
    _channelSourceAction: null,
    channelSourceAction: proto.channelSourceAction,
    setChannelSourceAction: proto.setChannelSourceAction,
    channelSkillId: proto.channelSkillId,
    setChannelSkillId: proto.setChannelSkillId,
    channelDurationRemaining: proto.channelDurationRemaining,
    setChannelDurationRemaining: proto.setChannelDurationRemaining,
    channelTickCountdown: proto.channelTickCountdown,
    setChannelTickCountdown: proto.setChannelTickCountdown,
    setChanneling: proto.setChanneling,
    setCasting: proto.setCasting,
    castTimeCountdown: proto.castTimeCountdown,
    _decidedAction: null,
    getUuid: () => 'test-uuid',
    getBattler: () => ({
      getAllNotes: () => notes.map(note => buildSkillRow(note)),
      isImmuneToInterrupt: globalThis.Game_Battler.prototype.isImmuneToInterrupt,
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

describe('J-ABS channeling and interruption (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_Skill } = await import('../../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));

    // RPG_UsableItem.js (abs) patches this bare global's prototype- must be the same module instance
    // RPG_Skill extends, so jabsInterruptMagnifier lands on RPG_Skill's real prototype chain.
    ({ default: globalThis.RPG_UsableItem } = await import('../../../../../src/plugins/_base/database/core/RPG_UsableItem.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.RPG_Skill.prototype with the channel/onChannelComplete tag getters.
    await import('../../../../../src/plugins/abs/core/database/RPG_Skill.js');

    // patches globalThis.RPG_UsableItem.prototype with jabsInterruptMagnifier and other shared tags.
    await import('../../../../../src/plugins/abs/core/database/RPG_UsableItem.js');

    // patches globalThis.Game_Battler.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Battler.js');

    // the real JABS_Battler/JABS_Engine classes- not prototype patches, but genuine classes with
    // beginChannel/processChannelingTimer/interrupt/checkInterrupt defined directly in their bodies.
    ({ default: globalThis.JABS_Battler } = await import('../../../../../src/plugins/abs/core/models/JABS_Battler.js'));
    ({ default: globalThis.JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();

    // the real plugin script declares `$jabsEngine` itself (starting out null), clobbering
    // whatever the harness's stub set it to- so (re)build the whole global fresh per test with
    // call-tracking mocks for everything channeling/interruption touches.
    globalThis.$jabsEngine = {
      __forceMapActionCalls: [],
      forceMapAction(caster, skillId, isRetaliation, targetX, targetY)
      {
        globalThis.$jabsEngine.__forceMapActionCalls.push({ skillId, targetX, targetY });
      },

      __paySkillCostsCalls: [],
      paySkillCosts(caster, action)
      {
        globalThis.$jabsEngine.__paySkillCostsCalls.push(action);
      },

      __logSkillExecutionCalls: [],
      logSkillExecution(uuid, skillId, stypeId)
      {
        globalThis.$jabsEngine.__logSkillExecutionCalls.push({ uuid, skillId, stypeId });
      },

      __applyCooldownCountersCalls: [],
      applyCooldownCounters(caster, action)
      {
        globalThis.$jabsEngine.__applyCooldownCountersCalls.push(action);
      },

      __applyCooldownValueForSkillCalls: [],
      applyCooldownValueForSkill(caster, action, cooldownValue)
      {
        globalThis.$jabsEngine.__applyCooldownValueForSkillCalls.push({ action, cooldownValue });
      },
    };
  });

  describe('RPG_Skill/RPG_UsableItem tag getters', () =>
  {
    it('jabsChannel parses the [skillId, duration] pair', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>');

      // Act
      const result = skill.jabsChannel;

      // Assert
      expect(result).toEqual([ 25, 180 ]);
    });

    it('jabsChannel defaults to an empty array when absent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<castTime:60>');

      // Act
      const result = skill.jabsChannel;

      // Assert
      expect(result).toEqual([]);
    });

    it('jabsChannelTickSpeed reads an explicit override', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channelTickSpeed:15>');

      // Act
      const result = skill.jabsChannelTickSpeed;

      // Assert
      expect(result).toBe(15);
    });

    it('jabsChannelTickSpeed falls back to the plugin default when omitted', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>');

      // Act
      const result = skill.jabsChannelTickSpeed;

      // Assert
      expect(result).toBe(globalThis.J.ABS.Metadata.DefaultChannelTickSpeed);
    });

    it('jabsOnChannelComplete parses a single skill id', () =>
    {
      // Arrange
      const skill = buildSkillRow('<onChannelComplete:[36]>');

      // Act
      const result = skill.jabsOnChannelComplete;

      // Assert
      expect(result).toEqual([ 36 ]);
    });

    it('jabsOnChannelComplete parses multiple skill ids', () =>
    {
      // Arrange
      const skill = buildSkillRow('<onChannelComplete:[36, 37, 38]>');

      // Act
      const result = skill.jabsOnChannelComplete;

      // Assert
      expect(result).toEqual([ 36, 37, 38 ]);
    });

    it('jabsOnChannelComplete defaults to an empty array when absent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>');

      // Act
      const result = skill.jabsOnChannelComplete;

      // Assert
      expect(result).toEqual([]);
    });

    it('jabsCannotMoveToInterrupt is true when tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<cannotMoveToInterrupt>');

      // Act
      const result = skill.jabsCannotMoveToInterrupt;

      // Assert
      expect(result).toBe(true);
    });

    it('jabsCannotMoveToInterrupt is false when not tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<castTime:60>');

      // Act
      const result = skill.jabsCannotMoveToInterrupt;

      // Assert
      expect(result).toBe(false);
    });

    it('jabsThisCannotBeInterrupted is true when tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<thisCannotBeInterrupted>');

      // Act
      const result = skill.jabsThisCannotBeInterrupted;

      // Assert
      expect(result).toBe(true);
    });

    it('jabsThisCannotBeInterrupted is false when not tagged', () =>
    {
      // Arrange
      const skill = buildSkillRow('<castTime:60>');

      // Act
      const result = skill.jabsThisCannotBeInterrupted;

      // Assert
      expect(result).toBe(false);
    });

    it('jabsInterruptMagnifier reads the tagged percent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<interrupt:200>');

      // Act
      const result = skill.jabsInterruptMagnifier;

      // Assert
      expect(result).toBe(200);
    });

    it('jabsInterruptMagnifier defaults to 0 (no interrupt capability) when absent', () =>
    {
      // Arrange
      const skill = buildSkillRow('<knockback:4>');

      // Act
      const result = skill.jabsInterruptMagnifier;

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('Game_Battler.isImmuneToInterrupt', () =>
  {
    it('is true when any note source carries <cannotBeInterrupted>', () =>
    {
      // Arrange
      const notes = [ buildSkillRow('<cannotBeInterrupted>') ];
      const battler = { getAllNotes: () => notes };

      // Act
      const result = globalThis.Game_Battler.prototype.isImmuneToInterrupt.call(battler);

      // Assert
      expect(result).toBe(true);
    });

    it('is false when no note source carries the tag', () =>
    {
      // Arrange
      const notes = [ buildSkillRow('<knockback:4>') ];
      const battler = { getAllNotes: () => notes };

      // Act
      const result = globalThis.Game_Battler.prototype.isImmuneToInterrupt.call(battler);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('beginChannel', () =>
  {
    it('pays cost once, logs the execution, and begins channeling without firing an immediate tick', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();

      // Act
      battler.beginChannel(action);

      // Assert
      expect(globalThis.$jabsEngine.__paySkillCostsCalls).toHaveLength(1);
      expect(globalThis.$jabsEngine.__logSkillExecutionCalls).toHaveLength(1);
      expect(battler.isChanneling()).toBe(true);
      expect(battler.getChannelDurationRemaining()).toBe(180);
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toHaveLength(0);
    });
  });

  describe('processChannelingTimer', () =>
  {
    it('does not fire the child skill before the tick interval elapses', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act- 29 frames: not yet a tick.
      for (let i = 0; i < 29; i++) battler.processChannelingTimer();

      // Assert
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toHaveLength(0);
    });

    it('fires the child skill at the frozen target location once the tick interval elapses', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);
      for (let i = 0; i < 29; i++) battler.processChannelingTimer();

      // Act- the 30th frame fires the first tick.
      battler.processChannelingTimer();

      // Assert
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
      ]);
    });

    it('fires exactly floor(duration / tickSpeed) ticks over the full duration', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act
      for (let i = 0; i < 180; i++) battler.processChannelingTimer();

      // Assert
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toHaveLength(6);
      expect(battler.isChanneling()).toBe(false);
    });

    it('fires the <onChannelComplete> payoff exactly once, only on natural completion', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 60]>\n<channelTickSpeed:30>\n<onChannelComplete:[36]>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act
      for (let i = 0; i < 60; i++) battler.processChannelingTimer();

      // Assert- 2 ticks of skill 25, then 1 payoff execution of skill 36.
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
        { skillId: 25, targetX: 7, targetY: 9 },
        { skillId: 36, targetX: 7, targetY: 9 },
      ]);
      expect(globalThis.$jabsEngine.__applyCooldownCountersCalls).toHaveLength(1);
    });

    it('does not fire any payoff when the skill omits <onChannelComplete>', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 30]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act
      for (let i = 0; i < 30; i++) battler.processChannelingTimer();

      // Assert
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toEqual([
        { skillId: 25, targetX: 7, targetY: 9 },
      ]);
    });
  });

  describe('interrupt', () =>
  {
    it('does nothing when the battler is neither casting nor channeling', () =>
    {
      // Arrange
      const battler = buildJabsBattler();

      // Act
      battler.interrupt(200, false);

      // Assert
      expect(globalThis.$jabsEngine.__applyCooldownValueForSkillCalls).toHaveLength(0);
    });

    it('self-interrupt (moving) applies the full effective cooldown, regardless of magnifier', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill, { getCooldown: () => 75 });
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act
      battler.interrupt(200, true);

      // Assert
      expect(battler.isChanneling()).toBe(false);
      expect(globalThis.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 75 },
      ]);
      // no payoff, no further ticks: interrupting is not natural completion.
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toHaveLength(0);
      expect(globalThis.$jabsEngine.__applyCooldownCountersCalls).toHaveLength(0);
    });

    it('external interrupt scales the cooldown penalty by the magnifier (75 * 200% = 150)', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill, { getCooldown: () => 75 });
      const battler = buildJabsBattler();
      battler.beginChannel(action);

      // Act
      battler.interrupt(200, false);

      // Assert
      expect(globalThis.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 150 },
      ]);
    });

    it('interrupting a cast discards the decided action so it never executes', () =>
    {
      // Arrange
      const skill = buildSkillRow('<castTime:60>');
      const action = buildAction(skill, { getCooldown: () => 40 });
      const battler = buildJabsBattler();
      battler._casting = true;
      battler._castTimeCountdown = 30;
      battler.setDecidedAction([ action ]);

      // Act
      battler.interrupt(100, false);

      // Assert
      expect(battler.isCasting()).toBe(false);
      expect(battler.isActionDecided()).toBe(false);
      expect(globalThis.$jabsEngine.__applyCooldownValueForSkillCalls).toEqual([
        { action, cooldownValue: 40 },
      ]);
    });

    it('already-fired ticks stand when a channel is interrupted mid-way', () =>
    {
      // Arrange
      const skill = buildSkillRow('<channel:[25, 180]>\n<channelTickSpeed:30>');
      const action = buildAction(skill);
      const battler = buildJabsBattler();
      battler.beginChannel(action);
      for (let i = 0; i < 30; i++) battler.processChannelingTimer();

      // Act
      battler.interrupt(100, true);

      // Assert- the one tick that already fired is not undone, but no more follow.
      expect(globalThis.$jabsEngine.__forceMapActionCalls).toHaveLength(1);
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
      return { checkInterrupt: globalThis.JABS_Engine.prototype.checkInterrupt };
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
        inFlightSkill = buildSkillRow('<castTime:60>'),
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
      // Arrange
      const engine = buildEngine();
      const target = buildTarget({ busy: false });
      const action = buildAction(buildSkillRow('<interrupt:200>'));

      // Act
      engine.checkInterrupt(action, target);

      // Assert
      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('does nothing when the attacking skill carries no <interrupt> tag', () =>
    {
      // Arrange
      const engine = buildEngine();
      const target = buildTarget();
      const action = buildAction(buildSkillRow('<knockback:4>'));

      // Act
      engine.checkInterrupt(action, target);

      // Assert
      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('interrupts with the attacking skill\'s magnifier when nothing blocks it', () =>
    {
      // Arrange
      const engine = buildEngine();
      const target = buildTarget();
      const action = buildAction(buildSkillRow('<interrupt:200>'));

      // Act
      engine.checkInterrupt(action, target);

      // Assert
      expect(target.__interruptCalls).toEqual([ { magnifier: 200, isSelf: false } ]);
    });

    it('is blocked by <thisCannotBeInterrupted> on the target\'s own in-flight skill', () =>
    {
      // Arrange
      const engine = buildEngine();
      const target = buildTarget({ inFlightSkill: buildSkillRow('<thisCannotBeInterrupted>') });
      const action = buildAction(buildSkillRow('<interrupt:200>'));

      // Act
      engine.checkInterrupt(action, target);

      // Assert
      expect(target.__interruptCalls).toHaveLength(0);
    });

    it('is blocked by battler-wide <cannotBeInterrupted> immunity', () =>
    {
      // Arrange
      const engine = buildEngine();
      const target = buildTarget({ immune: true });
      const action = buildAction(buildSkillRow('<interrupt:200>'));

      // Act
      engine.checkInterrupt(action, target);

      // Assert
      expect(target.__interruptCalls).toHaveLength(0);
    });
  });
});
//endregion plugins/abs/core/_component/channeling-interrupt.test.js
