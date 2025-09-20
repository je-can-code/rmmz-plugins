//region Spriteset_Map
//region init
J.ABS.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.ABS.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also create JABS-specific sprites.
  this.createJabsLayer();
};

/**
 * Creates JABS-unique sprites that aren't otherwise regularly-tracked sprites.
 */
Spriteset_Map.prototype.createJabsLayer = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * The container for all hitbox sprites.
   * @type {Sprite}
   */
  this._j._abs._hitboxLayer = new Sprite();

  /**
   * Direct tracking for individual sprites by their uuid.
   * @type {Record<string, Sprite>}
   */
  this._j._abs._actionHitboxSprites = {};

  /**
   * Direct tracking for battler hitbox sprites by their stable key.
   * Keys include enemy battler uuids, and fixed keys for player/followers.
   * @type {Record<string, Sprite>}
   */
  this._j._abs._battlerHitboxSprites = {};

  // mount under tilemap for consistent coordinates.
  this.addChild(this._j._abs._hitboxLayer);
};

/**
 * Gets the hitbox overlay sprite container.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getJabsHitboxLayer = function()
{
  return this._j._abs._hitboxLayer;
};

/**
 * Get the direct tracking dictionary for hitbox sprites.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getActionHitboxSprites = function()
{
  return this._j._abs._actionHitboxSprites;
};

/**
 * Accessor for the battler hitbox sprite dictionary.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getBattlerHitboxSprites = function()
{
  return this._j._abs._battlerHitboxSprites; // return the dict.
};
//endregion init

//region update
/**
 * Hooks into the `update` function to also update any active action sprites.
 */
