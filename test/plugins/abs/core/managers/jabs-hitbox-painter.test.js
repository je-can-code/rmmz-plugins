//region plugins/abs/core/managers/jabs-hitbox-painter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * These pin the exact geometry each shape asks of PIXI. Whether that geometry is what collision
 * tests is proved against the real thing in `spriteset-map-cast-preview.test.js`.
 *
 * The tile is deliberately not square, so a width read where a height belongs cannot go unnoticed.
 */
describe('JABS_HitboxPainter (direct src import)', () =>
{
  let JABS_HitboxPainter;
  let g;

  /**
   * Builds a hitbox with quiet defaults, so each test names only what it is about.
   * @param {Object} overrides The fields that matter to the test.
   * @returns {Object} The hitbox to draw.
   */
  const buildHitbox = overrides => ({
    shape: 'circle',
    range: 2,
    facing: 6,
    degrees: 180,
    thickness: 1,
    innerRadius: 0,
    ...overrides,
  });

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        Shapes: {
          Circle: 'circle',
          Rhombus: 'rhombus',
          Square: 'square',
          Line: 'line',
          Arc: 'arc',
          Wall: 'wall',
          Cross: 'cross',
        },
      },
    };

    ({ default: JABS_HitboxPainter } = await import(
      '../../../../../src/plugins/abs/core/managers/JABS_HitboxPainter.js'
    ));
  });

  beforeEach(() =>
  {
    g = {
      drawCircle: vi.fn(),
      drawRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      closePath: vi.fn(),
      beginHole: vi.fn(),
      endHole: vi.fn(),
      endFill: vi.fn(),
    };

    globalThis.$gameMap = { tileWidth: () => 48, tileHeight: () => 32 };
    globalThis.$jabsEngine = {
      dir8ToUnitVector: dir => ({ 2: { x: 0, y: 1 }, 6: { x: 1, y: 0 } }[dir]),
      getActionDegrees: vi.fn(() => null),
      getActionThicknessTiles: vi.fn(() => 2),
    };
  });

  describe('drawAction', () =>
  {
    /**
     * An action event carrying an action with a line hitbox.
     * @param {number|null} range The action's collision range.
     * @returns {Object} A stand-in for the action event.
     */
    const buildActionEvent = range => ({
      getJabsAction: () => ({
        getShape: () => 'line',
        getCollisionRange: () => range,
        direction: () => 2,
        getInnerRadius: () => 0,
      }),
    });

    it('draws what collision reads off the action', () =>
    {
      // Arrange: thickness comes from the engine, and the facing and range from the action.
      const actionEvent = buildActionEvent(3);

      // Act
      JABS_HitboxPainter.drawAction(g, actionEvent);

      // Assert: a 2-tile wide line reaching 3.5 major tiles down from the origin.
      expect(g.moveTo).toHaveBeenCalledWith(-48, 0);
      expect(g.lineTo).toHaveBeenCalledWith(48, 168);
      expect(g.endFill).toHaveBeenCalledTimes(1);
    });

    it('sweeps a full half circle when an arc has no degrees tag', () =>
    {
      // Arrange
      const actionEvent = {
        getJabsAction: () => ({
          getShape: () => 'arc',
          getCollisionRange: () => 2,
          direction: () => 6,
          getInnerRadius: () => 0,
        }),
      };

      // Act
      JABS_HitboxPainter.drawAction(g, actionEvent);

      // Assert
      expect(g.arc).toHaveBeenCalledWith(0, 0, 96, -Math.PI / 2, Math.PI / 2);
    });

    it('sweeps the tagged degrees when an arc has them', () =>
    {
      // Arrange
      globalThis.$jabsEngine.getActionDegrees.mockReturnValue(90);
      const actionEvent = {
        getJabsAction: () => ({
          getShape: () => 'arc',
          getCollisionRange: () => 2,
          direction: () => 6,
          getInnerRadius: () => 0,
        }),
      };

      // Act
      JABS_HitboxPainter.drawAction(g, actionEvent);

      // Assert
      expect(g.arc).toHaveBeenCalledWith(0, 0, 96, -Math.PI / 4, Math.PI / 4);
    });
  });

  describe('draw', () =>
  {
    it('completes the fill whatever it drew', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'square' }));

      // Assert
      expect(g.endFill).toHaveBeenCalledTimes(1);
    });

    it('sizes a circle in tile widths, the way collision does', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'circle', range: 2 }));

      // Assert
      expect(g.drawCircle).toHaveBeenCalledWith(0, 0, 96);
    });

    it('draws a skill with no hitbox tag as the circle it collides as', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: null, range: 2 }));

      // Assert
      expect(g.drawCircle).toHaveBeenCalledWith(0, 0, 96);
      expect(g.arc).not.toHaveBeenCalled();
    });

    it('draws a rhombus out to the range on each axis', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'rhombus', range: 2 }));

      // Assert
      expect(g.moveTo).toHaveBeenCalledWith(0, -64);
      expect(g.lineTo.mock.calls).toEqual([ [ 96, 0 ], [ 0, 64 ], [ -96, 0 ] ]);
      expect(g.closePath).toHaveBeenCalledTimes(1);
    });

    it('draws a square two ranges and a tile across, centered', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'square', range: 1 }));

      // Assert
      expect(g.drawRect).toHaveBeenCalledWith(-72, -48, 144, 96);
    });

    it('draws a line forward by its range and a half-tile pad, as wide as its thickness', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'line', range: 3, thickness: 2, facing: 6 }));

      // Assert
      expect(g.moveTo).toHaveBeenCalledWith(0, 48);
      expect(g.lineTo.mock.calls).toEqual([ [ 0, -48 ], [ 168, -48 ], [ 168, 48 ] ]);
    });

    it('keeps a line a pixel wide when its thickness is nothing', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'line', range: 1, thickness: 0, facing: 6 }));

      // Assert
      expect(g.moveTo).toHaveBeenCalledWith(0, 0.5);
    });

    it('draws a wall as deep as its thickness and two ranges and a tile across', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'wall', range: 1, thickness: 0.5, facing: 6 }));

      // Assert
      expect(g.moveTo).toHaveBeenCalledWith(0, 72);
      expect(g.lineTo.mock.calls).toEqual([ [ 0, -72 ], [ 24, -72 ], [ 24, 72 ] ]);
    });

    it('keeps a wall a pixel deep when its thickness is nothing', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'wall', range: 1, thickness: 0, facing: 6 }));

      // Assert
      expect(g.lineTo.mock.calls[1]).toEqual([ 1, -72 ]);
    });

    it('draws a cross as two bars, each as wide as its thickness on that axis', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'cross', range: 2, thickness: 1 }));

      // Assert
      expect(g.drawRect.mock.calls).toEqual([ [ -24, -80, 48, 160 ], [ -120, -16, 240, 32 ] ]);
    });

    it('keeps a cross a pixel wide when its thickness is nothing', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'cross', range: 2, thickness: 0 }));

      // Assert
      expect(g.drawRect.mock.calls).toEqual([ [ -0.5, -80, 1, 160 ], [ -120, -0.5, 240, 1 ] ]);
    });

    it('fans an arc from the pivot, centered on the aim', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: 90, facing: 2 }));

      // Assert: aimed down, so the sweep is centered on π/2.
      expect(g.moveTo).toHaveBeenCalledWith(0, 0);
      expect(g.arc).toHaveBeenCalledWith(0, 0, 96, Math.PI / 4, (Math.PI * 3) / 4);
      expect(g.lineTo).toHaveBeenLastCalledWith(0, 0);
      expect(g.closePath).toHaveBeenCalledTimes(1);
    });

    it('draws an arc of a full turn as a plain circle', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: 360 }));

      // Assert
      expect(g.drawCircle).toHaveBeenCalledWith(0, 0, 96);
      expect(g.arc).not.toHaveBeenCalled();
      expect(g.beginHole).not.toHaveBeenCalled();
    });

    it('treats an arc past a full turn as a full turn', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: 400 }));

      // Assert
      expect(g.drawCircle).toHaveBeenCalledWith(0, 0, 96);
      expect(g.arc).not.toHaveBeenCalled();
    });

    it('draws nothing wider than a sliver for an arc of no degrees', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: -10 }));

      // Assert
      expect(g.arc).toHaveBeenCalledWith(0, 0, 96, 0, 0);
    });
  });

  describe('breadthTiles', () =>
  {
    it('is a line\'s thickness', () =>
    {
      // Arrange & Act
      const result = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape: 'line', range: 4, thickness: 1.5 }));

      // Assert
      expect(result).toBe(1.5);
    });

    it.each([ 'wall', 'square', 'cross' ])('is two ranges and a tile across a %s', shape =>
    {
      // Arrange & Act
      const result = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape, range: 2 }));

      // Assert
      expect(result).toBe(5);
    });

    it.each([ 'circle', 'rhombus', null ])('is two ranges across a %s', shape =>
    {
      // Arrange & Act
      const result = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape, range: 2 }));

      // Assert
      expect(result).toBe(4);
    });

    it('is the span between the tips of a narrow wedge', () =>
    {
      // Arrange & Act
      const result = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape: 'arc', range: 1, degrees: 60 }));

      // Assert: a 60 degree wedge spans exactly one radius tip to tip.
      expect(result).toBeCloseTo(1, 10);
    });

    it('is two ranges from a half circle onward, the tips having stopped mattering', () =>
    {
      // Arrange & Act
      const halfCircle = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape: 'arc', range: 1, degrees: 180 }));
      const pastThat = JABS_HitboxPainter.breadthTiles(buildHitbox({ shape: 'arc', range: 1, degrees: 270 }));

      // Assert
      expect(halfCircle).toBe(2);
      expect(pastThat).toBe(2);
    });
  });

  describe('laneOpacityAt', () =>
  {
    it('stays solid up to where the fade begins', () =>
    {
      // Arrange & Act
      const results = [ 0, 19, 20 ].map(slice => JABS_HitboxPainter.laneOpacityAt(slice));

      // Assert: of thirty-two slices, the last twelve fade.
      expect(results).toEqual([ 1, 1, 1 ]);
    });

    it('thins out toward the far end without ever quite reaching nothing', () =>
    {
      // Arrange & Act
      const results = [ 21, 26, 31 ].map(slice => JABS_HitboxPainter.laneOpacityAt(slice));

      // Assert
      expect(results).toEqual([ 11 / 12, 6 / 12, 1 / 12 ]);
    });
  });

  describe('drawFlightLane', () =>
  {
    /**
     * A stand-in for a shot with a 2-radius circle hitbox, aimed right.
     * @param {number} laneTiles How far its lane reaches.
     * @returns {Object} A stand-in for the {@link JABS_CastPreviewAction}.
     */
    const buildStandIn = laneTiles => ({
      flightPreviewTiles: () => laneTiles,
      getJabsAction: () => ({
        getShape: () => 'circle',
        getCollisionRange: () => 2,
        direction: () => 6,
        getInnerRadius: () => 0,
      }),
    });

    const style = { fillColor: 0xFF5533, fillAlpha: 0.6 };

    beforeEach(() =>
    {
      g.beginFill = vi.fn();
      g.lineStyle = vi.fn();
    });

    it('draws nothing for an action that does not fly', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.drawFlightLane(g, buildStandIn(0), style);

      // Assert
      expect(g.beginFill).not.toHaveBeenCalled();
      expect(g.moveTo).not.toHaveBeenCalled();
    });

    it('draws its slices edge to edge, as wide as the hitbox and as long as the flight', () =>
    {
      // Arrange: 8 tiles over 32 slices is a quarter of a major tile, 12 pixels, each.
      const standIn = buildStandIn(8);

      // Act
      JABS_HitboxPainter.drawFlightLane(g, standIn, style);

      // Assert: the first slice, then the last one finishing exactly at the far end.
      expect(g.moveTo).toHaveBeenCalledTimes(32);
      expect(g.moveTo.mock.calls[0]).toEqual([ 0, 96 ]);
      expect(g.lineTo.mock.calls[1]).toEqual([ 12, -96 ]);
      expect(g.moveTo.mock.calls[31]).toEqual([ 372, 96 ]);
      expect(g.lineTo.mock.calls[95]).toEqual([ 384, 96 ]);
    });

    it('fades the far end out of the telegraph\'s own fill, with no outline', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.drawFlightLane(g, buildStandIn(8), style);

      // Assert
      expect(g.lineStyle).toHaveBeenCalledWith(0);
      expect(g.beginFill.mock.calls[0]).toEqual([ 0xFF5533, 0.6 ]);
      expect(g.beginFill.mock.calls[31][0]).toBe(0xFF5533);
      expect(g.beginFill.mock.calls[31][1]).toBeCloseTo(0.05, 10);
      expect(g.endFill).toHaveBeenCalledTimes(32);
    });
  });

  describe('the dead zone', () =>
  {
    it('punches a hole in any shape but the arc', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'circle', range: 2, innerRadius: 1 }));

      // Assert
      expect(g.beginHole).toHaveBeenCalledTimes(1);
      expect(g.drawCircle).toHaveBeenLastCalledWith(0, 0, 48);
      expect(g.endHole).toHaveBeenCalledTimes(1);
    });

    it('punches nothing when there is no dead zone', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'circle', range: 2, innerRadius: 0 }));

      // Assert
      expect(g.beginHole).not.toHaveBeenCalled();
    });

    it('bakes it into the polygon of an arc instead of punching at the pivot', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: 180, innerRadius: 1 }));

      // Assert: out along the rim, then back along the inner rim, with no hole anywhere.
      expect(g.arc.mock.calls).toEqual([
        [ 0, 0, 96, -Math.PI / 2, Math.PI / 2 ],
        [ 0, 0, 48, Math.PI / 2, -Math.PI / 2, true ],
      ]);
      expect(g.beginHole).not.toHaveBeenCalled();
    });

    it('punches a hole in an arc of a full turn, which has no pivot to break', () =>
    {
      // Arrange & Act
      JABS_HitboxPainter.draw(g, buildHitbox({ shape: 'arc', range: 2, degrees: 360, innerRadius: 1 }));

      // Assert
      expect(g.beginHole).toHaveBeenCalledTimes(1);
      expect(g.drawCircle.mock.calls).toEqual([ [ 0, 0, 96 ], [ 0, 0, 48 ] ]);
      expect(g.endHole).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/core/managers/jabs-hitbox-painter.test.js
