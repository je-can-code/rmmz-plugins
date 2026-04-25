//region Spriteset_Map
//region init
J.ABS.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function ()
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
Spriteset_Map.prototype.createJabsLayer = function ()
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
   * The container for all debug-centric hitbox sprites.
   * @type {Sprite}
   */
  this._j._abs._debugHitboxLayer = new Sprite();

  /**
   * Direct tracking for individual sprites by their uuid.
   * @type {Record<string, Sprite>}
   */
  this._j._abs._debugActionHitboxSprites = {};

  /**
   * Direct tracking for battler hitbox sprites by their stable key.
   * Keys include enemy battler uuids, and fixed keys for player/followers.
   * @type {Record<string, Sprite>}
   */
  this._j._abs._debugBattlerHitboxSprites = {};

  /**
   * Direct tracking for cast preview sprites by battler uuid.
   * Keys are of the form: `castpreview:${uuid}`.
   * @type {Record<string, Sprite>}
   */
  this._j._abs._castPreviewSprites = {};

  /**
   * The container for cast preview sprites.
   * @type {Sprite}
   */
  this._j._abs._castPreviewLayer = new Sprite();

  /**
   * The container for transient hitbox pulses.
   * @type {Sprite}
   */
  this._j._abs._hitboxPulseLayer = new Sprite();

  // mount under tilemap for consistent coordinates.
  this.addChild(this._j._abs._debugHitboxLayer);
  this.addChild(this._j._abs._castPreviewLayer);
  this._tilemap.addChild(this._j._abs._hitboxPulseLayer);

  // ensure no stale pulses from a prior map remain.
  JABS_HitboxPulseManager.clear();

  // bind the new layer to the static manager.
  JABS_HitboxPulseManager.setLayer(this._j._abs._hitboxPulseLayer);

  // apply optional manager configuration (duration, alpha, scale, colors, blend, etc.).
  JABS_HitboxPulseManager.configure(J.ABS.Metadata.HitboxPulse);

  // apply explicit cap if present using the public setter.
  JABS_HitboxPulseManager.setCap(J.ABS.Metadata.HitboxPulse.maxConcurrentPulses);
};

/**
 * Gets the hitbox overlay sprite container.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getJabsHitboxLayer = function ()
{
  return this._j._abs._debugHitboxLayer;
};

/**
 * Gets the cast preview sprite container.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getCastPreviewLayer = function ()
{
  return this._j._abs._castPreviewLayer;
};

/**
 * Get the direct tracking dictionary for hitbox sprites.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getActionHitboxSprites = function ()
{
  return this._j._abs._debugActionHitboxSprites;
};

/**
 * Accessor for the battler hitbox sprite dictionary.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getBattlerHitboxSprites = function ()
{
  return this._j._abs._debugBattlerHitboxSprites; // return the dict.
};
//endregion init

//region update
/**
 * Hooks into the `update` function to also update any active action sprites.
 */
J.ABS.Aliased.Spriteset_Map.set('update', Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function ()
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
Spriteset_Map.prototype.updateJabsSprites = function ()
{
  // manage action sprites.
  this.handleActionSprites();

  // manage battler sprites.
  this.handleBattlerSprites();

  // manage loot sprites.
  this.handleLootSprites();

  // manage full-screen sprite refreshes.
  this.handleSpriteRefresh();

  // manage cast preview overlays (MVP: enemies only).
  this.handleCastPreviewOverlays();

  // manage the hitbox overlays for actions.
  this.handleHitboxOverlay();

  // update transient hitbox pulses via the manager API.
  JABS_HitboxPulseManager.update();
};
//endregion update

//region action sprites
/**
 * Processes incoming requests to add/remove action sprites.
 */
Spriteset_Map.prototype.handleActionSprites = function ()
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
Spriteset_Map.prototype.addActionSprites = function ()
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
Spriteset_Map.prototype.addActionSprite = function (actionEvent)
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
Spriteset_Map.prototype.removeActionSprites = function ()
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
Spriteset_Map.prototype.removeActionSprite = function (actionEvent)
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
  // fall back to the original search by actionEvent (legacy behavior).
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

  // Also purge any JABS layer sprites tied to this uuid immediately.
  const uuid = actionEvent.getJabsActionUuid();
  if (uuid)
  {
    this.purgeActionSpritesByUuid(uuid);
  }

  // Acknowledge that this action’s sprite no longer needs removing.
  actionEvent.setActionSpriteNeedsRemoving(false);

  // Clear any now-expired action events from the map.
  $gameMap.clearExpiredJabsActionEvents();
};

/**
 * Forcefully purges all JABS-specific layer sprites (hitboxes, previews) for a given uuid.
 * Used during action removal to ensure no dangling sprites remain for even a single frame.
 * @param {string} uuid The uuid of the action being purged.
 */
