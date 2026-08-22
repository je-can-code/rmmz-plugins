//region plugins/sdp/core/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/sdp augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    // the whole source file is gated behind `if (J.ABS)` at module-load time.
    globalThis.J = { ABS: true, LOG: false, SDP: { Aliased: { JABS_Engine: new Map() } } };

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.gainBasicRewards = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    await import('../../../../../src/plugins/sdp/core/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.LOG = false;
  });

  describe('gainBasicRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.determineSdpGained = vi.fn().mockReturnValue(0);
      const enemy = {};
      const actor = {};

      // Act
      engine.gainBasicRewards(enemy, actor);

      // Assert
      expect(globalThis.J.SDP.Aliased.JABS_Engine.get('gainBasicRewards')).toHaveBeenCalledWith(enemy, actor);
    });

    it('does nothing further when no sdp points were determined', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.determineSdpGained = vi.fn().mockReturnValue(0);
      engine.gainSdpReward = vi.fn();

      // Act
      engine.gainBasicRewards({}, {});

      // Assert
      expect(engine.gainSdpReward).not.toHaveBeenCalled();
    });

    it('gains and logs the sdp reward when points were determined', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.determineSdpGained = vi.fn().mockReturnValue(6);
      engine.gainSdpReward = vi.fn();
      engine.createSdpLog = vi.fn();
      const enemy = {};
      const actor = {};

      // Act
      engine.gainBasicRewards(enemy, actor);

      // Assert
      expect(engine.gainSdpReward).toHaveBeenCalledWith(6, actor);
      expect(engine.createSdpLog).toHaveBeenCalledWith(6, actor);
    });
  });

  describe('determineSdpGained', () =>
  {
    it('returns 0 when the reward policy gate rejects the reward', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn().mockReturnValue(false);
      const actor = { getBattler: () => ({}) };
      const enemy = { sdpPoints: vi.fn().mockReturnValue(10) };

      // Act
      const result = engine.determineSdpGained(enemy, actor);

      // Assert
      expect(result).toEqual(0);
    });

    it('returns 0 when the enemy grants no base sdp points', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn().mockReturnValue(true);
      const actor = { getBattler: () => ({}) };
      const enemy = { sdpPoints: vi.fn().mockReturnValue(0) };

      // Act
      const result = engine.determineSdpGained(enemy, actor);

      // Assert
      expect(result).toEqual(0);
    });

    it('returns the scaled and rounded-up sdp points when eligible', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn().mockReturnValue(true);
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(1.2);
      const actor = { getBattler: () => ({}) };
      const enemy = { sdpPoints: vi.fn().mockReturnValue(10) };

      // Act
      const result = engine.determineSdpGained(enemy, actor);

      // Assert
      expect(result).toEqual(12);
    });
  });

  describe('gainSdpReward', () =>
  {
    it('does nothing when sdpPoints is zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.onSdpRewardGranted = vi.fn();
      const actor = { getBattler: vi.fn() };

      // Act
      engine.gainSdpReward(0, actor);

      // Assert
      expect(actor.getBattler).not.toHaveBeenCalled();
      expect(engine.onSdpRewardGranted).not.toHaveBeenCalled();
    });

    it('grants points to every party member and notifies with the defeating actor\'s final amount', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.onSdpRewardGranted = vi.fn();
      const defeatingBattler = { modSdpPoints: vi.fn().mockReturnValue(15) };
      const otherMember = { modSdpPoints: vi.fn().mockReturnValue(9) };
      const character = {};
      const actor = { getBattler: () => defeatingBattler, getCharacter: () => character };
      // the defeating battler is deliberately not last in the party: whichever member is visited
      // last would otherwise leave its own amount behind, and the identity check would go unproven.
      globalThis.$gameParty = { members: vi.fn().mockReturnValue([ defeatingBattler, otherMember ]) };

      // Act
      engine.gainSdpReward(10, actor);

      // Assert
      expect(otherMember.modSdpPoints).toHaveBeenCalledWith(10);
      expect(defeatingBattler.modSdpPoints).toHaveBeenCalledWith(10);
      expect(engine.onSdpRewardGranted).toHaveBeenCalledWith(15, character);
    });
  });

  describe('onSdpRewardGranted/onSdpPanelUnlocked', () =>
  {
    it('are no-op default hooks meant for optional extension', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act/Assert (no throw)
      expect(() => engine.onSdpRewardGranted(5, {})).not.toThrow();
      expect(() => engine.onSdpPanelUnlocked('panel-1', {})).not.toThrow();
    });
  });

  describe('createSdpLog', () =>
  {
    it('does not log when J.LOG is disabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = false;
      globalThis.$actionLogManager = { addLog: vi.fn() };

      // Act
      engine.createSdpLog(5, { battlerName: () => 'Hero' });

      // Assert
      expect(globalThis.$actionLogManager.addLog).not.toHaveBeenCalled();
    });

    it('builds and adds an sdp-acquired log entry when J.LOG is enabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = true;
      globalThis.$actionLogManager = { addLog: vi.fn() };
      globalThis.ActionLogBuilder = function()
      {
        this.setupSdpAcquired = vi.fn().mockReturnThis();
        this.build = vi.fn().mockReturnValue('built-sdp-log');
      };

      // Act
      engine.createSdpLog(5, { battlerName: () => 'Hero' });

      // Assert
      expect(globalThis.$actionLogManager.addLog).toHaveBeenCalledWith('built-sdp-log');
    });
  });

  describe('createSdpUnlockLog', () =>
  {
    it('does not log when J.LOG is disabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = false;
      globalThis.$actionLogManager = { addLog: vi.fn() };

      // Act
      engine.createSdpUnlockLog('panel-1');

      // Assert
      expect(globalThis.$actionLogManager.addLog).not.toHaveBeenCalled();
    });

    it('builds and adds an sdp-unlocked log entry when J.LOG is enabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = true;
      globalThis.$actionLogManager = { addLog: vi.fn() };
      globalThis.ActionLogBuilder = function()
      {
        this.setupSdpUnlocked = vi.fn().mockReturnThis();
        this.build = vi.fn().mockReturnValue('built-unlock-log');
      };

      // Act
      engine.createSdpUnlockLog('panel-1');

      // Assert
      expect(globalThis.$actionLogManager.addLog).toHaveBeenCalledWith('built-unlock-log');
    });
  });
});
//endregion plugins/sdp/core/managers/jabs-engine.test.js
