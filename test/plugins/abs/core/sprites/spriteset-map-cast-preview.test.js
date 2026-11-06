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
    { name: 'a direct skill with no radius', shape: null, range: null, isDirect: true },
  ];

  let JABS_Action;
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
          HitboxPulse: {
            useFadeAnimation: false,
            duration: 60,
            startAlpha: 0.5,
            scaleStart: 1,
            lineColor: 0xFFFFFF,
            lineAlpha: 1,
            lineWidth: 1,
            fillColor: 0xFFFFFF,
            fillAlpha: 0.5,
            blendMode: 0,
          },
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
    ({ default: JABS_Action } = await import('../../../../../src/plugins/abs/core/models/JABS_Action.js'));
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
    isDirect = false,
  }) =>
  {
    const [ casterX, casterY ] = CasterTile;

    return {
      getActionId: () => actionId,
      getShape: () => shape,
      getRange: () => range,
      isDirectAction: () => isDirect,
      getCollisionRange: () => JABS_Action.prototype.getCollisionRange.call({
        getRange: () => range,
        isDirectAction: () => isDirect,
      }),
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
   * Places the event firing spawns, without consulting anything a telegraph worked out.
   * @param {Object} action The action firing.
   * @param {[number, number]} spawnTile Where it spawns, in tiles.
   * @returns {Game_Character} A stand-in for the spawned `Game_Event`.
   */
  const spawnEvent = (action, [ spawnX, spawnY ]) =>
  {
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

    return spawned;
  };

  /**
   * Tests a grid of points around the real hit against both the drawing and the collision.
   * @param {Sprite} sprite The sprite the drawing sits at.
   * @param {PIXI.Graphics} graphics The drawing itself.
   * @param {Object} action The action drawn.
   * @param {Game_Character} spawned The event the action really spawned as.
   * @returns {{ hits:number, disagreements:Object[] }} How many samples the hit caught, and every
   * sample the drawing and the hit answered differently.
   */
  const compareWithTheHit = (sprite, graphics, action, spawned) =>
  {
    const origin = JABS_Engine.getActionOriginPixels(spawned);
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
          action.getCollisionRange(),
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
   * Tests a telegraph against the hit of the event its action really spawned as.
   * @param {Sprite} sprite The drawn preview sprite.
   * @param {Object} action The action it warned about.
   * @param {[number, number]} spawnTile Where the action actually spawned, in tiles.
   * @returns {{ hits:number, disagreements:Object[] }} What {@link compareWithTheHit} found.
   */
  const compareTelegraphWithTheHit = (sprite, action, spawnTile) =>
  {
    const spawned = spawnEvent(action, spawnTile);
    return compareWithTheHit(sprite, sprite._jabsCastPreviewG, action, spawned);
  };

  /**
   * Pulses a live action the way a frame does: the options the action really composes, handed to a
   * real pulse sprite.
   * @param {Object} action The live action.
   * @param {Game_Character} spawned The event the action spawned as.
   * @returns {Sprite_HitboxPulse} The placed and drawn pulse.
   */
  const pulseFor = (action, spawned) =>
  {
    const live = { ...action, getActionSprite: () => spawned };
    const options = JABS_Action.prototype.composeHitboxPulsePlainOptions.call(live);

    const pulse = new Sprite_HitboxPulse();
    pulse.setup(options);
    pulse.setWorldPosition(options.x, options.y);

    return pulse;
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
      const { hits, disagreements } = compareTelegraphWithTheHit(sprite, action, CasterTile);

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
      const { hits, disagreements } = compareTelegraphWithTheHit(sprite, action, [ 13, 4 ]);

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
      const { hits, disagreements } = compareTelegraphWithTheHit(sprite, action, [ 11.25, 6.5 ]);

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
      const { hits, disagreements } = compareTelegraphWithTheHit(sprite, action, CasterTile);

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
      const { hits, disagreements } = compareTelegraphWithTheHit(sprite, action, CasterTile);

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

  describe('a hit pulse', () =>
  {
    const cases = Hitboxes.flatMap(hitbox => Facings.map(facing => ({ ...hitbox, facing })));

    it.each(cases)('$name aimed toward $facing pulses exactly what it hits', hitbox =>
    {
      // Arrange
      const action = buildAction(hitbox);
      const spawned = spawnEvent(action, CasterTile);

      // Act
      const pulse = pulseFor(action, spawned);
      const { hits, disagreements } = compareWithTheHit(pulse, pulse.graphics(), action, spawned);

      // Assert: this is the shape that teaches a player what just got them.
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });

    it('never turns the sprite itself, because the drawing is already aimed', () =>
    {
      // Arrange
      const action = buildAction({ shape: 'line', range: 3, facing: 9 });
      const spawned = spawnEvent(action, CasterTile);

      // Act
      const pulse = pulseFor(action, spawned);

      // Assert
      expect(pulse.rotation).toBe(0);
    });
  });

  describe('the live hitbox overlay', () =>
  {
    it('draws what the action will test, aimed where it is aimed', () =>
    {
      // Arrange
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
      const sprite = { _jabsHitboxG: new PIXI.Graphics(), x: 0, y: 0 };
      const action = buildAction({ shape: 'arc', range: 2.5, degrees: 135, facing: 9 });
      const spawned = spawnEvent(action, CasterTile);
      const origin = JABS_Engine.getActionOriginPixels(spawned);
      sprite.x = origin.x;
      sprite.y = origin.y;

      // Act
      spriteset.drawActionHitboxInto(sprite, spawned);
      const { hits, disagreements } = compareWithTheHit(sprite, sprite._jabsHitboxG, action, spawned);

      // Assert
      expect(hits).toBeGreaterThan(0);
      expect(disagreements).toEqual([]);
    });
  });
});
//endregion plugins/abs/core/sprites/spriteset-map-cast-preview.test.js
