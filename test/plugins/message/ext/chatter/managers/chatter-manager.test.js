//region plugins/message/ext/chatter/managers/chatter-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatterManager from '../../../../../../src/plugins/message/ext/chatter/managers/ChatterManager.js';
import ChatterProfile from '../../../../../../src/plugins/message/ext/chatter/__models/ChatterProfile.js';

/**
 * Almost every case here holds two characters, and that is the point rather than thoroughness. This
 * manager's whole job is telling them apart: silencing the one being spoken to, cutting the one the
 * player walked away from, cooling down the one who just spoke. With a single character in the map,
 * "stop that one" and "stop everybody" are the same program, and the second one would empty a town
 * every time anybody opened their mouth.
 *
 * The characters are plain positions rather than events. Everything the manager asks of a target
 * goes through the resolver, so a stand-in that answers the same questions is the whole of what it
 * needs - and it lets a character be moved out of earshot without a map existing.
 */
describe('J-Message-Chatter ChatterManager (direct src import)', () =>
{
  /** @type {Map<string, ?object>} where each token's character is standing, if anywhere. */
  let characters;

  beforeAll(() =>
  {
    // the models seed string fields from String.empty, which J-Base installs onto String.
    if (String.empty === undefined)
    {
      Object.defineProperty(String, 'empty', {
        value: '',
        writable: false,
        configurable: true,
      });
    }
  });

  beforeEach(() =>
  {
    characters = new Map();

    // the project has configured no chatter defaults, which is the state of every project until
    // somebody writes the section.
    globalThis.MessageConfig = { section: () => ({}) };

    globalThis.$gamePlayer = {
      x: 0,
      y: 0,
    };

    globalThis.$gameMap = {
      isEventRunning: () => false,
      distance: (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2),
    };

    globalThis.BubbleTargetResolver = {
      resolve: token => characters.get(token) ?? null,
    };
  });

  afterEach(() =>
  {
    // the map of states is a static that outlives the test file.
    ChatterManager.clear();

    vi.restoreAllMocks();
  });

  /**
   * Puts a character on the map at a given distance from the player, declaring nothing.
   * @param {string} token The target token they answer to.
   * @param {number} distance How many tiles from the player they stand.
   */
  function stand(token, distance)
  {
    characters.set(token, {
      x: distance,
      y: 0,
    });
  }

  /**
   * Puts a character on the map at a given distance from the player, and gives them a pool.
   * @param {string} token The target token they chatter under.
   * @param {number} distance How many tiles from the player they stand.
   * @param {object} values Anything to override on their profile.
   * @returns {ChatterProfile} The profile they were declared with.
   */
  function place(token, distance, values = {})
  {
    characters.set(token, {
      x: distance,
      y: 0,
    });

    const base = { lines: [ `${token} says something.` ] };
    const profile = ChatterProfile.fromValues(Object.assign(base, values));

    ChatterManager.declare(token, profile);

    return profile;
  }

  /**
   * The tokens of everybody currently saying something.
   * @returns {string[]}
   */
  function speakers()
  {
    return ChatterManager.liveSessions()
      .map(([ token ]) => token);
  }

  /**
   * The live line of one token, or null if they are quiet.
   * @param {string} token The target token.
   * @returns {?ChatterSession}
   */
  function sessionOf(token)
  {
    const found = ChatterManager.liveSessions()
      .find(([ each ]) => each === token);

    if (found === undefined) return null;

    const [ , session ] = found;

    return session;
  }

  /**
   * Makes every roll come up at the bottom of its range, so a character speaks at the first chance.
   */
  function rollLowest()
  {
    vi.spyOn(Math, 'random')
      .mockReturnValue(0);
  }

  describe('naming a target', () =>
  {
    it('rewrites self into the event that is running', () =>
    {
      // Arrange & Act
      const token = ChatterManager.normalizeToken('self', 12);

      // Assert- a page declares under `e12` and a message pops `\pop[self]`; unless these agree,
      // talking to somebody would not stop them muttering.
      expect(token).toBe('e12');
    });

    it('leaves a target that already names somebody alone', () =>
    {
      // Arrange & Act
      const token = ChatterManager.normalizeToken('e12', 99);

      // Assert- the near miss for the rewrite: a host event id is present and must be ignored.
      expect(token).toBe('e12');
    });

    it('meets an author halfway on spacing and casing', () =>
    {
      // Arrange & Act
      const token = ChatterManager.normalizeToken('  Self ', 4);

      // Assert
      expect(token).toBe('e4');
    });

    it('names an event the way a page declares it', () =>
    {
      // Arrange & Act
      const token = ChatterManager.eventToken(7);

      // Assert
      expect(token).toBe('e7');
    });
  });

  describe('declaring a page', () =>
  {
    it('lets a declared character speak', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);

      // Act
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('says the line the page declared', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);

      // Act
      ChatterManager.update();

      // Assert
      expect(sessionOf('e1')
        .line()).toBe('e1 says something.');
    });

    it('forgets a character whose new page gave them nothing to say', () =>
    {
      // Arrange- a chatty page one, then the page two of somebody who has stopped being chatty.
      rollLowest();
      place('e1', 1);
      place('e2', 1);
      ChatterManager.update();

      // Act
      ChatterManager.declare('e1', ChatterProfile.fromValues({ radius: 9 }));

      // Assert- theirs stops and everybody else carries on.
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('leaves the timers alone when a page is re-declared', () =>
    {
      // Arrange- a long wait rolled, then the same page declared again. The engine re-runs page
      // setup for every event whenever any self-switch flips anywhere on the map.
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.5);
      const profile = place('e1', 1, { delay: 300 });
      ChatterManager.update();

      // Act- a re-declaration, with the dice now guaranteeing an immediate line if they were rolled.
      ChatterManager.declare('e1', profile);
      vi.spyOn(Math, 'random')
        .mockReturnValue(0);
      ChatterManager.update();

      // Assert- still serving the wait it rolled the first time, rather than starting over.
      expect(speakers()).toEqual([]);
    });
  });

  describe('deciding who speaks', () =>
  {
    it('leaves a character out of earshot quiet', () =>
    {
      // Arrange- one inside the radius and one beyond it, so "nobody speaks" cannot pass for
      // "the far one does not".
      rollLowest();
      place('e1', 1, { radius: 5 });
      place('e2', 9, { radius: 5 });

      // Act
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('does not run down the wait of a character out of earshot', () =>
    {
      // Arrange- a one frame wait, served while far away.
      vi.spyOn(Math, 'random')
        .mockReturnValue(0);
      place('e1', 9, { radius: 5, delay: 0 });

      // Act
      ChatterManager.update();
      ChatterManager.update();

      // Assert- walking into a market has to start the muttering over the next few seconds, not
      // deliver all of it on the frame somebody crosses a line on the floor.
      expect(speakers()).toEqual([]);
    });

    it('does not credit a wait served out of earshot once the player arrives', () =>
    {
      // Arrange- a full three hundred frame wait, every frame of it spent far away.
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.9999);
      place('e1', 9, { radius: 5, delay: 300 });

      Array.from({ length: 300 })
        .forEach(() => ChatterManager.update());

      // Act
      characters.get('e1').x = 1;
      ChatterManager.update();

      // Assert- the wait starts when the player can hear how it ends. Serving it from across the map
      // would mean walking into a market square and having every line in it fire at once.
      expect(speakers()).toEqual([]);
    });

    it('speaks once the player comes into earshot', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 9, { radius: 5 });
      ChatterManager.update();

      // Act
      characters.get('e1').x = 2;
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('stays quiet while a character still owes a wait', () =>
    {
      // Arrange- a wait of three hundred frames, with one of them served.
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.9999);
      place('e1', 1, { delay: 300 });

      // Act
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([]);
    });

    it('stays quiet while a character is resting', () =>
    {
      // Arrange- a line said and finished, which seeds the rest.
      rollLowest();
      place('e1', 1, { duration: 1, cooldown: 600 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();
      ChatterManager.update();
      ChatterManager.update();

      // Act
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([]);
    });

    it('speaks again once the rest is over', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { duration: 0, cooldown: 1 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();

      // Act- one frame ends the line, one serves the single frame of rest, one starts the next.
      ChatterManager.update();
      ChatterManager.update();
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('stays quiet for a token naming nobody on this map', () =>
    {
      // Arrange- a page copied in from another map, naming an event that does not exist here.
      rollLowest();
      place('e1', 1);
      characters.delete('e1');

      // Act
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([]);
    });
  });

  describe('a line in progress', () =>
  {
    it('does not spend a line time on screen while it is still typing out', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { duration: 2 });
      ChatterManager.update();

      // Act- many frames, none of which the bubble has reported a finished reveal for.
      ChatterManager.update();
      ChatterManager.update();
      ChatterManager.update();

      // Assert- a long line has to be readable for as long as a short one, so the clock cannot start
      // until the words are all there.
      expect(sessionOf('e1')
        .durationRemaining()).toBe(2);
    });

    it('spends a line time on screen once it has typed itself out', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { duration: 2 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();

      // Act
      ChatterManager.update();

      // Assert
      expect(sessionOf('e1')
        .durationRemaining()).toBe(1);
    });

    it('takes a line down once its time on screen is spent', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { duration: 1 });
      place('e2', 1, { duration: 600 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();

      // Act
      ChatterManager.update();
      ChatterManager.update();

      // Assert- only the one whose time ran out; the other is mid-line.
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('cuts off a line the player has walked away from', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { radius: 5 });
      place('e2', 1, { radius: 5 });
      ChatterManager.update();

      // Act
      characters.get('e1').x = 9;
      ChatterManager.update();

      // Assert- out of earshot means out of earshot, and only for the one walked away from.
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('cuts off a line whose speaker stopped existing', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);
      ChatterManager.update();

      // Act
      characters.delete('e1');
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([]);
    });

    it('rests a character for exactly the cooldown once their line ends', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { duration: 0, cooldown: 2 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();

      // Act- the frame that ends the line, then the two that serve the rest.
      ChatterManager.update();
      ChatterManager.update();
      ChatterManager.update();

      // Assert- still quiet after two frames of rest, and talking on the frame after, which pins the
      // rest to the length it was given rather than to any length at all.
      expect(speakers()).toEqual([]);

      ChatterManager.update();
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('never says the same line twice running', () =>
    {
      // Arrange
      rollLowest();
      const pool = [ 'Half price today.', 'Mind the step.' ];
      ChatterManager.declare('e1', ChatterProfile.fromValues({
        lines: pool,
        duration: 0,
        cooldown: 0,
      }));
      characters.set('e1', {
        x: 1,
        y: 0,
      });
      ChatterManager.update();
      const first = sessionOf('e1')
        .line();
      sessionOf('e1')
        .flagRevealed();

      // Act
      ChatterManager.update();
      ChatterManager.update();

      // Assert
      expect(sessionOf('e1')
        .line()).not.toBe(first);
    });
  });

  describe('being interrupted', () =>
  {
    it('silences the character a message is being spoken by', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);
      place('e2', 1);
      ChatterManager.update();

      // Act
      ChatterManager.silence('e1');

      // Assert- somebody you have started talking to stops muttering; the shopkeeper two doors down
      // carries on.
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('rests a character who was silenced mid-line', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1, { cooldown: 600 });
      ChatterManager.update();

      // Act
      ChatterManager.silence('e1');
      ChatterManager.update();

      // Assert- they do not simply start again on the very next frame.
      expect(speakers()).toEqual([]);
    });

    it('ignores a silence aimed at somebody who never chatters', () =>
    {
      // Arrange- by far the common case, since most messages in a game are spoken by somebody with
      // no chatter at all.
      rollLowest();
      place('e1', 1);
      ChatterManager.update();

      // Act
      ChatterManager.silence('e99');

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('ignores a silence aimed at a chatterer who is not speaking', () =>
    {
      // Arrange- declared, and one frame into a two frame wait.
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.9999);
      place('e1', 1, { delay: 2, cooldown: 600 });
      ChatterManager.update();

      // Act
      ChatterManager.silence('e1');
      ChatterManager.update();

      // Assert- they keep the wait they were serving and speak when it is up. Resting somebody who
      // had not said anything would push them ten seconds back for no reason anybody could see.
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('cuts every idle line when an event takes the floor', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);
      place('e2', 1);
      ChatterManager.update();

      // Act
      globalThis.$gameMap.isEventRunning = () => true;
      ChatterManager.update();

      // Assert- a cutscene does not get heckled.
      expect(speakers()).toEqual([]);
    });

    it('leaves a forced line alone when an event takes the floor', () =>
    {
      // Arrange- the whole point of the forced form is that a scene can use it.
      rollLowest();
      place('e1', 1);
      ChatterManager.update();
      stand('e2', 1);
      ChatterManager.force('e2', 'Psst.', {});

      // Act
      globalThis.$gameMap.isEventRunning = () => true;
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('starts no new line while an event has the floor', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);

      // Act
      globalThis.$gameMap.isEventRunning = () => true;
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([]);
    });

    it('still runs down a rest while an event has the floor', () =>
    {
      // Arrange- a character resting when the scene begins.
      rollLowest();
      place('e1', 1, { duration: 0, cooldown: 1 });
      ChatterManager.update();
      sessionOf('e1')
        .flagRevealed();
      ChatterManager.update();

      // Act- the rest is served during the scene, and the line comes after it ends.
      globalThis.$gameMap.isEventRunning = () => true;
      ChatterManager.update();
      globalThis.$gameMap.isEventRunning = () => false;
      ChatterManager.update();

      // Assert- otherwise a character would be left owing a full cooldown the moment a scene ended.
      expect(speakers()).toEqual([ 'e1' ]);
    });
  });

  describe('a line a scene demanded', () =>
  {
    it('speaks for somebody no page ever declared', () =>
    {
      // Arrange
      stand('player', 0);

      // Act
      ChatterManager.force('player', 'What was that?', {});

      // Assert
      expect(speakers()).toEqual([ 'player' ]);
    });

    it('says exactly the line it was handed', () =>
    {
      // Arrange
      stand('player', 0);

      // Act
      ChatterManager.force('player', 'What was that?', {});

      // Assert
      expect(sessionOf('player')
        .line()).toBe('What was that?');
    });

    it('takes the duration the command asked for', () =>
    {
      // Arrange
      stand('player', 0);

      // Act
      ChatterManager.force('player', 'What was that?', { duration: 45 });

      // Assert
      expect(sessionOf('player')
        .durationRemaining()).toBe(45);
    });

    it('falls back to the configured duration when the command left it blank', () =>
    {
      // Arrange
      stand('player', 0);

      // Act
      ChatterManager.force('player', 'What was that?', {});

      // Assert
      expect(sessionOf('player')
        .durationRemaining()).toBe(180);
    });

    it('says nothing for a target naming nobody on this map', () =>
    {
      // Arrange- a common event naming `self`, which resolves to event zero and therefore to nobody.
      // A line nobody can see would never type itself out, would never finish, and would sit on the
      // books until the map changed.

      // Act
      ChatterManager.force('e0', 'Psst.', {});

      // Assert
      expect(ChatterManager.isQuiet()).toBe(true);
    });

    it('is not cut off by the player being nowhere near', () =>
    {
      // Arrange
      stand('e1', 99);
      ChatterManager.force('e1', 'Psst.', {});

      // Act
      ChatterManager.update();

      // Assert- a scene put the line there deliberately, so the earshot rule does not apply to it.
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('leaves a forced speaker with nothing ambient to do once they are done', () =>
    {
      // Arrange- somebody a scene made speak who no page ever declared. They keep a place in the
      // manager afterwards, and having no pool is the only thing stopping them muttering forever.
      // no rest and no wait, so the very next frame is one they would speak on if anything let them.
      globalThis.MessageConfig = {
        section: () => ({
          cooldown: 0,
          duration: 0,
          delay: 0,
        }),
      };
      vi.spyOn(Math, 'random')
        .mockReturnValue(0.9999);

      // a declared character alongside, still counting down to their first line, so "nobody speaks"
      // cannot pass for "the forced one does not".
      place('e1', 1, { delay: 2 });
      stand('player', 0);
      ChatterManager.force('player', 'What was that?', {});
      sessionOf('player')
        .flagRevealed();

      // Act- one frame ends the forced line, the next is the one where they would speak again.
      ChatterManager.update();
      ChatterManager.update();

      // Assert
      expect(speakers()).toEqual([ 'e1' ]);
    });

    it('is cut by a message opening above the same character', () =>
    {
      // Arrange- the one rule a forced line does not get to ignore, because the alternative is a
      // mutter and a line of dialogue sitting on top of each other in the same place.
      rollLowest();
      place('e2', 1);
      ChatterManager.update();
      stand('e1', 1);
      ChatterManager.force('e1', 'Psst.', {});

      // Act
      ChatterManager.silence('e1');

      // Assert- theirs stops, and the character who is not being spoken to carries on.
      expect(speakers()).toEqual([ 'e2' ]);
    });

    it('survives a message above the same character when the scene asked it to', () =>
    {
      // Arrange- somebody thinking one thing while saying another, which is the whole reason the
      // flag exists. The author has put the thought and the spoken line on opposite sides.
      stand('e1', 1);
      ChatterManager.force('e1', 'I know what you did.', { position: 'top' }, true);

      // Act
      ChatterManager.silence('e1');

      // Assert
      expect(sessionOf('e1')
        .line()).toBe('I know what you did.');
    });

    it('replaces a line the character was already saying', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);
      ChatterManager.update();

      // Act
      ChatterManager.force('e1', 'Psst.', {});

      // Assert
      expect(sessionOf('e1')
        .line()).toBe('Psst.');
    });

    it('keeps the profile the page declared for everything it did not override', () =>
    {
      // Arrange
      place('e1', 1, { speed: 7 });

      // Act
      ChatterManager.force('e1', 'Psst.', {});

      // Assert- a forced line still reads in that character's voice, at their pace.
      expect(sessionOf('e1')
        .profile()
        .speed()).toBe(7);
    });
  });

  describe('reading a command that left fields blank', () =>
  {
    it('takes every field the command filled in', () =>
    {
      // Arrange & Act
      const overrides = ChatterManager.overridesFrom('45', 'bottom', 'dim');

      // Assert- the editor hands every argument over as a string, so the number has to be made one.
      expect(overrides).toEqual({
        duration: 45,
        position: 'bottom',
        background: 'dim',
      });
    });

    it('leaves out a duration the command did not fill in', () =>
    {
      // Arrange & Act
      const overrides = ChatterManager.overridesFrom('', 'bottom', 'dim');

      // Assert- absent rather than zero. Zero is a real duration, meaning the line comes down the
      // instant it finishes typing out, and it is not what a blank field asked for.
      expect(overrides).toEqual({
        position: 'bottom',
        background: 'dim',
      });
    });

    it('leaves out a position the command did not fill in', () =>
    {
      // Arrange & Act
      const overrides = ChatterManager.overridesFrom('45', '', 'dim');

      // Assert
      expect(overrides).toEqual({
        duration: 45,
        background: 'dim',
      });
    });

    it('leaves out a background the command did not fill in', () =>
    {
      // Arrange & Act
      const overrides = ChatterManager.overridesFrom('45', 'bottom', '');

      // Assert
      expect(overrides).toEqual({
        duration: 45,
        position: 'bottom',
      });
    });

    it('overrides nothing when the command filled in none of them', () =>
    {
      // Arrange & Act
      const overrides = ChatterManager.overridesFrom('', '', '');

      // Assert- the character keeps every setting their page gave them.
      expect(overrides).toEqual({});
    });
  });

  describe('leaving the map', () =>
  {
    it('starts with nobody chattering', () =>
    {
      // Arrange & Act
      const quiet = ChatterManager.isQuiet();

      // Assert
      expect(quiet).toBe(true);
    });

    it('knows somebody is chattering while a line is up', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);

      // Act
      ChatterManager.update();

      // Assert- the other side of the question the scene asks before clearing anything.
      expect(ChatterManager.isQuiet()).toBe(false);
    });

    it('forgets everybody', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);
      place('e2', 1);
      ChatterManager.update();

      // Act
      ChatterManager.clear();

      // Assert- every token named something on the map being left.
      expect(ChatterManager.isQuiet()).toBe(true);
    });

    it('forgets the declarations as well as the lines', () =>
    {
      // Arrange
      rollLowest();
      place('e1', 1);

      // Act
      ChatterManager.clear();
      ChatterManager.update();

      // Assert- a cleared character does not start talking again on the next frame.
      expect(speakers()).toEqual([]);
    });
  });
});
//endregion plugins/message/ext/chatter/managers/chatter-manager.test.js