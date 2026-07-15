//region plugins/jafting/ext/refine/_metadata/plugin-commands.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-JAFTING-Refinement plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneJaftingRefine;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSceneJaftingRefine = { callScene: vi.fn() };
    vi.doMock('../../../../../../src/plugins/jafting/ext/refine/scenes/Scene_JaftingRefine.js', () => ({ default: FakeSceneJaftingRefine }));

    globalThis.J = { JAFTING: { EXT: { REFINE: { Metadata: { name: 'J-JAFTING-Refinement' } } } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../../src/plugins/jafting/ext/refine/_metadata/pluginCommands.js');
  });

  it('registers call-menu under the J-JAFTING-Refinement plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([ 'call-menu' ]);
  });

  it('call-menu calls the jafting-refine scene', () =>
  {
    // Arrange/Act
    handlers['call-menu']();

    // Assert
    expect(FakeSceneJaftingRefine.callScene).toHaveBeenCalled();
  });
});
//endregion plugins/jafting/ext/refine/_metadata/plugin-commands.test.js