Spriteset_Map.prototype.purgeActionSpritesByUuid = function (uuid)
{
  // 1) Purge from action hitbox dictionary.
  const hitboxDict = this.getActionHitboxSprites();
  const hitboxSprite = hitboxDict[uuid];
  if (hitboxSprite)
  {
    const layer = this.getJabsHitboxLayer();
    if (hitboxSprite.parent === layer)
    {
      layer.removeChild(hitboxSprite);
    }
    this.destroyActionHitboxSprite(hitboxSprite);
    delete hitboxDict[uuid];
  }

  // 2) Purge from cast preview dictionary.
  const previewDict = this._j._abs._castPreviewSprites;
  const previewKey = `castpreview:${uuid}`;
  const previewSprite = previewDict[previewKey];
  if (previewSprite)
  {
    const layer = this.getCastPreviewLayer();
    if (previewSprite.parent === layer)
    {
      layer.removeChild(previewSprite);
    }
    this.destroyCastPreviewSprite(previewSprite);
    delete previewDict[previewKey];
  }
};
//endregion action sprites

//region generated battler sprites
/**
 * Processes incoming requests to add/remove generated battler sprites.
 */
Spriteset_Map.prototype.handleBattlerSprites = function ()
{
  if ($jabsEngine.requestBattlerRendering)
  {
    this.addBattlerSprites();
  }
};

/**
 * Adds all needing-to-be-added generated battler sprites to the map and renders.
 */
Spriteset_Map.prototype.addBattlerSprites = function ()
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
Spriteset_Map.prototype.addBattlerSprite = function (battlerEvent)
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
Spriteset_Map.prototype.handleLootSprites = function ()
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
Spriteset_Map.prototype.addLootSprites = function ()
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
Spriteset_Map.prototype.addLootSprite = function (lootEvent)
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
Spriteset_Map.prototype.removeLootSprites = function ()
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
Spriteset_Map.prototype.removeLootSprite = function (lootEvent)
{
  // attempt to find the sprite by direct character reference first.
  let spriteIndex = this._characterSprites.findIndex(sprite =>
  {
    // if the character doesn't match the event, then keep looking.
    if (sprite.character() !== lootEvent) return false;

    // we found a match!
    return true;
  });

  // if not found, attempt to resolve by loot uuid to cover reference mismatches.
  if (spriteIndex === -1)
  {
    // extract the target uuid for matching.
    const targetLoot = lootEvent.getJabsLoot();
    const targetUuid = targetLoot
      ? targetLoot.uuid
      : null;

    // only attempt uuid matching if one exists.
    if (targetUuid)
    {
      // scan for a sprite whose underlying loot uuid matches.
      spriteIndex = this._characterSprites.findIndex(sprite =>
      {
        // get the character associated with this sprite, if any.
        const character = sprite.character();

        // ensure we have a character and that it is loot.
        if (!character) return false;
        if (!character.isJabsLoot()) return false;

        // retrieve the loot for this character.
        const loot = character.getJabsLoot();

        // ensure loot exists and the uuid matches the target.
        if (!loot) return false;
        return loot.uuid === targetUuid;
      });
    }
  }

  // confirm we did indeed find the sprite's index for removal.
  if (spriteIndex !== -1)
  {
    // extract the sprite to be removed.
    const sprite = this._characterSprites[spriteIndex];

    // delete that sprite's loot child sprites, if any.
    sprite.deleteLootSprite();

    // remove the sprite from the display tree if attached.
    if (this._tilemap && sprite.parent === this._tilemap)
    {
      this._tilemap.removeChild(sprite);
    }

    // purge the sprite from tracking.
    this._characterSprites.splice(spriteIndex, 1);

    // destroy the sprite to stop updates and free resources.
    if (!sprite.destroyed)
    {
      sprite.destroy();
    }
  }

  // delete the now-removed sprite for this loot and clear events from the map.
  $gameMap.clearExpiredLootEvents();
};
//endregion loot sprites

//region event sprites
/**
 * Processes incoming requests to add/remove loot sprites.
 */
