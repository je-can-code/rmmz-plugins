//region plugins/message/_component/game-message-weld.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installMessageHostGlobals, setPluginContextToJBase, setPluginContextToJMessage } from './fixtures/install-message-host-globals.js';

/**
 * The code that welds one message to the next has to be gone by the time anybody reads the line.
 * Lifting it here, as the line arrives, rather than while the message is being drawn is what keeps it
 * from occupying width in a window and, if nothing happened to consume it, being drawn to the screen
 * for a player to puzzle over.
 */
describe('J-Message Game_Message message welding (direct src import)', () =>
{
  let message;

  beforeAll(async () =>
  {
    vi.resetModules();

    installMessageHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJMessage();
    await import('../../../../src/plugins/message/core/_metadata/initialization.js');

    // vanilla accessor this file reads through.
    globalThis.Game_Message.prototype.choices = function() { return this._choices; };

    // patches globalThis.Game_Message.prototype directly, no vm involved.
    await import('../../../../src/plugins/message/core/objects/Game_Message.js');
  });

  beforeEach(() =>
  {
    message = new globalThis.Game_Message();
    message._choices = [];
    message.clear();
  });

  it('lifts the code out of the line and remembers it was asked', () =>
  {
    // Arrange & Act
    message.add('I have been thinking about this.\\more');

    // Assert
    expect(message.texts()).toEqual([ 'I have been thinking about this.' ]);
    expect(message.hasMoreLink()).toBe(true);
  });

  it('reads the code in the middle of a line as readily as the end of one', () =>
  {
    // Arrange & Act
    message.add('one thing\\more and another');

    // Assert
    expect(message.texts()).toEqual([ 'one thing and another' ]);
    expect(message.hasMoreLink()).toBe(true);
  });

  it('leaves a line that never asked for more exactly as it was written', () =>
  {
    // Arrange & Act
    message.add('and that was the end of it.');

    // Assert
    expect(message.texts()).toEqual([ 'and that was the end of it.' ]);
    expect(message.hasMoreLink()).toBe(false);
  });

  it('refuses a longer code that merely begins the same way', () =>
  {
    // Arrange & Act
    // a code somebody invents later has to survive this one intact, or half of it reaches the player.
    message.add('\\moreover, it rained.');

    // Assert
    expect(message.texts()).toEqual([ '\\moreover, it rained.' ]);
    expect(message.hasMoreLink()).toBe(false);
  });

  it('goes on asking for more when a later line of the same message does not mention it', () =>
  {
    // Arrange- the code may sit on any line, so a line finding nothing says nothing about the ones
    // before it. Lowering the flag belongs to the interpreter, which knows where a message ends.
    message.add('I have been thinking about this.\\more');

    // Act
    message.add('for quite a while, in fact.');

    // Assert
    expect(message.texts()).toEqual([ 'I have been thinking about this.', 'for quite a while, in fact.' ]);
    expect(message.hasMoreLink()).toBe(true);
  });

  it('forgets that it was asked once the message is cleared', () =>
  {
    // Arrange
    message.add('I have been thinking about this.\\more');

    // Act
    message.clear();

    // Assert
    expect(message.hasMoreLink()).toBe(false);
  });
});
//endregion plugins/message/_component/game-message-weld.test.js