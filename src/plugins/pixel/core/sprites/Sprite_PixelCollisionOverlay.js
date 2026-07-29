//region Sprite_PixelCollisionOverlay
import PIXEL_CollisionManager from './../managers/PIXEL_CollisionManager.js';
import PixelDebugSampler from './../_models/PixelDebugSampler.js';

/**
 * A sprite that visualizes the PIXEL subcell collision table and the player's hitbox.
 * Draws only the currently visible subcells for performance.
 */
class Sprite_PixelCollisionOverlay
  extends Sprite
{
  /**
   * Constructor.
   * @param {...*} args Forwarded to {@link #initialize}.
   */
  

  //region properties
  /**
   * Gets the show grid lines.
   * @returns {*} The showGridLines.
   */
  isShowGridLines()
  {
    // hand back the show grid lines.
    return this._showGridLines;
  }

  /**
   * Gets the throttle.
   * @returns {*} The throttle.
   */
  throttle()
  {
    // hand back the throttle.
    return this._throttle;
  }

  /**
   * Sets the throttle.
   * @param {*} newThrottle The new throttle.
   */
  setThrottle(newThrottle)
  {
    // assign the throttle.
    this._throttle = newThrottle;
  }

  /**
   * Gets the last display x.
   * @returns {*} The lastDisplayX.
   */
  lastDisplayX()
  {
    // hand back the last display x.
    return this._lastDisplayX;
  }

  /**
   * Sets the last display x.
   * @param {*} newLastDisplayX The new lastDisplayX.
   */
  setLastDisplayX(newLastDisplayX)
  {
    // assign the last display x.
    this._lastDisplayX = newLastDisplayX;
  }

  /**
   * Gets the last display y.
   * @returns {*} The lastDisplayY.
   */
  lastDisplayY()
  {
    // hand back the last display y.
    return this._lastDisplayY;
  }

  /**
   * Sets the last display y.
   * @param {*} newLastDisplayY The new lastDisplayY.
   */
  setLastDisplayY(newLastDisplayY)
  {
    // assign the last display y.
    this._lastDisplayY = newLastDisplayY;
  }

  /**
   * Gets the last player x.
   * @returns {*} The lastPlayerX.
   */
  lastPlayerX()
  {
    // hand back the last player x.
    return this._lastPlayerX;
  }

  /**
   * Sets the last player x.
   * @param {*} newLastPlayerX The new lastPlayerX.
   */
  setLastPlayerX(newLastPlayerX)
  {
    // assign the last player x.
    this._lastPlayerX = newLastPlayerX;
  }

  /**
   * Gets the last player y.
   * @returns {*} The lastPlayerY.
   */
  lastPlayerY()
  {
    // hand back the last player y.
    return this._lastPlayerY;
  }

  /**
   * Sets the last player y.
   * @param {*} newLastPlayerY The new lastPlayerY.
   */
  setLastPlayerY(newLastPlayerY)
  {
    // assign the last player y.
    this._lastPlayerY = newLastPlayerY;
  }
  //endregion properties

  constructor(...args)
  {
    // Initialize Sprite base.
    super();
    this.initialize(...args);
  }

  /**
   * Initializes the overlay's bitmap and configuration.
   */
  initialize()
  {
    // Perform the base sprite initialization.
    super.initialize();

    // Create a bitmap that at least covers the screen.
    this.bitmap = new Bitmap(Graphics.width, Graphics.height);

    // Ensure the overlay sits above the tilemap but below topmost UI.
    this.z = 10;

    // Disable smoothing for crisp subcell rectangles.
    this.bitmap.smooth = false;

    // Track a small throttle counter for redraw frequency.
    this._throttle = 0;

    // Track last display coords to minimize redraws.
    this._lastDisplayX = -9999;
    this._lastDisplayY = -9999;

    // Track last player x/y to detect movement.
    this._lastPlayerX = -9999;
    this._lastPlayerY = -9999;

    // Whether to draw faint grid lines over subcells.
    this._showGridLines = true;

    // Semi-transparent overall opacity so map remains visible.
    this.opacity = 180;
  }

  /**
   * Updates the overlay each frame.
   */
  update()
  {
    // Perform base update.
    super.update();

    // Skip all logic (including the throttled redraw) when the overlay is hidden.
    // Without this guard the bitmap.clear() + fillRect storm runs every 6 frames
    // regardless of visibility, costing ~30fps on its own.
    if (this.visible === false) return;

    // If map or data not present, do nothing.
    if (!$gameMap || !$dataMap)
    {
      // Nothing to draw.
      return;
    }

    // Position the overlay to stick to the map's display origin.
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const dx = $gameMap.displayX();
    const dy = $gameMap.displayY();
    this.x = -Math.floor(dx * tw);
    this.y = -Math.floor(dy * th);

    // Throttle redraw to every 6 frames.
    this.setThrottle(this.throttle() + 1);
    const needThrottleRedraw = (this.throttle() % 6) === 0;

    // Detect camera or player motion to request redraw.
    const cameraMoved = (dx !== this.lastDisplayX()) || (dy !== this.lastDisplayY());
    const player = $gamePlayer;
    const playerMoved = player && (player.x !== this.lastPlayerX() || player.y !== this.lastPlayerY());

    // If neither throttle nor relevant movement, skip.
    if (!needThrottleRedraw && cameraMoved === false && playerMoved === false)
    {
      // Avoid unnecessary redraws.
      return;
    }

    // Cache state for next frame.
    this.setLastDisplayX(dx);
    this.setLastDisplayY(dy);
    if (player)
    {
      // Cache the player position for next frame.
      this.setLastPlayerX(player.x);
      this.setLastPlayerY(player.y);
    }

    // Redraw the visible region.
    this.redrawVisibleRegion();
  }

  /**
   * Redraws the bitmap for the currently visible region of the map.
   */
  redrawVisibleRegion()
  {
    // Clear the previous frame.
    this.bitmap.clear();

    // Ensure collision config exists.
    if (PIXEL_CollisionManager.collisionStepCount === undefined)
    {
      // Initialize with defaults if not present.
      PIXEL_CollisionManager.initConfig();
    }

    // Acquire basic dims and steps.
    const stepCount = PIXEL_CollisionManager.collisionStepCount;
    const subSizeX = $gameMap.tileWidth() / stepCount;
    const subSizeY = $gameMap.tileHeight() / stepCount;

    // Determine visible tile rectangle.
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const dx = $gameMap.displayX();
    const dy = $gameMap.displayY();
    const tilesWide = Math.ceil(Graphics.width / tw) + 2;
    const tilesHigh = Math.ceil(Graphics.height / th) + 2;

    // Compute start/end integer tiles.
    const tileStartX = Math.floor(dx);
    const tileStartY = Math.floor(dy);
    const tileEndX = Math.min(tileStartX + tilesWide, $gameMap.width());
    const tileEndY = Math.min(tileStartY + tilesHigh, $gameMap.height());

    // Draw subcells for each visible integer tile.
    for (let ty = tileStartY; ty < tileEndY; ty++)
    {
      // For each row of tiles, iterate subrows.
      for (let tx = tileStartX; tx < tileEndX; tx++)
      {
        // For each subrow in this tile.
        for (let sy = 0; sy < stepCount; sy++)
        {
          // Compute world subcell y coordinate in tile units.
          const subWorldY = ty + (sy / stepCount);

          // Precompute pixel y for this subrow.
          const py = Math.floor((subWorldY - dy) * th);

          // For each subcolumn in this tile.
          for (let sx = 0; sx < stepCount; sx++)
          {
            // Compute world subcell x coordinate in tile units.
            const subWorldX = tx + (sx / stepCount);

            // Lookup the collision code from the table.
            const code = this._readCode(subWorldX, subWorldY);

            // Acquire the color for this code.
            const color = this._colorForCode(code);

            // If no color (treat as transparent open), skip paint to keep perf.
            if (!color)
            {
              // Skip painting transparent subcells.
              continue;
            }

            // Compute pixel x for this subcell.
            const px = Math.floor((subWorldX - dx) * tw);

            // Draw the subcell rectangle with the code color.
            this.bitmap.fillRect(px, py, Math.ceil(subSizeX), Math.ceil(subSizeY), color);
          }
        }
      }
    }

    // Optionally draw faint subgrid lines to help visualize seams.
    if (this.isShowGridLines())
    {
      // Draw vertical and horizontal subcell grid lines.
      this._drawGridLines(tileStartX, tileStartY, tileEndX, tileEndY, stepCount, tw, th, dx, dy);
    }

    // Draw the player's hitbox on top.
    this._drawPlayerHitbox();

    // Also draw any one-frame sample traces provided by movement checks.
    this._drawSampleTraces();

    // Clear samples after drawing so next frame starts fresh.
    PixelDebugSampler.clear();
  }

  /**
   * Reads a code from the collision table for a fractional tile coordinate.
   * @param {number} subWorldX The fractional tile x.
   * @param {number} subWorldY The fractional tile y.
   * @returns {number} The stored code (or Open if missing).
   */
  _readCode(subWorldX, subWorldY)
  {
    // Acquire the table index for this coordinate.
    const idx = PIXEL_CollisionManager._index(subWorldX, subWorldY);

    // Return the code or default to Open if not present.
    return PIXEL_CollisionManager._table[idx] || PIXEL_CollisionManager.Codes.Open;
  }

  /**
   * Maps collision codes to semi-transparent colors for display.
   * @param {number} code The collision code.
   * @returns {string|null} A CSS color string, or null for transparent skip.
   */
  _colorForCode(code)
  {
    // Use a switch for clarity.
    switch (code)
    {
      // Open subcells are transparent; return null to skip the fillRect entirely.
      case PIXEL_CollisionManager.Codes.Open:
        return null;

      // Solid areas are strong red.
      case PIXEL_CollisionManager.Codes.Solid:
        return "rgba(255, 0, 0, 0.35)";

      // Vertical line blockers (Up/Down) are blue.
      case PIXEL_CollisionManager.Codes.VerticalLine:
        return "rgba(40, 120, 255, 0.35)";

      // Horizontal line blockers (Left/Right) are cyan.
      case PIXEL_CollisionManager.Codes.HorizontalLine:
        return "rgba(0, 220, 220, 0.35)";

      // Left edge blocker is orange.
      case PIXEL_CollisionManager.Codes.EdgeLeft:
        return "rgba(255, 140, 0, 0.40)";

      // Right edge blocker is darker orange.
      case PIXEL_CollisionManager.Codes.EdgeRight:
        return "rgba(255, 110, 0, 0.40)";

      // Bottom edge blocker is magenta.
      case PIXEL_CollisionManager.Codes.EdgeDown:
        return "rgba(220, 0, 180, 0.40)";

      // Top edge blocker is purple.
      case PIXEL_CollisionManager.Codes.EdgeUp:
        return "rgba(180, 0, 220, 0.40)";

      // Corners are yellow.
      case PIXEL_CollisionManager.Codes.CornerBottomLeft:
      case PIXEL_CollisionManager.Codes.CornerBottomRight:
      case PIXEL_CollisionManager.Codes.CornerTopLeft:
      case PIXEL_CollisionManager.Codes.CornerTopRight:
        return "rgba(255, 255, 0, 0.40)";

      // Unknown: pale gray.
      default:
        return "rgba(200, 200, 200, 0.25)";
    }
  }

  /**
   * Draws faint subgrid lines to visualize seam alignment.
   * @param {number} tileStartX Start tile x.
   * @param {number} tileStartY Start tile y.
   * @param {number} tileEndX End tile x.
   * @param {number} tileEndY End tile y.
   * @param {number} stepCount Subcells per tile edge.
   * @param {number} tw Tile width in pixels.
   * @param {number} th Tile height in pixels.
   * @param {number} dx Display origin x in tiles.
   * @param {number} dy Display origin y in tiles.
   */
  _drawGridLines(
    tileStartX,
    tileStartY,
    tileEndX,
    tileEndY,
    stepCount,
    tw,
    th,
    dx,
    dy)
  {
    // Choose line colors.
    const tileLine = "rgba(255,255,255,0.12)";
    const subLine = "rgba(255,255,255,0.06)";

    // Compute pixel boundaries.
    const pxStart = Math.floor((tileStartX - dx) * tw);
    const pyStart = Math.floor((tileStartY - dy) * th);
    const pxEnd = Math.ceil((tileEndX - dx) * tw);
    const pyEnd = Math.ceil((tileEndY - dy) * th);

    // Draw tile grid verticals.
    for (let tx = tileStartX; tx <= tileEndX; tx++)
    {
      // Compute pixel x for this tile boundary.
      const px = Math.floor((tx - dx) * tw);

      // Draw the tile vertical line.
      this.bitmap.fillRect(px, pyStart, 1, pyEnd - pyStart, tileLine);

      // Draw subcell verticals within the tile.
      for (let s = 1; s < stepCount; s++)
      {
        // Compute pixel x for subcell seam.
        const psx = Math.floor((tx - dx) * tw + (s * (tw / stepCount)));

        // Draw the subcell vertical line.
        this.bitmap.fillRect(psx, pyStart, 1, pyEnd - pyStart, subLine);
      }
    }

    // Draw tile grid horizontals.
    for (let ty = tileStartY; ty <= tileEndY; ty++)
    {
      // Compute pixel y for this tile boundary.
      const py = Math.floor((ty - dy) * th);

      // Draw the tile horizontal line.
      this.bitmap.fillRect(pxStart, py, pxEnd - pxStart, 1, tileLine);

      // Draw subcell horizontals within the tile.
      for (let s = 1; s < stepCount; s++)
      {
        // Compute pixel y for subcell seam.
        const psy = Math.floor((ty - dy) * th + (s * (th / stepCount)));

        // Draw the subcell horizontal line.
        this.bitmap.fillRect(pxStart, psy, pxEnd - pxStart, 1, subLine);
      }
    }
  }

  /**
   * Draws the player's collision hitbox rectangle over the overlay.
   */
  _drawPlayerHitbox()
  {
    // If no player, skip.
    if (!$gamePlayer)
    {
      // Nothing to draw if no player exists.
      return;
    }

    // Get the player center position using the same pivot used by collision.
    const cx = $gamePlayer.x + $gamePlayer.getCollisionPivotX();
    const cy = $gamePlayer.y + $gamePlayer.getCollisionPivotY();

    // Get the effective (pivot-clamped) collision radius.
    const radius = $gamePlayer.getEffectiveRadius();

    // Build the hitbox from the radius.
    const hb = $gamePlayer._pixelHitbox(radius);

    // Compute world-space rectangle corners in tiles.
    const left = cx + hb.hx;
    const top = cy + hb.hy;
    const widthTiles = hb.w;
    const heightTiles = hb.h;

    // Convert to pixels based on map display origin.
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const dx = $gameMap.displayX();
    const dy = $gameMap.displayY();
    const px = Math.floor((left - dx) * tw);
    const py = Math.floor((top - dy) * th);
    const pw = Math.ceil(widthTiles * tw);
    const ph = Math.ceil(heightTiles * th);

    // Draw the outline rectangle for the hitbox.
    this._strokeRect(px, py, pw, ph, "rgba(0, 255, 0, 0.9)");

    // Draw a small cross at the pivot.
    const cxp = Math.floor(((cx - dx) * tw));
    const cyp = Math.floor(((cy - dy) * th));
    this.bitmap.fillRect(cxp - 2, cyp, 5, 1, "rgba(0,255,0,0.9)");
    this.bitmap.fillRect(cxp, cyp - 2, 1, 5, "rgba(0,255,0,0.9)");
  }

  /**
   * Draws one-frame sample traces emitted by the collision checks.
   */
  _drawSampleTraces()
  {
    // If no debug container or no samples, skip.
    if (PixelDebugSampler.enabled === false) return;
    const dbg = PixelDebugSampler;
    if (!dbg.samples || dbg.samples.length === 0) return;

    // Acquire pixel conversion.
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const dx = $gameMap.displayX();
    const dy = $gameMap.displayY();

    // Compute subcell pixel sizes for a tiny highlight.
    if (PIXEL_CollisionManager.collisionStepCount === undefined) PIXEL_CollisionManager.initConfig();
    const step = PIXEL_CollisionManager.collisionStepCount;
    const subW = Math.max(2, Math.ceil(tw / step) - 1);
    const subH = Math.max(2, Math.ceil(th / step) - 1);

    // Draw each sample as a small rectangle in its color.
    dbg.samples.forEach(s =>
    {
      const px = Math.floor((s.x - dx) * tw);
      const py = Math.floor((s.y - dy) * th);
      this.bitmap.fillRect(px, py, subW, subH, s.color);
    });
  }

  /**
   * Draws a 1px rectangle stroke.
   * @param {number} x The x in pixels.
   * @param {number} y The y in pixels.
   * @param {number} w The width in pixels.
   * @param {number} h The height in pixels.
   * @param {string} color The CSS color.
   */
  _strokeRect(x, y, w, h, color)
  {
    // Draw top edge.
    this.bitmap.fillRect(x, y, w, 1, color);

    // Draw bottom edge.
    this.bitmap.fillRect(x, y + h - 1, w, 1, color);

    // Draw left edge.
    this.bitmap.fillRect(x, y, 1, h, color);

    // Draw right edge.
    this.bitmap.fillRect(x + w - 1, y, 1, h, color);
  }
}

export default Sprite_PixelCollisionOverlay;
//endregion Sprite_PixelCollisionOverlay