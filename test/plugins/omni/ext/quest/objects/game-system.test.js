//region plugins/omni/ext/quest/objects/game-system.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System (omni ext/quest, direct src import)', () =>
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
    globalThis.J = { OMNI: { EXT: { QUEST: { Aliased: { Game_System: new Map() } } } } };
    globalThis.$gameParty = {
      synchronizeQuestopediaDataBeforeSave: vi.fn(),
      updateTrackedOmniQuestsFromConfig: vi.fn(),
      synchronizeQuestopediaAfterLoad: vi.fn(),
    };

    // the file under test- patches globalThis.Game_System.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/omni/ext/quest/objects/Game_System.js');
  });

  afterEach(() =>
  {
    delete globalThis.Game_System;
    delete globalThis.J;
    delete globalThis.$gameParty;
  });

  it('onBeforeSave calls the original hook and syncs the questopedia cache into save data', () =>
  {
    const originalOnBeforeSave = globalThis.J.OMNI.EXT.QUEST.Aliased.Game_System.get('onBeforeSave');
    const system = new globalThis.Game_System();

    system.onBeforeSave();

    expect(originalOnBeforeSave).toHaveBeenCalled();
    expect(globalThis.$gameParty.synchronizeQuestopediaDataBeforeSave).toHaveBeenCalled();
  });

  it('onAfterLoad calls the original hook, refreshes tracked quests from config, and syncs the cache', () =>
  {
    const originalOnAfterLoad = globalThis.J.OMNI.EXT.QUEST.Aliased.Game_System.get('onAfterLoad');
    const system = new globalThis.Game_System();

    system.onAfterLoad();

    expect(originalOnAfterLoad).toHaveBeenCalled();
    expect(globalThis.$gameParty.updateTrackedOmniQuestsFromConfig).toHaveBeenCalled();
    expect(globalThis.$gameParty.synchronizeQuestopediaAfterLoad).toHaveBeenCalled();
  });
});
//endregion plugins/omni/ext/quest/objects/game-system.test.js
