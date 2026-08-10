//region plugins/omni/core/objects/_component/game-party.test.js
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

    // J-Base adds this hook and calls it from an aliased `initialize`; the omnipedia hangs off it
    // rather than off `initialize` itself, so the chain needs it to exist to be extended.
    Game_Party.prototype.initMembers = vi.fn(function()
    {
      this._j ??= {};
    });

    globalThis.Game_Party = Game_Party;
    globalThis.J = { OMNI: { Aliased: { Game_Party: new Map() } } };

    // the file under test- patches globalThis.Game_Party.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/omni/core/objects/Game_Party.js');
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

  it('still performs the original initMembers it extends', () =>
  {
    // Arrange
    const party = new globalThis.Game_Party();

    // Act
    party.initMembers();

    // Assert- omni owns none of the party's other state, so dropping the original here would strip
    // every field J-Base and its siblings seeded.
    expect(globalThis.J.OMNI.Aliased.Game_Party.get('initMembers')).toHaveBeenCalled();
  });

  it('reaches the omnipedia hook so extensions get a chance to seed their own members', () =>
  {
    // Arrange- the hook is empty in core on purpose; each omnipedia extension patches it, and this
    // is the single call site that gives all of them their opening.
    const party = new globalThis.Game_Party();
    const initOmnipediaMembers = vi.spyOn(party, 'initOmnipediaMembers');

    // Act
    party.initMembers();

    // Assert
    expect(initOmnipediaMembers).toHaveBeenCalled();

    initOmnipediaMembers.mockRestore();
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
//endregion plugins/omni/core/objects/_component/game-party.test.js