J.ABS.Aliased.Spriteset_Map.set('update', Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function()
{
  // perform original logic.
  J.ABS.Aliased.Spriteset_Map.get('update')
    .call(this);

  // perform jabs-related sprite updates.
  this.updateJabsSprites();
};

/**
 * Updates all existing actionSprites on the map.
 */
Spriteset_Map.prototype.updateJabsSprites = function()
{
  // manage action sprites.
  this.handleActionSprites();

  // manage battler sprites.
  this.handleBattlerSprites();

  // manage loot sprites.
  this.handleLootSprites();

  // manage full-screen sprite refreshes.
  this.handleSpriteRefresh();

  // manage the hitbox overlays for actions.
  this.handleHitboxOverlay();
};
//endregion update

//region action sprites
/**
 * Processes incoming requests to add/remove action sprites.
 */
Spriteset_Map.prototype.handleActionSprites = function()
{
  // check if we have incoming requests to add new action sprites.
  if ($jabsEngine.requestActionRendering)
  {
    // add the new action sprites.
    this.addActionSprites();
  }

  // check if we have incoming requests to remove old action sprites.
  if ($jabsEngine.requestClearMap)
  {
    // remove the old action sprites.
    this.removeActionSprites();
  }
};

/**
 * Adds all needing-to-be-added action sprites to the map and renders.
 */
Spriteset_Map.prototype.addActionSprites = function()
{
  // grab all the newly-added action events.
  const newActionEvents = $gameMap.newActionEvents();

  // scan each of them and add new action sprites as-needed.
  newActionEvents.forEach(this.addActionSprite, this);

  // acknowledge that action sprites were added.
  $jabsEngine.requestActionRendering = false;
};

/**
 * Processes a single event and adds its corresponding action sprite if necessary.
 * @param {Game_Event} actionEvent The event that may require a new sprite added.
 */
Spriteset_Map.prototype.addActionSprite = function(actionEvent)
{
  // get the underlying character associated with this action.
  const character = actionEvent.getJabsAction()
    .getActionSprite();

  // generate the new sprite based on the action's character.
  const sprite = new Sprite_Character(character);

  // add the sprite to tracking.
  this._characterSprites.push(sprite);
  this._tilemap.addChild(sprite);

  // acknowledge that the sprite was added.
  actionEvent.setActionSpriteNeedsAdding(false);
};

/**
 * Removes all expired action sprites from the map.
 */
Spriteset_Map.prototype.removeActionSprites = function()
{
  // grab all expired action events.
  const events = $gameMap.expiredActionEvents();

  // remove them.
  events.forEach(this.removeActionSprite, this);
};

/**
 * Processes a single action event and removes its corresponding sprite(s).
 * @param {Game_Event} actionEvent The action event that requires removal.
 */
Spriteset_Map.prototype.removeActionSprite = function(actionEvent)
{
  // Resolve the same underlying character that we used during add.
  const jabsAction = actionEvent.getJabsAction(); // underlying JABS_Action.
  const character = jabsAction
    ? jabsAction.getActionSprite() // character used to create the Sprite_Character
    : null; // fallback if something went awry.

  // Find all sprites that match this character (defensive: remove all we find).
  const matches = [];
  for (let i = this._characterSprites.length - 1; i >= 0; i--)
  {
    const sprite = this._characterSprites[i];

    // character() must match exactly the character we created the sprite with.
    if (character && sprite.character() === character)
    {
      // remove from tracking first.
      this._characterSprites.splice(i, 1);

      // remove from the display tree if attached.
      if (this._tilemap && sprite.parent === this._tilemap)
      {
        this._tilemap.removeChild(sprite);
      }

      // destroy the sprite to stop updates and free resources.
      if (!sprite.destroyed)
      {
        sprite.destroy();
      }

      // track for debugging/consistency if needed.
      matches.push(sprite);
    }
  }

  // If the add/remove got out of sync and there was no match by character,
  // fall back to the original search by actionEvent (legacy behavior), but
  // ensure we fully unmount/destroy if found.
  if (matches.length === 0)
  {
    const idx = this._characterSprites.findIndex(s => s.character() === actionEvent);
    if (idx !== -1)
    {
      const [ sprite ] = this._characterSprites.splice(idx, 1);
      if (this._tilemap && sprite && sprite.parent === this._tilemap)
      {
        this._tilemap.removeChild(sprite);
      }
      if (sprite && !sprite.destroyed)
      {
        sprite.destroy();
      }
    }
  }

  // Acknowledge that this action’s sprite no longer needs removing.
  actionEvent.setActionSpriteNeedsRemoving(false);

  // Clear any now-expired action events from the map.
  $gameMap.clearExpiredJabsActionEvents();
};
//endregion action sprites

//region generated battler sprites
/**
 * Processes incoming requests to add/remove generated battler sprites.
 */
Spriteset_Map.prototype.handleBattlerSprites = function()
{
  if ($jabsEngine.requestBattlerRendering)
  {
    this.addBattlerSprites();
  }
};

/**
 * Adds all needing-to-be-added generated battler sprites to the map and renders.
 */
Spriteset_Map.prototype.addBattlerSprites = function()
{
  // grab all the newly-added action events.
  const newActionEvents = $gameMap.newBattlerEvents();

  // scan each of them and add new action sprites as-needed.
  newActionEvents.forEach(this.addBattlerSprite, this);

  // acknowledge that battler sprites were added.
  $jabsEngine.requestBattlerRendering = false;
};

/**
 * Scans all events on the map and adds new generated battler sprites accordingly.
 */
Spriteset_Map.prototype.addBattlerSprite = function(battlerEvent)
{
  // generate the new sprite based on the action's character.
  const sprite = new Sprite_Character(battlerEvent);

  // add the sprite to tracking.
  this._characterSprites.push(sprite);
  this._tilemap.addChild(sprite);

  // acknowledge that the sprite was added.
  battlerEvent.removeFlagForAddingBattler();
};
//endregion generated battler sprites

//region loot sprites
/**
 * Processes incoming requests to add/remove loot sprites.
 */
Spriteset_Map.prototype.handleLootSprites = function()
{
  // check if we have incoming requests to add new loot sprites.
  if ($jabsEngine.requestLootRendering)
  {
    // add the new loot sprites.
    this.addLootSprites();
  }

  // check if we have incoming requests to remove old loot sprites.
  if ($jabsEngine.requestClearLoot)
  {
    // remove the old loot sprites.
    this.removeLootSprites();
  }
};

/**
 * Scans all events on the map and adds new loot sprites accordingly.
 */
Spriteset_Map.prototype.addLootSprites = function()
{
  // grab all the newly-added loot events.
  const events = $gameMap.newLootEvents();

  // scan each of them and add new loot sprites.
  events.forEach(this.addLootSprite, this);

  // acknowledge that loot sprites were added.
  $jabsEngine.requestLootRendering = false;
};

/**
 * Processes a single event and adds its corresponding loot sprite if necessary.
 * @param {Game_Event} lootEvent The event that may require a new sprite added.
 */
Spriteset_Map.prototype.addLootSprite = function(lootEvent)
{
  // generate the new sprite based on the loot's character.
  const sprite = new Sprite_Character(lootEvent);

  // add the sprite to tracking.
  this._characterSprites.push(sprite);
  this._tilemap.addChild(sprite);

  // acknowledge that the sprite was added.
  lootEvent.setLootNeedsAdding(false);
};

/**
 * Removes all needing-to-be-removed loot sprites from the map.
 */
Spriteset_Map.prototype.removeLootSprites = function()
{
  // grab all expired loot events.
  const events = $gameMap.expiredLootEvents();

  // remove them.
  events.forEach(this.removeLootSprite, this);

  // acknowledge that expired loot sprites were cleared.
  $jabsEngine.requestClearLoot = false;
};

/**
 * Processes a single loot event and removes its corresponding sprite(s).
 * @param {Game_Event} lootEvent The loot event that requires removal.
 */
Spriteset_Map.prototype.removeLootSprite = function(lootEvent)
{
  const spriteIndex = this._characterSprites.findIndex(sprite =>
  {
    // if the character doesn't match the event, then keep looking.
    if (sprite.character() !== lootEvent) return false;

    // we found a match!
    return true;
  });

  // confirm we did indeed find the sprite's index for removal.
  if (spriteIndex !== -1)
  {
    // delete that sprite's loot.
    this._characterSprites[spriteIndex].deleteLootSprite();

    // purge the sprite from tracking.
    this._characterSprites.splice(spriteIndex, 1);
  }

  // delete the now-removed sprite for this action.
  $gameMap.clearExpiredLootEvents();
};
//endregion loot sprites

//region event sprites
/**
 * Processes incoming requests to add/remove loot sprites.
 */
Spriteset_Map.prototype.handleSpriteRefresh = function()
{
  // check if we have incoming requests to do a sprite refresh.
  if ($jabsEngine.requestSpriteRefresh)
  {
    // refresh all character sprites.
    this.refreshAllCharacterSprites();
  }
};

/**
 * Refreshes all character sprites on the map.
 * TODO: is this functionally correct and consistently safe?
 */
Spriteset_Map.prototype.refreshAllCharacterSprites = function()
{
  // ensure the collection exists.
  this._characterSprites ||= [];

  // 1) Identify the current party characters to display.
  const player = $gamePlayer; // the leader
  const followers = $gamePlayer.followers()
    .data(); // array of Game_Follower

  // 2) Locate existing player and follower sprites (tolerate non-character entries).
  /** @type {Sprite_Character|null} */
  let playerSprite = null;
  /** @type {Sprite_Character[]} */
  const followerSprites = [];

  this._characterSprites.forEach(
    /**
     * @param {Sprite_Character} sprite
     */
    (sprite) =>
    {
      if (!sprite || typeof sprite.character !== "function") return; // skip non-character or unexpected entries

      const ch = sprite.character();
      if (!ch) return;

      // Is this the player sprite?
      if (typeof ch.isPlayer === "function" && ch.isPlayer())
      {
        playerSprite = sprite;
        return;
      }

      // Is this a follower sprite?
      if (typeof ch.isFollower === "function" && ch.isFollower())
      {
        followerSprites.push(sprite);
      }
    });

  // 3) Rebind the player sprite in place (create one if somehow missing).
  if (playerSprite)
  {
    if (playerSprite.character() !== player)
    {
      // rebind this sprite to the current player (no removal from tilemap).
      playerSprite.setCharacter(player);
    }
  }
  else
  {
    // If there was no existing player sprite, create and add one now.
    const newPlayerSprite = new Sprite_Character(player);
    this._characterSprites.push(newPlayerSprite);
    if (this._tilemap)
    {
      this._tilemap.addChild(newPlayerSprite);
    }
  }

  // 4) Ensure we have enough follower sprites; add only if we need more.
  if (followerSprites.length < followers.length)
  {
    for (let i = followerSprites.length; i < followers.length; i++)
    {
      const follower = followers[i];
      const followerSprite = new Sprite_Character(follower);
      this._characterSprites.push(followerSprite);
      if (this._tilemap)
      {
        this._tilemap.addChild(followerSprite);
      }
      followerSprites.push(followerSprite);
    }
  }

  // 5) Rebind follower sprites to the current follower list by index.
  const count = Math.min(followerSprites.length, followers.length);
  for (let i = 0; i < count; i++)
  {
    const sprite = followerSprites[i];
    const follower = followers[i];
    if (sprite.character() !== follower)
    {
      // rebind this sprite to the current follower (no removal from tilemap).
      sprite.setCharacter(follower);
    }
  }

  // 6) Clear the refresh request flag to prevent repeated refresh cycles.
  $jabsEngine.requestSpriteRefresh = false;
};
//endregion event sprites

//region hitbox sprites
/**
 * Renders translucent overlays for action hitboxes.
 */
Spriteset_Map.prototype.handleHitboxOverlay = function()
{
  // handle the action hitbox overlays.
  this.handleActionHitboxes();

  // handle the battler hitbox overlays.
  this.handleBattlerHitboxes();
};

/**
 * Applies the provided style to a PIXI.Graphics for drawing a hitbox.
 * @param {PIXI.Graphics} g The graphics instance to apply styles to.
 * @param {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }} style
 */
Spriteset_Map.prototype.applyHitboxStyle = function(g, style)
{
  // configure line + fill according to style.
  g.lineStyle(style.lineWidth, style.lineColor, style.lineAlpha); // outline style.
  g.beginFill(style.fillColor, style.fillAlpha); // fill style.
};

/**
 * Determines if the provided battler-bearing character overlaps any active action.
 * Uses JABS' native shape logic to ensure parity with gameplay collision.
 * @param {{ key:string, type:string, source: Game_CharacterBase }} item The battler overlay item.
 * @returns {boolean} True if overlapping any action; false otherwise.
 */
Spriteset_Map.prototype.isBattlerCollidingWithAnyAction = function(item)
{
  // pull the battler's character for collision checks.
  const target = item.source; // the battler-bearing character.

  // scan all active action events on the map.
  const actions = $gameMap.actionEvents(); // current action events.
  for (let i = 0; i < actions.length; i++)
  {
    // grab the action event and underlying JABS action model.
    const actionEvent = actions[i]; // the action's event/character.
    const jabsAction = actionEvent.getJabsAction(); // the JABS action model.

    // guard: no action model means nothing to collide with.
    if (!jabsAction) continue; // skip invalid action entries.

    // direct actions (proximity-based) do not use a map shape; skip them for this visual.
    if (jabsAction.isDirectAction()) continue; // only shaped actions.

    // derive parameters for the shape collision.
    const shape = jabsAction.getShape();
    const range = jabsAction.getRange();
    const facing = actionEvent.direction();

    // ask the engine if the target is within this action's range according to shape logic.
    const overlapped = $jabsEngine.isTargetWithinRange(facing, target, actionEvent, range, shape); // engine parity.

    // if overlapping, we're done.
    if (overlapped) return true; // this battler is overlapping at least one action.
  }

  // if none overlapped, report no overlap.
  return false; // not colliding with any active action.
};

//region action hitboxes
/**
 * Handle the overlays for all action-based hitboxes.
 */
Spriteset_Map.prototype.handleActionHitboxes = function()
{
  // build any missing hitbox sprites for active actions.
  this.buildMissingActionHitboxSprites();

  // refresh positions and shapes for existing hitbox sprites.
  this.refreshExistingActionHitboxSprites();

  // purge hitbox sprites that no longer have a corresponding action.
  this.purgeOrphanedActionHitboxSprites();
};

/**
 * Resolves the style used when drawing a hitbox for a given shape.
 * Reads from J.ABS.Metadata.HitboxStyles if present; falls back to defaults.
 * @param {string} shape The hitbox shape name (e.g., circle, rhombus, square, etc.).
 * @returns {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }}
 */
Spriteset_Map.prototype.getActionHitboxStyleFor = function(shape)
{
  // default base (orange translucent with darker outline).
  const defaults = {
    fillColor: 0xFFA500, // orange fill.
    fillAlpha: 0.35, // translucent.
    lineColor: 0xE08000, // darker orange outline.
    lineAlpha: 0.9, // mostly opaque outline.
    lineWidth: 2, // outline thickness.
  };

  // pull optional centralized styles if present.
  const styles = J.ABS.Metadata.HitboxStyles || {}; // centralized config bucket.

  // start with defaults, then layer global base overrides.
  const base = Object.assign({}, defaults, styles.base || {}); // merged base.

  // apply shape-specific overrides if provided.
  const key = (shape || "").toLowerCase(); // normalized key.
  const shapeOverrides = styles.byShape?.[key] || null; // optional per-shape.

  // produce the final style.
  const finalStyle = Object.assign({}, base, shapeOverrides || {}); // merged final style.
  return finalStyle; // return style for caller.
};

/**
 * Builds hitbox sprites for any action events that lack one.
 */
Spriteset_Map.prototype.buildMissingActionHitboxSprites = function()
{
  // get the container and dict for hitboxes.
  const layer = this.getJabsHitboxLayer(); // the parent container for hitbox sprites.
  const dict = this.getActionHitboxSprites(); // dictionary of existing hitbox sprites.

  // iterate over active action events.
  const actions = $gameMap.actionEvents(); // current action events.
  actions.forEach(actionEvent =>
  {
    // obtain a stable key for this action (prefer the action uuid).
    const key = actionEvent.getJabsActionUuid(); // stable key.

    // guard: skip if no uuid present (should not happen for action events).
    if (!key) return; // cannot track without a UUID.

    // if a sprite already exists for this action, skip creation.
    if (dict[key]) return; // already created for this action.

    // create and mount a new hitbox sprite.
    const sprite = this.createActionHitboxSprite(actionEvent); // build new hitbox sprite.
    dict[key] = sprite; // track it in the dict by key.
    layer.addChild(sprite); // attach to the hitbox layer.
  });
};

/**
 * Synchronizes position and appearance of existing hitbox sprites.
 */
Spriteset_Map.prototype.refreshExistingActionHitboxSprites = function()
{
  // quick access to tile size.
  const tw = $gameMap.tileWidth(); // tile width in pixels.
  const th = $gameMap.tileHeight(); // tile height in pixels.

  // iterate all current action events and refresh their hitbox sprites.
  const actions = $gameMap.actionEvents(); // current action events to render.
  actions.forEach(actionEvent =>
  {
    // read essentials from the action/event.
    const jabsAction = actionEvent.getJabsAction(); // the underlying JABS action model.
    if (!jabsAction) return; // guard: no action means nothing to draw.

    const shape = jabsAction.getShape(); // the action's hitbox shape.
    const range = jabsAction.getRange(); // the action's range.
    const facing = actionEvent.direction(); // 2=down,4=left,6=right,8=up.

    // locate the sprite for this action.
    const sprite = this.getOrCreateActionHitboxSpriteFor(actionEvent); // ensure we have a sprite.

    // centralized, corrected origin (parity with physics).
    const origin = JABS_Engine.getActionOriginPixels(actionEvent); // unified origin.
    sprite.x = origin.x; // place sprite at x.
    sprite.y = origin.y; // place sprite at y.

    // redraw the shape into the sprite's internal graphics (around local 0,0).
    // pass the actionEvent so Arc can resolve <degrees:N> from notes via engine helper.
    this.drawActionHitboxInto(sprite, shape, range, facing, tw, th, actionEvent); // draw shape for this frame.
  });
};

/**
 * Removes hitbox sprites that no longer correspond to an active action.
 */
Spriteset_Map.prototype.purgeOrphanedActionHitboxSprites = function()
{
  // compute the set of active keys (uuids) on the map now.
  const activeKeys = new Set(
    $gameMap.actionEvents()
      .map(ev => ev.getJabsActionUuid()) // all active keys.
  );

  // walk the dict and remove any sprites whose keys aren’t active.
  const dict = this.getActionHitboxSprites(); // existing sprites.
  const layer = this.getJabsHitboxLayer(); // parent container.

  Object.keys(dict)
    .forEach(key =>
    {
      if (activeKeys.has(key)) return; // still in use, keep it.

      // detach and destroy the orphaned sprite.
      const sprite = dict[key]; // the orphaned sprite.
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite); // remove from layer.
      }

      this.destroyActionHitboxSprite(sprite); // fully destroy internals.
      delete dict[key]; // remove from dict.
    });
};