Spriteset_Map.prototype.handleSpriteRefresh = function ()
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
Spriteset_Map.prototype.refreshAllCharacterSprites = function ()
{
  // ensure the collection exists.
  this._characterSprites ||= [];

  // 1) Identify the current party characters to display.
  const player = $gamePlayer; // the leader
  const followers = $gamePlayer.followers()
    .data(); // array of Game_Follower

  // 2) Locate existing player and follower sprites (tolerate non-character entries).
  let playerSprite = null;
  const followerSprites = [];

  this._characterSprites.forEach(
    (sprite) =>
    {
      // skip non-character or unexpected entries.
      if (!sprite || !sprite.character()) return;

      const ch = sprite.character();

      // Is this the player sprite?
      if (ch.isPlayer())
      {
        playerSprite = sprite;
        return;
      }

      // Is this a follower sprite?
      if (ch.isFollower())
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

//region cast preview sprites (MVP)
/**
 * Renders translucent overlays for casting previews (enemies only for MVP).
 */
Spriteset_Map.prototype.handleCastPreviewOverlays = function ()
{
  // build any missing cast preview sprites.
  this.buildMissingCastPreviewSprites();

  // refresh existing cast preview sprites.
  this.refreshExistingCastPreviewSprites();

  // purge orphaned cast preview sprites.
  this.purgeOrphanedCastPreviewSprites();
};

/**
 * Collects all enemy battlers that are currently casting and should show a preview.
 * @returns {{ key:string, source: Game_CharacterBase, battler:JABS_Battler, action:JABS_Action, skill:RPG_Skill }[]}
 */
Spriteset_Map.prototype.collectActiveCastPreviewItems = function ()
{
  /** @type {{ key:string, source: Game_CharacterBase, battler:JABS_Battler, action:JABS_Action, skill:RPG_Skill }[]} */
  const items = [];

  // scan map events that are JABS battlers (enemies live as events).
  $gameMap.events()
    .filter(ev => ev.isJabsBattler())
    .forEach(ev =>
    {
      // find the underlying JABS battler for this event.
      const jabsBattler = ev.getJabsBattler();
      if (!jabsBattler) return; // no battler.

      // MVP: enemies only (exclude player/followers here).
      if (jabsBattler.isPlayer()) return; // skip player.

      // require casting state + a decided action to preview.
      if (!jabsBattler.isCasting()) return; // not casting.
      const decided = jabsBattler.getDecidedAction();
      if (!decided || !decided.length) return; // no actions decided.

      // extract the primary action + base skill.
      const [ action ] = decided;

      // battler-level opt-out.
      const battlerCore = jabsBattler.getBattler();
      const ref = battlerCore.databaseData();
      if (RPGManager.checkForBooleanFromNoteByRegex(ref, J.ABS.RegExp.NoCastPreviewsBattler)) return;

      // skill-level opt-out.
      const skill = action.getBaseSkill();
      if (RPGManager.checkForBooleanFromNoteByRegex(skill, J.ABS.RegExp.NoCastPreviewSkill)) return;

      // optional delay window: <castPreviewWarnAt: N> (frames; show in last N frames).
      const warnAt = RPGManager.getNumberFromNoteByRegex(skill, J.ABS.RegExp.CastPreviewWarnAt, true);
      if (warnAt !== null)
      {
        const remaining = jabsBattler.getCastTimeCountdown();
        if (remaining > warnAt) return;
      }

      // construct a stable key per battler.
      const uuid = ev.getJabsBattlerUuid();
      if (!uuid) return; // cannot key the sprite.
      const key = `castpreview:${uuid}`;

      // build and add the item for this frame.
      items.push({
        key,
        source: ev,
        battler: jabsBattler,
        action,
        skill
      });
    });

  return items; // provide the preview candidates.
};

/**
 * Builds cast preview sprites for any battlers that lack one.
 */
Spriteset_Map.prototype.buildMissingCastPreviewSprites = function ()
{
  // get the preview container and dict.
  const layer = this.getCastPreviewLayer(); // decoupled from debug overlay layer.
  const dict = this._j._abs._castPreviewSprites; // preview sprite dict.

  // collect all active preview items for this frame.
  const items = this.collectActiveCastPreviewItems();

  // create any missing sprites.
  items.forEach(item =>
  {
    // if the sprite is already present, skip.
    if (dict[item.key]) return; // already present.

    // create and mount a new preview sprite.
    const sprite = this.createCastPreviewSprite(item);
    dict[item.key] = sprite;
    layer.addChild(sprite);
  });
};

/**
 * Synchronizes position and shape of existing cast preview sprites.
 */
Spriteset_Map.prototype.refreshExistingCastPreviewSprites = function ()
{
  // grab the preview sprite dictionary for quick access.
  const dict = this._j._abs._castPreviewSprites;

  // build an active-set of preview items for this frame keyed by their persistent key.
  const active = new Map();
  this.collectActiveCastPreviewItems()
    .forEach(item => active.set(item.key, item));

  // iterate over all currently tracked preview sprites.
  Object.keys(dict)
    .forEach(key =>
    {
      // grab the preview sprite for this key.
      const sprite = dict[key];

      // grab the active item that maps to this key.
      const item = active.get(key);

      // if this preview isn't active this frame, leave cleanup to the purge step.
      if (!item) return;

      // default the preview position to the caster's feet.
      let screenX = item.source.screenX();
      let screenY = item.source.screenY();

      // if the action is a direct-target action, try to spatialize appropriately.
      if (item.action.isDirectAction && item.action.isDirectAction())
      {
        // derive base skill and lock behavior.
        const baseSkill = item.action.getBaseSkill();
        const isLocked = !!baseSkill.jabsDirectLock;

        // default to nulls for target tile.
        let tx = null;
        let ty = null;

        // if not locked, prefer decision-time frozen coordinates from options.
        if (!isLocked)
        {
          // read the options and location.
          const options = item.action.getActionOptions();
          const loc = options
            ? options.getTargetLocation()
            : null;

          // if a frozen location exists, extract x,y.
          if (loc)
          {
            tx = loc.getX();
            ty = loc.getY();
          }
        }

        // if not frozen or is locked, follow the live resolver fallback.
        if (tx === null || ty === null || isLocked)
        {
          const [resolvedX, resolvedY] = item.battler.resolveDirectActionTargetCoordinates(item.action);
          tx = resolvedX;
          ty = resolvedY;
        }

        // if we successfully resolved coords, convert them from tile to screen space.
        if (tx !== null && ty !== null)
        {
          // grab tile dimensions for conversion.
          const tw = $gameMap.tileWidth();
          const th = $gameMap.tileHeight();

          // convert tile coords to screen coords centered on the tile.
          screenX = Math.round(($gameMap.adjustX(tx) + 0.5) * tw);
          screenY = Math.round(($gameMap.adjustY(ty) + 0.5) * th);
        }
      }

      // place the sprite at the decided origin for the preview.
      sprite.x = screenX;
      sprite.y = screenY;

      // draw the preview geometry for this frame.
      this.drawCastPreviewInto(sprite, item);
    });
};

/**
 * Removes any preview sprites that are no longer active.
 */
Spriteset_Map.prototype.purgeOrphanedCastPreviewSprites = function ()
{
  // pull dict and parent layer for previews.
  const dict = this._j._abs._castPreviewSprites; // preview sprite dict.
  const layer = this.getCastPreviewLayer(); // parent layer for previews.

  // compute active keys for this frame.
  const activeKeys = new Set(this.collectActiveCastPreviewItems()
    .map(it => it.key));

  // walk current dict and remove non-active ones.
  Object.keys(dict)
    .forEach(key =>
    {
      // skip ones that remain active.
      if (activeKeys.has(key)) return; // still active.

      // detach and destroy the orphaned sprite.
      const sprite = dict[key];
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite);
      }

      // destroy internals and clear tracking.
      this.destroyCastPreviewSprite(sprite);
      delete dict[key];
    });
};

/**
 * Creates a new cast preview sprite.
 * @param {{ key:string }} item The overlay item.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.createCastPreviewSprite = function (item)
{
  // create a container sprite + graphics to draw into.
  const sprite = new Sprite();

  /** @type {PIXI.Graphics} */
  const g = new PIXI.Graphics();

  // stash a few references.
  sprite._jabsCastPreviewG = g; // internal preview graphics.
  sprite._cpKey = item.key; // stable key for debugging.

  // attach graphics under sprite.
  sprite.addChild(g);

  // center origin so our drawing at (0,0) aligns to battler feet center.
  sprite.anchor.set(0.5, 0.5);

  return sprite;
};

