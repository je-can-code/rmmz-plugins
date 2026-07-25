//region plugins/time/core/_metadata/plugin-commands.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-TIME plugin commands (direct src import)', () =>
{
  let handlers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { TIME: { Metadata: { name: 'J-TIME' } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../src/plugins/time/core/_metadata/pluginCommands.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameTime = {
      hideMapWindow: vi.fn(),
      showMapWindow: vi.fn(),
      setTime: vi.fn(),
      addSeconds: vi.fn(),
      addMinutes: vi.fn(),
      addHours: vi.fn(),
      addDays: vi.fn(),
      addMonths: vi.fn(),
      addYears: vi.fn(),
      jumpToTimeOfDay: vi.fn(),
      deactivate: vi.fn(),
      activate: vi.fn(),
      unlockTone: vi.fn(),
      lockTone: vi.fn(),
    };
  });

  it('registers all ten commands under the J-TIME plugin name', () =>
  {
    // Arrange/Act (registration happened in beforeAll)

    // Assert
    expect(Object.keys(handlers)).toEqual([
      'hideMapTime', 'showMapTime', 'setTime', 'fastForwardtime', 'rewindTime',
      'jumpToTimeOfDay', 'stopTime', 'startTime', 'unlockTone', 'lockTone',
    ]);
  });

  it('hideMapTime hides the map window', () =>
  {
    // Arrange/Act
    handlers.hideMapTime();

    // Assert
    expect(globalThis.$gameTime.hideMapWindow).toHaveBeenCalled();
  });

  it('showMapTime shows the map window', () =>
  {
    // Arrange/Act
    handlers.showMapTime();

    // Assert
    expect(globalThis.$gameTime.showMapWindow).toHaveBeenCalled();
  });

  it('setTime parses and applies every field', () =>
  {
    // Arrange
    const args = { Second: '1', Minute: '2', Hour: '3', Day: '4', Month: '5', Year: '6' };

    // Act
    handlers.setTime(args);

    // Assert
    expect(globalThis.$gameTime.setTime).toHaveBeenCalledWith(1, 2, 3, 4, 5, 6);
  });

  it('fastForwardtime adds each parsed field forward', () =>
  {
    // Arrange
    const args = { Second: '1', Minute: '2', Hour: '3', Day: '4', Month: '5', Year: '6' };

    // Act
    handlers.fastForwardtime(args);

    // Assert
    expect(globalThis.$gameTime.addSeconds).toHaveBeenCalledWith(1);
    expect(globalThis.$gameTime.addMinutes).toHaveBeenCalledWith(2);
    expect(globalThis.$gameTime.addHours).toHaveBeenCalledWith(3);
    expect(globalThis.$gameTime.addDays).toHaveBeenCalledWith(4);
    expect(globalThis.$gameTime.addMonths).toHaveBeenCalledWith(5);
    expect(globalThis.$gameTime.addYears).toHaveBeenCalledWith(6);
  });

  it('rewindTime adds each parsed field negated', () =>
  {
    // Arrange
    const args = { Second: '1', Minute: '2', Hour: '3', Day: '4', Month: '5', Year: '6' };

    // Act
    handlers.rewindTime(args);

    // Assert
    expect(globalThis.$gameTime.addSeconds).toHaveBeenCalledWith(-1);
    expect(globalThis.$gameTime.addMinutes).toHaveBeenCalledWith(-2);
    expect(globalThis.$gameTime.addHours).toHaveBeenCalledWith(-3);
    expect(globalThis.$gameTime.addDays).toHaveBeenCalledWith(-4);
    expect(globalThis.$gameTime.addMonths).toHaveBeenCalledWith(-5);
    expect(globalThis.$gameTime.addYears).toHaveBeenCalledWith(-6);
  });

  it('jumpToTimeOfDay parses and jumps to the given time of day', () =>
  {
    // Arrange
    const args = { TimeOfDay: '2' };

    // Act
    handlers.jumpToTimeOfDay(args);

    // Assert
    expect(globalThis.$gameTime.jumpToTimeOfDay).toHaveBeenCalledWith(2);
  });

  it('stopTime deactivates the time system', () =>
  {
    // Arrange/Act
    handlers.stopTime();

    // Assert
    expect(globalThis.$gameTime.deactivate).toHaveBeenCalled();
  });

  it('startTime activates the time system', () =>
  {
    // Arrange/Act
    handlers.startTime();

    // Assert
    expect(globalThis.$gameTime.activate).toHaveBeenCalled();
  });

  it('unlockTone unlocks the screen tone', () =>
  {
    // Arrange/Act
    handlers.unlockTone();

    // Assert
    expect(globalThis.$gameTime.unlockTone).toHaveBeenCalled();
  });

  it('lockTone locks the screen tone', () =>
  {
    // Arrange/Act
    handlers.lockTone();

    // Assert
    expect(globalThis.$gameTime.lockTone).toHaveBeenCalled();
  });
});
//endregion plugins/time/core/_metadata/plugin-commands.test.js