/**
 * Retrieves or creates the hitbox sprite for a given action event.
 * @param {Game_Event} actionEvent The action event.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getOrCreateActionHitboxSpriteFor = function(actionEvent)
{
  // derive the dictionary key for this action.
  const key = actionEvent.getJabsActionUuid(); // stable id.

  // return the existing sprite if present.
  const dict = this.getActionHitboxSprites(); // dictionary of sprites.
  if (dict[key]) return dict[key]; // already made.

  // otherwise create, track, and return it.
  const sprite = this.createActionHitboxSprite(actionEvent); // create new sprite.
  dict[key] = sprite; // track it.
  this.getJabsHitboxLayer()
    .addChild(sprite); // mount it.
  return sprite; // provide to caller.
};

/**
 * Creates a new hitbox sprite (RMMZ Sprite wrapping a PIXI.Graphics) for an action.
 * @param {Game_Event} actionEvent The related action event.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.createActionHitboxSprite = function(actionEvent)
{
  // create a plain sprite to remain RMMZ-native at the boundary.
  const sprite = new Sprite(); // container-level sprite.

  // create a graphics child to actually draw the shapes.
  /** @type {PIXI.Graphics} */
  const g = new PIXI.Graphics(); // underlying shape drawer.

  // store references and small bits of state on the sprite.
  sprite._jabsHitboxG = g; // the internal graphics used for drawing.
  sprite._actionUuid = actionEvent.getJabsActionUuid(); // stable id.

  // attach the graphics under the sprite.
  sprite.addChild(g); // graphics is a child of sprite.

  // center the sprite so drawing at (0,0) will align to action center.
  sprite.anchor.set(0.5, 0.5); // center origin if available on Sprite.

  return sprite; // return the prepared sprite.
};

