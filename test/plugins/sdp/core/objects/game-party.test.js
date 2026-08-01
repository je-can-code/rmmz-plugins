//region plugins/sdp/core/objects/game-party.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installSdpHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJSdp,
} from '../../_component/fixtures/install-sdp-host-globals.js';

/**
 * Panel unlock state lives on each actor, so the party-level operations are fan-outs across every
 * actor rather than state of their own. The interesting behavior is the validation in front of
 * them: an unknown panel key is a config or scripting mistake, and quietly unlocking nothing would
 * hide it, so the party refuses the whole operation and says so.
 */
describe('J-SDP Game_Party (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installSdpHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJSdp();
    await import('../../../../../src/plugins/sdp/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/sdp/core/objects/Game_Party.js');
  });

  /**
   * Builds an actor stand-in that tracks which panel keys it has unlocked, so party-wide
   * operations are observed through the state they actually change.
   * @param {string[]} [unlocked] Keys this actor starts with unlocked.
   * @returns {object}
   */
  function makeActor(unlocked = [])
  {
    return {
      unlocked: new Set(unlocked),
      ranks: new Map(),
      hasAnyUnlockedSdps()
      {
        return this.unlocked.size > 0;
      },
      isSdpUnlocked(key)
      {
        return this.unlocked.has(key);
      },
      unlockSdpByKey(key)
      {
        this.unlocked.add(key);
      },
      lockSdpByKey(key)
      {
        this.unlocked.delete(key);
      },
      getSdpByKey(key)
      {
        return this.ranks.get(key);
      },
    };
  }

  /**
   * Installs a roster of actors and a set of known panel keys.
   * @param {object[]} actors The actors making up the roster.
   * @param {string[]} [panelKeys] The panel keys the config knows about.
   */
  function useRoster(actors, panelKeys = [ 'panel_a', 'panel_b' ])
  {
    globalThis.J.SDP.Metadata.panelsMap = new Map(panelKeys.map(key => [ key, { key } ]));
    globalThis.$gameActors = {
      actors()
      {
        return actors;
      },
      actor(actorId)
      {
        return actors[actorId - 1];
      },
    };
  }

  let party;

  beforeEach(() =>
  {
    party = new globalThis.Game_Party();
  });

  //region hasAnyUnlockedSdps
  describe('hasAnyUnlockedSdps', () =>
  {
    it('reports true when a single actor has anything unlocked', () =>
    {
      // Arrange: the SDP menu command hangs off this, so one actor is enough to earn it.
      useRoster([ makeActor(), makeActor([ 'panel_a' ]) ]);

      // Act
      const result = party.hasAnyUnlockedSdps();

      // Assert
      expect(result).toBe(true);
    });

    it('reports false when no actor has anything unlocked', () =>
    {
      // Arrange
      useRoster([ makeActor(), makeActor() ]);

      // Act
      const result = party.hasAnyUnlockedSdps();

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion hasAnyUnlockedSdps

  //region unlockSdp
  describe('unlockSdp', () =>
  {
    it('unlocks the panel for every actor in the roster', () =>
    {
      // Arrange
      const actors = [ makeActor(), makeActor() ];
      useRoster(actors);

      // Act
      party.unlockSdp('panel_a');

      // Assert
      expect(actors.map(actor => actor.isSdpUnlocked('panel_a'))).toEqual([ true, true ]);
    });

    it('unlocks nothing when the key is not a known panel', () =>
    {
      // Arrange: an unknown key means the caller and the config disagree, and unlocking a
      // partial set would leave the party in a state no config can explain.
      const actors = [ makeActor() ];
      useRoster(actors);
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.unlockSdp('panel_missing');

      // Assert
      expect(actors[0].unlocked.size).toBe(0);

      // restore manually so the spy cannot leak into whichever test runs next in this file.
      error.mockRestore();
    });

    it('reports an unknown key rather than failing silently', () =>
    {
      // Arrange
      useRoster([ makeActor() ]);
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.unlockSdp('panel_missing');

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });
  });
  //endregion unlockSdp

  //region unlockAllSdpsForEveryone
  describe('unlockAllSdpsForEveryone', () =>
  {
    it('unlocks every configured panel across the whole roster', () =>
    {
      // Arrange
      const actors = [ makeActor(), makeActor() ];
      useRoster(actors, [ 'panel_a', 'panel_b', 'panel_c' ]);

      // Act
      party.unlockAllSdpsForEveryone();

      // Assert
      expect(actors.map(actor => actor.unlocked.size)).toEqual([ 3, 3 ]);
    });
  });
  //endregion unlockAllSdpsForEveryone

  //region isSdpUnlocked
  describe('isSdpUnlocked', () =>
  {
    it('requires every actor to have the panel before calling it unlocked', () =>
    {
      // Arrange: a panel only half the party can see is not a party-wide unlock.
      useRoster([ makeActor([ 'panel_a' ]), makeActor() ]);

      // Act
      const result = party.isSdpUnlocked('panel_a');

      // Assert
      expect(result).toBe(false);
    });

    it('reports unlocked once every actor has it', () =>
    {
      // Arrange
      useRoster([ makeActor([ 'panel_a' ]), makeActor([ 'panel_a' ]) ]);

      // Act
      const result = party.isSdpUnlocked('panel_a');

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion isSdpUnlocked

  //region lockSdp
  describe('lockSdp', () =>
  {
    it('locks the panel for every actor in the roster', () =>
    {
      // Arrange
      const actors = [ makeActor([ 'panel_a' ]), makeActor([ 'panel_a' ]) ];
      useRoster(actors);

      // Act
      party.lockSdp('panel_a');

      // Assert
      expect(actors.map(actor => actor.isSdpUnlocked('panel_a'))).toEqual([ false, false ]);
    });

    it('locks nothing when the key is not a known panel', () =>
    {
      // Arrange
      const actors = [ makeActor([ 'panel_a' ]) ];
      useRoster(actors);
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.lockSdp('panel_missing');

      // Assert
      expect(actors[0].isSdpUnlocked('panel_a')).toBe(true);

      error.mockRestore();
    });

    it('reports an unknown key on lock as well', () =>
    {
      // Arrange
      useRoster([ makeActor([ 'panel_a' ]) ]);
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      party.lockSdp('panel_missing');

      // Assert
      expect(error).toHaveBeenCalled();

      error.mockRestore();
    });
  });
  //endregion lockSdp

  //region getSdpRankByActorAndKey
  describe('getSdpRankByActorAndKey', () =>
  {
    it('reports the rank the actor holds in that panel', () =>
    {
      // Arrange
      const actor = makeActor([ 'panel_a' ]);
      actor.ranks.set('panel_a', { currentRank: 4 });
      useRoster([ actor ]);

      // Act
      const result = party.getSdpRankByActorAndKey(1, 'panel_a');

      // Assert
      expect(result).toBe(4);
    });

    it('reports zero for a panel the actor has never ranked', () =>
    {
      // Arrange: never having touched a panel is rank zero, not an error.
      useRoster([ makeActor() ]);

      // Act
      const result = party.getSdpRankByActorAndKey(1, 'panel_a');

      // Assert
      expect(result).toBe(0);
    });

    it('reports zero for an actor id that resolves to nobody', () =>
    {
      // Arrange
      useRoster([ makeActor() ]);
      const error = vi.spyOn(console, 'error')
        .mockImplementation(() => {});

      // Act
      const result = party.getSdpRankByActorAndKey(99, 'panel_a');

      // Assert
      expect(result).toBe(0);

      error.mockRestore();
    });
  });
  //endregion getSdpRankByActorAndKey
});
//endregion plugins/sdp/core/objects/game-party.test.js