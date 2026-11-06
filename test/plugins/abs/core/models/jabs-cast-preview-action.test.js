//region plugins/abs/core/models/jabs-cast-preview-action.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_CastPreviewAction (direct src import)', () =>
{
  let JABS_CastPreviewAction;

  beforeAll(async () =>
  {
    vi.resetModules();

    // a character whose screen position is unmistakably a conversion of where it was put, sitting
    // a few pixels higher unless it wears a tile or an object sheet, same as the real thing.
    globalThis.Game_Character = class
    {
      setImage(characterName)
      {
        this.shiftY = characterName.startsWith('!')
          ? 0
          : 6;
      }

      setTileImage()
      {
        this.shiftY = 0;
      }

      locate(x, y)
      {
        this.x = x;
        this.y = y;
      }

      screenX()
      {
        return (this.x * 48) + 24;
      }

      screenY()
      {
        return (this.y * 48) + 48 - this.shiftY;
      }
    };

    ({ default: JABS_CastPreviewAction } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_CastPreviewAction.js'
    ));
  });

  let standIn;
  let caster;
  let action;

  beforeEach(() =>
  {
    standIn = new JABS_CastPreviewAction();
    caster = { resolveActionTargetCoordinates: vi.fn(() => [ 9, 8 ]) };
    action = { getCaster: () => caster, getActionId: () => 1 };

    globalThis.$jabsEngine = { determineActionSpawnCoordinates: vi.fn(() => [ 3, 4 ]) };
    globalThis.$actionMap = {
      events: {
        1: { pages: [ { image: { tileId: 0, characterName: '$a_slash-1', characterIndex: 0 } } ] },
        46: { pages: [ { image: { tileId: 0, characterName: '!Spirals', characterIndex: 0 } } ] },
        60: { pages: [ { image: { tileId: 5, characterName: '', characterIndex: 0 } } ] },
      },
    };
  });

  describe('set / getJabsAction', () =>
  {
    it('getJabsAction is null before any action is set', () =>
    {
      // Arrange & Act
      const result = standIn.getJabsAction();

      // Assert
      expect(result).toBeNull();
    });

    it('set assigns the real action this stands in for', () =>
    {
      // Arrange & Act
      standIn.set(action);

      // Assert
      expect(standIn.getJabsAction()).toBe(action);
    });

    it('set replaces whichever action it stood in for last', () =>
    {
      // Arrange: a telegraph's sprite outlives any one cast, so the next cast reuses this instance.
      const nextAction = { getCaster: () => caster, getActionId: () => 1 };
      standIn.set(action);

      // Act
      standIn.set(nextAction);

      // Assert
      expect(standIn.getJabsAction()).toBe(nextAction);
    });
  });

  describe('set', () =>
  {
    it('asks the caster where this action is headed, as firing will', () =>
    {
      // Arrange & Act
      standIn.set(action);

      // Assert
      expect(caster.resolveActionTargetCoordinates).toHaveBeenCalledWith(action);
    });

    it('hands the engine those coordinates to work out the spawn, as firing will', () =>
    {
      // Arrange & Act
      standIn.set(action);

      // Assert
      expect(globalThis.$jabsEngine.determineActionSpawnCoordinates).toHaveBeenCalledWith(caster, action, 9, 8);
    });

    it('passes unresolved coordinates through for the engine to settle on the caster', () =>
    {
      // Arrange: a non-direct action has no target to resolve, which the engine reads as "on the caster".
      caster.resolveActionTargetCoordinates.mockReturnValue([ null, null ]);

      // Act
      standIn.set(action);

      // Assert
      expect(globalThis.$jabsEngine.determineActionSpawnCoordinates).toHaveBeenCalledWith(caster, action, null, null);
    });
  });

  describe('screenX / screenY', () =>
  {
    it('reports the spawn spot in the screen pixels an event standing there would', () =>
    {
      // Arrange
      standIn.set(action);

      // Act
      const result = [ standIn.screenX(), standIn.screenY() ];

      // Assert
      expect(result).toEqual([ 168, 234 ]);
    });

    it('follows the cast when set again from a new spot', () =>
    {
      // Arrange: the caster was shoved mid-windup, so the spawn moved with it.
      standIn.set(action);
      globalThis.$jabsEngine.determineActionSpawnCoordinates.mockReturnValue([ 5, 1 ]);

      // Act
      standIn.set(action);

      // Assert
      expect([ standIn.screenX(), standIn.screenY() ]).toEqual([ 264, 90 ]);
    });

    it('rests flush on its tile when the action will spawn wearing an object sheet', () =>
    {
      // Arrange: same spot as the character art above, so only the art can move the answer.
      const flatAction = { getCaster: () => caster, getActionId: () => 46 };

      // Act
      standIn.set(flatAction);

      // Assert
      expect([ standIn.screenX(), standIn.screenY() ]).toEqual([ 168, 240 ]);
    });

    it('rests flush on its tile when the action will spawn showing a tile', () =>
    {
      // Arrange: a tile page has no sheet name to give it away, so only its tile id can.
      const tileAction = { getCaster: () => caster, getActionId: () => 60 };

      // Act
      standIn.set(tileAction);

      // Assert
      expect([ standIn.screenX(), standIn.screenY() ]).toEqual([ 168, 240 ]);
    });

    it('stands back up when the next cast wears character art again', () =>
    {
      // Arrange
      standIn.set({ getCaster: () => caster, getActionId: () => 46 });

      // Act
      standIn.set(action);

      // Assert
      expect(standIn.screenY()).toBe(234);
    });
  });
});
//endregion plugins/abs/core/models/jabs-cast-preview-action.test.js