/**
 * Destroys a hitbox sprite and its internals.
 * @param {Sprite} sprite The sprite to destroy.
 */
Spriteset_Map.prototype.destroyActionHitboxSprite = function(sprite)
{
  if (!sprite) return; // nothing to destroy.

  // cleanup graphics child if present.
  if (sprite._jabsHitboxG)
  {
    sprite._jabsHitboxG.clear(); // clear any drawings.
    sprite._jabsHitboxG.destroy({ children: true }); // dispose graphics.
  }

  // destroy the container sprite.
  sprite.destroy();
};

Spriteset_Map.prototype.drawActionHitboxInto = function(sprite, shape, range, facing, tw, th, actionEvent)
{
  // get the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG; // internal graphics for drawing.

  // clear previous drawings for this frame.
  g.clear(); // remove any prior shapes.

  // resolve and apply centralized style for this shape.
  const style = this.getActionHitboxStyleFor(shape); // centralized style resolution.
  this.applyHitboxStyle(g, style); // apply style to graphics.

  // draw around local (0,0) since sprite is positioned at the action center.
  const draw = (name) =>
  {
    switch ((name || "").toLowerCase())
    {
      case "circle":
      {
        // match engine: radius uses tile width (tw) for circles/sectors.
        const r = range * tw; // circle radius in pixels.
        g.drawCircle(0, 0, r); // draw centered circle.
        break; // done.
      }
      case "rhombus":
      {
        // diamond visualization unchanged.
        this.drawRhombusG(g, range * tw, range * th); // diamond.
        break; // done.
      }
      case "square":
      {
        // match engine square silhouette.
        const w = (2 * range + 1) * tw; // width in pixels.
        const h = (2 * range + 1) * th; // height in pixels.
        g.drawRect(-w / 2, -h / 2, w, h); // centered square.
        break; // done.
      }
      case "frontsquare":
      {
        // match engine front-square half with half-tile padding.
        this.drawFrontSquareG(g, range, facing, tw, th); // half-square in facing dir.
        break; // done.
      }
      case "line":
      {
        // match engine: length uses major axis regardless of orientation.
        const lengthPx = range * Math.max(tw, th); // length in px.

        // draw oriented thin rect with a small extra half-tile pad like engine.
        if (facing === 2) // down
        {
          g.drawRect(-tw / 2, 0, tw, lengthPx + (th / 2));
        }
        else if (facing === 8) // up
        {
          g.drawRect(-tw / 2, -lengthPx - (th / 2), tw, lengthPx + (th / 2));
        }
        else if (facing === 6) // right
        {
          g.drawRect(0, -th / 2, lengthPx + (tw / 2), th);
        }
        else // left
        {
          g.drawRect(-lengthPx - (tw / 2), -th / 2, lengthPx + (tw / 2), th);
        }
        break; // done.
      }
      case "wall":
      {
        // match engine wall silhouette.
        const lenTiles = (2 * range + 1); // total tiles spanned.
        if (facing === 2 || facing === 8)
        {
          const w = lenTiles * tw; // width across.
          g.drawRect(-w / 2, -th / 2, w, th); // horizontal wall.
        }
        else
        {
          const h = lenTiles * th; // height across.
          g.drawRect(-tw / 2, -h / 2, tw, h); // vertical wall.
        }
        break; // done.
      }
      case "cross":
      {
        // match engine cross silhouette.
        const w = (2 * range + 1) * tw; // total width.
        const h = (2 * range + 1) * th; // total height.
        g.drawRect(-tw / 2, -h / 2, tw, h); // vertical line.
        g.drawRect(-w / 2, -th / 2, w, th); // horizontal line.
        break; // done.
      }
      case "arc":
      default:
      {
        // draw a Euclidean sector wedge for Arc; resolve degrees via engine helper.
        const degrees = ($jabsEngine.getActionDegrees(actionEvent) ?? 180); // default legacy wedge.

        // compute center angle based on facing.
        let centerRad = 0; // default right.
        if (facing === 2) centerRad = Math.PI / 2; // down.
        else if (facing === 8) centerRad = -Math.PI / 2; // up.
        else if (facing === 6) centerRad = 0; // right.
        else centerRad = Math.PI; // left.

        // compute half-angle and start/end.
        const halfRad = (degrees * 0.5) * (Math.PI / 180); // half sweep in radians.
        const start = centerRad - halfRad; // start angle.
        const end = centerRad + halfRad; // end angle.

        // match engine radius math for sectors.
        const r = range * tw; // radius in px.

        // draw a filled wedge: origin → arc(start..end) → origin.
        g.moveTo(0, 0); // start at origin.
        g.lineTo(Math.cos(start) * r, Math.sin(start) * r); // edge to arc start.
        g.arc(0, 0, r, start, end); // arc along sweep.
        g.lineTo(0, 0); // edge back to origin.
        g.closePath(); // close shape.
        break; // done.
      }
    }
  };

  // perform the shape drawing.
  draw(shape); // draw the selected shape.

  // finalize.
  g.endFill(); // complete fill for this shape.
};

