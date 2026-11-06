//region Spriteset_Map
import JABS_HitboxPulseManager from './../managers/JABS_HitboxPulseManager.js';
import JABS_Engine from './../managers/JABS_Engine.js';
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_Action from '../models/JABS_Action.js';
import JABS_Aabb from '../models/JABS_Aabb.js';
import JABS_CastPreviewAction from '../models/JABS_CastPreviewAction.js';
import JABS_HitboxPainter from './../managers/JABS_HitboxPainter.js';
//region init
/**
 * Extends {@link Spriteset_Map.createLowerLayer}.<br/>
 * Also builds the JABS overlay layer after the vanilla lower layer.
 */
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
  this.setDebugHitboxLayer(new Sprite());

  /**
   * Direct tracking for individual sprites by their uuid.
   * @type {Record<string, Sprite>}
   */
  this.setDebugActionHitboxSprites({});

  /**
   * Direct tracking for battler hitbox sprites by their stable key.
   * Keys include enemy battler uuids, and fixed keys for player/followers.
   * @type {Record<string, Sprite>}
   */
  this.setDebugBattlerHitboxSprites({});

  /**
   * Direct tracking for cast preview sprites by battler uuid and place in the volley.
   * Keys are of the form: `castpreview:${uuid}:${index}`.
   * @type {Record<string, Sprite>}
   */
  this.setCastPreviewSprites({});

  /**
   * The container for cast preview sprites.
   * @type {Sprite}
   */
  this.setCastPreviewLayer(new Sprite());

  /**
   * The container for transient hitbox pulses.
   * @type {Sprite}
   */
  this.setHitboxPulseLayer(new Sprite());

  // mount under tilemap for consistent coordinates.
  this.addChild(this.debugHitboxLayer());
  this.addChild(this.castPreviewLayer());
  this.tilemap().addChild(this.hitboxPulseLayer());

  // ensure no stale pulses from a prior map remain.
  JABS_HitboxPulseManager.clear();

  // bind the new layer to the static manager.
  JABS_HitboxPulseManager.setLayer(this.hitboxPulseLayer());

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
  return this.debugHitboxLayer();
};

/**
 * Gets the cast preview sprite container.
 * @returns {Sprite}
 */
Spriteset_Map.prototype.getCastPreviewLayer = function ()
{
  return this.castPreviewLayer();
};

/**
 * Get the direct tracking dictionary for hitbox sprites.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getActionHitboxSprites = function ()
{
  return this.debugActionHitboxSprites();
};

/**
 * Accessor for the battler hitbox sprite dictionary.
 * @returns {Record<string, Sprite>}
 */
