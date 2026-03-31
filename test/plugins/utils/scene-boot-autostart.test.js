//region plugins/utils/scene-boot-autostart.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadUtilsPluginVm } from './utils-vm.js';

describe('J-SystemUtilities Scene_Boot behavior (out/J-SystemUtilities.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadUtilsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('startNormalGame autostarts when autostartNewgame is true', () =>
  {
    sandbox.__utilsOriginalStartNormalGameCalled = false;
    sandbox.__utilsSetupNewGameCalled = false;

    sandbox.SceneManager.goto = function(sceneCtor)
    {
      sandbox.__utilsGotoCalledWith = sceneCtor;
    };

    sandbox.J.UTILS.Metadata.autostartNewgame = true;

    const boot = new sandbox.Scene_Boot();
    boot.startNormalGame();

    expect(sandbox.__utilsSetupNewGameCalled).toBe(true);
    expect(sandbox.__utilsGotoCalledWith).toBe(sandbox.Scene_Map);
    expect(sandbox.__utilsOriginalStartNormalGameCalled).toBe(false);
  });
});
//endregion plugins/utils/scene-boot-autostart.test.js
