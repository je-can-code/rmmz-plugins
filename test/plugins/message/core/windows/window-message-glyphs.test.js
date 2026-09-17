//region plugins/message/core/windows/window-message-glyphs.test.js
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { repoRoot } from '../../../../setup/repo-root.js';
import { clearDrawnText, drawnText, installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * The seam between the engine's text pipeline and the glyph plane, against the real
 * `Window_Message` rather than a stand-in - because the thing being proved is which of the engine's
 * own paths reach the replacement and which do not, and a stubbed base class would answer whatever
 * the stub was written to answer.
 *
 * The fall-through cases are the ones that matter most. `Window_Message` inherits `drawTextEx` and
 * `textSizeEx`, and both run the entire text pipeline on a text state of their own; if either of
 * them started emitting glyphs, every measurement the window took of itself would also quietly add
 * letters to the screen. Nothing in vanilla calls them on a message window today, which is exactly
 * why the guard has to be tested rather than observed.
 *
 * Text *metrics* are deliberately not asserted here. The harness fakes `measureTextWidth` as ten
 * pixels per character, so any expectation about where a glyph sits horizontally would be measuring
 * the fake. Structure is real; geometry is not.
 */
describe('Window_Message glyph pipeline', () =>
{
  /**
   * A message window with the sub-windows the engine dereferences without checking.
   * @returns {Window_Message}
   */
  function messageWindow()
  {
    const window = new Window_Message(new Rectangle(0, 0, 800, 160));

    // `newPage` reaches the name box and `terminateMessage` reaches the gold window, both of them
    // unguarded. A scene wires these up; a test has to do it by hand or the first page throws.
    window.setNameBoxWindow({
      setName: () => {},
      start: () => {},
      close: () => {},
      isOpen: () => false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
    window.setGoldWindow({
      open: () => {},
      close: () => {},
      isOpen: () => false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });

    return window;
  }

  /**
   * Reveals a whole message into the window, the way the engine's update loop would over time.
   * @param {Window_Message} window The window to reveal into.
   * @param {string} text The message text, escape codes included.
   */
  function revealMessage(window, text)
  {
    $gameMessage.clear();
    $gameMessage.add(text);

    window.startMessage();
    window.processAllText(window.textState());
  }

  /**
   * The glyphs currently on the window's plane.
   * @param {Window_Message} window The window to read.
   * @returns {MessageGlyph[]}
   */
  function glyphsOf(window)
  {
    return window.messageGlyphLayer()
      .glyphSprites()
      .map(sprite => sprite.glyph());
  }

  beforeAll(async () =>
  {
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.$plugins = [];

    // J-Base owns `TextRasterMetrics`, the device-scaled `Bitmap`, and the escape code parsing that
    // `\_` and `\*` ride on. Loading the shipped bundle is how a J-Base global reaches a test, since
    // a plugin source file may never import across a ship boundary.
    const bundle = path.join(repoRoot, 'project/js/plugins/base/J-Base.js');
    vm.runInThisContext(fs.readFileSync(bundle, 'utf-8'), { filename: bundle });

    // the plugin reads its speaker profiles off the filesystem at load time; answering null is the
    // "this project has written no voices" path, which leaves every speaker on the engine's pace.
    globalThis.StorageManager.fsReadFile = () => null;

    globalThis.__PLUGIN_NAME__ = 'J-Message';
    globalThis.__PLUGIN_VERSION__ = '2.0.0';

    await import('../../../../../src/plugins/message/core/_metadata/initialization.js');

    // the window sizes itself from how many lines the message holds, and asking that is an accessor
    // this plugin adds - the engine keeps its lines private and offers only `allText` against them.
    await import('../../../../../src/plugins/message/core/objects/Game_Message.js');
    await import('../../../../../src/plugins/message/core/windows/Window_Message.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameMessage = new Game_Message();
  });

  describe('emitting', () =>
  {
    it('emits one glyph per character of a revealed message', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      revealMessage(window, 'abc');

      // Assert
      expect(glyphsOf(window).map(glyph => glyph.character))
        .toEqual([ 'a', 'b', 'c' ]);
    });

    it('draws nothing into the window contents for a revealed message', () =>
    {
      // Arrange
      const window = messageWindow();
      clearDrawnText();

      // Act
      revealMessage(window, 'abc');

      // Assert
      // the whole point of the pipeline: the text is sprites, not pixels in the contents bitmap.
      expect(drawnText).toEqual([]);
    });

    it('numbers glyphs continuously across a colour change mid-word', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      // the colour code splits the run in two; a per-run counter would restart the second half.
      revealMessage(window, 'ab\\C[2]cd');

      // Assert
      expect(glyphsOf(window).map(glyph => glyph.index))
        .toEqual([ 0, 1, 2, 3 ]);
    });

    it('survives two text codes with nothing between them', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      // the engine flushes at every control character, so back-to-back codes flush an empty run
      // between them. This is the exact shape Galv's plugin shipped broken for the wait codes.
      revealMessage(window, 'a\\C[2]\\C[3]b');

      // Assert
      expect(glyphsOf(window).map(glyph => glyph.character))
        .toEqual([ 'a', 'b' ]);
    });

    it('emits an inline icon as a glyph of its own', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      revealMessage(window, 'a\\I[87]b');

      // Assert
      const glyphs = glyphsOf(window);
      const iconGlyphs = glyphs.filter(glyph => glyph.isIcon() === true);
      expect(iconGlyphs.length).toBe(1);
      expect(iconGlyphs[ 0 ].iconIndex).toBe(87);
      expect(glyphs.length).toBe(3);
    });
  });

  describe('effect codes', () =>
  {
    it('marks glyphs inside an opened effect span', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      revealMessage(window, 'a\\~b\\~c');

      // Assert
      // only the middle character sits inside the span; the two outside it must stay still.
      const effectsByCharacter = {};
      glyphsOf(window)
        .forEach(glyph =>
        {
          effectsByCharacter[ glyph.character ] = glyph.effects;
        });
      expect(effectsByCharacter.a).toEqual([]);
      expect(effectsByCharacter.b).toEqual([ 'wave' ]);
      expect(effectsByCharacter.c).toEqual([]);
    });

    it('distinguishes one effect code from another', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      revealMessage(window, '\\%a\\%\\=b\\=');

      // Assert
      const effectsByCharacter = {};
      glyphsOf(window)
        .forEach(glyph =>
        {
          effectsByCharacter[ glyph.character ] = glyph.effects;
        });
      expect(effectsByCharacter.a).toEqual([ 'jitter' ]);
      expect(effectsByCharacter.b).toEqual([ 'rainbow' ]);
    });

    it('leaves the italics code to J-Base rather than swallowing it', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      // vanilla's message handler ends by delegating to the base, and the base is where `\_` lives.
      revealMessage(window, 'a\\_b');

      // Assert
      const glyphs = glyphsOf(window);
      const [ plainGlyph, slantedGlyph ] = glyphs;
      expect(plainGlyph.italic).toBe(false);
      expect(slantedGlyph.italic).toBe(true);
    });

    it('leaves the bold code to J-Base rather than swallowing it', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      revealMessage(window, 'a\\*b');

      // Assert
      const [ plainGlyph, boldGlyph ] = glyphsOf(window);
      expect(plainGlyph.bold).toBe(false);
      expect(boldGlyph.bold).toBe(true);
    });
  });

  describe('falling through', () =>
  {
    it('draws into the contents when asked to draw text outside a message', () =>
    {
      // Arrange
      const window = messageWindow();
      clearDrawnText();

      // Act
      // `drawTextEx` is ordinary drawing that happens to be performed on this window, and it must
      // keep landing in the contents bitmap the way it does on every other window in the game.
      window.drawTextEx('not a message', 0, 0, 400);

      // Assert
      // both halves matter: no glyphs is the guard, and the drawing having happened at all is the
      // proof that the guard sent it somewhere rather than simply dropping it.
      expect(glyphsOf(window)).toEqual([]);
      expect(drawnText.length).toBeGreaterThan(0);
    });

    it('emits nothing when measuring itself', () =>
    {
      // Arrange
      const window = messageWindow();

      // Act
      // `textSizeEx` runs the entire pipeline with drawing switched off; a measurement that added
      // letters to the screen would be a spectacular way to find out this guard was missing.
      window.textSizeEx('measure me');

      // Assert
      expect(glyphsOf(window)).toEqual([]);
    });

    it('keeps emitting for the message after an unrelated draw', () =>
    {
      // Arrange
      const window = messageWindow();
      window.drawTextEx('not a message', 0, 0, 400);

      // Act
      revealMessage(window, 'abc');

      // Assert
      expect(glyphsOf(window).length).toBe(3);
    });
  });

  describe('skipping', () =>
  {
    /**
     * Opens a message without revealing any of it, so a character is still waiting to be paced.
     * @param {Window_Message} window The window to open into.
     * @param {string} text The message text.
     */
    function beginMessage(window, text)
    {
      $gameMessage.clear();
      $gameMessage.add(text);
      window.startMessage();
    }

    /**
     * A profile that paces noticeably, so a wait that should not happen is visible when it does.
     * @returns {object} A speaker profile stand-in.
     */
    function slowProfile()
    {
      return {
        framesPerCharacter: 5,
        punctuationFrames: {},
        baselineEffects: [],
        hasVoice: () => false,
        voiceStride: 1,
        voiceSe: () => ({ name: '', volume: 0, pitch: 100, pan: 0 }),
      };
    }

    it('paces a character when the message is being read at the speaker\'s own speed', () =>
    {
      // Arrange
      const window = messageWindow();
      beginMessage(window, 'abc');
      window.setMessageProfile(slowProfile());
      window._waitCount = 0;
      window._showFast = false;
      window._lineShowFast = false;

      // Act
      window.speakMessageCharacter(window.textState());

      // Assert
      // five frames per character is four more than the engine already spends.
      expect(window._waitCount).toBe(4);
    });

    it('adds no pacing wait while the player is holding the message forward', () =>
    {
      // Arrange
      const window = messageWindow();
      beginMessage(window, 'abc');
      window.setMessageProfile(slowProfile());
      window._waitCount = 0;
      window._showFast = true;

      // Act
      window.speakMessageCharacter(window.textState());

      // Assert
      // the engine skips ahead by staying inside its reveal loop, and it only stays there while
      // nothing is waiting - so a wait added here keeps the page crawling through a skip.
      expect(window._waitCount).toBe(0);
    });

    it('adds no pacing wait on a line marked to show fast', () =>
    {
      // Arrange
      const window = messageWindow();
      beginMessage(window, 'abc');
      window.setMessageProfile(slowProfile());
      window._waitCount = 0;
      window._showFast = false;
      window._lineShowFast = true;

      // Act
      window.speakMessageCharacter(window.textState());

      // Assert
      expect(window._waitCount).toBe(0);
    });
  });

  describe('clearing', () =>
  {
    it('keeps the letters on screen while the finished message fades out', () =>
    {
      // Arrange
      const window = messageWindow();
      revealMessage(window, 'abc');

      // Act
      window.terminateMessage();

      // Assert- the letters are what is being faded. Clearing them here is what the engine's own
      // close does by hiding the client area, and it is why a message appeared to blink away.
      expect(glyphsOf(window)).toHaveLength(3);
    });

    it('empties the plane once the fade has run its course', () =>
    {
      // Arrange
      const window = messageWindow();
      revealMessage(window, 'abc');
      window.terminateMessage();

      // Act
      const frames = window.fadeFrames();
      Array.from({ length: frames })
        .forEach(() => window.updateMessageFade());

      // Assert
      expect(glyphsOf(window)).toEqual([]);
    });

    it('empties the plane at a page break', () =>
    {
      // Arrange
      const window = messageWindow();
      revealMessage(window, 'abc');

      // Act
      window.newPage(window.textState());

      // Assert
      expect(glyphsOf(window)).toEqual([]);
    });

    it('closes an emphasis the author left open at a page break', () =>
    {
      // Arrange
      const window = messageWindow();
      revealMessage(window, 'a\\~b');

      // Act
      window.newPage(window.textState());

      // Assert
      expect(window.textState().spanEffects.size).toBe(0);
    });

    it('restarts the plane clock at a page break', () =>
    {
      // Arrange
      const window = messageWindow();
      revealMessage(window, 'abc');
      window.messageGlyphLayer()
        .update();

      // Act
      window.newPage(window.textState());

      // Assert
      // a wave that kept counting would arrive on page two already mid-swell.
      expect(window.messageGlyphLayer()
        .frame())
        .toBe(0);
    });
  });
});
//endregion plugins/message/core/windows/window-message-glyphs.test.js