/**
 * Destroys a cast preview sprite and its internals.
 * @param {Sprite} sprite The sprite to destroy.
 */
Spriteset_Map.prototype.destroyCastPreviewSprite = function (sprite)
{
  if (!sprite) return;
  if (sprite._jabsCastPreviewG)
  {
    sprite._jabsCastPreviewG.clear();
    sprite._jabsCastPreviewG.destroy({ children: true });
  }
  sprite.destroy();
};

/**
 * Resolves the style used when drawing a cast preview for a given shape.
 * @param {string} shape The hitbox shape name.
 * @returns {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }}
 */
// eslint-disable-next-line no-unused-vars
Spriteset_Map.prototype.getCastPreviewStyleFor = function (shape)
{
  // MVP: a distinct, more transparent red/orange than live hitboxes.
  return {
    // soft orange-red
    fillColor: 0xFF5533,
    fillAlpha: 0.20,
    lineColor: 0xCC3F26,
    lineAlpha: 0.85,
    lineWidth: 2,
  };
};

/**
 * Draws the cast preview shape for the item’s primary action/skill.
 * Draws around local origin (0,0); sprite is already at caster feet.
 * @param {Sprite} sprite The target preview sprite.
 * @param {{ source:Game_CharacterBase, action:JABS_Action, skill:RPG_Skill }} item The item containing data.
 */
