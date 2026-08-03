//region plugins/abs/ext/allyai/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Party (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;
  let originalAddActor;
  let originalRemoveActor;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: { EXT: { ALLYAI: { Aliased: { Game_Party: new Map() }, Metadata: { DefaultFormationType: 'line' } } } },
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
    it('calls the original then defaults aggro to false and formation to the metadata default', () =>
    {
      const party = Object.create(globalThis.Game_Party.prototype);
      party.initMembers();
      expect(originalInitialize).toHaveBeenCalledTimes(1);
      expect(party.isAggro()).toBe(false);
      expect(party.getPartyFormation()).toBe('line');
    });
  });

  describe('isAggro / becomeAggro / becomePassive', () =>
  {
    it('tracks the aggro toggle', () =>
    {
      const party = buildParty();
      party.becomeAggro();
      expect(party.isAggro()).toBe(true);
      party.becomePassive();
      expect(party.isAggro()).toBe(false);
    });
  });

  describe('getPartyFormation / setPartyFormation', () =>
  {
    it('tracks the current formation key', () =>
    {
      const party = buildParty();
      party.setPartyFormation('wedge');
      expect(party.getPartyFormation()).toBe('wedge');
    });
  });

  describe('addActor', () =>
  {
    it('performs the original logic then updates allies', () =>
    {
      const party = buildParty();
      party.addActor(3);
      expect(originalAddActor).toHaveBeenCalledWith(3);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeActor', () =>
  {
    it('performs the original logic then updates allies', () =>
    {
      const party = buildParty();
      party.removeActor(3);
      expect(originalRemoveActor).toHaveBeenCalledWith(3);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-party.test.js
