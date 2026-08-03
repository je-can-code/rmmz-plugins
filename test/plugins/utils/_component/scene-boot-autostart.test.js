//region plugins/utils/_component/scene-boot-autostart.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installUtilsHostGlobals, setPluginContextToJBase, setPluginContextToJUtils } from './fixtures/install-utils-host-globals.js';

describe('J-SystemUtilities Scene_Boot behavior (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installUtilsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJUtils();
    await import('../../../../src/plugins/utils/core/_metadata/initialization.js');

    // patches globalThis.Scene_Boot.prototype directly, no vm involved.
    await import('../../../../src/plugins/utils/core/scenes/Scene_Boot.js');
  });

  it('startNormalGame autostarts when autostartNewgame is true', () =>
  {
    // Arrange
    globalThis.__utilsOriginalStartNormalGameCalled = false;
    globalThis.__utilsSetupNewGameCalled = false;
    globalThis.SceneManager.goto = function(sceneCtor)
    {
      globalThis.__utilsGotoCalledWith = sceneCtor;
    };
    globalThis.J.UTILS.Metadata.autostartNewgame = true;
    const boot = new globalThis.Scene_Boot();

    // Act
    boot.startNormalGame();

    // Assert
    expect(globalThis.__utilsSetupNewGameCalled).toBe(true);
    expect(globalThis.__utilsGotoCalledWith).toBe(globalThis.Scene_Map);
    expect(globalThis.__utilsOriginalStartNormalGameCalled).toBe(false);
  });
});
//endregion plugins/utils/_component/scene-boot-autostart.test.js