Spriteset_Map.prototype.drawCastPreviewInto = function (
  sprite,
  item
)
{
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsCastPreviewG; // graphics to draw into.

  // clear previous frame.
  g.clear();

  // derive shape parameters.
  const shape = item.action.getShape && item.action.getShape();
  const range = item.action.getRange && item.action.getRange();
  const facing = item.source.direction(); // 2/4/6/8.

  // quick access to tile size.
  const tw = $gameMap.tileWidth();
  const th = $gameMap.tileHeight();

  // apply style.
  const style = this.getCastPreviewStyleFor(shape);
  this.applyHitboxStyle(g, style);

  // Defaults for things we cannot derive without a live action event:
  //  - thickness (tiles) -> 1 tile.
  //  - arc degrees -> try skill tag if present; fallback 180°.
  const thicknessTiles = 1;
  const thicknessX = Math.max(0.5, thicknessTiles * tw);
  const thicknessY = Math.max(0.5, thicknessTiles * th);

  // try to pull <degrees:N> from the skill if present.
  const degrees = RPGManager.getNumberFromNoteByRegex(item.skill, J.ABS.RegExp.Degrees, true) ?? 180;
  const sweepRad = (degrees * Math.PI) / 180;

  // draw around local (0,0) since sprite sits at caster center.
  switch (shape)
  {
    case J.ABS.Shapes.Circle:
    {
      const r = range * tw;
      g.drawCircle(0, 0, r);
      break;
    }

    case J.ABS.Shapes.Rhombus:
    {
      this.drawRhombusG(g, range * tw, range * th);
      break;
    }

    case J.ABS.Shapes.Square:
    {
      const w = (2 * range + 1) * tw;
      const h = (2 * range + 1) * th;
      g.drawRect(-w / 2, -h / 2, w, h);
      break;
    }

    case J.ABS.Shapes.Line:
    {
      const lengthPx = range * Math.max(tw, th);
      if (facing === J.ABS.Directions.DOWN)
      {
        g.drawRect(-(thicknessX / 2), 0, thicknessX, lengthPx + (th / 2));
      }
      else if (facing === J.ABS.Directions.UP)
      {
        g.drawRect(-(thicknessX / 2), -lengthPx - (th / 2), thicknessX, lengthPx + (th / 2));
      }
      else if (facing === J.ABS.Directions.RIGHT)
      {
        g.drawRect(0, -(thicknessY / 2), lengthPx + (tw / 2), thicknessY);
      }
      else // LEFT
      {
        g.drawRect(-lengthPx - (tw / 2), -(thicknessY / 2), lengthPx + (tw / 2), thicknessY);
      }
      break;
    }

    case J.ABS.Shapes.Wall:
    {
      const lenTiles = (2 * range + 1);
      if (facing === J.ABS.Directions.DOWN || facing === J.ABS.Directions.UP)
      {
        const w = lenTiles * tw;
        g.drawRect(-w / 2, -thicknessY / 2, w, thicknessY);
      }
      else // RIGHT or LEFT
      {
        const h = lenTiles * th;
        g.drawRect(-thicknessX / 2, -h / 2, thicknessX, h);
      }
      break;
    }

    case J.ABS.Shapes.Cross:
    {
      const w = (2 * range + 1) * tw;
      const h = (2 * range + 1) * th;
      g.drawRect(-thicknessX / 2, -h / 2, thicknessX, h);
      g.drawRect(-w / 2, -thicknessY / 2, w, thicknessY);
      break;
    }

    case J.ABS.Shapes.Arc:
    default:
    {
      // derive a center angle from facing.
      let centerRad = 0; // right.
      if (facing === J.ABS.Directions.DOWN) centerRad = Math.PI / 2;
      if (facing === J.ABS.Directions.LEFT) centerRad = Math.PI;
      if (facing === J.ABS.Directions.UP) centerRad = -Math.PI / 2;

      const r = range * tw;
      this.drawSectorG(g, 0, 0, r, centerRad, sweepRad);
      break;
    }
  }

  // finalize fill.
  g.endFill();
};
//endregion cast preview sprites (MVP)

//region hitbox sprites
/**
 * Renders translucent overlays for action hitboxes.
 */
Spriteset_Map.prototype.handleHitboxOverlay = function ()
{
  // grab the hitbox overlay layer.
  const layer = this.getJabsHitboxLayer();

  // check for a request to toggle visibility of hitbox overlays.
  if ($jabsEngine.requestToggleHitboxOverlays)
  {
    // determine the next visibility state by flipping the current state.
    const nextVisible = !$jabsEngine.hitboxOverlaysVisible;

    // perform the transition to the next visibility state.
    this.transitionHitboxOverlayVisibility(nextVisible);

    // acknowledge the request and clear the flag.
    $jabsEngine.requestToggleHitboxOverlays = false;
  }

  // synchronize the layer’s visibility to the engine’s desired state.
  layer.visible = !!$jabsEngine.hitboxOverlaysVisible;

  // if overlays are hidden, do not process any overlay work.
  if (!layer.visible)
  {
    // do not build/refresh/purge any hitbox overlays while hidden.
    return;
  }

  // handle the action hitbox overlays when visible.
  this.handleActionHitboxes();

  // handle the battler hitbox overlays when visible.
  this.handleBattlerHitboxes();
};

/**
 * Transitions the hitbox overlays to the desired visibility state.
 * Always clears existing overlay sprites during a transition to ensure
 * fresh rebuild when becoming visible and to release resources when hiding.
 * @param {boolean} nextVisible The desired visibility state.
 */
