//region plugins/sdp/core/managers/battle-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('BattleManager ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    globalThis.J = { SDP: { Aliased: { BattleManager: new Map() }, Metadata: { victoryText: 'Node Points gained' } } };

    globalThis.BattleManager = {
      makeRewards: vi.fn(),
      gainRewards: vi.fn(),
      displayRewards: vi.fn(),
      _rewards: {},
    };

    await import('../../../../../src/plugins/sdp/core/managers/BattleManager.js');

    // J-Base accessors for the vanilla rewards bundle.
    globalThis.BattleManager.rewards = function() { return this._rewards; };
    globalThis.BattleManager.setRewards = function(v) { this._rewards = v; };
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameTroop = { sdpTotal: vi.fn().mockReturnValue(0) };
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
      expect(globalThis.J.SDP.Aliased.BattleManager.get('makeRewards')).toHaveBeenCalled();
    });

    it('merges the sdp total into the existing rewards', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { exp: 100 };
      globalThis.$gameTroop.sdpTotal.mockReturnValue(15);

      // Act
      globalThis.BattleManager.makeRewards();

      // Assert
      expect(globalThis.BattleManager._rewards).toEqual({ exp: 100, sdp: 15 });
    });
  });

  describe('gainRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange/Act
      globalThis.BattleManager.gainRewards();

      // Assert
      expect(globalThis.J.SDP.Aliased.BattleManager.get('gainRewards')).toHaveBeenCalled();
    });

    it('gains the sdp points afterward', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 5 };
      const member = { modSdpPoints: vi.fn() };
      globalThis.$gameParty.members.mockReturnValue([ member ]);

      // Act
      globalThis.BattleManager.gainRewards();

      // Assert
      expect(member.modSdpPoints).toHaveBeenCalledWith(5);
    });
  });

  describe('gainSdpPoints', () =>
  {
    it('applies the sdp total to every current party member', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 8 };
      const memberA = { modSdpPoints: vi.fn() };
      const memberB = { modSdpPoints: vi.fn() };
      globalThis.$gameParty.members.mockReturnValue([ memberA, memberB ]);

      // Act
      globalThis.BattleManager.gainSdpPoints();

      // Assert
      expect(memberA.modSdpPoints).toHaveBeenCalledWith(8);
      expect(memberB.modSdpPoints).toHaveBeenCalledWith(8);
    });
  });

  describe('displayRewards', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 0 };

      // Act
      globalThis.BattleManager.displayRewards();

      // Assert
      expect(globalThis.J.SDP.Aliased.BattleManager.get('displayRewards')).toHaveBeenCalled();
    });

    it('displays sdp before the original rewards display', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 4 };
      const callOrder = [];
      globalThis.$gameMessage.add.mockImplementation(() => callOrder.push('display'));
      globalThis.J.SDP.Aliased.BattleManager.get('displayRewards').mockImplementation(() => callOrder.push('original'));

      // Act
      globalThis.BattleManager.displayRewards();

      // Assert
      expect(callOrder).toEqual([ 'display', 'original' ]);
    });
  });

  describe('displaySdp', () =>
  {
    it('does not display anything when sdp is zero', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 0 };

      // Act
      globalThis.BattleManager.displaySdp();

      // Assert
      expect(globalThis.$gameMessage.add).not.toHaveBeenCalled();
    });

    it('does not display anything when sdp is negative', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: -5 };

      // Act
      globalThis.BattleManager.displaySdp();

      // Assert
      expect(globalThis.$gameMessage.add).not.toHaveBeenCalled();
    });

    it('adds an sdp-gained message using the configured victory text', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { sdp: 6 };

      // Act
      globalThis.BattleManager.displaySdp();

      // Assert
      expect(globalThis.$gameMessage.add).toHaveBeenCalledWith('\\. 6 Node Points gained');
    });
  });
});
//endregion plugins/sdp/core/managers/battle-manager.test.js
