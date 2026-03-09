//region Sprite_MiniMap
// noinspection JSBitwiseOperatorUsage
/**
 * A lightweight, cached mini-map sprite:
 * - Builds a padded cache of the map background and impassability edges.
 * - Renders the current view window by blitting from the cache.
 * - Draws dynamic overlay markers each frame (enemies, followers).
 * - Draws the player marker (green circle) onto the base bitmap when the viewport changes.
 *
 * External environment and global dependencies (RPG Maker MZ + JABS):
 * - $gameMap: Game_Map
 * - $gamePlayer: Game_Player
 * - Graphics: PIXI / RM screen dimensions
 * - Bitmap: RMMZ Bitmap
 * - Sprite: RMMZ Sprite
 * - J.ABS, JABS_AiManager: JABS battle system (optional)
 */
class Sprite_MiniMap
  extends Sprite
{
  //region configuration

  /**
   * Number of tiles to show from the player in each direction.
   * Viewport width/height in tiles = (MAP_RANGE * 2 + 1).
   * @type {number}
   */
  MAP_RANGE = 12;

  /**
   * The pixel size of each minimap tile.
   * @type {number}
   */
  SCALE = 8;

  /**
   * Minimap X position in screen pixels; -1 = auto bottom-right.
   * @type {number}
   */
  POS_X = -1;

  /**
   * Minimap Y position in screen pixels; -1 = auto bottom-right.
   * @type {number}
   */
  POS_Y = -1;

  /**
   * Background color surrounding/behind the minimap.
   * Accepts #rrggbb or #rrggbbaa; converted to CSS via toCss().
   * @type {string}
   */
  BG_COLOR = '#00000066';

  /**
   * General floor/ground fill color.
   * @type {string}
   */
  FLOOR_COLOR = '#ffffff33';

  /**
   * Edge (directional block) stroke color.
   * @type {string}
   */
  EDGE_COLOR = '#e6f0ffcc';

  /**
   * Fill color for wholly impassable tiles (blocked in all directions).
   * @type {string}
   */
  IMPASSABLE_COLOR = '#330000aa';

  /**
   * Minimum marker size in pixels.
   * @type {number}
   */
  MARKER_MIN = 2;

  /**
   * Whether or not to use smooth scrolling for the map rather than tile-step based scrolling.
   * @type {boolean}
   */
  SMOOTH_SCROLL = true;

  /**
   * The smoothness of scrolling- use 0 to follow the real position, or decimal for a little drag.
   * @type {number}
   */
  SMOOTH_LERP = 0;

  //endregion configuration

  /**
   * Constructs a new minimap sprite and initializes the cache, overlay, and positioning.
   */
  constructor()
  {
    super();

    this.initCoreData();
    this.initCacheData();
    this.initOverlayLayer();
    this.initChromeLayer();
    this.initFrameLayer();
  }

  initCoreData()
  {
    /**
     * The number of padding tiles applied on each side of the cached map.
     * This is equal to MAP_RANGE and allows player-centered scrolling near edges.
     * @type {number}
     */
    this._cacheOffsetTiles = 0;

    /**
     * Viewport dimension, in tiles, along a single axis (width or height).
     * Computed as (MAP_RANGE * 2 + 1).
     * @type {number}
     */
    this._viewTiles = (this.MAP_RANGE * 2) + 1;

    /**
     * Viewport width in pixels.
     * @type {number}
     */
    this._width = this._viewTiles * this.SCALE;

    /**
     * Viewport height in pixels.
     * @type {number}
     */
    this._height = this._viewTiles * this.SCALE;

    /**
     * The displayed bitmap containing only the visible window (cache slice + player marker).
     * @type {Bitmap}
     */
    this.bitmap = new Bitmap(this._width, this._height);

    // Positioning
    this.anchor.set(0.5, 0.5);

    this.x = J.MAP.Metadata.minimapX >= 0
      ? J.MAP.Metadata.minimapX
      : (Graphics.boxWidth - (this._width / 2) - 10);

    this.y = J.MAP.Metadata.minimapY >= 0
      ? J.MAP.Metadata.minimapY
      : (Graphics.boxHeight - (this._height / 2) - 10);

    this.z = 200;

    /**
     * Last known player x tile; used to detect when to re-blit the window.
     * @type {number}
     */
    this._lastX = -1;

    /**
     * Last known player y tile; used to detect when to re-blit the window.
     * @type {number}
     */
    this._lastY = -1;
  }

  initCacheData()
  {
    /**
     * Full-map cached bitmap (map + padding around it), rebuilt per-map.
     * @type {Bitmap}
     */
    this._cacheBitmap = new Bitmap(1, 1);

    /**
     * Whether the full-map cache is currently built.
     * @type {boolean}
     */
    this._cacheReady = false;

    /**
     * The mapId associated with the current cache.
     * @type {number}
     */
    this._cachedMapId = 0;

    this._smoothFx = 0; // smoothed source X in pixels within _cacheBitmap
    this._smoothFy = 0; // smoothed source Y in pixels within _cacheBitmap
  }

  initOverlayLayer()
  {
    /**
     * Dynamic overlay bitmap drawn every frame (enemies, followers, etc.).
     * @type {Bitmap}
     */
    this._overlay = new Bitmap(this._width, this._height);

    /**
     * Sprite child for the overlay bitmap.
     * @type {Sprite}
     */
    this._overlaySprite = new Sprite(this._overlay);
    this._overlaySprite.anchor.set(0.5, 0.5);
    this.addChild(this._overlaySprite);
  }

  initChromeLayer()
  {
    // Create a chrome layer (static UI chrome, like the North notch)
    this._chromeBitmap = new Bitmap(this._width, this._height);
    this._chromeSprite = new Sprite(this._chromeBitmap);

    // Add this line to align the chrome with the minimap center
    this._chromeSprite.anchor.set(0.5, 0.5);

    // adds it as the final layer before the frame.
    this.addChild(this._chromeSprite);

    // Draw the chrome now.
    this.redrawChrome();
  }

  initFrameLayer()
  {
    /**
     * The minimap's frame sprite.
     * @type {Sprite}
     */
    this._minimapFrameSprite = new Sprite(new Bitmap(this._width, this._height));
    this._minimapFrameSprite.anchor.set(0.5, 0.5);
    this._minimapFrameSprite.x = 0; // or align to minimap container offsets
    this._minimapFrameSprite.y = 0;
    this.addChild(this._minimapFrameSprite);

    // Draw initial frame
    this.drawPixelArtMinimapFrame(
      this._minimapFrameSprite.bitmap,
      0,
      0,
      this._minimapFrameSprite.bitmap.width,
      this._minimapFrameSprite.bitmap.height,
      {
        // tweak to taste
        thickness: 3,
        rim: 1,
        highlight: 1, // palette options (examples)
      });
  }

  //region lifecycle
  /**
   * Flags the full-map cache to be rebuilt on the next update tick.
   * Useful when tileset or rendering settings change.
   */
  refresh()
  {
    this._cacheReady = false;
  }

  /**
   * Per-frame update. Ensures cache is built for the active map,
   * re-blits the visible window when the player has changed tiles,
   * and refreshes the overlay every frame.
   */
  update()
  {
    super.update();
    if (!$gameMap) return;

    const mapId = $gameMap.mapId
      ? $gameMap.mapId()
      : 0;

    // Build cache if first time, or map changed, or refresh() requested.
    if (!this._cacheReady || this._cachedMapId !== mapId)
    {
      this.buildCache();
      this._cachedMapId = mapId;
      this._cacheReady = true;

      // Seed smoothing so there's no snap on the first frame after rebuild.
      const {
        fx,
        fy
      } = this.srcFloatFromPlayer?.() ?? {
        fx: 0,
        fy: 0
      };
      this._smoothFx = fx;
      this._smoothFy = fy;

      // Force initial redraw regardless of movement.
      this._lastX = -99999;
      this._lastY = -99999;
    }

    if (this.SMOOTH_SCROLL)
    {
      // Always redraw to follow sub-tile movement
      this.redrawWindowSmooth();
      this.refreshMinimapFrame();

      // Keep last integer tile updated for any logic that relies on it
      this._lastX = $gamePlayer.x;
      this._lastY = $gamePlayer.y;
    }
    else if (this.needsUpdate())
    {
      // Legacy: only redraw when the player changes tiles
      this.redrawWindow();
      this._lastX = $gamePlayer.x;
      this._lastY = $gamePlayer.y;
      this.refreshMinimapFrame();
    }

    // Overlay is dynamic; draw every frame.
    this.redrawOverlay();
  }

  refreshMinimapFrame()
  {
    if (!this._minimapFrameSprite) return;

    const w = this.bitmap.width;
    const h = this.bitmap.height;
    if (this._minimapFrameSprite.bitmap.width !== w || this._minimapFrameSprite.bitmap.height !== h)
    {
      this._minimapFrameSprite.bitmap = new Bitmap(w, h);
      // Keep the sprite centered over the parent
      this._minimapFrameSprite.anchor.set(0.5, 0.5);
      this._minimapFrameSprite.x = 0;
      this._minimapFrameSprite.y = 0;
    }
    else
    {
      this._minimapFrameSprite.bitmap.clear();
    }

    this.drawPixelArtMinimapFrame(this._minimapFrameSprite.bitmap, 0, 0, w, h);
  }

  //endregion lifecycle

  /**
   * Enters a temporary focus mode: the minimap is moved to the middle-right of the screen and greatly expand scope.
   * While focused, overlap dimming is disabled and the map is always visible.
   * Calling this while already focused is a no-op.
   */
  enterFocusMode()
  {
    // if already focused, do nothing.
    if (this._focusMode) return;

    // mark focused.
    this._focusMode = true;

    // snapshot current state to restore later.
    this._preFocusState = {
      mapRange: this.MAP_RANGE,           // current tiles in each direction
      scale: this.SCALE,                  // current tile pixel size
      width: this._width,                 // window width in px
      height: this._height,               // window height in px
      x: this.x,                          // position
      y: this.y,
      smoothFx: this._smoothFx,           // smooth scroll floats
      smoothFy: this._smoothFy,
    };

    // Choose an expanded scope. 2x is a good default; tweak to taste.
    // We expand MAP_RANGE (more tiles) to see far more of the map at once.
    const focusMultiplier = 3; // show twice the tiles in each direction
    this.MAP_RANGE = Math.max(4, Math.floor(this.MAP_RANGE * focusMultiplier));

    // Optionally nudge SCALE up a hair so the whole widget is even larger
    // (comment out if you want strictly “more area” with same per-tile size).
    // this.SCALE = this.SCALE + 2;

    // Recompute derived dimensions for the new window size.
    this._viewTiles = (this.MAP_RANGE * 2) + 1; // tiles per axis
    this._width = this._viewTiles * this.SCALE; // pixels
    this._height = this._viewTiles * this.SCALE; // pixels

    // Resize the base bitmap.
    this.bitmap = new Bitmap(this._width, this._height);

    // Resize overlay and keep it centered/aligned.
    if (this._overlaySprite)
    {
      this._overlay = new Bitmap(this._width, this._height);
      this._overlaySprite.bitmap = this._overlay;
      this._overlaySprite.anchor.set(0.5, 0.5);
    }

    // Resize chrome and redraw.
    if (this._chromeSprite)
    {
      this._chromeBitmap = new Bitmap(this._width, this._height);
      this._chromeSprite.bitmap = this._chromeBitmap;
      this._chromeSprite.anchor.set(0.5, 0.5);
      this.redrawChrome();
    }

    // Resize and redraw frame to match.
    this.refreshMinimapFrame();

    // Reposition: center of the screen.
    this.x = Math.floor(Graphics.boxWidth - (this._width / 2) - 10);
    this.y = Math.floor(Graphics.boxHeight / 2);

    // Force cache rebuild and seed smoothing so there is no snap.
    this.refresh();
    const {
      fx,
      fy
    } = this.srcFloatFromPlayer?.() ?? {
      fx: 0,
      fy: 0
    };
    this._smoothFx = fx;
    this._smoothFy = fy;

    // Ensure immediate redraw.
    this._lastX = -99999;
    this._lastY = -99999;

    // Ensure visibility while focused.
    this.visible = true;
  }

  /**
   * Exits focus mode and restores the previous minimap size, scope, and position.
   * Calling this when not focused is a no-op.
   */
  exitFocusMode()
  {
    // if not focused, nothing to do.
    if (!this._focusMode) return;

    // clear focus flag first to let visibility logic work normally.
    this._focusMode = false;

    // pull prior state; if missing, just bail gracefully.
    const st = this._preFocusState || null;
    this._preFocusState = null;
    if (!st) return;

    // Restore core values.
    this.MAP_RANGE = st.mapRange;
    this.SCALE = st.scale;

    // Recompute derived window size.
    this._viewTiles = (this.MAP_RANGE * 2) + 1;
    this._width = this._viewTiles * this.SCALE;
    this._height = this._viewTiles * this.SCALE;

    // Resize base bitmap.
    this.bitmap = new Bitmap(this._width, this._height);

    // Resize overlay bitmap/sprite.
    if (this._overlaySprite)
    {
      this._overlay = new Bitmap(this._width, this._height);
      this._overlaySprite.bitmap = this._overlay;
      this._overlaySprite.anchor.set(0.5, 0.5);
    }

    // Resize chrome and redraw.
    if (this._chromeSprite)
    {
      this._chromeBitmap = new Bitmap(this._width, this._height);
      this._chromeSprite.bitmap = this._chromeBitmap;
      this._chromeSprite.anchor.set(0.5, 0.5);
      this.redrawChrome();
    }

    // Refresh the frame to match new size.
    this.refreshMinimapFrame();

    // Restore configured corner/coordinates.
    this.anchor.set(0.5, 0.5);
    this.x = J.MAP.Metadata.minimapX >= 0
      ? J.MAP.Metadata.minimapX
      : (Graphics.boxWidth - (this._width / 2) - 10);
    this.y = J.MAP.Metadata.minimapY >= 0
      ? J.MAP.Metadata.minimapY
      : (Graphics.boxHeight - (this._height / 2) - 10);

    // Force cache rebuild for the smaller window and reset smoothing.
    this.refresh();
    const {
      fx,
      fy
    } = this.srcFloatFromPlayer?.() ?? {
      fx: 0,
      fy: 0
    };
    this._smoothFx = fx;
    this._smoothFy = fy;

    // Force redraw next update.
    this._lastX = -99999;
    this._lastY = -99999;
  }

  /**
   * Whether the minimap is in the temporary focus mode.
   * @returns {boolean}
   */
  isInFocusMode()
  {
    return !!this._focusMode;
  }

  //region drawing
  /**
   * Returns true if the player changed tiles since the last redraw.
   * @returns {boolean}
   */
  needsUpdate()
  {
    if (!$gamePlayer) return false;
    return $gamePlayer.x !== this._lastX || $gamePlayer.y !== this._lastY;
  }

  /**
   * Rebuilds the full cached bitmap of the map (with padding), drawing:
   * - Background
   * - Base floor tiles
   * - Edge strokes according to passability flags
   * Subclasses may override drawCell(...) to fully customize tile rendering.
   */
  buildCache()
  {
    const mapWidth = $gameMap.width();
    const mapHeight = $gameMap.height();

    const pad = this.MAP_RANGE; // padding tiles around the map in the cache
    this._cacheOffsetTiles = pad;

    const cacheTilesW = mapWidth + (pad * 2);
    const cacheTilesH = mapHeight + (pad * 2);
    const pixelWidth = cacheTilesW * this.SCALE;
    const pixelHeight = cacheTilesH * this.SCALE;

    this._cacheBitmap = new Bitmap(pixelWidth, pixelHeight);

    // Background behind the map
    this._cacheBitmap.fillRect(0, 0, pixelWidth, pixelHeight, this.toCss(this.BG_COLOR));

    // Pre-fetch tileset flags once
    /** @type {number[]} */
    const flags = $gameMap.tilesetFlags();

    // Loop flags from engine
    const loopH = $gameMap.isLoopHorizontal?.() ?? false;
    const loopV = $gameMap.isLoopVertical?.() ?? false;

    // Base map at (pad, pad)
    this.drawMapCopyAt(pad, pad, flags);

    // Horizontal wrapping (fill left/right padding)
    if (loopH)
    {
      this.drawMapCopyAt(pad - mapWidth, pad, flags); // left band
      this.drawMapCopyAt(pad + mapWidth, pad, flags); // right band
    }

    // Vertical wrapping (fill top/bottom padding)
    if (loopV)
    {
      this.drawMapCopyAt(pad, pad - mapHeight, flags); // top band
      this.drawMapCopyAt(pad, pad + mapHeight, flags); // bottom band
    }

    // Corner quadrants when both loop
    if (loopH && loopV)
    {
      this.drawMapCopyAt(pad - mapWidth, pad - mapHeight, flags); // top-left
      this.drawMapCopyAt(pad + mapWidth, pad - mapHeight, flags); // top-right
      this.drawMapCopyAt(pad - mapWidth, pad + mapHeight, flags); // bottom-left
      this.drawMapCopyAt(pad + mapWidth, pad + mapHeight, flags); // bottom-right
    }
  }

  /**
   * Clears the base window bitmap and blits the appropriate slice
   * from the full cached bitmap, then draws the player marker at the center.
   */
  redrawWindow()
  {
    if (!this._cacheBitmap) return;

    this.bitmap.clear();

    const {
      srcX,
      srcY
    } = this.cacheSrcFromPlayer();
    this.bitmap.blt(this._cacheBitmap, srcX, srcY, this._width, this._height, 0, 0);
    // Player marker at center (green circle)
    this.drawPlayerMarker();
  }

  /**
   * Draws the static layer after the overlay layer.
   */
  redrawChrome()
  {
    if (!this._chromeBitmap) return;

    this._chromeBitmap.clear();
    this.drawNorthNotch(this._chromeBitmap);

    this.setChildIndex(this._chromeSprite, this.children.length - 1);
  }

  /**
   * Clears and redraws the dynamic overlay (enemies, followers, etc.).
   */
  redrawOverlay()
  {
    this._overlay.clear();
    this.drawOverlay(this._overlay);
  }

  redrawWindowSmooth()
  {
    if (!this._cacheBitmap) return;

    // Target float source (pixels)
    const {
      fx: tfx,
      fy: tfy
    } = this.srcFloatFromPlayer();

    // Optional easing (lerp) for extra smoothness
    if (this.SMOOTH_LERP > 0)
    {
      const a = this.SMOOTH_LERP;
      this._smoothFx = this._smoothFx + (tfx - this._smoothFx) * a;
      this._smoothFy = this._smoothFy + (tfy - this._smoothFy) * a;
    }
    else
    {
      this._smoothFx = tfx;
      this._smoothFy = tfy;
    }

    // Clamp source to cache bounds
    const maxSx = Math.max(0, this._cacheBitmap.width - this._width);
    const maxSy = Math.max(0, this._cacheBitmap.height - this._height);
    const sfx = Math.min(Math.max(this._smoothFx, 0), maxSx);
    const sfy = Math.min(Math.max(this._smoothFy, 0), maxSy);

    // Slice on whole pixels; keep sub-pixel via dest offset
    const srcX = Math.floor(sfx);
    const srcY = Math.floor(sfy);
    const dx = -(sfx - srcX); // fractional remainder, negative to keep player centered
    const dy = -(sfy - srcY);

    this.bitmap.clear();

    // If your runtime floors dx/dy, wrap with Math.round(dx/dy)
    this.bitmap.blt(this._cacheBitmap, srcX, srcY, this._width, this._height, dx, dy);

    // Player marker stays at center
    this.drawPlayerMarker();
  }

  /**
   * Draws the player marker (a centered plus "+") at the center tile
   * of the current window on the base bitmap.
   */
  drawPlayerMarker()
  {
    // Center tile (MAP_RANGE, MAP_RANGE) in window space
    const {
      leftPx,
      topPx
    } = this.tileLeftTopPx(this.MAP_RANGE, this.MAP_RANGE);

    // Base player marker (plus)
    this.drawPlusOn(this.bitmap, leftPx, topPx, this.SCALE - 2, MinimapEventType.Player.color);

    // Perpendicular facing line (always on)
    const dir = $gamePlayer.direction();
    this.drawFacingPerpLineOn(this.bitmap, leftPx, topPx, this.SCALE, MinimapEventType.Player.color, dir);
  }

  /**
   * Draws edge strokes for a single tile according to the blocked-direction bitmask.
   * Bits: 0x01=down, 0x02=left, 0x04=right, 0x08=up
   * @param {Bitmap} targetBitmap - The bitmap to draw onto.
   * @param {number} sx - Tile top-left x in pixels on targetBitmap.
   * @param {number} sy - Tile top-left y in pixels on targetBitmap.
   * @param {number} mask - Blocked-direction mask.
   */
  drawEdges(targetBitmap, sx, sy, mask)
  {
    const c = this.toCss(this.EDGE_COLOR);
    const s = this.SCALE;
    const t = 2; // edge thickness

    if (mask & 0x01) targetBitmap.fillRect(sx, sy + s - t, s, t, c); // bottom
    if (mask & 0x02) targetBitmap.fillRect(sx, sy, t, s, c);         // left
    if (mask & 0x04) targetBitmap.fillRect(sx + s - t, sy, t, s, c); // right
    if (mask & 0x08) targetBitmap.fillRect(sx, sy, s, t, c);         // top
  }

  /**
   * Draws one full map copy into the cache, offset by whole-tile origins.
   * originTileX/Y are in cache tile space, relative to the cache’s (0,0).
   * @param {number} originTileX
   * @param {number} originTileY
   * @param {number[]} flags - tileset flags (pre-fetched)
   */
  drawMapCopyAt(originTileX, originTileY, flags)
  {
    const mapWidth = $gameMap.width();
    const mapHeight = $gameMap.height();

    for (let y = 0; y < mapHeight; y++)
    {
      for (let x = 0; x < mapWidth; x++)
      {
        const sx = (originTileX + x) * this.SCALE;
        const sy = (originTileY + y) * this.SCALE;

        const mask = this.blockedMaskAt(x, y, flags);

        if (this.drawCell(x, y, sx, sy, mask)) continue;

        if (mask === 0x0f)
        {
          this._cacheBitmap.fillRect(sx, sy, this.SCALE, this.SCALE, this.toCss(this.IMPASSABLE_COLOR));
        }
        else
        {
          this._cacheBitmap.fillRect(sx, sy, this.SCALE, this.SCALE, this.toCss(this.FLOOR_COLOR));
          this.drawEdges(this._cacheBitmap, sx, sy, mask);
        }
      }
    }
  }

  /**
   * Draws a marker using a {@link MinimapEventType}'s shape and color.
   */
  drawByType(targetBitmap, lx, ly, sizePx, type)
  {
    const size = Math.max(this.MARKER_MIN, Math.min(this.SCALE, sizePx));
    switch (type.shape)
    {
      case MinimapEventType.Shapes.Square:
        this.drawSquareOn(targetBitmap, lx, ly, size, type.color);
        break;
      case MinimapEventType.Shapes.Diamond:
        this.drawDiamondOn(targetBitmap, lx, ly, size, type.color);
        break;
      case MinimapEventType.Shapes.Plus:
        this.drawPlusOn(targetBitmap, lx, ly, size, type.color);
        break;
      case MinimapEventType.Shapes.HollowSquare:
        this.drawHollowSquareOn(targetBitmap, lx, ly, size, type.color);
        break;
      case MinimapEventType.Shapes.Disk:
      default:
        this.drawDiskOn(targetBitmap, lx, ly, size, type.color);
        break;
    }
  }

  drawNorthNotch(targetBitmap)
  {
    const w = this._width;
    const centerX = Math.floor(w / 2);

    // Use your configured edge color with a darker halo for contrast
    const fillCol = this.toCss(this.EDGE_COLOR);     // e.g., '#ffffff77'
    const underCol = 'rgba(0,0,0,0.40)';             // subtle dark halo

    // Height scales with tile size, clamped (≈4–7 px for common scales)
    const triH = Math.max(4, Math.min(7, Math.floor(this.SCALE / 2)));

    // Inset from top to sit below any outer border lines
    const topY = 6; // increase to 6–8 if your border is thicker

    // Underlay halo (slightly wider than the fill)
    for (let i = 0; i < triH; i++)
    {
      const span = i + 1;
      const y = topY + i;
      targetBitmap.fillRect(centerX - span - 1, y, (span * 2 + 1) + 2, 1, underCol);
    }

    // Fill: symmetric, up-pointing isosceles triangle
    for (let i = 0; i < triH; i++)
    {
      const span = i;
      const y = topY + i;
      targetBitmap.fillRect(centerX - span, y, span * 2 + 1, 1, fillCol);
    }
  }

  //endregion drawing

  //region overlay & markers
  /**
   * Draws dynamic markers for enemies and followers onto the overlay bitmap.
   * - Hostile enemies: red diamonds.
   * - Inanimate/non-hostile enemies: orange diamonds.
   * - Followers: blue squares.
   * @param {Bitmap} overlayBitmap - The overlay bitmap to draw on.
   */
  drawOverlay(overlayBitmap)
  {
    if (!$gameMap || !$gamePlayer) return;

    this.drawFollowers(overlayBitmap);
    this.drawEvents(overlayBitmap);
  }

  /**
   * Draws the followers onto the overlay bitmap.
   */
  drawFollowers(overlayBitmap)
  {
    const scale = this.SCALE;

    const followers = $gamePlayer.followers()
      .visibleFollowers();

    followers.forEach(follower =>
    {
      const wx = (follower._realX ?? follower.x);
      const wy = (follower._realY ?? follower.y);
      const {
        lx,
        ly
      } = this.worldToLocalAroundPlayer(wx, wy);
      if (!this.inView(lx, ly)) return;

      this.drawByType(overlayBitmap, lx, ly, Math.max(2, scale - 4), MinimapEventType.Follower);
    }, this);
  }

  /**
   * Draws the various events onto the overlay bitmap.
   */
  drawEvents(overlayBitmap)
  {
    $gameMap.events()
      .forEach(event => this.drawEvent(overlayBitmap, event), this);
  }

  /**
   * Draws a particular event onto the bitmap overlay.
   * @param {Bitmap} overlayBitmap The bitmap being rendered onto.
   * @param {Game_Event} event The event potentially being rendered onto the map.
   */
  drawEvent(overlayBitmap, event)
  {
    if (!this.isEventRenderable(event)) return;

    const wx = (event._realX ?? event.x);
    const wy = (event._realY ?? event.y);
    const {
      lx,
      ly
    } = this.worldToLocalAroundPlayer(wx, wy);
    if (!this.inView(lx, ly)) return;

    const type = event.minimapEventType();

    // Special handling for teleport markers with area.
    if (type === MinimapEventType.Teleport)
    {
      const {
        w,
        h
      } = event.getAreaEventRect();

      // if the area is more than 1x1, draw a stretched rectangle covering the area footprint.
      if (w > 1 || h > 1)
      {
        // Compute area in local pixels; assume event tile is the top-left of the area.
        const areaWpx = Math.max(1, Math.floor(w * this.SCALE));
        const areaHpx = Math.max(1, Math.floor(h * this.SCALE));

        // adaptive outline thickness.
        const t = Math.max(1, Math.floor(this.SCALE / 6));
        const outlineCol = this.toCss(type.color);

        // Build a softer matching fill color.
        const fillCol = this.fillCssFrom(type.color, 0.35);

        // Outline rectangle: top / bottom / left / right
        overlayBitmap.fillRect(lx, ly, areaWpx, t, outlineCol);                    // top edge
        overlayBitmap.fillRect(lx, ly + areaHpx - t, areaWpx, t, outlineCol);     // bottom edge
        overlayBitmap.fillRect(lx, ly, t, areaHpx, outlineCol);                    // left edge
        overlayBitmap.fillRect(lx + areaWpx - t, ly, t, areaHpx, outlineCol);      // right edge

        // Inner fill (inside outline), if large enough.
        const innerW = areaWpx - t * 2;
        const innerH = areaHpx - t * 2;
        if (innerW > 0 && innerH > 0)
        {
          overlayBitmap.fillRect(lx + t, ly + t, innerW, innerH, fillCol);
        }

        // skip the per-tile marker when area outline/fill was drawn.
        return;
      }

      // 1x1 teleport area: draw a single outlined square with soft fill.
      this.drawByType(overlayBitmap, lx, ly, Math.max(2, this.SCALE - 4), type);
      return;
    }

    // All other marker types draw normally per-tile.
    this.drawByType(overlayBitmap, lx, ly, Math.max(2, this.SCALE - 4), type);
  }

  /**
   * Returns true if the upper-left pixel of a tile (lx, ly) falls within the visible window bounds.
   * Accepts coordinates that may be slightly outside to avoid drawing off-screen.
   * @param {number} lx - Local x in pixels (tile origin).
   * @param {number} ly - Local y in pixels (tile origin).
   * @returns {boolean}
   */
  inView(lx, ly)
  {
    const s = this.SCALE;
    return !(lx < -s || ly < -s || lx >= this._width || ly >= this._height);
  }

  /**
   * Computes the centered inner box within one tile for a marker of a given size.
   * @param {number} sizePx - Desired marker size in pixels (clamped to [MARKER_MIN..SCALE]).
   * @returns {{size:number, ox:number, oy:number, r:number}} Object containing:
   * - size: clamped size in pixels
   * - ox: left offset inside the tile
   * - oy: top offset inside the tile
   * - r: radius/falloff (floor(size/2)), useful for disks/diamonds
   */
  innerBox(sizePx)
  {
    const s = this.SCALE;
    const size = Math.max(this.MARKER_MIN, Math.min(s, Math.floor(sizePx)));
    const ox = Math.floor((s - size) / 2);
    const oy = Math.floor((s - size) / 2);
    const r = Math.floor(size / 2);
    return {
      size,
      ox,
      oy,
      r
    };
  }

  /**
   * Converts world tile coordinates (may be fractional for smooth movement)
   * to local window pixel coordinates (tile top-left).
   * @param {number} wx - World x in tiles (can be fractional).
   * @param {number} wy - World y in tiles (can be fractional).
   * @param {number} leftTile - Current window's top-left world tile X.
   * @param {number} topTile - Current window's top-left world tile Y.
   * @returns {{lx:number, ly:number}} Local pixel coords.
   */
  worldToLocal(wx, wy, leftTile, topTile)
  {
    const s = this.SCALE;
    return {
      lx: Math.floor((wx - leftTile) * s),
      ly: Math.floor((wy - topTile) * s),
    };
  }

  /**
   * Converts an in-window tile coordinate (0..viewTiles-1) to the pixel top-left in the bitmap.
   * @param {number} tx - Tile X within the window.
   * @param {number} ty - Tile Y within the window.
   * @returns {{leftPx:number, topPx:number}}
   */
  tileLeftTopPx(tx, ty)
  {
    const s = this.SCALE;
    return {
      leftPx: tx * s,
      topPx: ty * s
    };
  }

  /**
   * Draws a filled disk (circle) centered inside the tile at (lx, ly).
   * @param {Bitmap} targetBitmap - Target bitmap to draw on.
   * @param {number} lx - Tile top-left x in pixels.
   * @param {number} ly - Tile top-left y in pixels.
   * @param {number} sizePx - Desired marker size in pixels.
   * @param {string} color - Hex or hex+alpha string (e.g., #rrggbb or #rrggbbaa).
   */
  drawDiskOn(targetBitmap, lx, ly, sizePx, color)
  {
    if (!this.inView(lx, ly)) return;
    const {
      ox,
      oy,
      r
    } = this.innerBox(sizePx);
    const cx = lx + ox + r;
    const cy = ly + oy + r;
    const col = this.toCss(color);

    for (let dy = -r; dy <= r; dy++)
    {
      const span = Math.floor(Math.sqrt(r * r - dy * dy));
      targetBitmap.fillRect(cx - span, cy + dy, span * 2 + 1, 1, col);
    }
  }

  /**
   * Draws a filled diamond (rotated square) centered inside the tile at (lx, ly).
   * @param {Bitmap} targetBitmap - Target bitmap to draw on.
   * @param {number} lx - Tile top-left x in pixels.
   * @param {number} ly - Tile top-left y in pixels.
   * @param {number} sizePx - Desired marker size in pixels.
   * @param {string} color - Hex or hex+alpha string (e.g., #rrggbb or #rrggbbaa).
   */
  drawDiamondOn(targetBitmap, lx, ly, sizePx, color)
  {
    if (!this.inView(lx, ly)) return;
    const {
      ox,
      oy,
      r
    } = this.innerBox(sizePx);
    const cx = lx + ox + r;
    const cy = ly + oy + r;
    const col = this.toCss(color);

    for (let dy = -r; dy <= r; dy++)
    {
      const span = r - Math.abs(dy);
      targetBitmap.fillRect(cx - span, cy + dy, span * 2 + 1, 1, col);
    }
  }

  /**
   * Draws a filled square centered inside the tile at (lx, ly).
   * @param {Bitmap} targetBitmap - Target bitmap to draw on.
   * @param {number} lx - Tile top-left x in pixels.
   * @param {number} ly - Tile top-left y in pixels.
   * @param {number} sizePx - Desired marker size in pixels.
   * @param {string} color - Hex or hex+alpha string (e.g., #rrggbb or #rrggbbaa).
   */
  drawSquareOn(targetBitmap, lx, ly, sizePx, color)
  {
    if (!this.inView(lx, ly)) return;
    const {
      size,
      ox,
      oy
    } = this.innerBox(sizePx);
    targetBitmap.fillRect(lx + ox, ly + oy, size, size, this.toCss(color));
  }

  /**
   * Draws a centered plus "+" inside the tile at (lx, ly).
   * The plus scales with sizePx and uses an adaptive arm thickness.
   * @param {Bitmap} targetBitmap - Target bitmap to draw on.
   * @param {number} lx - Tile top-left x in pixels.
   * @param {number} ly - Tile top-left y in pixels.
   * @param {number} sizePx - Desired marker size in pixels.
   * @param {string} color - Hex or hex+alpha string (e.g., #rrggbb or #rrggbbaa).
   */
  drawPlusOn(targetBitmap, lx, ly, sizePx, color)
  {
    if (!this.inView(lx, ly)) return;

    // Compute the centered inner box and the tile center.
    const {
      size,
      ox,
      oy,
      r
    } = this.innerBox(sizePx);
    const cx = lx + ox + r;
    const cy = ly + oy + r;
    const col = this.toCss(color);

    // Adaptive thickness: about one third of the marker size (min 1px).
    const thickness = Math.max(1, Math.floor(size / 3));
    const halfT = Math.floor(thickness / 2);

    // Vertical arm (full height of the marker box), centered on cx.
    const vLeft = cx - halfT;
    const vTop = ly + oy;
    targetBitmap.fillRect(vLeft, vTop, thickness, size, col);

    // Horizontal arm (full width of the marker box), centered on cy.
    const hLeft = lx + ox;
    const hTop = cy - halfT;
    targetBitmap.fillRect(hLeft, hTop, size, thickness, col);
  }

  /**
   * Draws a hollow square or series of squares based on the given size.
   * @param {Bitmap} targetBitmap - Target bitmap to draw on.
   * @param {number} lx - Tile top-left x in pixels.
   * @param {number} ly - Tile top-left y in pixels.
   * @param {number} sizePx - Desired marker size in pixels.
   * @param {string} color - Hex or hex+alpha string (e.g., #rrggbb or #rrggbbaa).
   */
  drawHollowSquareOn(targetBitmap, lx, ly, sizePx, color)
  {
    // Render a 1px (or 2px for larger scales) outline square centered in the tile, with a soft fill for contrast.
    if (!this.inView(lx, ly)) return;

    // compute inner centered box.
    const {
      size: s,
      ox,
      oy
    } = this.innerBox(sizePx);
    const x0 = lx + ox;
    const y0 = ly + oy;
    const w = s;
    const h = s;

    // adaptive outline thickness.
    const t = Math.max(1, Math.floor(this.SCALE / 6));

    // Outline color (as provided).
    const outlineCol = this.toCss(color);

    // Compute the fill color.
    const fillCol = this.fillCssFrom(color, 0.35);

    // Draw outline: top, bottom, left, right.
    // top
    targetBitmap.fillRect(x0, y0, w, t, outlineCol);
    // bottom
    targetBitmap.fillRect(x0, y0 + h - t, w, t, outlineCol);
    // left
    targetBitmap.fillRect(x0, y0, t, h, outlineCol);
    // right
    targetBitmap.fillRect(x0 + w - t, y0, t, h, outlineCol);

    // Draw inner fill (inside the outline). Guard tiny sizes.
    const innerW = w - t * 2;
    const innerH = h - t * 2;
    if (innerW > 0 && innerH > 0)
    {
      targetBitmap.fillRect(x0 + t, y0 + t, innerW, innerH, fillCol);
    }
  }

  /**
   * Draws a small flat line ("T-cap") perpendicular to the plus arm for the
   * player's facing direction. The line sits near the tip of the faced arm
   * and stays within the inner marker box to avoid clipping.
   *
   * @param {Bitmap} targetBitmap
   * @param {number} lx - tile top-left x in pixels
   * @param {number} ly - tile top-left y in pixels
   * @param {number} sizePx - desired marker size in pixels
   * @param {string} color - hex or hex+alpha (#rrggbb or #rrggbbaa)
   * @param {number} dir - facing direction (2=down,4=left,6=right,8=up)
   */
  drawFacingPerpLineOn(targetBitmap, lx, ly, sizePx, color, dir)
  {
    if (!this.inView(lx, ly)) return;

    // Compute inner box and center.
    const {
      size,
      ox,
      oy,
      r
    } = this.innerBox(sizePx);
    const cx = lx + ox + r;
    const cy = ly + oy + r;
    const col = this.toCss(color);

    // Inner box bounds (inclusive)
    const ix0 = lx + ox;
    const iy0 = ly + oy;
    const ix1 = ix0 + size - 1;
    const iy1 = iy0 + size - 1;

    // Match the plus arm thickness for harmony, but make the cap a bit slimmer.
    const thickness = Math.max(2, Math.floor(size / 3));
    const capThickness = Math.max(1, Math.floor(thickness / 2));

    // Cap length scales with size, clamped to look good and avoid overhangs.
    const capLen = Math.max(thickness + 1, Math.min(size - 2, Math.floor(size * 0.6)));

    // 1px margin from inner box edge.
    const margin = 1;

    switch (dir)
    {
      case 8:
      { // Up: faced arm vertical; draw a horizontal line near top.
        const y = iy0 + margin;
        const x = cx - Math.floor(capLen / 2);
        targetBitmap.fillRect(x, y, capLen, capThickness, col);
        break;
      }
      case 2:
      { // Down: horizontal line near bottom.
        const y = iy1 - margin - (capThickness - 1);
        const x = cx - Math.floor(capLen / 2);
        targetBitmap.fillRect(x, y, capLen, capThickness, col);
        break;
      }
      case 4:
      { // Left: faced arm horizontal; draw a vertical line near left edge.
        const x = ix0 + margin;
        const y = cy - Math.floor(capLen / 2);
        targetBitmap.fillRect(x, y, capThickness, capLen, col);
        break;
      }
      case 6:
      { // Right: vertical line near right edge.
        const x = ix1 - margin - (capThickness - 1);
        const y = cy - Math.floor(capLen / 2);
        targetBitmap.fillRect(x, y, capThickness, capLen, col);
        break;
      }
      default:
        break;
    }
  }

  //endregion overlay & markers

  //region passability
  /**
   * Computes the blocked-direction mask for a tile using the same precedence
   * as Game_Map.prototype.checkPassage.
   * Bits:
   * - 0x01 = down blocked
   * - 0x02 = left blocked
   * - 0x04 = right blocked
   * - 0x08 = up blocked
   * 0x0f indicates wholly impassable.
   * @param {number} x - Tile X.
   * @param {number} y - Tile Y.
   * @param {number[]} [flagsRef] - Optional pre-fetched tilesetFlags array.
   * @returns {number} The blocked-direction mask.
   */
  blockedMaskAt(x, y, flagsRef)
  {
    if (!$gameMap.isValid(x, y)) return 0x0f; // treat OOB as blocked

    const flags = flagsRef || $gameMap.tilesetFlags();
    const tiles = $gameMap.allTiles(x, y); // tile-graphic events first, then layers 3..0

    for (const tileId of tiles)
    {
      const flag = flags[tileId] || 0;
      if (flag & 0x10) continue; // star: no effect on passage
      return flag & 0x0f;        // lower nibble: directional blocks
    }

    // No decisive tile found → engine defaults to blocked for our purposes
    return 0x0f;
  }

  //endregion passability

  //region utilities
  /**
   * Converts #rrggbb or #rrggbbaa into a CSS color string.
   * @param {string} hex - Hex color string (#rrggbb or #rrggbbaa). Whitespace is ignored.
   * @returns {string} CSS color string.
   */
  toCss(hex)
  {
    if (typeof hex !== 'string') return '#ff00ff';
    const clean = hex.replace(/\s+/g, String.empty);
    if (!clean.startsWith('#')) return '#ff00ff';

    if (clean.length === 7) return clean; // #rrggbb

    if (clean.length === 9)
    { // #rrggbbaa
      const r = parseInt(clean.slice(1, 3), 16);
      const g = parseInt(clean.slice(3, 5), 16);
      const b = parseInt(clean.slice(5, 7), 16);
      const a = parseInt(clean.slice(7, 9), 16) / 255;
      return `rgba(${r},${g},${b},${a})`;
    }

    return '#ff00ff'; // error/magenta
  }

  fillCssFrom(hex, ratio = 0.35)
  {
    // strip leading '#'.
    const raw = (hex && hex[0] === '#')
      ? hex.slice(1)
      : (hex ?? "");

    // parse rgb from #rrggbb or #rrggbbaa.
    const r = parseInt(raw.slice(0, 2) || "00", 16);
    const g = parseInt(raw.slice(2, 4) || "00", 16);
    const b = parseInt(raw.slice(4, 6) || "00", 16);
    const a = raw.length >= 8
      ? (parseInt(raw.slice(6, 8), 16) / 255)
      : 1;

    // scale the original alpha to a gentler fill (default ~35% of outline alpha).
    const fillA = Math.max(0, Math.min(1, a * ratio));

    // return rgba css string.
    return `rgba(${r},${g},${b},${fillA.toFixed(3)})`;
  }

  /**
   * Computes the top-left pixel in the padded cache to blit from,
   * based on the player's current tile position (kept centered).
   * @returns {{srcX:number, srcY:number}}
   */
  cacheSrcFromPlayer()
  {
    const pad = this._cacheOffsetTiles; // tiles
    const srcX = (($gamePlayer.x - this.MAP_RANGE) + pad) * this.SCALE;
    const srcY = (($gamePlayer.y - this.MAP_RANGE) + pad) * this.SCALE;
    return {
      srcX,
      srcY
    };
  }

  srcFloatFromPlayer()
  {
    const pad = this._cacheOffsetTiles; // tiles
    const rx = ($gamePlayer._realX ?? $gamePlayer.x);
    const ry = ($gamePlayer._realY ?? $gamePlayer.y);
    // Top-left of window so player is centered (MAP_RANGE from origin)
    const fx = ((rx - this.MAP_RANGE) + pad) * this.SCALE; // pixels
    const fy = ((ry - this.MAP_RANGE) + pad) * this.SCALE; // pixels
    return {
      fx,
      fy
    };
  }

  /**
   * Converts world tile coords to local overlay pixel coords using the shortest
   * wrapped delta around the player. Ensures markers near map seams appear on
   * the closest side in looping maps.
   * @param {number} wx - World x in tiles (can be fractional).
   * @param {number} wy - World y in tiles (can be fractional).
   * @returns {{lx:number, ly:number}}
   */
  worldToLocalAroundPlayer(wx, wy)
  {
    const s = this.SCALE;

    // Player precise position (smooth if available)
    const px = ($gamePlayer._realX ?? $gamePlayer.x);
    const py = ($gamePlayer._realY ?? $gamePlayer.y);

    let dx = wx - px;
    let dy = wy - py;

    const loopH = $gameMap.isLoopHorizontal();
    const loopV = $gameMap.isLoopVertical();
    const mapW = $gameMap.width();
    const mapH = $gameMap.height();

    // Choose shortest horizontal delta on looped maps
    if (loopH && mapW > 0)
    {
      if (dx > mapW / 2) dx -= mapW;
      if (dx < -mapW / 2) dx += mapW;
    }

    // Choose shortest vertical delta on looped maps
    if (loopV && mapH > 0)
    {
      if (dy > mapH / 2) dy -= mapH;
      if (dy < -mapH / 2) dy += mapH;
    }

    // Center tile is MAP_RANGE; offset by deltas
    const tileX = this.MAP_RANGE + dx;
    const tileY = this.MAP_RANGE + dy;

    return {
      lx: Math.floor(tileX * s),
      ly: Math.floor(tileY * s),
    };
  }

  /**
   * Returns whether an event should be rendered on the minimap.
   * @param {Game_Event} event The event being inspected for rendering as an overlay on the minimap.
   */
  isEventRenderable(event)
  {
    if (!event) return false;

    // Skip erased events.
    if (event.isErased()) return false;

    // skip transparent events.
    if (event.isTransparent()) return false;

    // Only show normal priority (same as characters) by default.
    // TODO: monitor this to see if we need to apply any of this type of filtering.
    // if (event.isNormalPriority() === false) return false;

    // return whether or not the event should be shown on the minimap.
    return event.shouldShowOnMinimap();
  }

  //endregion utilities

  //region hooks
  /**
   * Hook for subclasses to fully override how a single map cell is drawn into the cache.
   * Return true to indicate you handled drawing for this cell; false to use default rendering.
   * @param {number} x - Map tile X.
   * @param {number} y - Map tile Y.
   * @param {number} sx - Pixel x origin within the cache bitmap (top-left of the tile).
   * @param {number} sy - Pixel y origin within the cache bitmap (top-left of the tile).
   * @param {number} blockedMask - Directional block mask for this tile.
   * @returns {boolean} True if the tile was fully handled; false to fall back to default rendering.
   */
  // eslint-disable-next-line no-unused-vars
  drawCell(x, y, sx, sy, blockedMask)
  {
    // Example override:
    // if ($gameMap.regionId(x, y) === 50) { /* draw special */ return true; }
    return false;
  }

  /**
   * Computes the top-left world tile (x, y) for the visible window (no clamping).
   * The cached bitmap has padding, so un-clamped values are safe to render.
   * @returns {[number, number]} Tuple [leftTile, topTile].
   */
  currentViewOrigin()
  {
    const half = this.MAP_RANGE;
    const leftTile = $gamePlayer.x - half;
    const topTile = $gamePlayer.y - half;
    return [ leftTile, topTile ];
  }

  //endregion hooks

  //region border
  /**
   * Draw a pixel-art frame onto a bitmap.
   * - bitmap: target Bitmap (already sized to the minimap area or overlay).
   * - x, y, w, h: frame rectangle.
   * - opts: colors and thickness options.
   */
  drawPixelArtMinimapFrame(bitmap, x, y, w, h, opts = {})
  {
    // Configurable palette and sizes
    const thickness = opts.thickness ?? 3;       // main frame thickness
    const rim = opts.rim ?? 1;              // outer darker rim thickness
    const hl = opts.highlight ?? 1;        // inner bright highlight thickness

    // Colors (ARGB hex or CSS strings), tuned to look nice on most maps
    const cDark = opts.cDark ?? "rgba(18,18,22,1.0)";  // outer rim (nearly black)
    const cMid = opts.cMid ?? "rgba(255,220,180,0.3)";  // body of the frame
    const cInner = opts.cInner ?? "rgba(200,200,220,1.0)"; // inner highlight ring
    const cShadow = opts.cShadow ?? "rgba(0,0,0,0.35)";    // soft drop shadow
    const cAccent = opts.cAccent ?? "rgba(255,215,120,1.0)"; // small corner rivets (gold-ish)

    // Soft shadow outside the frame for depth (optional)
    const sh = 2; // shadow size
    // top
    bitmap.fillRect(x - sh, y - sh, w + sh * 2, sh, cShadow);
    // bottom
    bitmap.fillRect(x - sh, y + h, w + sh * 2, sh, cShadow);
    // left
    bitmap.fillRect(x - sh, y, sh, h, cShadow);
    // right
    bitmap.fillRect(x + w, y, sh, h, cShadow);

    // Outer rim
    // top
    bitmap.fillRect(x, y, w, rim, cDark);
    // bottom
    bitmap.fillRect(x, y + h - rim, w, rim, cDark);
    // left
    bitmap.fillRect(x, y, rim, h, cDark);
    // right
    bitmap.fillRect(x + w - rim, y, rim, h, cDark);

    // Main body (between rim and inner highlight)
    const innerX = x + rim;
    const innerY = y + rim;
    const innerW = w - rim * 2;
    const innerH = h - rim * 2;

    // top band
    bitmap.fillRect(innerX, innerY, innerW, thickness, cMid);
    // bottom band
    bitmap.fillRect(innerX, innerY + innerH - thickness, innerW, thickness, cMid);
    // left band
    bitmap.fillRect(innerX, innerY, thickness, innerH, cMid);
    // right band
    bitmap.fillRect(innerX + innerW - thickness, innerY, thickness, innerH, cMid);

    // Inner highlight ring (subtle)
    const ihX = innerX + thickness;
    const ihY = innerY + thickness;
    const ihW = innerW - thickness * 2;
    const ihH = innerH - thickness * 2;

    if (ihW > 0 && ihH > 0)
    {
      // top
      bitmap.fillRect(ihX, ihY, ihW, hl, cInner);
      // left
      bitmap.fillRect(ihX, ihY, hl, ihH, cInner);

      // Slightly dimmer highlight on bottom/right for a beveled look
      const cInner2 = "rgba(180,180,200,0.9)";
      // bottom
      bitmap.fillRect(ihX, ihY + ihH - hl, ihW, hl, cInner2);
      // right
      bitmap.fillRect(ihX + ihW - hl, ihY, hl, ihH, cInner2);
    }

    // Corner accents/rivets (tiny dots)
    const dot = 2;
    const pad = 3;

    // top-left
    bitmap.fillRect(x + pad, y + pad, dot, dot, cAccent);
    // top-right
    bitmap.fillRect(x + w - pad - dot, y + pad, dot, dot, cAccent);
    // bottom-left
    bitmap.fillRect(x + pad, y + h - pad - dot, dot, dot, cAccent);
    // bottom-right
    bitmap.fillRect(x + w - pad - dot, y + h - pad - dot, dot, dot, cAccent);
  }

  //endregion border
}

//endregion Sprite_MiniMap