Spriteset_Map.prototype.transitionHitboxOverlayVisibility = function (nextVisible)
{
  // if no change is needed, do nothing.
  if ($jabsEngine.hitboxOverlaysVisible === !!nextVisible)
  {
    // nothing to do if already in the desired state.
    return;
  }

  // clear all existing overlay sprites from the layer and tracking.
  this.clearAllHitboxOverlays();

  // set the new visibility state on the engine.
  $jabsEngine.hitboxOverlaysVisible = !!nextVisible;

  // also synchronize the layer visibility immediately.
  const layer = this.getJabsHitboxLayer();
  layer.visible = $jabsEngine.hitboxOverlaysVisible;
};

/**
 * Removes and destroys all hitbox overlay sprites (both action and battler),
 * and clears their tracking dictionaries.
 */
Spriteset_Map.prototype.clearAllHitboxOverlays = function ()
{
  // grab the layer and sprite dictionaries.
  const layer = this.getJabsHitboxLayer(); // parent container for overlays.
  const actionDict = this.getActionHitboxSprites(); // action overlay sprites.
  const battlerDict = this.getBattlerHitboxSprites(); // battler overlay sprites.

  // remove/destroy all action overlay sprites and clear their entries.
  Object.keys(actionDict)
    .forEach(key =>
    {
      // grab the sprite by key.
      const sprite = actionDict[key];

      // if the sprite is currently attached, detach it.
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite);
      }

      // destroy the sprite internals.
      this.destroyActionHitboxSprite(sprite);

      // remove the sprite from the dictionary.
      delete actionDict[key];
    });

  // remove/destroy all battler overlay sprites and clear their entries.
  Object.keys(battlerDict)
    .forEach(key =>
    {
      // grab the sprite by key.
      const sprite = battlerDict[key];

      // if the sprite is currently attached, detach it.
      if (sprite && sprite.parent === layer)
      {
        layer.removeChild(sprite);
      }

      // destroy the sprite internals.
      this.destroyBattlerHitboxSprite(sprite);

      // remove the sprite from the dictionary.
      delete battlerDict[key];
    });
};

/**
 * Applies the provided style to a PIXI.Graphics for drawing a hitbox.
 * @param {PIXI.Graphics} g The graphics instance to apply styles to.
 * @param {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }} style
 */
Spriteset_Map.prototype.applyHitboxStyle = function (
  g,
  style
)
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
Spriteset_Map.prototype.isBattlerCollidingWithAnyAction = function (item)
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
    // logical travel dir8 on the action model (map event direction may be cardinal for `$` sheet rows).
    const facing = jabsAction.direction();

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
Spriteset_Map.prototype.handleActionHitboxes = function ()
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
Spriteset_Map.prototype.getActionHitboxStyleFor = function (shape)
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
  const key = (shape || String.empty).toLowerCase(); // normalized key.
  const shapeOverrides = (styles.byShape || {})[key] || null;

  // produce the final style.
  const finalStyle = Object.assign({}, base, shapeOverrides || {}); // merged final style.
  return finalStyle; // return style for caller.
};

/**
 * Builds hitbox sprites for any action events that lack one.
 */
