//region plugins/omni/ext/stats/objects/game-party.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { installSaveRegistrationRealm } from '../../../../../setup/install-save-registration-realm.js';

describe('J-OMNI-Stats Game_Party hooks (direct src import)', () =>
{
  /**
   * The original this plugin aliases, spied on to prove the chain is not broken.
   * @type {Function}
   */
  let originalInitOmnipediaMembers;

  beforeEach(async () =>
  {
    vi.resetModules();

    await installSaveRegistrationRealm();

    globalThis.J = { OMNI: { EXT: { STATS: { Aliased: { Game_Party: new Map() } } } } };

    // J-Omnipedia's own Game_Party ships in a different bundle and is a bare global by the time this
    // extension's script runs. Only the method this plugin aliases needs to exist.
    originalInitOmnipediaMembers = vi.fn();

    function Game_Party() {}

    Game_Party.prototype.initOmnipediaMembers = originalInitOmnipediaMembers;
    globalThis.Game_Party = Game_Party;

    await import('../../../../../../src/plugins/omni/ext/stats/objects/Game_Party.js');
  });

  it('leaves the omnipedia chain it extends intact', () =>
  {
    // Arrange.
    const party = new globalThis.Game_Party();

    // Act.
    party.initOmnipediaMembers();

    // Assert.
    expect(originalInitOmnipediaMembers).toHaveBeenCalledTimes(1);
  });

  it('seeds a record the party can be asked for', () =>
  {
    // Arrange.
    const party = new globalThis.Game_Party();

    // Act.
    party.initOmnipediaMembers();

    // Assert: a fresh record answers zero rather than being absent.
    const records = party.getStatistopediaRecords();
    expect(records.longestKillStreak()).toBe(0);
    expect(records.killsByEnemyId().size).toBe(0);
  });

  it('nests the record under the omnipedia namespace it shares with its siblings', () =>
  {
    // Arrange: a sibling extension's slice that must survive this one initializing beside it.
    const party = new globalThis.Game_Party();
    party._j = { _omni: { _somethingElse: 'untouched' } };

    // Act.
    party.initOmnipediaMembers();

    // Assert.
    expect(party._j._omni._somethingElse).toBe('untouched');
    expect(party._j._omni._statistopediaRecords).toBe(party.getStatistopediaRecords());
  });
});
//endregion plugins/omni/ext/stats/objects/game-party.test.js
