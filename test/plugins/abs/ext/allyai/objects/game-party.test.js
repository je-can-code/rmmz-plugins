//region plugins/abs/ext/allyai/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Party (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;
  let originalAddActor;
  let originalRemoveActor;

  // the three stances in ladder order, with distinct keys, so a lookup that matched everything would show up.
  const safeSupport = { key: 'safe-support', name: 'Safe Support' };
  const bloodyWanker = { key: 'bloody-wanker', name: 'Bloody Wanker' };
  const meatShield = { key: 'meat-shield', name: 'Meat Shield' };

  beforeAll(async () =>
  {
    vi.resetModules();

    // the stance model is imported for its clamp, and its fields default to the base plugin's empty string.
    String.empty = '';

    globalThis.J = {
      ABS: {
        EXT: {
          ALLYAI: {
            Aliased: { Game_Party: new Map() },
            Metadata: { DefaultStanceType: 'safe-support', StanceTypes: [ safeSupport, bloodyWanker, meatShield ] },
          },
        },
      },
    };

    function Game_Party()
    {
    }

    originalInitialize = vi.fn();
    originalAddActor = vi.fn();
    originalRemoveActor = vi.fn();
    Game_Party.prototype.initMembers = originalInitialize;
    Game_Party.prototype.addActor = originalAddActor;
    Game_Party.prototype.removeActor = originalRemoveActor;
    globalThis.Game_Party = Game_Party;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Party.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockReset();
    originalAddActor.mockReset();
    originalRemoveActor.mockReset();
    globalThis.$gameMap = { updateAllies: vi.fn() };
  });

  function buildParty()
  {
    const party = Object.create(globalThis.Game_Party.prototype);
    party.initMembers();
    return party;
  }

  describe('initMembers / initAllyAi', () =>
  {
    it('calls the original then defaults the stance to the metadata default', () =>
    {
      // Arrange
      const party = Object.create(globalThis.Game_Party.prototype);

      // Act
      party.initMembers();

      // Assert
      expect(originalInitialize).toHaveBeenCalledTimes(1);
      expect(party.getPartyStance()).toBe('safe-support');
    });
  });

  describe('getPartyStance / setPartyStance', () =>
  {
    it('tracks the current stance key', () =>
    {
      // Arrange
      const party = buildParty();

      // Act
      party.setPartyStance('meat-shield');

      // Assert
      expect(party.getPartyStance()).toBe('meat-shield');
    });
  });

  describe('getPartyStanceType', () =>
  {
    it('resolves the stance the saved key names', () =>
    {
      // Arrange - the second stance, so a lookup that always answered the first would fail.
      const party = buildParty();
      party.setPartyStance('meat-shield');

      // Act
      const stance = party.getPartyStanceType();

      // Assert
      expect(stance).toBe(meatShield);
    });

    it('falls back to the first stance when the saved key names none', () =>
    {
      // Arrange - a key a save might still hold after its stance was retired.
      const party = buildParty();
      party.setPartyStance('close-circle');

      // Act
      const stance = party.getPartyStanceType();

      // Assert
      expect(stance).toBe(safeSupport);
    });
  });

  describe('stanceKeyAlongLadder', () =>
  {
    it('steps one rung bolder', () =>
    {
      // Arrange
      const party = buildParty();
      party.setPartyStance('safe-support');

      // Act & Assert
      expect(party.stanceKeyAlongLadder(1)).toBe('bloody-wanker');
    });

    it('steps one rung safer', () =>
    {
      // Arrange
      const party = buildParty();
      party.setPartyStance('meat-shield');

      // Act & Assert
      expect(party.stanceKeyAlongLadder(-1)).toBe('bloody-wanker');
    });

    it('stays on the boldest rung rather than wrapping around', () =>
    {
      // Arrange
      const party = buildParty();
      party.setPartyStance('meat-shield');

      // Act & Assert
      expect(party.stanceKeyAlongLadder(1)).toBe('meat-shield');
    });

    it('stays on the safest rung rather than wrapping around', () =>
    {
      // Arrange
      const party = buildParty();
      party.setPartyStance('safe-support');

      // Act & Assert
      expect(party.stanceKeyAlongLadder(-1)).toBe('safe-support');
    });
  });

  describe('addActor', () =>
  {
    it('performs the original logic then updates allies', () =>
    {
      // Arrange
      const party = buildParty();

      // Act
      party.addActor(3);

      // Assert
      expect(originalAddActor).toHaveBeenCalledWith(3);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeActor', () =>
  {
    it('performs the original logic then updates allies', () =>
    {
      // Arrange
      const party = buildParty();

      // Act
      party.removeActor(3);

      // Assert
      expect(originalRemoveActor).toHaveBeenCalledWith(3);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-party.test.js
