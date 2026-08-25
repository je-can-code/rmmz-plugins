//region plugins/apt/core/_models/jabs-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/apt-core augments (direct src import)', () =>
{
  let JABS_Engine;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: true, APT: { Aliased: { JABS_Engine: new Map() } } };

    // the source file imports the real core ApManager for gainAp; mock it so this test only
    // exercises the JABS_Engine augment's own branching, not ApManager's.
    vi.doMock('../../../../../src/plugins/apt/core/managers/ApManager.js', () => ({
      default: { gainAp: vi.fn() },
    }));

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.gainBasicRewards = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    globalThis.J.LOG = false;

    ({ default: globalThis.ApManager } = await import('../../../../../src/plugins/apt/core/managers/ApManager.js'));

    await import('../../../../../src/plugins/apt/core/_models/JABS_Battler.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameParty = { members: vi.fn().mockReturnValue([]) };
  });

  describe('gainBasicRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.determineApGained = vi.fn().mockReturnValue(0);
      const enemy = {};
      const actor = {};

      // Act
      engine.gainBasicRewards(enemy, actor);

      // Assert
      expect(globalThis.J.APT.Aliased.JABS_Engine.get('gainBasicRewards')).toHaveBeenCalledWith(enemy, actor);
    });

    it('gains aptitude reward using the AP determined from the defeated enemy', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.determineApGained = vi.fn().mockReturnValue(7);
      engine.gainAptitudeReward = vi.fn();
      const enemy = {};
      const actor = {};

      // Act
      engine.gainBasicRewards(enemy, actor);

      // Assert
      expect(engine.gainAptitudeReward).toHaveBeenCalledWith(7, actor, enemy);
    });
  });

  describe('determineApGained', () =>
  {
    it('returns 0 when the reward policy gate rejects the reward', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn().mockReturnValue(false);
      const enemy = { apPoints: vi.fn().mockReturnValue(10) };

      // Act
      const result = engine.determineApGained(enemy);

      // Assert
      expect(result).toEqual(0);
      expect(enemy.apPoints).not.toHaveBeenCalled();
    });

    it('returns the enemy apPoints when the reward policy gate allows it', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainReward = vi.fn().mockReturnValue(true);
      const enemy = { apPoints: vi.fn().mockReturnValue(10) };

      // Act
      const result = engine.determineApGained(enemy);

      // Assert
      expect(result).toEqual(10);
    });
  });

  describe('gainAptitudeReward', () =>
  {
    it('does nothing when the AP amount is zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act
      engine.gainAptitudeReward(0, {}, {});

      // Assert
      expect(globalThis.$gameParty.members).not.toHaveBeenCalled();
    });

    it('skips a member that fails the canGainAptitudeReward check', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(false);
      globalThis.$gameParty.members.mockReturnValue([ {} ]);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      expect(globalThis.JABS_AiManager.getBattlerByUuid).not.toHaveBeenCalled();
    });

    it('skips a qualifying member with no associated JABS battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(true);
      const member = { getUuid: () => 'uuid-1' };
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);

      // Act/Assert (no throw)
      expect(() => engine.gainAptitudeReward(10, {}, {})).not.toThrow();
      expect(globalThis.ApManager.gainAp).not.toHaveBeenCalled();
    });

    it('awards scaled AP via ApManager and logs it for a qualifying member', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(true);
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(1.5);
      engine.createLogAp = vi.fn();
      const member = { getUuid: () => 'uuid-1' };
      const jabsBattler = {};
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      engine.gainAptitudeReward(10, {}, {});

      // Assert
      expect(globalThis.ApManager.gainAp).toHaveBeenCalledWith(member, 15, 'on-kill');
      expect(engine.createLogAp).toHaveBeenCalledWith(15, jabsBattler);
    });
  });

  describe('canGainAptitudeReward', () =>
  {
    it('allows the reward when J.LEVEL is not in use', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LEVEL = false;
      const actor = { level: 1 };
      const enemy = { level: 99 };

      // Act
      const result = engine.canGainAptitudeReward(actor, enemy);

      // Assert
      expect(result).toEqual(true);
    });

    it('rejects the reward when level scaling is enabled and the level gap exceeds the threshold', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LEVEL = true;
      globalThis.J.APT.Metadata = { usingLevelThresholdLimit: true, maxLevelThreshold: 5 };
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      const actor = { level: 20 };
      const enemy = { level: 1 };

      // Act
      const result = engine.canGainAptitudeReward(actor, enemy);

      // Assert
      expect(result).toEqual(false);
    });

    it('ignores the level gap entirely when the threshold limit is switched off', () =>
    {
      // Arrange- level scaling being on is not the same as the AP threshold being in use; they are
      // separate knobs, and a player running scaled levels without the aptitude ceiling must still
      // earn AP from anything they can kill. The threshold is a real number here rather than the
      // unbounded sentinel, so the gap genuinely exceeds it and only the flag holds the gate open.
      const engine = new JABS_Engine();
      globalThis.J.LEVEL = true;
      globalThis.J.APT.Metadata = { usingLevelThresholdLimit: false, maxLevelThreshold: 5 };
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      const actor = { level: 20 };
      const enemy = { level: 1 };

      // Act
      const result = engine.canGainAptitudeReward(actor, enemy);

      // Assert
      expect(result).toEqual(true);
    });

    it('allows the reward when the level gap is within the threshold', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LEVEL = true;
      globalThis.J.APT.Metadata = { usingLevelThresholdLimit: true, maxLevelThreshold: 5 };
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      const actor = { level: 4 };
      const enemy = { level: 1 };

      // Act
      const result = engine.canGainAptitudeReward(actor, enemy);

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('createLogAp', () =>
  {
    it('does not log when J.LOG is disabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = false;
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };

      // Act
      engine.createLogAp(5, { battlerName: () => 'Hero' });

      // Assert
      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });

    it('builds and adds a log entry when J.LOG is enabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = true;
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
      globalThis.ActionLogBuilder = function()
      {
        this.setMessage = vi.fn().mockReturnThis();
        this.build = vi.fn().mockReturnValue('built-log');
      };

      // Act
      engine.createLogAp(5, { battlerName: () => 'Hero' });

      // Assert
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith('built-log');
    });
  });
});
//endregion plugins/apt/core/_models/jabs-battler.test.js
