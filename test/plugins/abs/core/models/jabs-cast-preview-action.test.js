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
      static ROUTE_END = 0;

      static ROUTE_MOVE_FORWARD = 12;

      setMoveSpeed(moveSpeed)
      {
        this.moveSpeed = moveSpeed;
      }

      distancePerFrame()
      {
        return (2 ** this.moveSpeed) / 256;
      }

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

    // the comment reading J-Base and J-ABS add to the engine's Game_Event.
    globalThis.Game_Event = {
      getValidCommentCommandsFromPage: page => page.list,
      readCustomMoveSpeed: comments => (comments.length > 0 ? comments[0].parameters[0] : null),
    };

    ({ default: JABS_CastPreviewAction } = await import(
      '../../../../../src/plugins/abs/core/models/JABS_CastPreviewAction.js'
    ));
  });

  let standIn;
  let caster;
  let action;

  /**
   * Builds an action map template whose single page moves as described.
   * @param {Object} movement The fields of the page's movement that matter to the test.
   * @returns {Object} The action map event.
   */
  const buildTemplate = ({ moveType = 3, moveSpeed = 4, repeat = true, route = [ 12, 0 ], list = [] }) => ({
    pages: [
      {
        image: { tileId: 0, characterName: '$a_shot', characterIndex: 0 },
        moveType,
        moveSpeed,
        moveRoute: { repeat, list: route.map(code => ({ code })) },
        list,
      },
    ],
  });

  /**
   * Builds an action spawning from the given template, living as long as it says.
   * @param {Object} movement The fields of the template's movement that matter to the test.
   * @param {Object} overrides Anything else the action should answer differently.
   * @returns {Object} A stand-in for the {@link JABS_Action}.
   */
  const buildFlyingAction = (movement, overrides = {}) =>
  {
    globalThis.$actionMap.events[70] = buildTemplate(movement);

    return {
      getCaster: () => caster,
      getActionId: () => 70,
      isDirectAction: () => false,
      getMaxDuration: () => 240,
      getCollisionRange: () => 1.5,
      ...overrides,
    };
  };

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

  describe('flightPreviewTiles', () =>
  {
    it('reaches as far as the first second of flight takes it', () =>
    {
      // Arrange: speed 4 is a sixteenth of a tile a frame.
      standIn.set(buildFlyingAction({ moveSpeed: 4 }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(3.75);
    });

    it('stops short when the shot expires inside that second', () =>
    {
      // Arrange
      standIn.set(buildFlyingAction({ moveSpeed: 4 }, { getMaxDuration: () => 20 }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(1.25);
    });

    it('reads a comment over the speed on the page, as a spawned event does', () =>
    {
      // Arrange: Shock's real numbers, a page at speed 4 and a comment at 7.
      const list = [ { code: 108, parameters: [ 7 ] } ];
      standIn.set(buildFlyingAction({ moveSpeed: 4, list }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(30);
    });

    it('reaches nowhere for a direct action, which lands rather than flies', () =>
    {
      // Arrange: everything else about it would fly, so only being direct can answer no.
      standIn.set(buildFlyingAction({}, { isDirectAction: () => true }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(0);
    });

    it('reaches nowhere from a template set to fixed, whose route never runs', () =>
    {
      // Arrange
      standIn.set(buildFlyingAction({ moveType: 0 }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(0);
    });

    it('reaches nowhere on a single step that never repeats, which only nudges it', () =>
    {
      // Arrange
      standIn.set(buildFlyingAction({ repeat: false }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(0);
    });

    it('reaches nowhere on a route with no steps in it', () =>
    {
      // Arrange
      standIn.set(buildFlyingAction({ route: [ 0 ] }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(0);
    });

    it('reaches nowhere on a custom route with no step forward, like staying on the caster', () =>
    {
      // Arrange: most of the game's casts ride this exact shape, so it has to stay quiet.
      standIn.set(buildFlyingAction({ route: [ 45, 0 ] }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(0);
    });

    it('reaches a tile past its hitbox on a looping route that does more than step forward', () =>
    {
      // Arrange: Rending Chaos, a step forward beside a script that turns it who knows which way.
      standIn.set(buildFlyingAction({ route: [ 12, 45, 0 ] }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(2.5);
    });

    it('reaches a tile past its hitbox on a one-shot route of many steps', () =>
    {
      // Arrange: Ruthless Wing, which changes speed between its steps and then stops.
      standIn.set(buildFlyingAction({ repeat: false, route: [ 45, 12, 45, 12, 0 ] }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(2.5);
    });

    it('reaches just the tile for a wandering action with no hitbox size of its own', () =>
    {
      // Arrange
      standIn.set(buildFlyingAction({ route: [ 12, 45, 0 ] }, { getCollisionRange: () => null }));

      // Act
      const result = standIn.flightPreviewTiles();

      // Assert
      expect(result).toBe(1);
    });
  });
});
//endregion plugins/abs/core/models/jabs-cast-preview-action.test.js
