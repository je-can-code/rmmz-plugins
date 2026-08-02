//region plugins/level/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-LevelMaster plugin commands (direct src import)', () =>
{
  let handlers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { LEVEL: { Metadata: { name: 'J-LevelMaster' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/level/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameSystem = {
      enableLevelScaling: vi.fn(),
      disableLevelScaling: vi.fn(),
    };
  });

  it('registers both scaling commands under the plugin name', () =>
  {
    // Arrange & Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([ 'enableScaling', 'disableScaling' ]);
  });

  it('enableScaling turns level scaling on through the game system', () =>
  {
    // Arrange & Act
    handlers['enableScaling']();

    // Assert- scaling state lives on $gameSystem so it rides along in the save file.
    expect(globalThis.$gameSystem.enableLevelScaling).toHaveBeenCalled();
  });

  it('disableScaling turns level scaling off through the game system', () =>
  {
    // Arrange & Act
    handlers['disableScaling']();

    // Assert
    expect(globalThis.$gameSystem.disableLevelScaling).toHaveBeenCalled();
  });
});
//endregion plugins/level/core/_metadata/plugin-commands.test.js
