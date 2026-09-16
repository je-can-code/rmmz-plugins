//region plugins/message/ext/chatter/_component/engine-augmentations.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installMessageHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJMessageChatter,
} from '../../../_component/fixtures/install-message-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * These files augment engine classes rather than defining anything, so the classes have to exist as
 * globals before the modules are imported - importing one is what performs the patch.
 *
 * The two of them are really one rule about ordering, and it is the rule most likely to be got
 * wrong. A transfer sets the map up, which is what makes every event declare itself, and only
 * afterwards does the scene build anything - so the forgetting has to happen on the map rather than
 * on the scene, and it has to happen *before* the setup that declares the new map's events. Getting
 * either half backwards leaves a town permanently silent, which nothing reports.
 */
describe('J-Message-Chatter engine augmentations (direct src import)', () =>
{
  /** @type {object} the J umbrella as J-Base built it; J-Base's bootstrap is once-per-realm. */
  let realJ;

  /** @type {object} the manager as the patched files themselves see it. */
  let manager;

  /** @type {string[]} the order in which the map alias and its original ran. */
  let setupLog;

  /** @type {object[]} the comment commands the fake event page holds. */
  let pageCommands;

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
    globalThis.BubbleTargetResolver = {
      resolve: () => ({
        x: 1,
        y: 1,
      }),
    };

    // a map with the player standing right next to whoever is talking, so a declared character
    // speaks on the very next frame and the declaration is observable through what they say.
    globalThis.$gamePlayer = {
      x: 1,
      y: 1,
    };
    globalThis.$gameMap = {
      isEventRunning: () => false,
      distance: (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2),
    };
    vi.spyOn(Math, 'random')
      .mockReturnValue(0);

    await import('../../../../../../src/plugins/message/ext/chatter/_metadata/initialization.js');

    // the engine classes these files patch, in the shapes the patches actually rely on. The comment
    // reader is J-Base's real one, so the page below is filtered exactly as a real page would be.
    pageCommands = [];
    setupLog = [];

    function Game_Event()
    {
    }

    Game_Event.prototype.eventId = function()
    {
      return 5;
    };

    Game_Event.prototype.setupPage = function()
    {
      setupLog.push('original setupPage');
    };

    Game_Event.prototype.getValidCommentCommands = function()
    {
      return pageCommands;
    };

    function Game_Map()
    {
    }

    Game_Map.prototype.setup = function(_mapId)
    {
      setupLog.push(`original setup saw ${manager.isQuiet()}`);
    };

    globalThis.Game_Event = Game_Event;
    globalThis.Game_Map = Game_Map;

    const { default: FreshManager } = await import(
      '../../../../../../src/plugins/message/ext/chatter/managers/ChatterManager.js');
    manager = FreshManager;

    await import('../../../../../../src/plugins/message/ext/chatter/objects/Game_Event.js');
    await import('../../../../../../src/plugins/message/ext/chatter/objects/Game_Map.js');
  });

  /**
   * Puts a comment on the fake event page.
   * @param {string} text The comment's text.
   */
  function comment(text)
  {
    pageCommands.push({
      code: 108,
      parameters: [ text ],
    });
  }

  /**
   * Whether the event actually chatters, by letting it.
   *
   * Observed through what the character does rather than through a query added for the purpose: a
   * declaration that cannot make anybody speak is not a declaration.
   * @returns {?object} The line they started saying, or null if they said nothing.
   */
  function spokenLine()
  {
    manager.update();

    const found = manager.liveSessions()
      .find(([ token ]) => token === 'e5');

    if (found === undefined) return null;

    const [ , session ] = found;

    return session;
  }

  describe('Game_Event', () =>
  {
    it('still runs the original page setup', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();

      // Act
      event.setupPage();

      // Assert- everything else on a page - its movement, its trigger, its list - is set up by the
      // original, so an alias that replaced it would break the event entirely.
      expect(setupLog).toEqual([ 'original setupPage' ]);
    });

    it('declares the chatter a page asks for', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      comment('<chatter:Mind the step.>');

      // Act
      event.setupPage();

      // Assert
      expect(spokenLine()
        .line()).toBe('Mind the step.');
    });

    it('declares nothing for a page with no chatter on it', () =>
    {
      // Arrange- the overwhelming majority of events in a project, whose pages are full of other
      // plugins' comments and none of this one's.
      const event = new globalThis.Game_Event();
      comment('<light:[5, #ffbb73]>');

      // Act
      event.setupPage();

      // Assert
      expect(spokenLine()).toBe(null);
    });

    it('stops the chatter when a new page carries none', () =>
    {
      // Arrange- a chatty page one, then the page two of a merchant who has closed up for the night.
      const event = new globalThis.Game_Event();
      comment('<chatter:Mind the step.>');
      event.setupPage();

      // Act
      pageCommands = [];
      event.setupPage();

      // Assert
      expect(spokenLine()).toBe(null);
    });

    it('reads the comments out of the command shape the editor stores them in', () =>
    {
      // Arrange- the editor stores a comment block as one command for its first line and another for
      // each line after it, and a tag written on the second line has to be found just the same.
      const event = new globalThis.Game_Event();
      comment('<chatter:Mind the step.>');
      pageCommands.push({
        code: 408,
        parameters: [ '<chatterRadius:2>' ],
      });

      // Act
      event.setupPage();

      // Assert
      expect(spokenLine()
        .profile()
        .radius()).toBe(2);
    });
  });

  describe('Game_Map', () =>
  {
    it('still runs the original map setup', () =>
    {
      // Arrange
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert
      expect(setupLog).toEqual([ 'original setup saw true' ]);
    });

    it('forgets the map being left', () =>
    {
      // Arrange
      const event = new globalThis.Game_Event();
      comment('<chatter:Mind the step.>');
      event.setupPage();
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert- every token was naming somebody standing on the old map.
      expect(spokenLine()).toBe(null);
    });

    it('forgets before the original sets the new map up', () =>
    {
      // Arrange- the original is what makes every event on the new map declare itself, so a wipe
      // afterwards would take all of it with it and leave the town silent for good.
      const event = new globalThis.Game_Event();
      comment('<chatter:Mind the step.>');
      event.setupPage();
      const map = new globalThis.Game_Map();

      // Act
      map.setup(3);

      // Assert- the original saw an already-empty manager.
      expect(setupLog).toEqual([ 'original setupPage', 'original setup saw true' ]);
    });
  });
});
//endregion plugins/message/ext/chatter/_component/engine-augmentations.test.js