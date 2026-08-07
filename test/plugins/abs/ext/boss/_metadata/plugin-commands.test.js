//region plugins/abs/ext/boss/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The two commands a story event drives a boss fight with.
 *
 * Both are one line of delegation, and both are the only seam between an event page and the manager
 * - so what is worth guarding is that the registration happened at all, under the plugin's own name,
 * and that the encounter key survives the trip. RMMZ hands every plugin command argument across as a
 * string, so a command that forgets to read the one it was given fails silently and looks like a
 * boss that simply never appeared.
 */
describe('J-ABS-Boss plugin commands', () =>
{
  const PLUGIN_NAME = 'J-ABS-Boss';

  /**
   * Every command the ship registered, keyed by name.
   * @type {Map<string, Function>}
   */
  let registered;

  /**
   * The manager the commands delegate to.
   *
   * Imported inside `beforeAll` rather than at the top of the file on purpose: `vi.resetModules()`
   * starts a new module registry, and a statically hoisted import would resolve to the instance from
   * the previous one - a different object than the commands themselves ended up holding, so spying on
   * it would watch a manager nobody calls.
   * @type {typeof import('../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js').default}
   */
  let JabsBossManager;

  /**
   * Runs a registered command the way `PluginManager` would.
   * @param {string} commandName The command to run.
   * @param {object} args The stringy arguments RMMZ hands over.
   */
  const runCommand = (commandName, args) => registered.get(commandName)
    .call(null, args);

  beforeAll(async () =>
  {
    vi.resetModules();

    registered = new Map();

    globalThis.PluginManager = {
      parameters: () => ({}),
      registerCommand: (pluginName, commandName, callback) =>
      {
        // capturing the plugin name alongside the callback is what makes the registration itself
        // checkable - a command registered under the wrong name is never reachable in-game.
        registered.set(commandName, callback);
        registered.set(`${commandName}:plugin`, pluginName);
      },
    };

    globalThis.J = { ABS: { EXT: { BOSS: { Metadata: { name: PLUGIN_NAME } } } } };

    ({ default: JabsBossManager } = await import(
      '../../../../../../src/plugins/abs/ext/boss/managers/JabsBossManager.js'));

    await import('../../../../../../src/plugins/abs/ext/boss/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('registration', () =>
  {
    it('registers both commands under the plugin\'s own lowercase name', () =>
    {
      // Arrange
      // Act
      // Assert: `registerCommand` matches on the name RMMZ knows the plugin by, so a mismatch here
      // means the command exists in the editor and does nothing when the event runs it.
      expect(registered.get('start-encounter:plugin'))
        .toBe(PLUGIN_NAME);
      expect(registered.get('end-encounter:plugin'))
        .toBe(PLUGIN_NAME);
    });
  });

  describe('start-encounter', () =>
  {
    it('starts the encounter the event named', () =>
    {
      // Arrange
      const startEncounter = vi.spyOn(JabsBossManager, 'startEncounter')
        .mockImplementation(() => {});

      // Act
      runCommand('start-encounter', { encounterKey: 'gluttonwolf' });

      // Assert
      expect(startEncounter)
        .toHaveBeenCalledWith('gluttonwolf');
    });
  });

  describe('end-encounter', () =>
  {
    it('ends the active encounter without needing to be told which one', () =>
    {
      // Arrange: ending is explicit rather than automatic on defeat, because the fight is not over
      // when the boss reaches zero health - it is over when its death scene finishes.
      const endEncounter = vi.spyOn(JabsBossManager, 'endEncounter')
        .mockImplementation(() => {});

      // Act
      runCommand('end-encounter', {});

      // Assert
      expect(endEncounter)
        .toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/boss/_metadata/plugin-commands.test.js