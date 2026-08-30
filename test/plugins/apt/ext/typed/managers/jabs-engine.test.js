//region plugins/apt/ext/typed/managers/jabs-engine.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_Engine ext/typed augments (direct src import)', () =>
{
  let JABS_Engine;
  let ApTypeKey;
  let ApTypeGrant;

  beforeAll(async () =>
  {
    vi.resetModules();

    // the whole source file is gated behind `if (J.ABS)` at module-load time.
    globalThis.J = {
      ABS: true,
      LOG: false,
      APT: {
        EXT: {
          TYPED: {
            Aliased: { JABS_Engine: new Map() },
            Metadata: { ImplicitEnemyElementPercent: 0 },
          },
        },
      },
    };

    ({ default: ApTypeKey } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js'));
    ({ default: ApTypeGrant } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeGrant.js'));

    function StubJABS_Engine()
    {
    }

    StubJABS_Engine.prototype.gainAptitudeReward = vi.fn();
    globalThis.JABS_Engine = StubJABS_Engine;

    globalThis.JABS_AiManager = { getBattlerByUuid: vi.fn() };
    globalThis.ApManager = { gainTypedAp: vi.fn(), apTypeDisplay: vi.fn() };

    await import('../../../../../../src/plugins/apt/ext/typed/managers/JABS_Engine.js');
    ({ JABS_Engine } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent = 0;
    globalThis.$gameParty = { members: vi.fn().mockReturnValue([]) };
  });

  function makeEnemy({ explicitTyped = [], inferredTypes = [] } = {})
  {
    return {
      enemy: () => ({
        typedApRewards: () => explicitTyped,
        inferredTypedElements: () => inferredTypes,
      }),
    };
  }

  describe('gainAptitudeReward', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const enemy = makeEnemy();

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(globalThis.J.APT.EXT.TYPED.Aliased.JABS_Engine.get('gainAptitudeReward')).toHaveBeenCalledWith(10, {}, enemy);
    });

    it('does nothing further when there are no explicit or inferred typed rewards', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const enemy = makeEnemy();

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(globalThis.$gameParty.members).not.toHaveBeenCalled();
    });

    it('does nothing further when inferred types exist but the implicit percent is zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const enemy = makeEnemy({ inferredTypes: [ new ApTypeKey('element', 1) ] });
      globalThis.J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent = 0;

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(globalThis.$gameParty.members).not.toHaveBeenCalled();
    });

    it('does nothing further when the implicit percent is set but nothing was inferred', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const enemy = makeEnemy();
      globalThis.J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent = 50;

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      // the mirror of the case above- a willingness to award implicit AP is worth nothing when the
      // enemy's traits imply no element alignment to award it for.
      expect(globalThis.$gameParty.members).not.toHaveBeenCalled();
    });

    it('distributes typed rewards to eligible party members when explicit rewards exist', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(true);
      engine.distributeTypedAptitudeRewardsForMember = vi.fn();
      const member = {};
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      const explicitTyped = [ new ApTypeGrant(5, 'element', 1) ];
      const enemy = makeEnemy({ explicitTyped });

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(engine.distributeTypedAptitudeRewardsForMember).toHaveBeenCalledWith(member, 10, enemy, explicitTyped, [], 0);
    });

    it('distributes on inferred types alone, with no explicit rewards authored at all', () =>
    {
      // Arrange- inferred element AP is the whole point of the implicit percent knob: an enemy that
      // was never given explicit `<apType:...>` lines still teaches whatever it is aligned with.
      // Every other distribution test here pairs inferred types with an explicit grant, which lets
      // the explicit half carry the gate on its own.
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(true);
      engine.distributeTypedAptitudeRewardsForMember = vi.fn();
      const member = {};
      globalThis.$gameParty.members.mockReturnValue([ member ]);
      const inferredTypes = [ new ApTypeKey('element', 1) ];
      const enemy = makeEnemy({ inferredTypes });
      globalThis.J.APT.EXT.TYPED.Metadata.ImplicitEnemyElementPercent = 25;

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(engine.distributeTypedAptitudeRewardsForMember)
        .toHaveBeenCalledWith(member, 10, enemy, [], inferredTypes, 25);
    });

    it('skips a member who fails the canGainAptitudeReward check', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.canGainAptitudeReward = vi.fn().mockReturnValue(false);
      engine.distributeTypedAptitudeRewardsForMember = vi.fn();
      globalThis.$gameParty.members.mockReturnValue([ {} ]);
      const enemy = makeEnemy({ explicitTyped: [ new ApTypeGrant(5, 'element', 1) ] });

      // Act
      engine.gainAptitudeReward(10, {}, enemy);

      // Assert
      expect(engine.distributeTypedAptitudeRewardsForMember).not.toHaveBeenCalled();
    });
  });

  describe('distributeTypedAptitudeRewardsForMember', () =>
  {
    it('does nothing when the member has no associated JABS battler', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      const member = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(null);
      const grant = new ApTypeGrant(5, 'element', 1);

      // Act
      engine.distributeTypedAptitudeRewardsForMember(member, 10, {}, [ grant ], [], 0);

      // Assert
      expect(globalThis.ApManager.gainTypedAp).not.toHaveBeenCalled();
    });

    it('applies each explicit typed grant, scaled by the reward multiplier', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(2);
      engine.onTypedApGained = vi.fn();
      engine.createLogApTyped = vi.fn();
      const character = {};
      const jabsBattler = { getCharacter: () => character };
      const member = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue(jabsBattler);
      const grant = new ApTypeGrant(5, 'element', 1);

      // Act
      engine.distributeTypedAptitudeRewardsForMember(member, 10, {}, [ grant ], [], 0);

      // Assert
      expect(globalThis.ApManager.gainTypedAp).toHaveBeenCalledWith(member, 10, 'element', 1, 'on-kill:typed:explicit');
      expect(engine.onTypedApGained).toHaveBeenCalledWith(10, character, new ApTypeKey('element', 1));
      expect(engine.createLogApTyped).toHaveBeenCalledWith(10, jabsBattler, new ApTypeKey('element', 1));
    });

    it('does not apply inferred types when the implicit percent is zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(1);
      const member = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });
      const inferredKey = new ApTypeKey('element', 1);

      // Act
      engine.distributeTypedAptitudeRewardsForMember(member, 10, {}, [], [ inferredKey ], 0);

      // Assert
      expect(globalThis.ApManager.gainTypedAp).not.toHaveBeenCalled();
    });

    it('applies a percent-scaled bonus for each inferred enemy type when the percent is nonzero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(1);
      engine.onTypedApGained = vi.fn();
      engine.createLogApTyped = vi.fn();
      const member = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });
      const inferredKey = new ApTypeKey('element', 1);

      // Act
      // baseActualAp = ceil(10 * 1) = 10; bonus = ceil(10 * 50 / 100) = 5.
      engine.distributeTypedAptitudeRewardsForMember(member, 10, {}, [], [ inferredKey ], 50);

      // Assert
      expect(globalThis.ApManager.gainTypedAp).toHaveBeenCalledWith(member, 5, 'element', 1, 'on-kill:typed:inferred-enemy');
    });

    it('does not apply an inferred bonus that rounds down to zero', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      engine.getRewardScalingMultiplier = vi.fn().mockReturnValue(1);
      const member = { getUuid: () => 'uuid-1' };
      globalThis.JABS_AiManager.getBattlerByUuid.mockReturnValue({ getCharacter: () => ({}) });
      const inferredKey = new ApTypeKey('element', 1);

      // Act
      // baseActualAp = ceil(0 * 1) = 0; bonus = ceil(0 * 50 / 100) = 0, so it's skipped.
      engine.distributeTypedAptitudeRewardsForMember(member, 0, {}, [], [ inferredKey ], 50);

      // Assert
      expect(globalThis.ApManager.gainTypedAp).not.toHaveBeenCalled();
    });
  });

  describe('onTypedApGained', () =>
  {
    it('is a no-op default hook meant for optional extension', () =>
    {
      // Arrange
      const engine = new JABS_Engine();

      // Act/Assert (no throw)
      expect(() => engine.onTypedApGained(5, {}, new ApTypeKey('element', 1))).not.toThrow();
    });
  });

  describe('createLogApTyped', () =>
  {
    it('does not log when J.LOG is disabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = false;
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };

      // Act
      engine.createLogApTyped(5, { battlerName: () => 'Hero' }, new ApTypeKey('element', 1));

      // Assert
      expect(globalThis.$mapLogs.action.addLog).not.toHaveBeenCalled();
    });

    it('builds and adds a typed log entry with the resolved display name/icon when J.LOG is enabled', () =>
    {
      // Arrange
      const engine = new JABS_Engine();
      globalThis.J.LOG = true;
      globalThis.ApManager.apTypeDisplay.mockReturnValue({ name: 'Fire', icon: 64 });
      globalThis.$mapLogs = { action: { addLog: vi.fn() } };
      let capturedMessage;
      globalThis.ActionLogBuilder = function()
      {
        this.setMessage = vi.fn(msg =>
        {
          capturedMessage = msg;
          return this;
        });
        this.build = vi.fn(() => capturedMessage);
      };

      // Act
      engine.createLogApTyped(5, { battlerName: () => 'Hero' }, new ApTypeKey('element', 1));

      // Assert
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith(expect.stringContaining('Fire'));
      expect(globalThis.$mapLogs.action.addLog).toHaveBeenCalledWith(expect.stringContaining('\\i[64]'));
    });
  });
});
//endregion plugins/apt/ext/typed/managers/jabs-engine.test.js