/**
 * Draws a diamond (rhombus) centered on the graphics' local origin.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {number} rx Horizontal radius in px.
 * @param {number} ry Vertical radius in px.
 */
Spriteset_Map.prototype.drawRhombusG = function(g, rx, ry)
{
  g.moveTo(0, -ry); // top.
  g.lineTo(rx, 0); // right.
  g.lineTo(0, ry); // bottom.
  g.lineTo(-rx, 0); // left.
  g.closePath(); // close.
};

/**
 * Draws a half-diamond (front rhombus) from origin in facing direction.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {number} rx Horizontal radius in px.
 * @param {number} ry Vertical radius in px.
 * @param {number} facing 2/4/6/8
 */
Spriteset_Map.prototype.drawFrontRhombusG = function(g, rx, ry, facing)
{
  if (facing === 2) // down
  {
    g.moveTo(0, 0);
    g.lineTo(rx, 0);
    g.lineTo(0, ry);
    g.closePath(); // lower-right tri.
    g.moveTo(0, 0);
    g.lineTo(0, ry);
    g.lineTo(-rx, 0);
    g.closePath(); // lower-left tri.
  }
  else if (facing === 8) // up
  {
    g.moveTo(0, 0);
    g.lineTo(0, -ry);
    g.lineTo(rx, 0);
    g.closePath(); // upper-right tri.
    g.moveTo(0, 0);
    g.lineTo(-rx, 0);
    g.lineTo(0, -ry);
    g.closePath(); // upper-left tri.
  }
  else if (facing === 6) // right
  {
    g.moveTo(0, 0);
    g.lineTo(rx, 0);
    g.lineTo(0, -ry);
    g.closePath(); // right-upper tri.
    g.moveTo(0, 0);
    g.lineTo(0, ry);
    g.lineTo(rx, 0);
    g.closePath(); // right-lower tri.
  }
  else // left
  {
    g.moveTo(0, 0);
    g.lineTo(-rx, 0);
    g.lineTo(0, -ry);
    g.closePath(); // left-upper tri.
    g.moveTo(0, 0);
    g.lineTo(0, ry);
    g.lineTo(-rx, 0);
    g.closePath(); // left-lower tri.
  }
};

