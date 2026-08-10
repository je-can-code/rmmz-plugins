//region plugins/escribe/core/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installEscribeHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJEscribe,
} from '../../_component/fixtures/install-escribe-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * The escription state an event carries, and the proximity it recomputes every frame.
 *
 * The parsing half is covered by the component test next door; what is left here is the state
 * surface it writes through and the per-frame proximity update that reads it back. Both matter for
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
   * Builds an event already holding describe data, standing a set distance from the player.
   * @param {Escription} escription The describe data to hold.
   * @param {number} distance How far the player is standing.
   * @returns {Game_Event} The event under test.
   */
  const buildDescribedEvent = (escription, distance) =>
  {
    const event = buildEvent({ distanceFromPlayer: () => distance });
    event.setEscribeData(escription);

    return event;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installEscribeHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

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
    it('seeds no describe data, because nothing has read the event\'s page yet', () =>
    {
      // Arrange
      // Act
      const event = buildEvent();

      // Assert
      expect(event.escribeData())
        .toBeNull();
      expect(event.hasEscribeData())
        .toBe(false);
    });

    it('seeds both proximity flags unknown rather than false', () =>
    {
      // Arrange
      // Act
      const event = buildEvent();

      // Assert: false would claim the player has been measured and found far away, which is a
      // different statement than never having measured.
      expect(event.getPlayerNearbyForText())
        .toBeNull();
      expect(event.getPlayerNearbyForIcon())
        .toBeNull();
    });

    it('seeds neither pending flag, since there is nothing to add or remove yet', () =>
    {
      // Arrange
      // Act
      const event = buildEvent();

      // Assert
      expect(event.needsEscribeAdding())
        .toBe(false);
      expect(event.needsEscribeRemoval())
        .toBe(false);
    });
  });

  describe('setEscribeData()', () =>
  {
    it('holds the describe data the parse produced', () =>
    {
      // Arrange
      const event = buildEvent();
      const escription = new Escription('Hello', 12, 2, 1);

      // Act
      event.setEscribeData(escription);

      // Assert
      expect(event.escribeData())
        .toBe(escription);
      expect(event.hasEscribeData())
        .toBe(true);
    });
  });

  describe('setPlayerNearbyForText()', () =>
  {
    it('records whether the player is close enough to read the text', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      event.setPlayerNearbyForText(true);

      // Assert
      expect(event.getPlayerNearbyForText())
        .toBe(true);
    });
  });

  describe('setPlayerNearbyForIcon()', () =>
  {
    it('records whether the player is close enough to see the icon', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      event.setPlayerNearbyForIcon(true);

      // Assert
      expect(event.getPlayerNearbyForIcon())
        .toBe(true);
    });
  });

  describe('flagForEscribeAddition()', () =>
  {
    it('marks the escription as owed to the map', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      event.flagForEscribeAddition();

      // Assert
      expect(event.needsEscribeAdding())
        .toBe(true);
    });
  });

  describe('acknowledgeEscribeAddition()', () =>
  {
    it('clears the flag once the map has taken the escription', () =>
    {
      // Arrange
      const event = buildEvent();
      event.flagForEscribeAddition();

      // Act
      event.acknowledgeEscribeAddition();

      // Assert: leaving it set would have the map re-add the same escription every frame.
      expect(event.needsEscribeAdding())
        .toBe(false);
    });
  });

  describe('flagForEscribeRemoval()', () =>
  {
    it('marks the escription as owed removal from the map', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      event.flagForEscribeRemoval();

      // Assert
      expect(event.needsEscribeRemoval())
        .toBe(true);
    });
  });

  describe('acknowledgeEscribeRemoval()', () =>
  {
    it('clears the flag once the map has dropped the escription', () =>
    {
      // Arrange
      const event = buildEvent();
      event.flagForEscribeRemoval();

      // Act
      event.acknowledgeEscribeRemoval();

      // Assert
      expect(event.needsEscribeRemoval())
        .toBe(false);
    });
  });
  //endregion the state an escription lives in

  //region when the page is allowed to be read at all
  describe('canParseEscriptionComments()', () =>
  {
    it('reads an ordinary event standing on a real page', () =>
    {
      // Arrange
      const event = buildEvent();
      event._pageIndex = 0;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(canParse)
        .toBe(true);
    });

    it('refuses an event with no active page', () =>
    {
      // Arrange
      const event = buildEvent();
      event._pageIndex = -1;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(canParse)
        .toBe(false);
    });

    it('refuses an event whose page conditions are unmet', () =>
    {
      // Arrange
      const event = buildEvent();
      event._pageIndex = -2;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(canParse)
        .toBe(false);
    });

    it('refuses a JABS action, which is torn down before a label could ever be read', () =>
    {
      // Arrange
      globalThis.J.ABS = {};
      const event = buildEvent({
        isJabsAction: () => true,
        isJabsLoot: () => false,
      });
      event._pageIndex = 0;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(canParse)
        .toBe(false);
    });

    it('refuses JABS loot, which carries its own presentation already', () =>
    {
      // Arrange
      globalThis.J.ABS = {};
      const event = buildEvent({
        isJabsAction: () => false,
        isJabsLoot: () => true,
      });
      event._pageIndex = 0;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(canParse)
        .toBe(false);
    });

    it('never asks about JABS objects when JABS is not installed', () =>
    {
      // Arrange
      const isJabsAction = vi.fn(() => true);
      const event = buildEvent({ isJabsAction });
      event._pageIndex = 0;

      // Act
      const canParse = event.canParseEscriptionComments();

      // Assert
      expect(isJabsAction)
        .not.toHaveBeenCalled();
      expect(canParse)
        .toBe(true);
    });
  });

  describe('parseEscriptionComments()', () =>
  {
    it('does nothing at all to an event it is not allowed to read', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [ { parameters: [ '<text:Hello>' ] } ] });
      event._pageIndex = -1;

      // Act
      event.parseEscriptionComments();

      // Assert: not merely "produces nothing" - it must not clear or flag anything either.
      expect(event.hasEscribeData())
        .toBe(false);
      expect(event.needsEscribeRemoval())
        .toBe(false);
    });
  });

  describe('setupPage()', () =>
  {
    it('re-reads the escription, because a new page can describe something else entirely', () =>
    {
      // Arrange
      const event = buildEvent({ getValidCommentCommands: () => [ { parameters: [ '<text:Hello>' ] } ] });
      event._pageIndex = 0;

      // Act
      event.setupPage();

      // Assert
      expect(event.escribeData()
        .text())
        .toBe('Hello');
    });
  });
  //endregion when the page is allowed to be read at all

  //region the proximity recomputed every frame
  describe('hasProximityEscriptionData()', () =>
  {
    it('has none when the event has no describe data at all', () =>
    {
      // Arrange
      const event = buildEvent();

      // Act
      const hasProximity = event.hasProximityEscriptionData();

      // Assert
      expect(hasProximity)
        .toBe(false);
    });

    it('has none when both ranges sit at the default', () =>
    {
      // Arrange: a describe with no proximity is always visible, so there is nothing to recompute.
      const event = buildEvent();
      event.setEscribeData(new Escription('Hello', 12, -1, -1));

      // Act
      const hasProximity = event.hasProximityEscriptionData();

      // Assert
      expect(hasProximity)
        .toBe(false);
    });

    it('has some when only the text carries a range', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setEscribeData(new Escription('Hello', 12, 3, -1));

      // Act
      const hasProximity = event.hasProximityEscriptionData();

      // Assert
      expect(hasProximity)
        .toBe(true);
    });

    it('has some when only the icon carries a range', () =>
    {
      // Arrange
      const event = buildEvent();
      event.setEscribeData(new Escription('Hello', 12, -1, 3));

      // Act
      const hasProximity = event.hasProximityEscriptionData();

      // Assert
      expect(hasProximity)
        .toBe(true);
    });
  });

  describe('updateEscribeTextProximity()', () =>
  {
    it('leaves the flag untouched when the text is not proximity-gated', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, -1, 3), 1);

      // Act
      event.updateEscribeTextProximity();

      // Assert: a text with no range is always shown, and writing false here would hide it.
      expect(event.getPlayerNearbyForText())
        .toBeNull();
    });

    it('shows the text once the player is inside its range', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, 3, -1), 2);

      // Act
      event.updateEscribeTextProximity();

      // Assert
      expect(event.getPlayerNearbyForText())
        .toBe(true);
    });

    it('shows the text at exactly the range, rather than one tile short of it', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, 3, -1), 3);

      // Act
      event.updateEscribeTextProximity();

      // Assert
      expect(event.getPlayerNearbyForText())
        .toBe(true);
    });

    it('hides the text again once the player walks back out of range', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, 3, -1), 9);
      event.setPlayerNearbyForText(true);

      // Act
      event.updateEscribeTextProximity();

      // Assert
      expect(event.getPlayerNearbyForText())
        .toBe(false);
    });
  });

  describe('updateEscribeIconProximity()', () =>
  {
    it('leaves the flag untouched when the icon is not proximity-gated', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, 3, -1), 1);

      // Act
      event.updateEscribeIconProximity();

      // Assert
      expect(event.getPlayerNearbyForIcon())
        .toBeNull();
    });

    it('shows the icon once the player is inside its range', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, -1, 3), 2);

      // Act
      event.updateEscribeIconProximity();

      // Assert
      expect(event.getPlayerNearbyForIcon())
        .toBe(true);
    });

    it('hides the icon again once the player walks back out of range', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, -1, 3), 9);
      event.setPlayerNearbyForIcon(true);

      // Act
      event.updateEscribeIconProximity();

      // Assert
      expect(event.getPlayerNearbyForIcon())
        .toBe(false);
    });
  });

  describe('update()', () =>
  {
    it('recomputes both proximities for an event that has any', () =>
    {
      // Arrange
      const event = buildDescribedEvent(new Escription('Hello', 12, 3, 3), 1);

      // Act
      event.update();

      // Assert
      expect(event.getPlayerNearbyForText())
        .toBe(true);
      expect(event.getPlayerNearbyForIcon())
        .toBe(true);
    });

    it('skips the work entirely for an event with nothing proximity-gated', () =>
    {
      // Arrange: this runs for every event on the map, every frame, so the guard is the point.
      const distanceFromPlayer = vi.fn(() => 1);
      const event = buildEvent({ distanceFromPlayer });

      // Act
      event.update();

      // Assert
      expect(distanceFromPlayer)
        .not.toHaveBeenCalled();
    });
  });
  //endregion the proximity recomputed every frame

  //region the abstract defaults every non-event character keeps
  describe('Game_Character defaults', () =>
  {
    it('reports no escribe data, because only events can carry a description', () =>
    {
      // Arrange- the player, followers and vehicles all reach these. They exist so the map's own
      // sweep can ask every character the same question without knowing which kind it is holding.
      const character = new globalThis.Game_Character();

      // Act
      const hasData = character.hasEscribeData();

      // Assert
      expect(hasData)
        .toBe(false);
    });

    it('parses nothing, since a non-event has no comment commands to read', () =>
    {
      // Arrange
      const character = new globalThis.Game_Character();

      // Act
      const parse = () => character.parseEscriptionComments();

      // Assert
      expect(parse)
        .not.toThrow();
    });
  });
  //endregion the abstract defaults every non-event character keeps
});
//endregion plugins/escribe/core/objects/game-event.test.js