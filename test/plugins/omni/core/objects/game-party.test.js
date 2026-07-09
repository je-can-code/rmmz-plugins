//region plugins/omni/core/objects/game-party.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Party (omni core, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();

    function Game_Party()
    {
    }

    Game_Party.prototype.initialize = function()
    {
      this._j ??= {};
    };

    globalThis.Game_Party = Game_Party;
    globalThis.J = { OMNI: { Aliased: { Game_Party: new Map() } } };

    // the file under test- patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../../src/plugins/omni/core/objects/Game_Party.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_Party;
    delete globalThis.J;
  });

  it('aliases the original initialize and still calls it', () =>
  {
    const party = new globalThis.Game_Party();

    party.initialize();

    expect(party._j).toEqual({});
  });

  it('initOmnipediaMembers is a no-op hook available for extension plugins to patch', () =>
  {
    const party = new globalThis.Game_Party();

    expect(() => party.initOmnipediaMembers()).not.toThrow();
  });

  it('isOmnipediaInitialized reflects the truthiness of this._j._omni', () =>
  {
    const party = new globalThis.Game_Party();
    party.initialize();

    expect(party.isOmnipediaInitialized()).toBe(false);

    party._j._omni = {};

    expect(party.isOmnipediaInitialized()).toBe(true);
  });
});
//endregion plugins/omni/core/objects/game-party.test.js