/**
 * Draws the front-half of a square in the facing direction from origin.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {number} range Range in tiles.
 * @param {number} facing 2/4/6/8
 * @param {number} tw Tile width in px.
 * @param {number} th Tile height in px.
 */
Spriteset_Map.prototype.drawFrontSquareG = function(g, range, facing, tw, th)
{
  // total full-square size in pixels.
  const totalW = (2 * range + 1) * tw; // total width of full square.
  const totalH = (2 * range + 1) * th; // total height of full square.

  // match engine collisionFrontSquare offsets with extra half-tile padding.
  if (facing === 2) // down → bottom half from origin
  {
    // width full, height half + half-tile padding, starting at y=0.
    g.drawRect(-(totalW / 2), 0, totalW, (totalH / 2) + (th / 2));
  }
  else if (facing === 8) // up → top half up from origin
  {
    // width full, height half + half-tile padding, starting above origin.
    g.drawRect(-(totalW / 2), -((totalH / 2) + (th / 2)), totalW, (totalH / 2) + (th / 2));
  }
  else if (facing === 6) // right → right half from origin
  {
    // width half + half-tile padding, full height, starting at x=0.
    g.drawRect(0, -(totalH / 2), (totalW / 2) + (tw / 2), totalH);
  }
  else // left → left half from origin
  {
    // width half + half-tile padding, full height, starting to the left of origin.
    g.drawRect(-((totalW / 2) + (tw / 2)), -(totalH / 2), (totalW / 2) + (tw / 2), totalH);
  }
};
//endregion action hitboxes

//region battler hitboxes

/**
 * Handle the overlays for all battler-based hitboxes.
 */