Spriteset_Map.prototype.getBattlerHitboxSprites = function ()
{
  return this.debugBattlerHitboxSprites(); // return the dict.
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
  this.characterSprites().push(sprite);
  this.tilemap().addChild(sprite);

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
  for (let i = this.characterSprites().length - 1; i >= 0; i--)
  {
    const sprite = this.characterSprites()[i];

    // character() must match exactly the character we created the sprite with.
    if (character && sprite.character() === character)
    {
      // remove from tracking first.
      this.characterSprites().splice(i, 1);

      // remove from the display tree if attached.
      if (this.tilemap() && sprite.parent === this.tilemap())
      {
        this.tilemap().removeChild(sprite);
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
    const idx = this.characterSprites().findIndex(s => s.character() === actionEvent);
    if (idx !== -1)
    {
      const [ sprite ] = this.characterSprites().splice(idx, 1);
      if (this.tilemap() && sprite && sprite.parent === this.tilemap())
      {
        this.tilemap().removeChild(sprite);
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
  const previewDict = this.castPreviewSprites();
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
  this.characterSprites().push(sprite);
  this.tilemap().addChild(sprite);

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
  this.characterSprites().push(sprite);
  this.tilemap().addChild(sprite);

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
  let spriteIndex = this.characterSprites().findIndex(sprite =>
  {
    // if the character doesn't match the event, then keep looking.
    if (sprite.character() !== lootEvent) return false;

    // we found a match!
    return true;
  });

  // if not found, attempt to resolve by loot uuid to cover reference mismatches.
  if (spriteIndex === -1)
  {
    // extract the target uuid for matching. `uuid` is a method, and reading it without calling it
    // yields the prototype's function - which compares equal against every other drop's, making
    // this scan match the first loot sprite on the map and destroy a drop nobody asked about.
    const targetUuid = lootEvent.getJabsLoot()
      .uuid();

    // scan for a sprite whose underlying loot uuid matches.
    spriteIndex = this.characterSprites().findIndex(sprite =>
    {
      // get the character associated with this sprite, if any.
      const character = sprite.character();

      // ensure we have a character and that it is loot.
      if (!character) return false;
      if (!character.isJabsLoot()) return false;

      // retrieve the loot for this character and compare identities.
      const loot = character.getJabsLoot();

      return loot.uuid() === targetUuid;
    });
  }

  // confirm we did indeed find the sprite's index for removal.
  if (spriteIndex !== -1)
  {
    // extract the sprite to be removed.
    const sprite = this.characterSprites()[spriteIndex];

    // delete that sprite's loot child sprites, if any.
    sprite.deleteLootSprite();

    // remove the sprite from the display tree if attached.
    if (this.tilemap() && sprite.parent === this.tilemap())
    {
      this.tilemap().removeChild(sprite);
    }

    // purge the sprite from tracking.
    this.characterSprites().splice(spriteIndex, 1);

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

  // 1) Identify the current party characters to display.
  const player = $gamePlayer; // the leader
  const followers = $gamePlayer.followers()
    .data(); // array of Game_Follower

  // 2) Locate existing player and follower sprites (tolerate non-character entries).
  let playerSprite = null;
  const followerSprites = [];

  this.characterSprites().forEach(
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
    this.characterSprites().push(newPlayerSprite);
    if (this.tilemap())
    {
      this.tilemap().addChild(newPlayerSprite);
    }
  }

  // 4) Ensure we have enough follower sprites; add only if we need more.
  if (followerSprites.length < followers.length)
  {
    for (let i = followerSprites.length; i < followers.length; i++)
    {
      const follower = followers[i];
      const followerSprite = new Sprite_Character(follower);
      this.characterSprites().push(followerSprite);
      if (this.tilemap())
      {
        this.tilemap().addChild(followerSprite);
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
 * Collects the actions of all enemy battlers that are currently casting and should show a preview.
 * @returns {{ key:string, action:JABS_Action }[]}
 */
Spriteset_Map.prototype.collectActiveCastPreviewItems = function ()
{
  /** @type {{ key:string, action:JABS_Action }[]} */
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

      // require casting/channeling state + a decided action to preview.
      if (!jabsBattler.isCastingOrChanneling()) return; // not casting or channeling.
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

      // the stable part of the key, shared by the whole volley.
      const uuid = ev.getJabsBattlerUuid();
      if (!uuid) return; // cannot key the sprite.

      // every action in a volley is a hit of its own, with its own aim and spawn offset.
      decided.forEach((decidedAction, index) =>
      {
        // build and add the item for this frame.
        items.push({
          key: `castpreview:${uuid}:${index}`,
          action: decidedAction,
        });
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
  const dict = this.castPreviewSprites(); // preview sprite dict.

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
  const dict = this.castPreviewSprites();

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

      // stand in for the action event this cast has yet to spawn.
      const standIn = sprite._jabsCastPreviewAction;
      standIn.set(item.action);

      // place the sprite at the origin the hit will be tested from.
      const origin = JABS_Engine.getActionOriginPixels(standIn);
      sprite.x = origin.x;
      sprite.y = origin.y;

      // draw the preview geometry for this frame.
      this.drawCastPreviewInto(sprite);
    });
};

/**
 * Removes any preview sprites that are no longer active.
 */
Spriteset_Map.prototype.purgeOrphanedCastPreviewSprites = function ()
{
  // pull dict and parent layer for previews.
  const dict = this.castPreviewSprites(); // preview sprite dict.
  const layer = this.getCastPreviewLayer(); // parent layer for previews.

  // compute active keys for this frame.
  const activeCastPreviewKeys = this.collectActiveCastPreviewItems()
    .map(it => it.key);

  const activeKeys = new Set(activeCastPreviewKeys);

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
  sprite._jabsCastPreviewAction = new JABS_CastPreviewAction(); // stands in for the unspawned action.
  sprite._cpKey = item.key; // stable key for debugging.

  // attach graphics under sprite.
  sprite.addChild(g);

  // center origin so our drawing at (0,0) aligns to the action's origin.
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
 * Draws the cast preview shape for the action this sprite stands in for.
 * Draws around local origin (0,0); sprite is already at the action's origin.
 * @param {Sprite} sprite The target preview sprite.
 */
Spriteset_Map.prototype.drawCastPreviewInto = function (sprite)
{
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsCastPreviewG; // graphics to draw into.

  // clear previous frame.
  g.clear();

  // the stand-in carries everything the hit itself will read.
  const standIn = sprite._jabsCastPreviewAction;
  const action = standIn.getJabsAction();

  // apply style.
  const style = this.getCastPreviewStyleFor(action.getShape());
  this.applyHitboxStyle(g, style);

  // draw the same geometry the live hitbox draws, aimed where the action is aimed.
  JABS_HitboxPainter.drawAction(g, standIn);
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

  const showFullOverlays = !!$jabsEngine.hitboxOverlaysVisible;
  const pulseColliderHighlight = J.ABS.Metadata.HitboxPulse.enabled === true
    && J.ABS.Metadata.HitboxPulse.highlightColliderBattlers === true;

  // full debug overlays on, or pulse mode requests collider outlines only.
  layer.visible = showFullOverlays || pulseColliderHighlight;

  if (layer.visible === false)
  {
    return;
  }

  if (showFullOverlays)
  {
    this.handleActionHitboxes();
    this.handleBattlerHitboxes('all');
  }
  else
  {
    this.handleBattlerHitboxes('colliding');
  }
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
 * @param {{
 *  fillColor:number, fillAlpha:number, lineColor:number, lineAlpha:number,
 *  lineWidth:number, lineAlignment?:number
 * }} style
 */
Spriteset_Map.prototype.applyHitboxStyle = function (
  g,
  style
)
{
  // default to an inner-aligned stroke so the visible outer edge stays honest to the real geometry.
  const lineAlignment = style.lineAlignment ?? 0;

  // configure line + fill according to style.
  g.lineStyle(style.lineWidth, style.lineColor, style.lineAlpha, lineAlignment); // outline style.
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

    const shape = jabsAction.getShape();
    const range = jabsAction.getCollisionRange();
    const facing = jabsAction.direction();
    const innerRadius = jabsAction.getInnerRadius();

    // mirror {@link JABS_Engine#getCollisionTargets}: direct + sprite uses the same wedge test as gameplay.
    if (jabsAction.isDirectAction())
    {
      const actionSprite = jabsAction.getActionSprite();

      if (actionSprite)
      {
        const overlapped = $jabsEngine.isTargetWithinRange(facing, target, actionSprite, range, shape, innerRadius);

        if (overlapped)
        {
          return true;
        }

        continue;
      }

      const gameAction = jabsAction.getAction();

      if (gameAction.isForUser())
      {
        const casterChar = jabsAction.getCaster()
          .getCharacter();

        if (target === casterChar)
        {
          return true;
        }

        continue;
      }

      const casterJb = jabsAction.getCaster();
      const targetJb = target.getJabsBattler();

      if (!targetJb)
      {
        continue;
      }

      const maxDistance = jabsAction.getProximity();
      const distance = casterJb.distanceToDesignatedTarget(targetJb);

      if (distance <= maxDistance)
      {
        return true;
      }

      continue;
    }

    const overlapped = $jabsEngine.isTargetWithinRange(facing, target, actionEvent, range, shape, innerRadius);

    if (overlapped)
    {
      return true;
    }
  }

  return false;
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
  // iterate all current action events and refresh their hitbox sprites.
  const actions = $gameMap.actionEvents(); // current action events to render.
  actions.forEach(actionEvent =>
  {
    // read essentials from the action/event.
    const jabsAction = actionEvent.getJabsAction(); // the underlying JABS action model.
    if (!jabsAction) return; // guard: no action means nothing to draw.

    // locate the sprite for this action.
    const sprite = this.getOrCreateActionHitboxSpriteFor(actionEvent); // ensure we have a sprite.

    // centralized, corrected origin (parity with physics).
    const origin = JABS_Engine.getActionOriginPixels(actionEvent); // unified origin.
    sprite.x = origin.x; // place sprite at x.
    sprite.y = origin.y; // place sprite at y.

    // redraw the shape into the sprite's internal graphics (around local 0,0).
    this.drawActionHitboxInto(sprite, actionEvent); // draw shape for this frame.
  });
};

/**
 * Removes hitbox sprites that no longer correspond to an active action.
 */
Spriteset_Map.prototype.purgeOrphanedActionHitboxSprites = function ()
{
  // compute the set of active keys (uuids) on the map now.
  const activeActionUuids = $gameMap.actionEvents()
    .map(ev => ev.getJabsActionUuid());

  const activeKeys = new Set(activeActionUuids);

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
 * Draws the collision/visual hitbox into the provided sprite’s internal PIXI.Graphics.
 * @param {Sprite} sprite The container sprite that owns the PIXI.Graphics.
 * @param {Game_Event} actionEvent The action event whose hitbox is being drawn.
 */
Spriteset_Map.prototype.drawActionHitboxInto = function (sprite, actionEvent)
{
  // access the graphics used to draw.
  /** @type {PIXI.Graphics} */
  const g = sprite._jabsHitboxG; // internal graphics for drawing.

  // clear previous drawings for this frame.
  g.clear(); // remove any prior shapes.

  // resolve and apply centralized style for this shape.
  const shape = actionEvent.getJabsAction()
    .getShape();
  const style = this.getActionHitboxStyleFor(shape); // centralized style resolution.
  this.applyHitboxStyle(g, style); // apply style to graphics.

  // draw the geometry itself.
  JABS_HitboxPainter.drawAction(g, actionEvent);
};

//endregion action hitboxes

//region battler hitboxes

/**
 * Handle the overlays for all battler-based hitboxes.
 * @param {'all'|'colliding'} itemMode Whether to draw every battler or only those overlapping an action shape.
 */
Spriteset_Map.prototype.handleBattlerHitboxes = function (itemMode = 'all')
{
  // build any missing hitbox sprites for active battlers.
  this.buildMissingBattlerHitboxSprites(itemMode);

  // refresh positions and shapes for existing battler hitbox sprites.
  this.refreshExistingBattlerHitboxSprites(itemMode);

  // purge battler hitbox sprites that no longer have a corresponding battler.
  this.purgeOrphanedBattlerHitboxSprites(itemMode);
};

/**
 * Collects battler overlay items, optionally filtered to those overlapping an active action.
 * @param {'all'|'colliding'} itemMode Filter mode.
 * @returns {{ key:string, type:string, source: Game_CharacterBase }[]}
 */
Spriteset_Map.prototype.collectBattlerOverlayItems = function (itemMode = 'all')
{
  const items = this.collectActiveBattlerOverlayItems();

  if (itemMode === 'colliding')
  {
    return items.filter(entry => this.isBattlerCollidingWithAnyAction(entry));
  }

  return items;
};

/**
 * Builds battler hitbox sprites for any battlers that lack one.
 * @param {'all'|'colliding'} itemMode Filter mode.
 */
Spriteset_Map.prototype.buildMissingBattlerHitboxSprites = function (itemMode = 'all')
{
  // get the container and dict for battler hitboxes.
  const layer = this.getJabsHitboxLayer(); // parent container for hitboxes.
  const dict = this.getBattlerHitboxSprites(); // existing battler hitbox sprites.

  // collect all active battler keys + sources to build for.
  const items = this.collectBattlerOverlayItems(itemMode); // [{ key, type, source }]

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
 * @param {'all'|'colliding'} itemMode Filter mode.
 */
Spriteset_Map.prototype.refreshExistingBattlerHitboxSprites = function (itemMode = 'all')
{
  // quick access to tile size.
  const tw = $gameMap.tileWidth(); // tile width in pixels.
  const th = $gameMap.tileHeight(); // tile height in pixels.

  // collect all active battler keys + sources to refresh.
  const items = this.collectBattlerOverlayItems(itemMode); // [{ key, type, source }]

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
 * @param {'all'|'colliding'} itemMode Filter mode.
 */
Spriteset_Map.prototype.purgeOrphanedBattlerHitboxSprites = function (itemMode = 'all')
{
  // compute the set of active keys now.
  const activeOverlayKeys = this.collectBattlerOverlayItems(itemMode)
    .map(it => it.key);

  const active = new Set(activeOverlayKeys);

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

    // Append the row to the working collection.
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

      // Append the row to the working collection.
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

//region properties
/**
 * Gets the debug hitbox layer.
 * @returns {Sprite} The debugHitboxLayer.
 */
Spriteset_Map.prototype.debugHitboxLayer = function()
{
  // hand back the debug hitbox layer.
  return this._j._abs._debugHitboxLayer;
};

/**
 * Sets the debug hitbox layer.
 * @param {Sprite} newDebugHitboxLayer The new debugHitboxLayer.
 */
Spriteset_Map.prototype.setDebugHitboxLayer = function(newDebugHitboxLayer)
{
  // assign the debug hitbox layer.
  this._j._abs._debugHitboxLayer = newDebugHitboxLayer;
};

/**
 * Gets the debug action hitbox sprites.
 * @returns {Record<string, Sprite>} The debugActionHitboxSprites.
 */
Spriteset_Map.prototype.debugActionHitboxSprites = function()
{
  // hand back the debug action hitbox sprites.
  return this._j._abs._debugActionHitboxSprites;
};

/**
 * Sets the debug action hitbox sprites.
 * @param {Record<string, Sprite>} newDebugActionHitboxSprites The new debugActionHitboxSprites.
 */
Spriteset_Map.prototype.setDebugActionHitboxSprites = function(newDebugActionHitboxSprites)
{
  // assign the debug action hitbox sprites.
  this._j._abs._debugActionHitboxSprites = newDebugActionHitboxSprites;
};

/**
 * Gets the debug battler hitbox sprites.
 * @returns {Record<string, Sprite>} The debugBattlerHitboxSprites.
 */
Spriteset_Map.prototype.debugBattlerHitboxSprites = function()
{
  // hand back the debug battler hitbox sprites.
  return this._j._abs._debugBattlerHitboxSprites;
};

/**
 * Sets the debug battler hitbox sprites.
 * @param {Record<string, Sprite>} newDebugBattlerHitboxSprites The new debugBattlerHitboxSprites.
 */
Spriteset_Map.prototype.setDebugBattlerHitboxSprites = function(newDebugBattlerHitboxSprites)
{
  // assign the debug battler hitbox sprites.
  this._j._abs._debugBattlerHitboxSprites = newDebugBattlerHitboxSprites;
};

/**
 * Gets the cast preview sprites.
 * @returns {Record<string, Sprite>} The castPreviewSprites.
 */
Spriteset_Map.prototype.castPreviewSprites = function()
{
  // hand back the cast preview sprites.
  return this._j._abs._castPreviewSprites;
};

/**
 * Sets the cast preview sprites.
 * @param {Record<string, Sprite>} newCastPreviewSprites The new castPreviewSprites.
 */
Spriteset_Map.prototype.setCastPreviewSprites = function(newCastPreviewSprites)
{
  // assign the cast preview sprites.
  this._j._abs._castPreviewSprites = newCastPreviewSprites;
};

/**
 * Gets the cast preview layer.
 * @returns {Sprite} The castPreviewLayer.
 */
Spriteset_Map.prototype.castPreviewLayer = function()
{
  // hand back the cast preview layer.
  return this._j._abs._castPreviewLayer;
};

/**
 * Sets the cast preview layer.
 * @param {Sprite} newCastPreviewLayer The new castPreviewLayer.
 */
Spriteset_Map.prototype.setCastPreviewLayer = function(newCastPreviewLayer)
{
  // assign the cast preview layer.
  this._j._abs._castPreviewLayer = newCastPreviewLayer;
};

/**
 * Gets the hitbox pulse layer.
 * @returns {Sprite} The hitboxPulseLayer.
 */
Spriteset_Map.prototype.hitboxPulseLayer = function()
{
  // hand back the hitbox pulse layer.
  return this._j._abs._hitboxPulseLayer;
};

/**
 * Sets the hitbox pulse layer.
 * @param {Sprite} newHitboxPulseLayer The new hitboxPulseLayer.
 */
Spriteset_Map.prototype.setHitboxPulseLayer = function(newHitboxPulseLayer)
{
  // assign the hitbox pulse layer.
  this._j._abs._hitboxPulseLayer = newHitboxPulseLayer;
};
//endregion properties
//endregion Spriteset_Map