//region plugins/motion/_component/plugin-commands.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installMotionComponentGlobals,
  setMotionConfig,
  setPluginContextToJBase,
  setPluginContextToJMotion,
} from './fixtures/install-motion-component-globals.js';

describe('J-Motion plugin commands (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js').default} */
  let CharacterMotionComposer;

  /** @type {typeof import('../../../../src/plugins/motion/core/core/MotionChannels.js').default} */
  let MotionChannels;

  /** @type {Map<string, Function>} */
  const registeredCommands = new Map();

  beforeAll(async () =>
  {
    vi.resetModules();

    installMotionComponentGlobals();
    setMotionConfig({});

    // capture the command handlers as they register, which is the only way a command is reachable.
    globalThis.PluginManager.registerCommand = (pluginName, commandName, handler) =>
    {
      registeredCommands.set(commandName, handler);
    };

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMotion();
    await import('../../../../src/plugins/motion/core/_metadata/initialization.js');

    // literal import paths, so Stryker can map mutants in these files back to this test file.
    await import('../../../../src/plugins/motion/core/core/MotionTypeRegistry.js');
    ({ default: MotionChannels } =
      await import('../../../../src/plugins/motion/core/core/MotionChannels.js'));
    ({ default: CharacterMotionComposer } =
      await import('../../../../src/plugins/motion/core/managers/CharacterMotionComposer.js'));
    await import('../../../../src/plugins/motion/core/_metadata/pluginCommands.js');
  });

  /** @type {Object} */
  let event;

  /** @type {Object} */
  let interpreter;

  beforeEach(() =>
  {
    event = { name: 'event-7' };
    interpreter = { eventId: () => 3 };

    globalThis.$gamePlayer = {
      name: 'player',
      followers: () => ({ follower: index => ({ name: `follower-${index}` }) }),
    };
    globalThis.$gameMap = { event: eventId => (eventId === 7 ? event : null) };
  });

  afterEach(() =>
  {
    CharacterMotionComposer.forget(event);
    CharacterMotionComposer.forget(globalThis.$gamePlayer);
    delete globalThis.$gamePlayer;
    delete globalThis.$gameMap;
    vi.restoreAllMocks();
  });

  /**
   * Invokes a registered command the way the engine does, bound to the running interpreter.
   * @param {string} commandName The command to run.
   * @param {Object} args Its arguments, all of which arrive as strings in a real game.
   */
  const runCommand = (commandName, args) =>
  {
    const handler = registeredCommands.get(commandName);
    handler.call(interpreter, args);
  };

  /**
   * Advances a character one frame.
   *
   * Withdrawing a motion asks its effects to stop rather than dropping them where they stand, so
   * they are only let go on the next frame - which is what lets a transition travel home instead
   * of the character snapping. A test asserting that something is gone has to let that frame pass.
   * @param {Object} target The character to advance.
   */
  const passAFrame = target => CharacterMotionComposer.compose(target);

  describe('registration', () =>
  {
    it('registers exactly the two commands the plugin documents', () =>
    {
      // Assert
      expect(Array.from(registeredCommands.keys())).toEqual([ 'applyMotion', 'removeMotion' ]);
    });
  });

  describe('applyMotion', () =>
  {
    it('applies a motion to a named event', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'sway, 8, 100, sync',
        sourceKey: 'command',
        duration: '0',
      });

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
    });

    it('applies a motion to the player', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Player',
        targetId: '1',
        motion: 'float',
        sourceKey: 'command',
        duration: '0',
      });

      // Assert
      expect(CharacterMotionComposer.hasMotion(globalThis.$gamePlayer)).toBe(true);
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('applies a motion to the event running the command', () =>
    {
      // Arrange
      const runningEvent = { name: 'event-3' };
      globalThis.$gameMap = { event: eventId => (eventId === 3 ? runningEvent : null) };

      // Act
      runCommand('applyMotion', {
        target: 'This Event',
        targetId: '99',
        motion: 'float',
        sourceKey: 'command',
        duration: '0',
      });

      // Assert
      expect(CharacterMotionComposer.hasMotion(runningEvent)).toBe(true);
      CharacterMotionComposer.forget(runningEvent);
    });

    it('parses the motion parameters out of the string it was handed', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'sway, 8, 100, sync',
        sourceKey: 'command',
        duration: '0',
      });
      const ticks = 25;
      let composition = null;
      for (let index = 0; index < ticks; index++)
      {
        composition = CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(composition.valueFor(MotionChannels.OFFSET_X)).toBeCloseTo(8, 10);
    });

    it('files the motion under the source it was told to use', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'cutscene',
        duration: '0',
      });
      CharacterMotionComposer.removeDeclarations(event, 'command');

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
    });

    it('files the motion under `command` when no source was given', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: '',
        duration: '0',
      });
      CharacterMotionComposer.removeDeclarations(event, 'command');
      passAFrame(event);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('withdraws the motion once the duration it was given has elapsed', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'command',
        duration: '5',
      });
      const ticks = 6;
      for (let index = 0; index < ticks; index++)
      {
        CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('runs indefinitely when the duration will not parse as a number', () =>
    {
      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'command',
        duration: 'soon',
      });
      const ticks = 200;
      for (let index = 0; index < ticks; index++)
      {
        CharacterMotionComposer.compose(event);
      }

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
    });

    it('reports a target it cannot find rather than failing silently', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '99',
        motion: 'float',
        sourceKey: 'command',
        duration: '0',
      });

      // Assert
      expect(warned.mock.calls.at(0)
        .at(0)).toContain('could not find its target');
    });

    it('applies nothing when the motion itself is malformed', () =>
    {
      // Arrange
      vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'nonsense',
        sourceKey: 'command',
        duration: '0',
      });

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });
  });

  describe('removeMotion', () =>
  {
    it('withdraws what the named source applied', () =>
    {
      // Arrange
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'command',
        duration: '0',
      });

      // Act
      runCommand('removeMotion', { target: 'Event', targetId: '7', sourceKey: 'command' });
      passAFrame(event);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('leaves motions from other sources running', () =>
    {
      // Arrange
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'cutscene',
        duration: '0',
      });

      // Act
      runCommand('removeMotion', { target: 'Event', targetId: '7', sourceKey: 'command' });

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(true);
    });

    it('defaults to withdrawing the command source when none was named', () =>
    {
      // Arrange
      runCommand('applyMotion', {
        target: 'Event',
        targetId: '7',
        motion: 'float',
        sourceKey: 'command',
        duration: '0',
      });

      // Act
      runCommand('removeMotion', { target: 'Event', targetId: '7', sourceKey: '' });
      passAFrame(event);

      // Assert
      expect(CharacterMotionComposer.hasMotion(event)).toBe(false);
    });

    it('reports a target it cannot find rather than failing silently', () =>
    {
      // Arrange
      const warned = vi.spyOn(console, 'warn')
        .mockImplementation(() =>
        {
        });

      // Act
      runCommand('removeMotion', { target: 'Event', targetId: '99', sourceKey: 'command' });

      // Assert
      expect(warned.mock.calls.at(0)
        .at(0)).toContain('could not find its target');
    });
  });
});
//endregion plugins/motion/_component/plugin-commands.test.js