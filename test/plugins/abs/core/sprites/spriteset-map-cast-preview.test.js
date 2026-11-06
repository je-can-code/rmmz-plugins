//region plugins/abs/core/sprites/spriteset-map-cast-preview.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { installMinimalDatabase, installRmmzViewLayer } from '../../../../setup/rmmz-view-harness.js';

/**
 * Stepping out of the drawn shape is the whole of how an attack gets dodged, so what a telegraph
 * draws has to be what the hit tests. Both sides here are the real thing: the real drawing into a
 * real PIXI.Graphics, against real collision from an event placed where firing places it.
 */
describe('Spriteset_Map cast previews', () =>
{
  /**
   * Where the caster stands, off the tile grid the way pixel movement leaves everything.
   */
  const CasterTile = [ 10.25, 7.5 ];

  /**
   * How far around the origin to sample, in pixels; past the reach of every shape under test.
   */
  const ReachPx = 300;

  /**
   * The gap between samples, in pixels; deliberately no divisor of the tile size, so a sample
   * cannot land exactly on an edge where the two sides could fairly round apart.
   */
  const StepPx = 11.3;

  /**
   * How far the rows of samples sit out of phase with the columns, in pixels. Without it the grid
   * has samples exactly on both diagonals, which are the very edges a diagonal aim draws.
   */
  const RowPhasePx = 3.7;

  /**
   * The corners of the box, a pixel out each way, that a sample has to clear to count. PIXI draws
   * an arc as short straight segments where collision tests a true curve, so right on the rim the
   * two round apart by a fraction of a pixel, which no player could ever stand in.
   */
  const EdgeNudges = [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ];

  /**
   * Every direction an action can be aimed. Enemies only ever face four ways on the map, and the
   * diagonals are exactly where a telegraph reading the caster instead of the action comes apart.
   */
  const Facings = [ 1, 2, 3, 4, 6, 7, 8, 9 ];

  /**
   * One of each hitbox an action can have, sized like the ones the game's skills use.
   */
  const Hitboxes = [
    { name: 'an arc', shape: 'arc', range: 1.5, degrees: 75 },
    { name: 'a wide arc', shape: 'arc', range: 2.5, degrees: 135 },
    { name: 'an arc with no degrees tag', shape: 'arc', range: 2 },
    { name: 'an arc with a dead zone', shape: 'arc', range: 2.5, degrees: 135, innerRadius: 1 },
    { name: 'a line', shape: 'line', range: 3 },
    { name: 'a thick line', shape: 'line', range: 3, thickness: 2 },
    { name: 'a wall', shape: 'wall', range: 1, thickness: 0.5 },
    { name: 'a circle', shape: 'circle', range: 2 },
    { name: 'a circle with a dead zone', shape: 'circle', range: 2, innerRadius: 1 },
    { name: 'a rhombus', shape: 'rhombus', range: 2 },
    { name: 'a square', shape: 'square', range: 1 },
    { name: 'a cross', shape: 'cross', range: 2 },
    { name: 'a thick cross', shape: 'cross', range: 2, thickness: 2 },
    { name: 'a skill with no hitbox tag', shape: null, range: 2 },
  ];

  let JABS_Engine;
  let Sprite_HitboxPulse;

  beforeAll(async () =>
  {
    // the real view layer, so `Spriteset_Map`, `Game_Character` and PIXI.Graphics are genuine.
    installRmmzViewLayer();
    installMinimalDatabase();

    globalThis.J = {
      ABS: {
        Aliased: { Spriteset_Map: new Map() },
        Directions: {
          LOWERLEFT: 1,
          DOWN: 2,
          LOWERRIGHT: 3,
          LEFT: 4,
          RIGHT: 6,
          UPPERLEFT: 7,
          UP: 8,
          UPPERRIGHT: 9,
        },
        Shapes: {
          Circle: 'circle',
          Rhombus: 'rhombus',
          Square: 'square',
          Line: 'line',
          Arc: 'arc',
          Wall: 'wall',
          Cross: 'cross',
        },
        RegExp: {
          Degrees: /<degrees: ?(\d+)>/i,
          CastPreviewWarnAt: /<castPreviewWarnAt: ?(\d+)>/i,
        },

        // the origin settings the game actually ships with.
        Metadata: {
          MaxAiUpdateRange: 30,
          HitboxMeleeOriginOffsetPxX: 0,
          HitboxMeleeOriginOffsetPxY: -10,
          HitboxMeleeOriginExtraPxYFacingDown: 0,
          HitboxMeleeOriginExtraPxYFacingUp: 0,
          HitboxMeleeOriginLiftReductionPxFacingDown: 28,
        },
      },
    };

    // models registered at import time only need the call to land somewhere; nothing here saves.
    globalThis.SerializableRegistry = { register: () => {} };

    // a J-Base addition the hitbox styling leans on.
    String.empty = '';

    // the action map's templates, one each of character art, an object sheet, and a tile.
    globalThis.$actionMap = {
      events: {
        1: { pages: [ { image: { tileId: 0, characterName: '', characterIndex: 0 } } ] },
        46: { pages: [ { image: { tileId: 0, characterName: '!Spirals', characterIndex: 0 } } ] },
        60: { pages: [ { image: { tileId: 5, characterName: '', characterIndex: 0 } } ] },
      },
    };

    // reads a skill's note, the one place the drawing and the hit look up their degrees.
    globalThis.RPGManager = {
      checkForBooleanFromNoteByRegex: () => false,
      getNumberFromNoteByRegex: (skill, regex) =>
      {
        const found = skill.note.match(regex);
        return found === null
          ? null
          : Number(found[1]);
      },
    };

    globalThis.$gameMap = {
      tileWidth: () => 48,
      tileHeight: () => 48,
      adjustX: x => x,
      adjustY: y => y,
      isBush: () => false,
    };

    await import('../../../../../src/plugins/abs/core/sprites/Spriteset_Map.js');
    ({ default: JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
    ({ default: Sprite_HitboxPulse } = await import('../../../../../src/plugins/abs/core/sprites/Sprite_HitboxPulse.js'));
    const { default: JABS_Aabb } = await import('../../../../../src/plugins/abs/core/models/JABS_Aabb.js');

    // the engine's pure geometry, without standing up the enemy map its constructor wants.
    globalThis.$jabsEngine = Object.create(JABS_Engine.prototype);

    // every sample is a point: a battler's real full-tile body would blur the edge being compared.
    vi.spyOn(JABS_Engine, 'getBattlerAabbModel')
      .mockImplementation(({ screenX, screenY }) => new JABS_Aabb(screenX, screenY, 0, 0));
  });

  afterAll(() =>
  {
    JABS_Engine.getBattlerAabbModel.mockRestore();
  });

  /**
   * Builds the action a caster is winding up.
   * @param {Object} hitbox The hitbox to give it, shaped like an entry in {@link Hitboxes}.
   * @returns {Object} A stand-in for the {@link JABS_Action}.
   */
  const buildAction = ({
    shape,
    range,
    facing,
    degrees = null,
    thickness = 1,
    innerRadius = 0,
    target = [ null, null ],
    options = null,
    actionId = 1,
  }) =>
  {
    const [ casterX, casterY ] = CasterTile;

    return {
      getActionId: () => actionId,
      getShape: () => shape,
      getRange: () => range,
      direction: () => facing,
      getInnerRadius: () => innerRadius,
      getThicknessTiles: () => thickness,
      getActionOptions: () => options,
      getBaseSkill: () => ({
        note: degrees === null
          ? ''
          : `<degrees:${degrees}>`,
      }),
      getCaster: () => ({
        getX: () => casterX,
        getY: () => casterY,
        resolveActionTargetCoordinates: () => target,
      }),
    };
  };

  /**
   * Telegraphs an action the way a frame does, through the real refresh.
   * @param {Object} action The action winding up.
   * @returns {Sprite} The placed and drawn preview sprite.
   */
  const telegraph = action =>
  {
    const item = { key: 'castpreview:foe:0', action };
    const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
    const sprite = spriteset.createCastPreviewSprite(item);

    spriteset.castPreviewSprites = () => ({ [item.key]: sprite });
    spriteset.collectActiveCastPreviewItems = () => [ item ];
    spriteset.refreshExistingCastPreviewSprites();

    return sprite;
  };

  /**
   * Tests a grid of points around the real hit against both the telegraph and the collision.
   * @param {Sprite} sprite The drawn preview sprite.
   * @param {Object} action The action it warned about.
   * @param {[number, number]} spawnTile Where the action actually spawned, in tiles.
   * @returns {{ hits:number, disagreements:Object[] }} How many samples the hit caught, and every
   * sample the telegraph and the hit answered differently.
   */
  const compareWithTheHit = (sprite, action, [ spawnX, spawnY ]) =>
  {
    // the event firing spawns, placed without consulting anything the telegraph worked out.
    const [ page ] = globalThis.$actionMap.events[action.getActionId()].pages;
    const spawned = new Game_Character();
    if (page.image.tileId > 0)
    {
      spawned.setTileImage(page.image.tileId);
    }
    else
    {
      spawned.setImage(page.image.characterName, page.image.characterIndex);
    }

    spawned.locate(spawnX, spawnY);
    spawned.getJabsAction = () => action;

    const origin = JABS_Engine.getActionOriginPixels(spawned);
    const graphics = sprite._jabsCastPreviewG;
    const outcome = { hits: 0, disagreements: [] };

    for (let offsetY = RowPhasePx - ReachPx; offsetY <= ReachPx; offsetY += StepPx)
    {
      for (let offsetX = -ReachPx; offsetX <= ReachPx; offsetX += StepPx)
      {
        const screenX = origin.x + offsetX;
        const screenY = origin.y + offsetY;

        // where this sample falls inside the sprite, which is what the drawing is relative to.
        const localX = screenX - sprite.x;
        const localY = screenY - sprite.y;

        const isHit = globalThis.$jabsEngine.isTargetWithinRange(
          action.direction(),
          { screenX, screenY },
          spawned,
          action.getRange(),
          action.getShape(),
          action.getInnerRadius());
        if (isHit) outcome.hits += 1;

        // a sample straddling the drawn edge is too close to call; see EdgeNudges.
        const isDrawn = graphics.geometry.containsPoint(new PIXI.Point(localX, localY));
        const isClear = EdgeNudges.every(([ nudgeX, nudgeY ]) =>
        {
          const nudged = new PIXI.Point(localX + nudgeX, localY + nudgeY);
          return graphics.geometry.containsPoint(nudged) === isDrawn;
        });

        if (isClear && isDrawn !== isHit) outcome.disagreements.push({ offsetX, offsetY, isDrawn, isHit });
      }
    }

    return outcome;
  };

  /**
   * A map event for a battler holding the given decided actions.
   * @param {string} uuid The battler's uuid.
   * @param {Object[]} decided The battler's decided actions.
   * @param {boolean} isCasting Whether it is winding them up.
   * @returns {Object} A stand-in for the battler's `Game_Event`.
   */
  const buildBattlerEvent = (uuid, decided, isCasting) => ({
    isJabsBattler: () => true,
    getJabsBattlerUuid: () => uuid,
    getJabsBattler: () => ({
      isPlayer: () => false,
      isCastingOrChanneling: () => isCasting,
      getDecidedAction: () => decided,
      getBattler: () => ({ databaseData: () => ({ note: '' }) }),
    }),
  });

  describe('agreeing with the hit', () =>
  {
    const cases = Hitboxes.flatMap(hitbox => Facings.map(facing => ({ ...hitbox, facing })));

    it.each(cases)('$name aimed toward $facing draws exactly what it hits', hitbox =>
    {
      // Arrange
      const action = buildAction(hitbox);

      // Act
      const sprite = telegraph(action);
      const { hits, disagreements } = compareWithTheHit(sprite, action, CasterTile);

      // Assert: the anchor proves the grid reached the shape, not that two empty answers agreed.
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });

    it('draws a direct action on the tile it lands on, not on its caster', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'circle', range: 1, facing: 8, target: [ 13, 4 ] });

      // Act
      const sprite = telegraph(action);
      const { hits, disagreements } = compareWithTheHit(sprite, action, [ 13, 4 ]);

      // Assert
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });

    it('draws a spoke of a volley on the spot its spawn offset puts it', () =>
    {
      // Arrange
      const options = { getSpawnOffsetX: () => 1, getSpawnOffsetY: () => -1 };
      const action = buildAction({ shape: 'arc', range: 1, degrees: 60, facing: 2, options });

      // Act
      const sprite = telegraph(action);
      const { hits, disagreements } = compareWithTheHit(sprite, action, [ 11.25, 6.5 ]);

      // Assert
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });

    it('draws an action wearing an object sheet flush with the tile it will rest on', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'rhombus', range: 2, facing: 6, actionId: 46 });

      // Act
      const sprite = telegraph(action);
      const { hits, disagreements } = compareWithTheHit(sprite, action, CasterTile);

      // Assert
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });

    it('draws an action showing a tile flush with the tile it will rest on', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'rhombus', range: 2, facing: 6, actionId: 60 });

      // Act
      const sprite = telegraph(action);
      const { hits, disagreements } = compareWithTheHit(sprite, action, CasterTile);

      // Assert
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });
  });

  describe('where a telegraph sits', () =>
  {
    it('lifts a sideways swing to chest height, off the caster\'s feet at y 402', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'arc', range: 1.5, degrees: 75, facing: 6 });

      // Act
      const sprite = telegraph(action);

      // Assert
      expect([ sprite.x, sprite.y ]).toEqual([ 516, 378 ]);
    });

    it('lifts an upward swing higher still', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'arc', range: 1.5, degrees: 75, facing: 8 });

      // Act
      const sprite = telegraph(action);

      // Assert
      expect([ sprite.x, sprite.y ]).toEqual([ 516, 368 ]);
    });

    it('lifts a downward swing the least', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'arc', range: 1.5, degrees: 75, facing: 2 });

      // Act
      const sprite = telegraph(action);

      // Assert
      expect([ sprite.x, sprite.y ]).toEqual([ 516, 383.36 ]);
    });
  });

  describe('collectActiveCastPreviewItems', () =>
  {
    it('collects one preview per spoke of a volley, keyed so none overwrite another', () =>
    {
      // Arrange: a bystander holding actions it is not casting must contribute nothing.
      const spokes = [ 2, 3, 1 ].map(facing => buildAction({ shape: 'arc', range: 1, facing }));
      const caster = buildBattlerEvent('foe', spokes, true);
      const bystander = buildBattlerEvent('idle', [ buildAction({ shape: 'arc', range: 1, facing: 2 }) ], false);
      globalThis.$gameMap.events = () => [ caster, bystander ];
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);

      // Act
      const items = spriteset.collectActiveCastPreviewItems();

      // Assert
      expect(items.map(item => item.key)).toEqual([ 'castpreview:foe:0', 'castpreview:foe:1', 'castpreview:foe:2' ]);
      expect(items.map(item => item.action)).toEqual(spokes);
    });
  });

  describe('a skill with no hitbox tag', () =>
  {
    it('draws as a whole circle on the live hitbox overlay', () =>
    {
      // Arrange
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
      const sprite = { _jabsHitboxG: new PIXI.Graphics() };
      const event = { getJabsAction: () => buildAction({ shape: null, range: 2, facing: 6 }) };

      // Act
      spriteset.drawActionHitboxInto(sprite, null, 2, 6, 48, 48, event);

      // Assert: directly behind the aim, which any wedge aimed forward would leave out.
      expect(sprite._jabsHitboxG.geometry.containsPoint(new PIXI.Point(-48, 0))).toBe(true);
    });

    it('pulses as a whole circle', () =>
    {
      // Arrange
      const pulse = new Sprite_HitboxPulse();
      const options = {
        shape: null,
        range: 2,
        duration: 60,
        startAlpha: 1,
        endAlpha: 1,
        scaleStart: 1,
        scaleEnd: 1,
        lineColor: 0xFFFFFF,
        lineAlpha: 1,
        lineWidth: 1,
        fillColor: 0xFFFFFF,
        fillAlpha: 1,
        blendMode: PIXI.BLEND_MODES.NORMAL,
      };

      // Act
      pulse.setup(options);

      // Assert: the pulse draws along +X, so this point is directly behind its aim.
      expect(pulse.graphics().geometry.containsPoint(new PIXI.Point(-48, 0))).toBe(true);
    });
  });
});
//endregion plugins/abs/core/sprites/spriteset-map-cast-preview.test.js
