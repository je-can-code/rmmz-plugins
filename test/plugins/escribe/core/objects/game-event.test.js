//region plugins/escribe/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from '../../_component/fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * The escriptions an event carries, and the proximity it recomputes every frame.
 *
 * The parsing half is covered by the component test next door; what is left here is the state
 * surface it writes through and the per-frame proximity sweep that reads it back. Both matter for
 * the same reason: an escription that never turns off is a label that follows the player around the
 * map, and nothing about that failure looks like an error.
 */
describe('J-Escriptions Game_Event', () =>
{
  let Game_Event;
  let Escription;

  /**
   * Builds a bare event with its escription members seeded.
   * @param {object=} overrides Per-instance methods this event should answer with.
   * @returns {Game_Event} The event under test.
   */
  const buildEvent = (overrides = {}) =>
  {
    const event = new Game_Event();
    event.initMembers();

    Object.assign(event, overrides);

    return event;
  };

  /**
   * Builds an event already describing things, standing a set distance from the player.
   * @param {Escription[]} escriptions The escriptions to hold.
   * @param {number} distance How far the player is standing, in tiles.
   * @returns {Game_Event} The event under test.
   */
  const buildDescribedEvent = (escriptions, distance) =>
  {
    const event = buildEvent({ distanceFromPlayer: () => distance });
    event.setEscriptions(escriptions);

    return event;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the parse path reaches through the real note parser, so setupPage() needs it present.
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJEscribe();
    await import('../../../../../src/plugins/escribe/core/_metadata/initialization.js');

    // must come from the same post-reset module registry epoch as Game_Event.js below, since that
    // file imports its own copy of the model.
    ({ default: Escription } = await import('../../../../../src/plugins/escribe/core/_models/Escription.js'));

    await import('../../../../../src/plugins/escribe/core/objects/Game_Character.js');
    await import('../../../../../src/plugins/escribe/core/objects/Game_Event.js');

    // J-Base accessors the production code reads through.
    globalThis.Game_Event.prototype.pageIndex = function()
    {
      return this._pageIndex;
    };

    ({ Game_Event } = globalThis);
  });

  beforeEach(() =>
  {
    delete globalThis.J.ABS;
  });

  //region the state an escription lives in
  describe('initMembers()', () =>
  {
    it('seeds an empty escription list, because nothing has read the event\'s page yet', () =>
    {
      // Arrange
      const event = new Game_Event();

      // Act
      event.initMembers();

      // Assert
      expect(event.escriptions()).toEqual([]);
    });

    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const spy = vi.spyOn(globalThis.J.ESCRIBE.Aliased.Game_Event.get('initMembers'), 'call');
      const event = new Game_Event();

      // Act
      event.initMembers();

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });

  describe('setEscriptions()', () =>
  {
    it('holds the escriptions the parse produced', () =>
    {
      // Arrange
      const event = buildEvent();
      const escription = new Escription(Escription.Kinds.Text, 'a rusty old chest', -1);

      // Act
      event.setEscriptions([ escription ]);

      // Assert
      expect(event.escriptions()).toEqual([ escription ]);
    });
  });

  describe('hasEscriptions()', () =>
  {
    it('describes nothing while the list is empty', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      const result = event.hasEscriptions();

      // Assert
      expect(result).toBe(false);
    });

    it('describes something the moment the list holds one', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setEscriptions([ new Escription(Escription.Kinds.Icon, 208, -1) ]);

      // Act
      const result = event.hasEscriptions();

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion the state an escription lives in

  //region who is allowed to be read
  describe('canParseEscriptionComments()', () =>
  {
    it('reads an ordinary event standing on a real page', () =>
    {
      // Arrange
      const event = buildEvent({ _pageIndex: 0 });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(true);
    });

    it('refuses an event with no active page', () =>
    {
      // Arrange
      const event = buildEvent({ _pageIndex: -1 });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(false);
    });

    it('refuses an event whose page conditions are unmet', () =>
    {
      // Arrange
      const event = buildEvent({ _pageIndex: -2 });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a JABS action, which is torn down before a label could ever be read', () =>
    {
      // Arrange
      globalThis.J.ABS = {};
      const event = buildEvent({
        _pageIndex: 0,
        isJabsAction: () => true,
        isJabsLoot: () => false,
      });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(false);
    });

    it('refuses JABS loot, which carries its own presentation already', () =>
    {
      // Arrange
      globalThis.J.ABS = {};
      const event = buildEvent({
        _pageIndex: 0,
        isJabsAction: () => false,
        isJabsLoot: () => true,
      });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(false);
    });

    it('reads an ordinary event even while JABS is installed', () =>
    {
      // Arrange
      globalThis.J.ABS = {};
      const event = buildEvent({
        _pageIndex: 0,
        isJabsAction: () => false,
        isJabsLoot: () => false,
      });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(true);
    });

    it('never asks about JABS objects when JABS is not installed', () =>
    {
      // Arrange- the predicates would answer true if anything called them, so a passing read here
      // proves the namespace check short-circuited before reaching them.
      const isJabsAction = vi.fn(() => true);
      const event = buildEvent({
        _pageIndex: 0,
        isJabsAction,
      });

      // Act
      const result = event.canParseEscriptionComments();

      // Assert
      expect(result).toBe(true);
      expect(isJabsAction).not.toHaveBeenCalled();
    });
  });

  describe('setupPage()', () =>
  {
    it('re-reads the escriptions, because a new page can describe something else entirely', () =>
    {
      // Arrange
      const event = buildEvent({ _pageIndex: 0 });
      const parse = vi.spyOn(event, 'parseEscriptionComments');

      // Act
      event.setupPage();

      // Assert
      expect(parse).toHaveBeenCalledTimes(1);
    });
  });
  //endregion who is allowed to be read

  //region the per-frame proximity sweep
  describe('updateEscriptionProximity()', () =>
  {
    it('measures nothing for an event that describes nothing', () =>
    {
      // Arrange
      const distanceFromPlayer = vi.fn(() => 1);
      const event = buildEvent({ distanceFromPlayer });

      // Act
      event.updateEscriptionProximity();

      // Assert
      expect(distanceFromPlayer).not.toHaveBeenCalled();
    });

    it('measures nothing when every escription is always visible', () =>
    {
      // Arrange
      const distanceFromPlayer = vi.fn(() => 1);
      const event = buildEvent({ distanceFromPlayer });
      event.setEscriptions([ new Escription(Escription.Kinds.Text, 'always', Escription.ALWAYS_VISIBLE) ]);

      // Act
      event.updateEscriptionProximity();

      // Assert
      expect(distanceFromPlayer).not.toHaveBeenCalled();
    });

    it('marks the player near once they are inside the range', () =>
    {
      // Arrange- the range is met exactly, which is the boundary the comparison is written on.
      const gated = new Escription(Escription.Kinds.Text, 'gated', 3);
      const event = buildDescribedEvent([ gated ], 3);

      // Act
      event.updateEscriptionProximity();

      // Assert
      expect(gated.isPlayerNearby()).toBe(true);
    });

    it('marks the player away once they are outside the range', () =>
    {
      // Arrange
      const gated = new Escription(Escription.Kinds.Text, 'gated', 3);
      gated.setPlayerNearby(true);
      const event = buildDescribedEvent([ gated ], 4);

      // Act
      event.updateEscriptionProximity();

      // Assert
      expect(gated.isPlayerNearby()).toBe(false);
    });

    it('leaves an always-visible sibling alone while updating a gated one', () =>
    {
      // Arrange- the ungated one has to survive the sweep untouched, or "updates the gated ones"
      // and "updates everything" would be the same program.
      const gated = new Escription(Escription.Kinds.Text, 'gated', 5);
      const ungated = new Escription(Escription.Kinds.Icon, 208, Escription.ALWAYS_VISIBLE);
      const event = buildDescribedEvent([ gated, ungated ], 2);

      // Act
      event.updateEscriptionProximity();

      // Assert
      expect(gated.isPlayerNearby()).toBe(true);
      expect(ungated.isPlayerNearby()).toBe(false);
    });
  });

  describe('update()', () =>
  {
    it('sweeps proximity on top of the original update', () =>
    {
      // Arrange
      const event = buildEvent({ distanceFromPlayer: () => 1 });
      const sweep = vi.spyOn(event, 'updateEscriptionProximity');

      // Act
      event.update();

      // Assert
      expect(sweep).toHaveBeenCalledTimes(1);
    });
  });
  //endregion the per-frame proximity sweep
});
//endregion plugins/escribe/core/objects/game-event.test.js