//region plugins/jafting/core/_metadata/plugin-commands.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-JAFTING plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneJafting;
  let FakeSceneJaftingSalvage;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSceneJafting = { callScene: vi.fn() };
    FakeSceneJaftingSalvage = { callScene: vi.fn() };
    vi.doMock('../../../../../src/plugins/jafting/core/scenes/Scene_Jafting.js', () => ({ default: FakeSceneJafting }));
    vi.doMock('../../../../../src/plugins/jafting/core/scenes/Scene_JaftingSalvage.js', () => ({ default: FakeSceneJaftingSalvage }));

    globalThis.J = { JAFTING: { Metadata: { name: 'J-JAFTING' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/jafting/core/_metadata/pluginCommands.js');
  });

  it('registers both commands under the J-JAFTING plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([ 'call-menu', 'call-salvage' ]);
  });

  it('call-menu calls the core jafting scene', () =>
  {
    // Arrange/Act
    handlers['call-menu']();

    // Assert
    expect(FakeSceneJafting.callScene).toHaveBeenCalled();
  });

  it('call-salvage calls the salvage scene directly', () =>
  {
    // Arrange/Act
    handlers['call-salvage']();

    // Assert
    expect(FakeSceneJaftingSalvage.callScene).toHaveBeenCalled();
  });
});
//endregion plugins/jafting/core/_metadata/plugin-commands.test.js