Spriteset_Map.prototype.buildMissingActionHitboxSprites = function ()
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
Spriteset_Map.prototype.refreshExistingActionHitboxSprites = function ()
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
    // logical travel dir8 on the action model (map event direction may be cardinal for `$` sheet rows).
    const facing = jabsAction.direction();

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
Spriteset_Map.prototype.purgeOrphanedActionHitboxSprites = function ()
{
  // compute the set of active keys (uuids) on the map now.
  const activeKeys = new Set($gameMap.actionEvents()
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
Spriteset_Map.prototype.getOrCreateActionHitboxSpriteFor = function (actionEvent)
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
Spriteset_Map.prototype.createActionHitboxSprite = function (actionEvent)
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
Spriteset_Map.prototype.destroyActionHitboxSprite = function (sprite)
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

/**
 * Draws a filled convex quad for an oriented rectangle starting at local (0,0) and extending
 * forward along the dir8 unit vector from `$jabsEngine.dir8ToUnitVector`, with half-breadth perpendicular.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {1|2|3|4|6|7|8|9} facing The dir8 facing for the forward axis.
 * @param {number} lengthPx Forward length in pixels.
 * @param {number} halfBreadthPx Half-width in pixels along the perpendicular axis.
 * @returns {void}
 */
Spriteset_Map.prototype.drawOrientedHitboxQuadG = function (
  g,
  facing,
  lengthPx,
  halfBreadthPx
)
{
  const { x: fx, y: fy } = $jabsEngine.dir8ToUnitVector(facing);
  const px = fy;
  const py = -fx;
  const ax = -px * halfBreadthPx;
  const ay = -py * halfBreadthPx;
  const bx = px * halfBreadthPx;
  const by = py * halfBreadthPx;
  const cx = (fx * lengthPx) + bx;
  const cy = (fy * lengthPx) + by;
  const dx = (fx * lengthPx) + ax;
  const dy = (fy * lengthPx) + ay;

  g.moveTo(ax, ay);
  g.lineTo(bx, by);
  g.lineTo(cx, cy);
  g.lineTo(dx, dy);
  g.closePath();
};

/**
 * Draws the collision/visual hitbox into the provided sprite’s internal PIXI.Graphics.
 * Honors <thickness:N> for line, wall, and cross.
 *
 * @param {Sprite} sprite The container sprite that owns the PIXI.Graphics.
 * @param {string} shape One of J.ABS.Shapes.* values.
 * @param {number} range Size in tiles for the shape (semantics vary by shape; see individual cases).
 * @param {1|2|3|4|6|7|8|9} facing Logical dir8 travel direction for the action.
 * @param {number} tw Tile width in pixels.
 * @param {number} th Tile height in pixels.
 * @param {Game_Event} actionEvent The action event for tag resolution.
 */
Spriteset_Map.prototype.drawActionHitboxInto = function (
  sprite,
  shape,
  range,
  facing,
  tw,
  th,
  actionEvent
)
{
  // access the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG; // internal graphics for drawing.

  // clear previous drawings for this frame.
  g.clear(); // remove any prior shapes.

  // resolve and apply centralized style for this shape.
  const style = this.getActionHitboxStyleFor(shape); // centralized style resolution.
  this.applyHitboxStyle(g, style); // apply style to graphics.

  // precompute thickness (in tiles) once for any shapes that use it.
  const thicknessTiles = ($jabsEngine.getActionThicknessTiles(actionEvent) ?? 1);
  const minPx = 0.5; // small positive thickness minimum to avoid degenerate shapes.
  const thicknessX = Math.max(minPx, thicknessTiles * tw);
  const thicknessY = Math.max(minPx, thicknessTiles * th);

  // draw around local (0,0) since sprite is positioned at the action center.
  switch (shape)
  {
    case J.ABS.Shapes.Circle:
    {
      // circle radius uses tile width for consistency with collision.
      const r = range * tw;
      g.drawCircle(0, 0, r);
      break;
    }

    case J.ABS.Shapes.Rhombus:
    {
      // diamond visualization.
      this.drawRhombusG(g, range * tw, range * th);
      break;
    }

    case J.ABS.Shapes.Square:
    {
      // full square centered at the origin.
      const w = (2 * range + 1) * tw;
      const h = (2 * range + 1) * th;
      g.drawRect(-w / 2, -h / 2, w, h);
      break;
    }

    case J.ABS.Shapes.Line:
    {
      // length uses major axis regardless of orientation.
      const lengthPx = range * Math.max(tw, th);

      // draw oriented rect with a small extra half-tile pad like engine collision.
      const lengthWithPad = lengthPx + (Math.max(tw, th) / 2);
      const halfBreadth = Math.max(thicknessX, thicknessY) / 2;
      this.drawOrientedHitboxQuadG(g, facing, lengthWithPad, halfBreadth);
      break;
    }

    case J.ABS.Shapes.Wall:
    {
      // breadth spans (2*range+1) tiles across the perpendicular axis.
      const lenTiles = (2 * range + 1);
      const breadthW = lenTiles * tw;
      const breadthH = lenTiles * th;
      const depthW = Math.max(minPx, thicknessTiles * tw);
      const depthH = Math.max(minPx, thicknessTiles * th);
      const depthPx = Math.max(depthW, depthH);
      const halfBreadth = Math.max(breadthW, breadthH) / 2;
      this.drawOrientedHitboxQuadG(g, facing, depthPx, halfBreadth);
      break;
    }

    case J.ABS.Shapes.Cross:
    {
      // cross is the union of a vertical and horizontal bar.
      const w = (2 * range + 1) * tw;
      const h = (2 * range + 1) * th;
      g.drawRect(-thicknessX / 2, -h / 2, thicknessX, h); // vertical bar
      g.drawRect(-w / 2, -thicknessY / 2, w, thicknessY); // horizontal bar
      break;
    }

    case J.ABS.Shapes.Arc:
    default:
    {
      // sector wedge; resolve degrees via engine helper.
      const degrees = ($jabsEngine.getActionDegrees(actionEvent) ?? 180);

      // compute center angle from logical dir8 (0 = right, π/2 = down in canvas atan2 space).
      const { x: fx, y: fy } = $jabsEngine.dir8ToUnitVector(facing);
      const centerRad = Math.atan2(fy, fx);

      // compute sweep in radians and draw.
      const sweepRad = (degrees * Math.PI) / 180;
      const r = range * tw; // radius in px
      this.drawSectorG(g, 0, 0, r, centerRad, sweepRad);
      break;
    }
  }

  // complete fill for this shape.
  g.endFill();
};

/**
 * Draws a diamond (rhombus) centered on the graphics' local origin.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {number} rx Horizontal radius in px.
 * @param {number} ry Vertical radius in px.
 */
Spriteset_Map.prototype.drawRhombusG = function (
  g,
  rx,
  ry
)
{
  g.moveTo(0, -ry); // top.
  g.lineTo(rx, 0); // right.
  g.lineTo(0, ry); // bottom.
  g.lineTo(-rx, 0); // left.
  g.closePath(); // close.
};

/**
 * Draws a filled sector (wedge) into a PIXI.Graphics.
 * If sweepRad >= 2π (or ~360°), a full circle is drawn.
 * @param {PIXI.Graphics} g The graphics to draw on.
 * @param {number} cx Center X (local space).
 * @param {number} cy Center Y (local space).
 * @param {number} r Radius in pixels.
 * @param {number} centerRad Center angle in radians. 0 = right, π/2 = down, π = left, -π/2 = up.
 * @param {number} sweepRad Total sweep in radians (0–2π].
 */
Spriteset_Map.prototype.drawSectorG = function (
  g,
  cx,
  cy,
  r,
  centerRad,
  sweepRad
)
{
  // normalize sweep to [0, 2π].
  const TAU = Math.PI * 2; // 2π constant.
  const sweep = Math.max(0, Math.min(TAU, sweepRad || 0)); // clamp.

  // if the sweep is effectively a full circle, just draw a circle.
  if (sweep >= TAU - 1e-6)
  {
    g.drawCircle(cx, cy, r);
    return;
  }

  // derive start/end angles about the center angle.
  const start = centerRad - (sweep / 2);
  const end = centerRad + (sweep / 2);

  // compute the start point on the circumference.
  const sx = cx + (r * Math.cos(start));
  const sy = cy + (r * Math.sin(start));

  // start from center → line to arc start → arc to end → back to center → fill.
  g.moveTo(cx, cy);
  g.lineTo(sx, sy);
  g.arc(cx, cy, r, start, end); // clockwise sector edge.
  g.lineTo(cx, cy);
  g.closePath();
};

//endregion action hitboxes

//region battler hitboxes

/**
 * Handle the overlays for all battler-based hitboxes.
 */
Spriteset_Map.prototype.handleBattlerHitboxes = function ()
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
Spriteset_Map.prototype.buildMissingBattlerHitboxSprites = function ()
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
Spriteset_Map.prototype.refreshExistingBattlerHitboxSprites = function ()
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
Spriteset_Map.prototype.purgeOrphanedBattlerHitboxSprites = function ()
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
 * @returns {{ key:string, type:'player'|'follower'|'battler', source: Game_CharacterBase }[]}
 */
Spriteset_Map.prototype.collectActiveBattlerOverlayItems = function ()
{
  /** @type {{ key:string, type:'player'|'follower'|'battler', source: Game_CharacterBase }[]} */
  const items = []; // the final collection.

  // include player (always present on map).
  const player = $gamePlayer; // the player character.
  if (player)
  {
    items.push({
      key: 'battler:player',
      type: 'player',
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
      type: 'follower',
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
        type: 'battler',
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
Spriteset_Map.prototype.getOrCreateBattlerHitboxSpriteFor = function (item)
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
Spriteset_Map.prototype.createBattlerHitboxSprite = function (item)
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
 * @param {'player'|'follower'|'battler'} type The kind of battler.
 * @param {number} tw Tile width in pixels.
 * @param {number} th Tile height in pixels.
 * @param {boolean} colliding Whether the battler overlaps any active action.
 * @param {JABS_Aabb} aabb The model rect for this battler in screen pixels.
 */
Spriteset_Map.prototype.drawBattlerHitboxInto = function (
  sprite,
  type,
  tw,
  th,
  colliding,
  aabb
)
{
  // get the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG; // internal graphics for drawing.

  // clear previous drawings for this frame.
  g.clear(); // remove any prior shapes.

  // resolve and apply centralized style for this battler kind and state.
  const style = this.getBattlerHitboxStyle(
    type,
    colliding
      ? 'colliding'
      : null
  ); // style with state.
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
 * @param {'player'|'follower'|'battler'} kind The battler kind.
 * @param {string|null} state Optional state key such as "colliding".
 * @returns {{ fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number, lineWidth:number }}
 */
Spriteset_Map.prototype.getBattlerHitboxStyle = function (
  kind,
  state
)
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
  const kindKey = (kind || 'battler').toLowerCase(); // normalized.
  const byKind = (styles.byKind || {})[kindKey] || null;

  // apply state-specific overrides if provided (e.g., colliding).
  const stateKey = (state || String.empty).toLowerCase();
  const byState = stateKey
    ? ((styles.byState || {})[stateKey] || null)
    : null;

  // layered result: base -> kind -> state.
  const finalStyle = Object.assign({}, base, byKind || {}, byState || {}); // merged final style.
  return finalStyle; // return style for caller.
};

/**
 * Destroys a battler hitbox sprite and its internals.
 * @param {Sprite} sprite The sprite to destroy.
 */
Spriteset_Map.prototype.destroyBattlerHitboxSprite = function (sprite)
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