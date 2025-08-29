//region annoations
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 MAP] Renders a passability-driven minimap on the screen.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW
 * This plugin renders a minimap onto the map.
 *
 * Integrates with others of mine plugins:
 * - J-Base; to be honest this is just required for all my plugins.
 * - J-ABS; reveals battlers on the map.
 *
 * ----------------------------------------------------------------------------
 * DETAILS:
 * This plugin has no paramters and works as-is out of the box.
 *
 * TODO:
 * Add ability to relocate the minimap.
 * Add show/hide functionality.
 * Add interference/overlap opacity changes.
 *
 * ============================================================================
 * CHANGELOG:
 * - 1.0.0
 *    The initial release.
 * ============================================================================
 * @command toggle-minimap
 * @text Toggle MiniMap
 * @desc Toggles visibility of the minimap to the designated state.
 * @arg action
 * @type boolean
 * @desc True for visible, false for invisible.
 * @default true
 */
//endregion annotations

//region plugin metadata
class J_MAP__PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
  }
}

//endregion plugin metadata

//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.MAP = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.MAP.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.MAP.Metadata = new J_MAP__PluginMetadata('J-MAP', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.MAP.Aliased = {};
J.MAP.Aliased.Scene_Map = new Map();
//endregion initialization

//region plugin commands
/**
 * Plugin command for toggling visibility of the minimap.
 */
PluginManager.registerCommand(
  J.MAP.Metadata.name,
  "toggle-minimap",
  args =>
  {
    const { action } = args;
    const shouldShow = action === "true";

    // TODO: implement show/hide logic and update this.
  });
//endregion plugin commands

//region Scene_Map integration
J.MAP.Aliased.Scene_Map.set('initMembers', Scene_Map.prototype.initMembers);
Scene_Map.prototype.initMembers = function()
{
  // perform original logic.
  J.MAP.Aliased.Scene_Map.get('initMembers')
    .call(this);

  // also initialize the HUD members.
  this.initMiniMapMembers();
};

Scene_Map.prototype.initMiniMapMembers = function()
{
  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._map ||= {};

  /**
   * The tracked minimap.
   * @type {Sprite_MiniMap}
   */
  this._j._map._miniMap = null;
};

/**
 * Extends {@link Scene_Map.createAllWindows}.<br>
 * Also creates the minimap sprite.
 */
J.MAP.Aliased.Scene_Map.set('createAllWindows', Scene_Map.prototype.createAllWindows);
Scene_Map.prototype.createAllWindows = function()
{
  // perform original logic
  J.MAP.Aliased.Scene_Map.get('createAllWindows').call(this);

  // create the minimap layer
  this.createMiniMap();
};

/**
 * Creates and attaches the minimap to the scene.
 */
