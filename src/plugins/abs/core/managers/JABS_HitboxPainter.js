//region JABS_HitboxPainter
/**
 * Draws hitbox geometry. Telegraphs, live hitboxes and hit pulses all draw through here, so the
 * shape that warns a player, the shape that teaches them, and the shape collision tests are one
 * and the same.
 */
class JABS_HitboxPainter
{
  /**
   * The narrowest a thickness may draw, in pixels, matching the floor collision gives it.
   * @type {number}
   */
  static MinimumThicknessPx = 1;

  /**
   * Draws the hitbox of an action, read the same way collision reads it.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Game_Event|JABS_CastPreviewAction} actionEvent The action event, or the stand-in for one.
   */
  static drawAction(g, actionEvent)
  {
    const action = actionEvent.getJabsAction();

    JABS_HitboxPainter.draw(g, {
      shape: action.getShape(),
      range: action.getCollisionRange(),
      facing: action.direction(),
      degrees: $jabsEngine.getActionDegrees(actionEvent) ?? 180,
      thickness: $jabsEngine.getActionThicknessTiles(actionEvent),
      innerRadius: action.getInnerRadius(),
    });
  }

  /**
   * Draws a hitbox around the graphics' local (0,0) and completes the fill, on whatever style the
   * caller already applied. Honors <thickness:N> for line, wall, and cross.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {{ shape:string|null, range:number, facing:number, degrees:number, thickness:number, innerRadius:number }} hitbox
   * The hitbox to draw: its shape, its size in tiles, its dir8 aim, and its tag values.
   */
  static draw(g, hitbox)
  {
    const { shape, innerRadius } = hitbox;

    switch (shape)
    {
      case J.ABS.Shapes.Rhombus:
        JABS_HitboxPainter.drawRhombus(g, hitbox);
        break;

      case J.ABS.Shapes.Square:
        JABS_HitboxPainter.drawSquare(g, hitbox);
        break;

      case J.ABS.Shapes.Line:
        JABS_HitboxPainter.drawLine(g, hitbox);
        break;

      case J.ABS.Shapes.Wall:
        JABS_HitboxPainter.drawWall(g, hitbox);
        break;

      case J.ABS.Shapes.Cross:
        JABS_HitboxPainter.drawCross(g, hitbox);
        break;

      case J.ABS.Shapes.Arc:
        JABS_HitboxPainter.drawArc(g, hitbox);
        break;

      // a skill with no <hitbox> tag collides as a circle, so it has to draw as one.
      case J.ABS.Shapes.Circle:
      default:
        JABS_HitboxPainter.drawCircle(g, hitbox);
        break;
    }

    // punch the universal dead zone out of every shape but the arc, which bakes it into its own
    // polygon: a hole punched at the pivot would break PIXI's triangulation.
    if (innerRadius > 0 && shape !== J.ABS.Shapes.Arc)
    {
      g.beginHole();
      g.drawCircle(0, 0, innerRadius * $gameMap.tileWidth());
      g.endHole();
    }

    // complete fill for this shape.
    g.endFill();
  }

  /**
   * Draws a circle, its radius in tile widths for consistency with collision.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawCircle(g, hitbox)
  {
    g.drawCircle(0, 0, hitbox.range * $gameMap.tileWidth());
  }

  /**
   * Draws a diamond centered on the origin.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawRhombus(g, hitbox)
  {
    const rx = hitbox.range * $gameMap.tileWidth();
    const ry = hitbox.range * $gameMap.tileHeight();

    g.moveTo(0, -ry);
    g.lineTo(rx, 0);
    g.lineTo(0, ry);
    g.lineTo(-rx, 0);
    g.closePath();
  }

  /**
   * Draws a full square centered on the origin.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawSquare(g, hitbox)
  {
    const tilesAcross = (2 * hitbox.range) + 1;
    const w = tilesAcross * $gameMap.tileWidth();
    const h = tilesAcross * $gameMap.tileHeight();

    g.drawRect(-w / 2, -h / 2, w, h);
  }

  /**
   * Draws a bar reaching forward from the origin along the aim.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawLine(g, hitbox)
  {
    const { range, facing, thickness } = hitbox;
    const tile = JABS_HitboxPainter.majorTilePx();

    // length uses the major axis regardless of orientation, with the half-tile pad collision gives it.
    const lengthPx = (range * tile) + (tile / 2);
    const breadthPx = Math.max(JABS_HitboxPainter.MinimumThicknessPx, thickness * tile);

    JABS_HitboxPainter.drawOrientedQuad(g, facing, lengthPx, breadthPx / 2);
  }

  /**
   * Draws a wide, shallow bar directly ahead of the origin.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawWall(g, hitbox)
  {
    const { range, facing, thickness } = hitbox;
    const tile = JABS_HitboxPainter.majorTilePx();

    // thickness is how deep it reaches forward, and the breadth spans the perpendicular axis.
    const depthPx = Math.max(JABS_HitboxPainter.MinimumThicknessPx, thickness * tile);
    const breadthPx = ((2 * range) + 1) * tile;

    JABS_HitboxPainter.drawOrientedQuad(g, facing, depthPx, breadthPx / 2);
  }

  /**
   * Draws the union of a vertical and a horizontal bar, centered on the origin. A cross never
   * turns with the aim, the same as its collision.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawCross(g, hitbox)
  {
    const { range, thickness } = hitbox;
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const tilesAcross = (2 * range) + 1;
    const w = tilesAcross * tw;
    const h = tilesAcross * th;
    const thicknessX = Math.max(JABS_HitboxPainter.MinimumThicknessPx, thickness * tw);
    const thicknessY = Math.max(JABS_HitboxPainter.MinimumThicknessPx, thickness * th);

    g.drawRect(-thicknessX / 2, -h / 2, thicknessX, h);
    g.drawRect(-w / 2, -thicknessY / 2, w, thicknessY);
  }

  /**
   * Draws a wedge centered on the aim.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {Object} hitbox The hitbox to draw; see {@link JABS_HitboxPainter.draw}.
   */
  static drawArc(g, hitbox)
  {
    const { range, facing, degrees, innerRadius } = hitbox;
    const tw = $gameMap.tileWidth();

    // the center angle from the logical dir8 (0 = right, π/2 = down in canvas atan2 space).
    const { x: fx, y: fy } = $jabsEngine.dir8ToUnitVector(facing);
    const centerRad = Math.atan2(fy, fx);

    const sweepRad = (degrees * Math.PI) / 180;

    JABS_HitboxPainter.drawSector(g, range * tw, centerRad, sweepRad, innerRadius * tw);
  }