Spriteset_Map.prototype.handleBattlerHitboxes = function()
{
  // build any missing hitbox sprites for active battlers.
  this.buildMissingBattlerHitboxSprites();

  // refresh positions and shapes for existing battler hitbox sprites.
  this.refreshExistingBattlerHitboxSprites();

  // purge battler hitbox sprites that no longer have a corresponding battler.
  this.purgeOrphanedBattlerHitboxSprites();
};

/**
 * Builds battler hitbox sprites for any battlers that lack one.
 */
Spriteset_Map.prototype.buildMissingBattlerHitboxSprites = function()
{
  // get the container and dict for battler hitboxes.
  const layer = this.getJabsHitboxLayer(); // parent container for hitboxes.
  const dict = this.getBattlerHitboxSprites(); // existing battler hitbox sprites.

  // collect all active battler keys + sources to build for.
  const items = this.collectActiveBattlerOverlayItems(); // [{ key, type, source }]

  // create any that are missing.
  items.forEach(item =>
  {
    // skip if a sprite already exists for this key.
    if (dict[item.key]) return; // already present.

    // create and mount a new battler hitbox sprite.
    const sprite = this.createBattlerHitboxSprite(item); // build new sprite.
    dict[item.key] = sprite; // track it.
    layer.addChild(sprite); // attach to the hitbox layer.
  });
};

/**
 * Synchronizes position and appearance of existing battler hitbox sprites.
 */
Spriteset_Map.prototype.refreshExistingBattlerHitboxSprites = function()
{
  // quick access to tile size.
  const tw = $gameMap.tileWidth(); // tile width in pixels.
  const th = $gameMap.tileHeight(); // tile height in pixels.

  // collect all active battler keys + sources to refresh.
  const items = this.collectActiveBattlerOverlayItems(); // [{ key, type, source }]

  // refresh each active battler's sprite.
  items.forEach(item =>
  {
    // locate or create the sprite for this battler.
    const sprite = this.getOrCreateBattlerHitboxSpriteFor(item); // ensure sprite exists.

    // compute on-screen center for the battler (feet).
    const cx = item.source.screenX(); // center x at feet.
    const cy = item.source.screenY(); // center y at feet.
    sprite.x = cx; // place sprite at x.
    sprite.y = cy; // place sprite at y.

    // compute the AABB model from the engine for consistent drawing.
    const aabb = JABS_Engine.getBattlerAabbModel(item.source);

    // determine if this battler currently overlaps any active action.
    const colliding = this.isBattlerCollidingWithAnyAction(item); // true if overlapping.

    // redraw the 1x1 tile square representing the battler's occupancy using the model rect.
    this.drawBattlerHitboxInto(sprite, item.type, tw, th, colliding, aabb); // draw for this frame.
  });
};

/**
 * Removes battler hitbox sprites that no longer correspond to an active battler.
 */
Spriteset_Map.prototype.purgeOrphanedBattlerHitboxSprites = function()
{
  // compute the set of active keys now.
  const active = new Set(this.collectActiveBattlerOverlayItems()
    .map(it => it.key)); // active keys.

  // walk the dict and remove any sprites whose keys aren’t active.
  const dict = this.getBattlerHitboxSprites(); // existing sprites.
  const layer = this.getJabsHitboxLayer(); // parent container.

  Object.keys(dict)
    .forEach(key =>
    {
      if (active.has(key)) return; // still in use, keep it.

      // detach and destroy the orphaned sprite.
      const sprite = dict[key]; // the orphaned sprite.
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite); // remove from layer.
      }

      this.destroyBattlerHitboxSprite(sprite); // dispose internals.
      delete dict[key]; // remove from dict.
    });
};

/**
 * Collects all battler-bearing characters to overlay and produces stable keys.
 * Includes: player, followers, and enemy battler events.
 * @returns {{ key:string, type:"player"|"follower"|"battler", source: Game_CharacterBase }[]}
 */
Spriteset_Map.prototype.collectActiveBattlerOverlayItems = function()
{
  /** @type {{ key:string, type:"player"|"follower"|"battler", source: Game_CharacterBase }[]} */
  const items = []; // the final collection.

  // include player (always present on map).
  const player = $gamePlayer; // the player character.
  if (player)
  {
    items.push({
      key: "battler:player",
      type: "player",
      source: player
    }); // add player.
  }

  // include followers (ally AI or default followers alike).
  const followers = $gamePlayer.followers()
    .data(); // array of Game_Follower.
  for (let i = 0; i < followers.length; i++)
  {
    const follower = followers[i];
    if (!follower || !follower.isVisible()) continue;

    items.push({
      key: `battler:follower:${i}`,
      type: "follower",
      source: follower
    }); // add follower.
  }

  // include enemy battler events (events that represent battlers on the map).
  $gameMap.events()
    .filter(ev => ev.isJabsBattler())
    .forEach(ev =>
    {
      const uuid = ev.getJabsBattlerUuid();
      if (!uuid) return;

      items.push({
        key: uuid,
        type: "battler",
        source: ev
      }); // add enemy battler event.
    });

  return items; // provide the collection.
};

