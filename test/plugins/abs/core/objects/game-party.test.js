//region plugins/abs/core/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS Game_Party (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Game_Party: new Map() } } };

    function Game_Party()
    {
    }
    originalInitialize = vi.fn();
    Game_Party.prototype.initialize = originalInitialize;
    globalThis.Game_Party = Game_Party;

    vi.doMock('../../../../../src/plugins/abs/core/models/JABS_Battler.js', () => ({ default: class {} }));
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({
      default: class { static getBattlerByUuid() {} },
    }));

    await import('../../../../../src/plugins/abs/core/objects/Game_Party.js');

    ({ default: globalThis.__JABS_AiManagerMock } =
      await import('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js'));
  });

  beforeEach(() =>
  {
    originalInitialize.mockClear();
    vi.spyOn(globalThis.__JABS_AiManagerMock, 'getBattlerByUuid').mockReset();
    globalThis.$jabsEngine = { forcedCombat: false };
  });

  function buildParty(overrides = {})
  {
    return Object.assign(Object.create(globalThis.Game_Party.prototype), overrides);
  }

  describe('initialize', () =>
  {
    it('performs the original logic then initializes JABS party data', () =>
    {
      // Arrange
      const party = buildParty();
      vi.spyOn(party, 'initJabsPartyData').mockImplementation(() => {});

      // Act
      party.initialize();

      // Assert
      expect(originalInitialize).toHaveBeenCalled();
      expect(party.initJabsPartyData).toHaveBeenCalled();
    });
  });

  describe('initJabsPartyData', () =>
  {
    it('seeds the JABS namespace and defaults party cycling to enabled on a fresh instance', () =>
    {
      // Arrange
      const party = buildParty();

      // Act
      party.initJabsPartyData();

      // Assert
      expect(party._j._abs._canPartyCycle).toEqual(true);
    });

    it('does not clobber an already-initialized truthy party cycling flag', () =>
    {
      // Arrange (the `||=` initializer only skips reassignment for truthy values- `false` itself
      // would be treated as "not yet initialized" and reset back to true, per the source's own logic)
      const party = buildParty({ _j: { _abs: { _canPartyCycle: true } } });

      // Act
      party.initJabsPartyData();

      // Assert
      expect(party._j._abs._canPartyCycle).toEqual(true);
    });

    it('resets an explicitly-false party cycling flag back to true, per the `||=` initializer', () =>
    {
      // Arrange
      const party = buildParty({ _j: { _abs: { _canPartyCycle: false } } });

      // Act
      party.initJabsPartyData();

      // Assert
      expect(party._j._abs._canPartyCycle).toEqual(true);
    });
  });

  describe('enablePartyCycling', () =>
  {
    it('sets party cycling to true', () =>
    {
      // Arrange
      const party = buildParty({ _j: { _abs: { _canPartyCycle: false } } });

      // Act
      party.enablePartyCycling();

      // Assert
      expect(party._j._abs._canPartyCycle).toEqual(true);
    });
  });

  describe('disablePartyCycling', () =>
  {
    it('sets party cycling to false', () =>
    {
      // Arrange
      const party = buildParty({ _j: { _abs: { _canPartyCycle: true } } });

      // Act
      party.disablePartyCycling();

      // Assert
      expect(party._j._abs._canPartyCycle).toEqual(false);
    });
  });

  describe('canPartyCycle', () =>
  {
    it('reflects the stored party cycling flag', () =>
    {
      // Arrange
      const party = buildParty({ _j: { _abs: { _canPartyCycle: true } } });

      // Act/Assert
      expect(party.canPartyCycle()).toEqual(true);
    });
  });

  //region leaderJabsBattler
  describe('leaderJabsBattler', () =>
  {
    it('returns undefined when there is no leader', () =>
    {
      // Arrange
      const party = buildParty({ leader: vi.fn(() => null) });

      // Act/Assert
      expect(party.leaderJabsBattler()).toBeUndefined();
    });

    it("returns the JABS battler tracked for the leader's uuid", () =>
    {
      // Arrange
      const leader = { getUuid: vi.fn(() => 'uuid-1') };
      const party = buildParty({ leader: vi.fn(() => leader) });
      const jabsBattler = {};
      globalThis.__JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(jabsBattler);

      // Act
      const result = party.leaderJabsBattler();

      // Assert
      expect(globalThis.__JABS_AiManagerMock.getBattlerByUuid).toHaveBeenCalledWith('uuid-1');
      expect(result).toBe(jabsBattler);
    });
  });
  //endregion leaderJabsBattler

  //region anyMemberInCombat
  describe('anyMemberInCombat', () =>
  {
    it('returns true immediately when combat is globally forced', () =>
    {
      // Arrange
      globalThis.$jabsEngine.forcedCombat = true;
      const party = buildParty({ battleMembers: vi.fn(() => []) });

      // Act/Assert
      expect(party.anyMemberInCombat()).toEqual(true);
      expect(party.battleMembers).not.toHaveBeenCalled();
    });

    it('returns false when there are no battle members', () =>
    {
      // Arrange
      const party = buildParty({ battleMembers: vi.fn(() => []) });

      // Act/Assert
      expect(party.anyMemberInCombat()).toEqual(false);
    });

    it('returns false when a tracked battler exists but is not in combat', () =>
    {
      // Arrange
      const actor = { getUuid: vi.fn(() => 'uuid-1') };
      const party = buildParty({ battleMembers: vi.fn(() => [ actor ]) });
      globalThis.__JABS_AiManagerMock.getBattlerByUuid.mockReturnValue({ isInCombat: vi.fn(() => false) });

      // Act/Assert
      expect(party.anyMemberInCombat()).toEqual(false);
    });

    it('returns false when a member has no tracked JABS battler', () =>
    {
      // Arrange
      const actor = { getUuid: vi.fn(() => 'uuid-1') };
      const party = buildParty({ battleMembers: vi.fn(() => [ actor ]) });
      globalThis.__JABS_AiManagerMock.getBattlerByUuid.mockReturnValue(null);

      // Act/Assert
      expect(party.anyMemberInCombat()).toEqual(false);
    });

    it('returns true when any battle member has a tracked battler that is in combat', () =>
    {
      // Arrange
      const notInCombat = { getUuid: vi.fn(() => 'uuid-1') };
      const inCombat = { getUuid: vi.fn(() => 'uuid-2') };
      const party = buildParty({ battleMembers: vi.fn(() => [ notInCombat, inCombat ]) });
      globalThis.__JABS_AiManagerMock.getBattlerByUuid.mockImplementation(uuid =>
        (uuid === 'uuid-2' ? { isInCombat: vi.fn(() => true) } : { isInCombat: vi.fn(() => false) }));

      // Act/Assert
      expect(party.anyMemberInCombat()).toEqual(true);
    });
  });
  //endregion anyMemberInCombat
});
//endregion plugins/abs/core/objects/game-party.test.js
