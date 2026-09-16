//region plugins/message/ext/bubbles/_component/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageBubbles,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * A plugin command is a function handed to the engine at load time and never called by anything in
 * the plugin, so the only way to exercise one is to catch it on its way past and invoke it. Worth
 * doing: the registration name is `Metadata.name` rather than the ship's filename, and a command
 * registered under the wrong one is silently unreachable from the editor with no error anywhere.
 */
describe('J-Message-Bubbles plugin commands (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  /** @type {Map<string, Function>} every command the ship registered, by name. */
  let registered;

  /**
   * The manager as the command file itself sees it.
   *
   * Re-imported after the module reset rather than at the top of this file, because a reset hands
   * out a fresh copy of every module - and a static map on one copy is invisible to the other, which
   * looks exactly like a command that ran and did nothing.
   * @type {object}
   */
  let manager;

  beforeAll(async () =>
  {
    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.2.0';
    globalThis.J.MESSAGE = {
      Metadata: { version: { version: () => '1.3.1' } },
      EXT: {},
    };

    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    installPluginManagerWithParams(globalThis, 'J-Message-Bubbles', {});
    setPluginContextToJMessageBubbles();

    await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/initialization.js');

    registered = new Map();
    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      registered.set(`${pluginName}:${commandName}`, handler);
    };

    const { default: FreshManager } = await import(
      '../../../../../../src/plugins/message/ext/bubbles/managers/SpentBubbleManager.js');
    manager = FreshManager;

    await import('../../../../../../src/plugins/message/ext/bubbles/_metadata/pluginCommands.js');
  });

  it('registers the conversation command under the name the editor will call it by', () =>
  {
    // Arrange & Act
    const handler = registered.get('J-Message-Bubbles:end-conversation');

    // Assert- registered under the wrong plugin name, this is unreachable and says nothing about it.
    expect(handler).toBeDefined();
  });

  it('ends the conversation when the command runs', () =>
  {
    // Arrange
    manager.retain('a1', { speakerName: 'Jerald' });
    manager.retain('a2', { speakerName: 'Rupert' });
    const handler = registered.get('J-Message-Bubbles:end-conversation');

    // Act
    handler();

    // Assert
    expect(manager.isEmpty()).toBe(true);
  });
});
//endregion plugins/message/ext/bubbles/_component/plugin-commands.test.js