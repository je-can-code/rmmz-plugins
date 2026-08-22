//region plugins/abs/ext/danger/objects/game-event.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Game_Event (unit, all downstream dependencies mocked)', () =>
{
  const NO_INDICATOR_REGEX = /^<noIndicator>$/i;
  const SHOW_INDICATOR_REGEX = /^<showIndicator>$/i;

  /** @type {import('vitest').Mock} the "original" (aliased) initializeCoreData. */
  let originalInitializeCoreData;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            Aliased: { Game_Event: new Map() },
            RegExp: { NoIndicator: NO_INDICATOR_REGEX, ShowIndicator: SHOW_INDICATOR_REGEX },
          },
        },
      },
    };

    function Game_Event()
    {
    }

    originalInitializeCoreData = vi.fn();
    Game_Event.prototype.initializeCoreData = originalInitializeCoreData;
    globalThis.Game_Event = Game_Event;

    await import('../../../../../../src/plugins/abs/ext/danger/objects/Game_Event.js');
  });

  beforeEach(() =>
  {
    originalInitializeCoreData.mockReset();
  });

  function buildEvent(overrides = {})
  {
    const event = Object.create(globalThis.Game_Event.prototype);
    event.getValidCommentCommands = () => [];
    return Object.assign(event, overrides);
  }

  describe('initializeCoreData', () =>
  {
    it('performs the original logic unmodified when there is no core data', () =>
    {
      // Arrange
      const event = buildEvent();
      event.updateWithDangerIndicator = vi.fn();

      // Act
      event.initializeCoreData(null);

      // Assert
      expect(event.updateWithDangerIndicator).not.toHaveBeenCalled();
      expect(originalInitializeCoreData).toHaveBeenCalledWith(null);
    });

    it('updates the core data with the danger indicator before delegating to the original logic', () =>
    {
      // Arrange
      const event = buildEvent();
      const coreData = { id: 'core' };
      const updatedCoreData = { id: 'updated' };
      event.updateWithDangerIndicator = vi.fn(() => updatedCoreData);

      // Act
      event.initializeCoreData(coreData);

      // Assert
      expect(event.updateWithDangerIndicator).toHaveBeenCalledWith(coreData);
      expect(originalInitializeCoreData).toHaveBeenCalledWith(updatedCoreData);
    });
  });

  describe('updateWithDangerIndicator', () =>
  {
    it('sets the danger indicator flag on the core data using the resolved battler id', () =>
    {
      // Arrange
      const event = buildEvent();
      event.canShowDangerIndicator = vi.fn(() => true);
      const coreData = { battlerId: () => 7, setDangerIndicator: vi.fn() };

      // Act
      const result = event.updateWithDangerIndicator(coreData);

      // Assert
      expect(event.canShowDangerIndicator).toHaveBeenCalledWith(7);
      expect(coreData.setDangerIndicator).toHaveBeenCalledWith(true);
      expect(result).toBe(coreData);
    });
  });

  describe('canShowDangerIndicator', () =>
  {
    /** Builds $gameEnemies wired to return the given showDangerIndicator() result. */
    function withEnemyIndicator(showResult)
    {
      globalThis.$gameEnemies = { enemy: () => ({ showDangerIndicator: () => showResult }) };
    }

    it('returns the enemy default when there are no comment commands', () =>
    {
      // Arrange
      withEnemyIndicator(true);
      const event = buildEvent({ getValidCommentCommands: () => [] });

      // Act
      const result = event.canShowDangerIndicator(1);

      // Assert
      expect(result).toBe(true);
    });

    it('forces false when a comment explicitly hides the indicator', () =>
    {
      // Arrange
      withEnemyIndicator(true);
      const event = buildEvent({
        getValidCommentCommands: () => [ { parameters: [ '<noIndicator>' ] } ],
      });

      // Act
      const result = event.canShowDangerIndicator(1);

      // Assert
      expect(result).toBe(false);
    });

    it('forces true when a comment explicitly shows the indicator', () =>
    {
      // Arrange
      withEnemyIndicator(false);
      const event = buildEvent({
        getValidCommentCommands: () => [ { parameters: [ '<showIndicator>' ] } ],
      });

      // Act
      const result = event.canShowDangerIndicator(1);

      // Assert
      expect(result).toBe(true);
    });

    it('lets a later comment command override an earlier one', () =>
    {
      // Arrange
      withEnemyIndicator(true);
      const event = buildEvent({
        getValidCommentCommands: () => [
          { parameters: [ '<noIndicator>' ] },
          { parameters: [ '<showIndicator>' ] },
        ],
      });

      // Act
      const result = event.canShowDangerIndicator(1);

      // Assert
      expect(result).toBe(true);
    });

    it('ignores comment commands that match neither indicator tag', () =>
    {
      // Arrange- the enemy default is false so a show-tag match would visibly flip the answer;
      // starting from true would let the show branch fire unnoticed.
      withEnemyIndicator(false);
      const event = buildEvent({
        getValidCommentCommands: () => [ { parameters: [ '<somethingElse>' ] } ],
      });

      // Act
      const result = event.canShowDangerIndicator(1);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/danger/objects/game-event.test.js
