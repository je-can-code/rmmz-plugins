//region plugins/message/ext/chatter/_component/plugin-commands.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageChatter,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * A plugin command is a function handed to the engine at load time and never called by anything in
 * the plugin, so the only way to exercise one is to catch it on its way past and invoke it.
 *
 * This one has a second thing worth catching. The engine calls a handler as `func.bind(self)(args)`
 * with the running interpreter as `self`, which is the only way a target of `self` can mean
 * anything - so every case below invokes it the same way the engine does rather than calling it
 * plainly. An arrow function would pass a test that called it plainly and fail in the editor.
 */
describe('J-Message-Chatter plugin commands (direct src import)', () =>
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
      Metadata: { version: { version: () => '2.0.0' } },
      EXT: {
        BUBBLES: { Metadata: { version: { version: () => '1.0.0' } } },
      },
    };

    const { default: FreshPluginMetadata } = await import(
      '../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    installPluginManagerWithParams(globalThis, 'J-Message-Chatter', {});
    setPluginContextToJMessageChatter();

    globalThis.MessageConfig = { section: () => ({}) };

    // event five is standing on the map; nothing else is.
    globalThis.BubbleTargetResolver = {
      resolve: token => (token === 'e5'
        ? {
          x: 1,
          y: 1,
        }
        : null),
    };

    await import('../../../../../../src/plugins/message/ext/chatter/_metadata/initialization.js');

    registered = new Map();
    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      registered.set(`${pluginName}:${commandName}`, handler);
    };

    const { default: FreshManager } = await import(
      '../../../../../../src/plugins/message/ext/chatter/managers/ChatterManager.js');
    manager = FreshManager;

    await import('../../../../../../src/plugins/message/ext/chatter/_metadata/pluginCommands.js');
  });

  afterEach(() =>
  {
    manager.clear();
  });

  /**
   * Runs the command the way the engine does, bound to an interpreter running a given event.
   * @param {object} args The command's arguments, as the editor hands them over.
   * @param {number} eventId The event whose page is running the command.
   */
  function runChatterNow(args, eventId)
  {
    const handler = registered.get('J-Message-Chatter:chatter-now');
    const interpreter = { eventId: () => eventId };

    handler.bind(interpreter)(args);
  }

  /**
   * The line a token is currently saying, if any.
   * @param {string} token The target token.
   * @returns {?object}
   */
  function sessionOf(token)
  {
    const found = manager.liveSessions()
      .find(([ each ]) => each === token);

    if (found === undefined) return null;

    const [ , session ] = found;

    return session;
  }

  it('registers the command under the name the editor will call it by', () =>
  {
    // Arrange & Act
    const handler = registered.get('J-Message-Chatter:chatter-now');

    // Assert- registered under the wrong plugin name, this is unreachable and says nothing about it.
    expect(handler).toBeDefined();
  });

  it('makes the running event speak when the target is self', () =>
  {
    // Arrange & Act
    runChatterNow({
      target: 'self',
      text: 'Psst.',
      duration: '',
      position: '',
      background: '',
      persist: 'false',
    }, 5);

    // Assert- this is the whole reason the handler cannot be an arrow function: an arrow discards
    // the interpreter binding, and `self` would name nobody.
    expect(sessionOf('e5')
      .line()).toBe('Psst.');
  });

  it('makes a named event speak regardless of which event is running', () =>
  {
    // Arrange & Act
    runChatterNow({
      target: 'e5',
      text: 'Psst.',
      duration: '',
      position: '',
      background: '',
      persist: 'false',
    }, 99);

    // Assert- the near miss for `self`: the host event is present and must be ignored.
    expect(sessionOf('e5')).not.toBe(null);
  });

  it('takes the duration the command was given', () =>
  {
    // Arrange & Act
    runChatterNow({
      target: 'e5',
      text: 'Psst.',
      duration: '45',
      position: '',
      background: '',
      persist: 'false',
    }, 5);

    // Assert
    expect(sessionOf('e5')
      .durationRemaining()).toBe(45);
  });

  it('takes the side the command was given', () =>
  {
    // Arrange & Act
    runChatterNow({
      target: 'e5',
      text: 'Psst.',
      duration: '',
      position: 'bottom',
      background: '',
      persist: 'false',
    }, 5);

    // Assert
    expect(sessionOf('e5')
      .profile()
      .prefersBelow()).toBe(true);
  });

  it('takes the backdrop the command was given', () =>
  {
    // Arrange & Act
    runChatterNow({
      target: 'e5',
      text: 'I know what you did.',
      duration: '',
      position: '',
      background: 'dim',
      persist: 'false',
    }, 5);

    // Assert- the Show Text dropdown's dim, which on a bubble reads as an inner thought.
    expect(sessionOf('e5')
      .profile()
      .backgroundType()).toBe(1);
  });

  it('keeps a line through a conversation when the box is ticked', () =>
  {
    // Arrange
    runChatterNow({
      target: 'e5',
      text: 'I know what you did.',
      duration: '',
      position: 'top',
      background: 'dim',
      persist: 'true',
    }, 5);

    // Act
    manager.silence('e5');

    // Assert- the thought stays up while its owner talks, which is the whole reason for the box.
    expect(sessionOf('e5')).not.toBe(null);
  });

  it('lets a line go for a conversation when the box is left alone', () =>
  {
    // Arrange- the near miss, and the default: an unticked checkbox arrives as the string "false",
    // which is not the same as being absent and is emphatically not falsy.
    runChatterNow({
      target: 'e5',
      text: 'Psst.',
      duration: '',
      position: '',
      background: '',
      persist: 'false',
    }, 5);

    // Act
    manager.silence('e5');

    // Assert
    expect(sessionOf('e5')).toBe(null);
  });

  it('says nothing when run from a common event with a target of self', () =>
  {
    // Arrange- an interpreter with no event of its own answers zero, and `e0` names nobody. The
    // failure mode of this is silence, which is also what chatter looks like when it works, so it is
    // worth pinning rather than discovering.

    // Act
    runChatterNow({
      target: 'self',
      text: 'Psst.',
      duration: '',
      position: '',
      background: '',
      persist: 'false',
    }, 0);

    // Assert
    expect(manager.isQuiet()).toBe(true);
  });
});
//endregion plugins/message/ext/chatter/_component/plugin-commands.test.js