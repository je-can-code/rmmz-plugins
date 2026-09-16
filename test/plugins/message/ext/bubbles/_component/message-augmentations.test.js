//region plugins/message/ext/bubbles/_component/message-augmentations.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageBubbles,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * These three files augment engine classes rather than defining anything, so the classes have to
 * exist as globals before the modules are imported - importing one is what performs the patch.
 *
 * The stubs are deliberately the real shapes: `Game_Message.initialize` reaching `clear` is what
 * makes the bubble fields exist on a fresh message at all, and `command101` gathering its lines
 * through `add` is what makes the pop code get read out of them.
 */
describe('J-Message-Bubbles engine augmentations (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  /** @type {string[]} the order in which the interpreter alias and its original ran. */
  let commandLog;

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

    // the engine classes these files patch, in the shapes the patches actually rely on.
    function Game_Message()
    {
      this.initialize();
    }

    Game_Message.prototype.initialize = function()
    {
      this.clear();
    };

    Game_Message.prototype.clear = function()
    {
      this._texts = [];
    };

    Game_Message.prototype.add = function(text)
    {
      this._texts.push(text);
    };

    commandLog = [];

    function Game_Interpreter()
    {
    }

    Game_Interpreter.prototype.eventId = function()
    {
      return 12;
    };

    Game_Interpreter.prototype.command101 = function()
    {
      commandLog.push(`original saw host ${globalThis.$gameMessage.bubbleHostEventId()}`);

      return true;
    };

    function Game_CharacterBase()
    {
    }

    Game_CharacterBase.prototype.screenY = function()
    {
      return 300;
    };

    globalThis.Game_Message = Game_Message;
    globalThis.Game_Interpreter = Game_Interpreter;
    globalThis.Game_CharacterBase = Game_CharacterBase;
    globalThis.$gameMap = { tileHeight: () => 48 };

    await import('../../../../../../src/plugins/message/ext/bubbles/objects/Game_Message.js');
    await import('../../../../../../src/plugins/message/ext/bubbles/objects/Game_Interpreter.js');
    await import('../../../../../../src/plugins/message/ext/bubbles/objects/Game_CharacterBase.js');

    globalThis.$gameMessage = new globalThis.Game_Message();
  });

  describe('Game_Message', () =>
  {
    it('starts a fresh message floating above nobody', () =>
    {
      // Arrange & Act
      const target = globalThis.$gameMessage.bubbleTarget();

      // Assert- clear runs from initialize, so a message never has to be cleared to be usable.
      expect(target).toBe('');
    });

    it('starts a fresh message with no host event', () =>
    {
      // Arrange & Act
      const hostEventId = globalThis.$gameMessage.bubbleHostEventId();

      // Assert
      expect(hostEventId).toBe(0);
    });

    it('reads the target out of a line carrying a pop code', () =>
    {
      // Arrange & Act
      globalThis.$gameMessage.add('\\pop[a1]That signpost is judging me.');

      // Assert
      expect(globalThis.$gameMessage.bubbleTarget()).toBe('a1');
    });

    it('keeps the pop code out of the line a player reads', () =>
    {
      // Arrange & Act
      // left in, the code would occupy width, push a wrap, and print itself if anything failed to
      // consume it.
      globalThis.$gameMessage.add('\\pop[a1]That signpost is judging me.');

      // Assert
      expect(globalThis.$gameMessage._texts).toEqual([ 'That signpost is judging me.' ]);
    });

    it('finds a pop code an author left at the end of the line', () =>
    {
      // Arrange & Act
      globalThis.$gameMessage.add('That signpost is judging me.\\pop[e12]');

      // Assert
      expect(globalThis.$gameMessage.bubbleTarget()).toBe('e12');
      expect(globalThis.$gameMessage._texts).toEqual([ 'That signpost is judging me.' ]);
    });

    it('leaves a line carrying no pop code entirely alone', () =>
    {
      // Arrange & Act
      // the overwhelming majority of lines, including every line after the first of a floating one.
      globalThis.$gameMessage.add('It has no opinions.');

      // Assert
      expect(globalThis.$gameMessage._texts).toEqual([ 'It has no opinions.' ]);
      expect(globalThis.$gameMessage.bubbleTarget()).toBe('');
    });

    it('keeps the target a first line set when later lines carry no code', () =>
    {
      // Arrange
      globalThis.$gameMessage.add('\\pop[a1]That signpost is judging me.');

      // Act
      globalThis.$gameMessage.add('It really is.');

      // Assert
      expect(globalThis.$gameMessage.bubbleTarget()).toBe('a1');
    });

    it('forgets the target when the message is cleared', () =>
    {
      // Arrange
      globalThis.$gameMessage.add('\\pop[a1]That signpost is judging me.');

      // Act
      globalThis.$gameMessage.clear();

      // Assert- a stale target would float the next message above whoever spoke the last one.
      expect(globalThis.$gameMessage.bubbleTarget()).toBe('');
    });
  });

  describe('Game_Interpreter', () =>
  {
    it('tells the message which event is running it', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();

      // Act
      interpreter.command101([]);

      // Assert
      expect(globalThis.$gameMessage.bubbleHostEventId()).toBe(12);
    });

    it('stashes the event before the original gathers the text', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();

      // Act
      interpreter.command101([]);

      // Assert- gathering a line is where its pop code gets read, so an id set afterward would
      // arrive too late for the very message it belongs to.
      expect(commandLog).toEqual([ 'original saw host 12' ]);
    });

    it('hands back whatever the original answered', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();

      // Act
      const handled = interpreter.command101([]);

      // Assert- the interpreter reads this to decide whether the command consumed its turn.
      expect(handled).toBe(true);
    });
  });

  describe('Game_CharacterBase', () =>
  {
    it('aims a tail at a character head when the bubble is above them', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const anchorY = character.bubbleAnchorY(false);

      // Assert- one tile above the ground they are standing on, so the tail does not have to cross
      // their whole sprite to reach them.
      expect(anchorY).toBe(252);
    });

    it('aims a tail at a character feet when the bubble is below them', () =>
    {
      // Arrange
      const character = new globalThis.Game_CharacterBase();

      // Act
      const anchorY = character.bubbleAnchorY(true);

      // Assert- the ground they are standing on. Aiming at the head from underneath would put the
      // bubble on top of them instead of under them.
      expect(anchorY).toBe(300);
    });
  });
});
//endregion plugins/message/ext/bubbles/_component/message-augmentations.test.js