/**
 * Retrieves or creates the battler hitbox sprite for a given overlay item.
 * @param {{ key:string, type:string, source: Game_CharacterBase }} item The overlay item.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getOrCreateBattlerHitboxSpriteFor = function(item)
{
  // derive the key for this battler's sprite.
  const { key } = item; // stable id.

  // return the existing sprite if present.
  const dict = this.getBattlerHitboxSprites(); // dictionary of sprites.
  if (dict[key]) return dict[key]; // already made.

  // otherwise create, track, and return it.
  const sprite = this.createBattlerHitboxSprite(item); // create new sprite.
  dict[key] = sprite; // track it.
  this.getJabsHitboxLayer()
    .addChild(sprite); // mount it.
  return sprite; // provide to caller.
};

/**
 * Creates a new battler hitbox sprite (Sprite wrapping a PIXI.Graphics).
 * @param {{ key:string, type:string, source: Game_CharacterBase }} item The overlay item.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.createBattlerHitboxSprite = function(item)
{
  // create a plain sprite to remain RMMZ-native at the boundary.
  const sprite = new Sprite(); // container-level sprite.

  // create a graphics child to actually draw the shapes.
  /** @type {PIXI.Graphics} */
  const g = new PIXI.Graphics(); // underlying shape drawer.

  // store references and small bits of state on the sprite.
  sprite._jabsHitboxG = g; // the internal graphics used for drawing.
  sprite._battlerKey = item.key; // stable id.
  sprite._battlerType = item.type; // kind: player|follower|battler.

  // attach the graphics under the sprite.
  sprite.addChild(g); // graphics is a child of sprite.

  // center the sprite so drawing at (0,0) will align to center.
  sprite.anchor.set(0.5, 0.5); // center origin.

  return sprite; // return the prepared sprite.
};

/**
 * Draws the battler's occupancy hitbox (1x1 tile square) into the sprite graphics.
 * @param {Sprite} sprite The target battler hitbox sprite.
 * @param {"player"|"follower"|"battler"} type The kind of battler.
 * @param {number} tw Tile width in pixels.
 * @param {number} th Tile height in pixels.
 * @param {boolean} colliding Whether the battler overlaps any active action.
 * @param {JABS_Aabb} aabb The model rect for this battler in screen pixels.
 */
Spriteset_Map.prototype.drawBattlerHitboxInto = function(sprite, type, tw, th, colliding, aabb)
{
  // get the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG; // internal graphics for drawing.

  // clear previous drawings for this frame.
  g.clear(); // remove any prior shapes.

  // resolve and apply centralized style for this battler kind and state.
  const style = this.getBattlerHitboxStyle(type,
    colliding
      ? "colliding"
      : null); // style with state.
  this.applyHitboxStyle(g, style); // apply style to graphics.

  // compute local offsets: sprite is centered at feet (cx,cy) with anchor 0.5,0.5.
  const localX = aabb.x - sprite.x; // top-left x relative to sprite origin.
  const localY = aabb.y - sprite.y; // top-left y relative to sprite origin.

  // draw the model rect exactly so visuals match physics.
  g.drawRect(localX, localY, aabb.w, aabb.h);

  // finalize fill.
  g.endFill(); // complete fill for this hitbox.
};

/**
 * Resolves the style used when drawing a battler hitbox for a given battler kind.
 * Reads from J.ABS.Metadata.HitboxStyles.byKind and .byState; falls back to defaults.
 * @param {"player"|"follower"|"battler"} kind The battler kind.
 * @param {string|null} state Optional state key such as "colliding".
 * @returns {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }}
 */
Spriteset_Map.prototype.getBattlerHitboxStyle = function(kind, state)
{
  // defaults tailored for battlers (green-ish for visibility against action orange).
  const defaults = {
    fillColor: 0x2ECC71, // green fill.
    fillAlpha: 0.25, // translucent.
    lineColor: 0x27AE60, // darker green outline.
    lineAlpha: 0.9, // outline opacity.
    lineWidth: 2, // outline thickness.
  };

  // pull optional centralized styles if present.
  const styles = J.ABS.Metadata.HitboxStyles || {}; // centralized config bucket.

  // merge base overrides if provided.
  const base = Object.assign({}, defaults, styles.base || {}); // merged base.

  // apply kind-specific overrides if provided.
  const kindKey = (kind || "battler").toLowerCase(); // normalized.
  const byKind = styles.byKind?.[kindKey] || null; // optional kind overrides.

  // apply state-specific overrides if provided (e.g., colliding).
  const stateKey = (state || "").toLowerCase(); // normalized.
  const byState = stateKey
    ? (styles.byState?.[stateKey] || null)
    : null; // optional state overrides.

  // layered result: base -> kind -> state.
  const finalStyle = Object.assign({}, base, byKind || {}, byState || {}); // merged final style.
  return finalStyle; // return style for caller.
};

/**
 * Destroys a battler hitbox sprite and its internals.
 * @param {Sprite} sprite The sprite to destroy.
 */
Spriteset_Map.prototype.destroyBattlerHitboxSprite = function(sprite)
{
  if (!sprite) return; // nothing to destroy.

  // cleanup graphics child if present.
  if (sprite._jabsHitboxG)
  {
    sprite._jabsHitboxG.clear(); // clear any drawings.
    sprite._jabsHitboxG.destroy({ children: true }); // dispose graphics.
  }

  // destroy the container sprite.
  sprite.destroy(); // dispose sprite and its children.
};
//endregion battler hitboxes
//endregion hitbox sprites
//endregion Spriteset_Map