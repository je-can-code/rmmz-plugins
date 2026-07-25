//region plugins/omni/ext/monster/objects/_component/game-system.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System (omni ext/monster, direct src import)', () =>
{
  beforeEach(async () =>
  {
    vi.resetModules();

    function Game_System()
    {
    }

    Game_System.prototype.onBeforeSave = vi.fn();
    Game_System.prototype.onAfterLoad = vi.fn();

    globalThis.Game_System = Game_System;
    globalThis.J = { OMNI: { EXT: { MONSTER: { Aliased: { Game_System: new Map() } } } } };
    globalThis.$gameParty = {
      synchronizeMonsterpediaDataBeforeSave: vi.fn(),
      synchronizeMonsterpediaAfterLoad: vi.fn(),
    };

    // the file under test- patches globalThis.Game_System.prototype directly, no vm involved.
    await import('../../../../../../../src/plugins/omni/ext/monster/objects/Game_System.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_System;
    delete globalThis.J;
    delete globalThis.$gameParty;
  });

  it('onBeforeSave calls the original hook and syncs the monsterpedia cache into save data', () =>
  {
    const originalOnBeforeSave = globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_System.get('onBeforeSave');
    const system = new globalThis.Game_System();

    system.onBeforeSave();

    expect(originalOnBeforeSave).toHaveBeenCalled();
    expect(globalThis.$gameParty.synchronizeMonsterpediaDataBeforeSave).toHaveBeenCalled();
  });

  it('onAfterLoad calls the original hook and syncs saved data back into the cache', () =>
  {
    const originalOnAfterLoad = globalThis.J.OMNI.EXT.MONSTER.Aliased.Game_System.get('onAfterLoad');
    const system = new globalThis.Game_System();

    system.onAfterLoad();

    expect(originalOnAfterLoad).toHaveBeenCalled();
    expect(globalThis.$gameParty.synchronizeMonsterpediaAfterLoad).toHaveBeenCalled();
  });
});
//endregion plugins/omni/ext/monster/objects/_component/game-system.test.js
