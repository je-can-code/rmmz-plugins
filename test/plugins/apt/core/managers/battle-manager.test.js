//region plugins/apt/core/managers/battle-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('BattleManager ext/apt augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { APT: { Aliased: { BattleManager: new Map() } } };

    vi.doMock('../../../../../src/plugins/apt/core/managers/ApManager.js', () => ({
      default: { gainAp: vi.fn() },
    }));

    globalThis.BattleManager = {
      makeRewards: vi.fn(),
      gainRewards: vi.fn(),
      displayRewards: vi.fn(),
      _rewards: {},
    };

    ({ default: globalThis.ApManager } = await import('../../../../../src/plugins/apt/core/managers/ApManager.js'));

    await import('../../../../../src/plugins/apt/core/managers/BattleManager.js');

    // J-Base accessors for the vanilla rewards bundle.
    globalThis.BattleManager.rewards = function() { return this._rewards; };
    globalThis.BattleManager.setRewards = function(v) { this._rewards = v; };
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameTroop = { aptitudeApTotal: vi.fn().mockReturnValue(0) };
    globalThis.$gameParty = { members: vi.fn().mockReturnValue([]) };
    globalThis.$gameMessage = { add: vi.fn() };
    globalThis.BattleManager._rewards = {};
  });

  describe('makeRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.BattleManager.makeRewards();

      // Assert
      expect(globalThis.J.APT.Aliased.BattleManager.get('makeRewards')).toHaveBeenCalled();
    });

    it('merges the aptitude AP total into the existing rewards', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { exp: 100 };
      globalThis.$gameTroop.aptitudeApTotal.mockReturnValue(12);

      // Act
      globalThis.BattleManager.makeRewards();

      // Assert
      expect(globalThis.BattleManager._rewards).toEqual({ exp: 100, aptitudeAp: 12 });
    });
  });

  describe('gainRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.BattleManager.gainRewards();

      // Assert
      expect(globalThis.J.APT.Aliased.BattleManager.get('gainRewards')).toHaveBeenCalled();
    });

    it('gains the aptitude AP rewards afterward', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 5 };
      const member = {};
      globalThis.$gameParty.members.mockReturnValue([ member ]);

      // Act
      globalThis.BattleManager.gainRewards();

      // Assert
      expect(globalThis.ApManager.gainAp).toHaveBeenCalledWith(member, 5, 'victory');
    });
  });

  describe('gainAptitudeApRewards', () =>
  {
    it('does nothing when there is no aptitude AP in the rewards', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 0 };
      globalThis.$gameParty.members.mockReturnValue([ {} ]);

      // Act
      globalThis.BattleManager.gainAptitudeApRewards();

      // Assert
      expect(globalThis.ApManager.gainAp).not.toHaveBeenCalled();
    });

    it('awards aptitude AP to every current party member', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 8 };
      const memberA = {};
      const memberB = {};
      globalThis.$gameParty.members.mockReturnValue([ memberA, memberB ]);

      // Act
      globalThis.BattleManager.gainAptitudeApRewards();

      // Assert
      expect(globalThis.ApManager.gainAp).toHaveBeenCalledWith(memberA, 8, 'victory');
      expect(globalThis.ApManager.gainAp).toHaveBeenCalledWith(memberB, 8, 'victory');
    });
  });

  describe('displayRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.BattleManager.displayRewards();

      // Assert
      expect(globalThis.J.APT.Aliased.BattleManager.get('displayRewards')).toHaveBeenCalled();
    });

    it('displays aptitude AP before the original rewards display', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 3 };
      const callOrder = [];
      globalThis.$gameMessage.add.mockImplementation(() => callOrder.push('display'));
      globalThis.J.APT.Aliased.BattleManager.get('displayRewards').mockImplementation(() => callOrder.push('original'));

      // Act
      globalThis.BattleManager.displayRewards();

      // Assert
      expect(callOrder).toEqual([ 'display', 'original' ]);
    });
  });

  describe('displayAptitudeAp', () =>
  {
    it('does not add a message when there is no aptitude AP', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 0 };

      // Act
      globalThis.BattleManager.displayAptitudeAp();

      // Assert
      expect(globalThis.$gameMessage.add).not.toHaveBeenCalled();
    });

    it('adds an AP-gained message to the victory log', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { aptitudeAp: 9 };

      // Act
      globalThis.BattleManager.displayAptitudeAp();

      // Assert
      expect(globalThis.$gameMessage.add).toHaveBeenCalledWith('\\. 9 AP gained');
    });
  });
});
//endregion plugins/apt/core/managers/battle-manager.test.js