Scene_Map.prototype.createMiniMap = function()
{
  /**
   * The minimap sprite instance.
   * @type {Sprite_MiniMap}
   */
  this._j._map._miniMap = new Sprite_MiniMap();

  // add the minimap.
  this.addChild(this._j._map._miniMap);
};
//endregion Scene_Map integration

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
  EDGE_COLOR = '#ffffff77';

  /**
   * Fill color for wholly impassable tiles (blocked in all directions).
   * @type {string}
   */
  IMPASSABLE_COLOR = '#330000aa';

  /**
   * Player marker color (green).
   * @type {string}
   */
  PLAYER_COLOR = '#00cc66cc';

  /**
   * Hostile enemy marker color (red diamond).
   * @type {string}
   */
  ENEMY_COLOR = '#ff4444cc';

  /**
   * Non-hostile/inanimate enemy marker color (orange diamond).
   * @type {string}
   */
  INANIMATE_COLOR = '#ffaa44cc';

  /**
   * Follower marker color (blue square).
   * @type {string}
   */
  FOLLOWER_COLOR = '#44aaffcc';

  /**
   * Minimum marker size in pixels.
   * @type {number}
   */
  MARKER_MIN = 2;
  //endregion configuration

  //region initialize
  /**
   * Constructs a new minimap sprite and initializes the cache, overlay, and positioning.
   */
  constructor()
  {
    super();

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
    this.x = this.POS_X >= 0
      ? this.POS_X
      : (Graphics.boxWidth - (this._width / 2) - 10);
    this.y = this.POS_Y >= 0
      ? this.POS_Y
      : (Graphics.boxHeight - (this._height / 2) - 10);
    this.z = 200;

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
        // cDark: "rgba(24,20,28,1.0)",
        // cMid: "rgba(70,70,90,1.0)",
        // cInner: "rgba(220,220,236,1.0)",
        // cShadow: "rgba(0,0,0,0.35)",
        // cAccent: "rgba(255,196,96,1.0)"
      });
  }

  //endregion initialize

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

      // Force initial redraw regardless of movement.
      this._lastX = -99999;
      this._lastY = -99999;
    }

    // Redraw window only if the player changed tiles.
    if (this.needsUpdate())
    {
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

    for (let y = 0; y < mapHeight; y++)
    {
      for (let x = 0; x < mapWidth; x++)
      {
        const sx = (x + pad) * this.SCALE; // shifted by pad
        const sy = (y + pad) * this.SCALE; // shifted by pad

        const mask = this.blockedMaskAt(x, y, flags);

        // Allow subclasses to fully override tile drawing.
        if (this.drawCell(x, y, sx, sy, mask)) continue;

        if (mask === 0x0f)
        {
          // Fully impassable tile
          this._cacheBitmap.fillRect(sx, sy, this.SCALE, this.SCALE, this.toCss(this.IMPASSABLE_COLOR));
        }
        else
        {
          // Floor, then edges
          this._cacheBitmap.fillRect(sx, sy, this.SCALE, this.SCALE, this.toCss(this.FLOOR_COLOR));
          this.drawEdges(this._cacheBitmap, sx, sy, mask);
        }
      }
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
   * Clears and redraws the dynamic overlay (enemies, followers, etc.).
   */
  redrawOverlay()
  {
    this._overlay.clear();
    this.drawOverlay(this._overlay);
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
    this.drawPlusOn(this.bitmap, leftPx, topPx, this.SCALE - 2, this.PLAYER_COLOR);
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

    const [ leftTile, topTile ] = this.currentViewOrigin();
    const s = this.SCALE;

    // 1) Enemies (hostile = red diamond, inanimate = orange diamond)
    if (J.ABS)
    {
      const enemies = JABS_AiManager
        .getEnemyBattlers()
        .filter(b => !b.isDead() && !b.isHidden());

      for (const b of enemies)
      {
        const char = b.getCharacter();
        const wx = (char._realX ?? char.x);
        const wy = (char._realY ?? char.y);
        const {
          lx,
          ly
        } = this.worldToLocal(wx, wy, leftTile, topTile);
        if (!this.inView(lx, ly)) continue;

        const color = (b.isInanimate?.() ?? false)
          ? this.INANIMATE_COLOR
          : this.ENEMY_COLOR;
        this.drawDiamondOn(overlayBitmap, lx, ly, s - 2, color);
      }
    }

    // 2) Followers (blue squares)
    const followersMgr = $gamePlayer.followers?.();
    if (followersMgr && followersMgr.visibleFollowers)
    {
      for (const f of followersMgr.visibleFollowers())
      {
        const wx = (f._realX ?? f.x);
        const wy = (f._realY ?? f.y);
        const {
          lx,
          ly
        } = this.worldToLocal(wx, wy, leftTile, topTile);
        if (!this.inView(lx, ly)) continue;
        this.drawSquareOn(overlayBitmap, lx, ly, Math.max(2, s - 4), this.FOLLOWER_COLOR);
      }
    }
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
    const clean = hex.replace(/\s+/g, '');
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
  drawCell(x, y, sx, sy, blockedMask)
  { // eslint-disable-line no-unused-vars
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
    const cMid = opts.cMid ?? "rgba(60,60,72,1.0)";  // body of the frame
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
    const pad = 3; // distance from outer corner
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