  /**
   * Draws a filled sector around the origin, or a full circle when the sweep covers the whole way
   * around.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {number} r The radius in pixels.
   * @param {number} centerRad The center angle in radians. 0 = right, π/2 = down, π = left, -π/2 = up.
   * @param {number} sweepRad The total sweep in radians (0–2π].
   * @param {number} innerR The dead-zone radius in pixels; a positive one bakes an annular sector
   * (donut slice) instead of a pivot fan.
   */
  static drawSector(g, r, centerRad, sweepRad, innerR)
  {
    // normalize sweep to [0, 2π].
    const TAU = Math.PI * 2;
    const sweep = Math.max(0, Math.min(TAU, sweepRad));

    // if the sweep is effectively a full circle, a plain hole punch is safe- the ring never
    // touches the pivot the way a wedge fan does.
    if (sweep >= TAU - 1e-6)
    {
      g.drawCircle(0, 0, r);

      if (innerR > 0)
      {
        g.beginHole();
        g.drawCircle(0, 0, innerR);
        g.endHole();
      }

      return;
    }

    // derive start/end angles about the center angle.
    const start = centerRad - (sweep / 2);
    const end = centerRad + (sweep / 2);

    if (innerR > 0)
    {
      // bake the dead zone directly into the polygon as a true annular sector: out along the
      // outer rim, then back along the inner rim, closing the donut slice.
      g.moveTo(innerR * Math.cos(start), innerR * Math.sin(start));
      g.lineTo(r * Math.cos(start), r * Math.sin(start));
      g.arc(0, 0, r, start, end);
      g.lineTo(innerR * Math.cos(end), innerR * Math.sin(end));
      g.arc(0, 0, innerR, end, start, true);
      g.closePath();
      return;
    }

    // start from center → line to arc start → arc to end → back to center → fill.
    g.moveTo(0, 0);
    g.lineTo(r * Math.cos(start), r * Math.sin(start));
    g.arc(0, 0, r, start, end);
    g.lineTo(0, 0);
    g.closePath();
  }

  /**
   * Draws a filled rectangle starting at the origin and extending forward along the dir8 unit
   * vector, with its breadth split evenly either side of that axis.
   * @param {PIXI.Graphics} g The graphics to draw on.
   * @param {number} facing The dir8 facing for the forward axis.
   * @param {number} lengthPx The forward length in pixels.
   * @param {number} halfBreadthPx The half-width in pixels along the perpendicular axis.
   */
  static drawOrientedQuad(g, facing, lengthPx, halfBreadthPx)
  {
    const { x: fx, y: fy } = $jabsEngine.dir8ToUnitVector(facing);
    const px = fy;
    const py = -fx;
    const ax = -px * halfBreadthPx;
    const ay = -py * halfBreadthPx;
    const bx = px * halfBreadthPx;
    const by = py * halfBreadthPx;

    g.moveTo(ax, ay);
    g.lineTo(bx, by);
    g.lineTo((fx * lengthPx) + bx, (fy * lengthPx) + by);
    g.lineTo((fx * lengthPx) + ax, (fy * lengthPx) + ay);
    g.closePath();
  }

  /**
   * The longer side of a tile in pixels, which is what collision measures its oriented bars with.
   * @returns {number}
   */
  static majorTilePx()
  {
    return Math.max($gameMap.tileWidth(), $gameMap.tileHeight());
  }
}

export default JABS_HitboxPainter;
//endregion JABS_HitboxPainter