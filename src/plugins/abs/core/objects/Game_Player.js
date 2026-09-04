//region Game_Player
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_LootDrop from '../models/JABS_LootDrop.js';
/**
 * While JABS is enabled, don't try to interact with events if they are enemies.
 */
J.ABS.Aliased.Game_Player.set('startMapEvent', Game_Player.prototype.startMapEvent);
Game_Player.prototype.startMapEvent = function(x, y, triggers, normal)
{
  // this is mostly the same logic as the original, except if JABS is enabled...
  // we skip detection of battle.
  if ($jabsEngine.absEnabled)
  {
    if (!$gameMap.isEventRunning())
    {
      for (const event of $gameMap.eventsXy(x, y))
      {
        // eslint-disable-next-line max-len
        if (!event.isErased() && event.isTriggerIn(triggers) && event.isNormalPriority() === normal && !event.getJabsBattler())
        {
          event.start();
        }
      }
    }
  }
  else
  {
    // perform original logic.
    J.ABS.Aliased.Game_Player.get('startMapEvent')
      .call(this, x, y, triggers, normal);
  }
};

/**
 * If the Abs menu is pulled up, the player shouldn't be able to move.
 */
J.ABS.Aliased.Game_Player.set('canMove', Game_Player.prototype.canMove);
Game_Player.prototype.canMove = function()
{
  // check if something related to JABS is causing the player to stop moving. Note that the menu is no
  // longer among them: it is a scene now, so Scene_Map is not even running while it is open.
  const isAbsPaused = $jabsEngine.absPause;

  // casting/channeling only roots the player outright when the in-flight skill opts into
  // <cannotMoveToInterrupt>; otherwise movement is allowed, and JABS_Battler's own
  // updateSelfInterruptOnMove() is what cancels the cast/channel as a consequence of that
  // movement- watching input signals directly there is movement-plugin-agnostic, since this
  // project's pixel-movement plugin fully overwrites moveByInput/executeMove rather than
  // aliasing them.
  const isPlayerRooted = $jabsEngine.getPlayer1()
    .hasUninterruptibleMovementLock();

  // any of these will prevent the player from moving.
  const jabsDeniesMovement = (isAbsPaused || isPlayerRooted);

  // check if JABS is denying movement.
  if (jabsDeniesMovement)
  {
    // decline movement.
    return false;
  }
  // JABS isn't denying movement.
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Player.get('canMove')
      .call(this);
  }
};

/**
 * Extends {@link #isDashing}.<br/>
 * Disables engine dash while the player is in JABS combat.
 */
J.ABS.Aliased.Game_Player.set("isDashing", Game_Player.prototype.isDashing);
Game_Player.prototype.isDashing = function()
{
  // if JABS says the party is in combat, engine-style dashing is disabled.
  const inCombat = $gameParty.anyMemberInCombat();
  if (inCombat)
  {
    // force no dash during combat so sprint cannot re-assert itself.
    return false;
  }

  // otherwise, perform original engine logic.
  // perform original logic.
  return J.ABS.Aliased.Game_Player.get("isDashing").call(this);
};

/**
 * Initializes the player's `JABS_Battler` if it was not already initialized.
 */
J.ABS.Aliased.Game_Player.set('refresh', Game_Player.prototype.refresh);
Game_Player.prototype.refresh = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Player.get('refresh')
    .call(this);

  // initialize the player when the player is refreshed.
  // TODO: consider using $jabsEngine.refreshPlayer1(); ?
  $jabsEngine.initializePlayer1();
};

/**
 * Extends {@link #update}.<br/>
 * Checks whether or not the player is picking up loot drops.
 */
J.ABS.Aliased.Game_Player.set('update', Game_Player.prototype.update);
Game_Player.prototype.update = function(sceneActive)
{
  // perform original logic.
  J.ABS.Aliased.Game_Player.get('update')
    .call(this, sceneActive);

  // loot is monitored on every frame the player exists rather than only on frames they are
  // walking. a drop being drawn inward has to keep travelling after the player stops, and a
  // player standing still on top of a drop has to be able to collect it.

  // TODO: lift this to Game_Character or something if wanting others to collect loot.
  this.checkForLoot();
};

//region loot
/**
 * Checks to see if the player coordinates are intercepting with any loot
 * currently on the ground.
 */
Game_Player.prototype.checkForLoot = function()
{
  // get all the loot drops on the map.
  const lootDrops = $gameMap.getJabsLootDrops();

  // make sure we have any loot to work with before processing.
  if (!lootDrops.length) return;

  // draw nearby loot inward before asking what has arrived, so anything that lands this frame is
  // collected this frame rather than sitting on top of the player for one extra tick.
  this.processLootMagnetism(lootDrops);

  // process the loot collection.
  this.processLootCollection(lootDrops);
};

/**
 * Draws every nearby loot drop toward the player.
 * @param {Game_Event[]} lootDrops The list of all loot drops.
 */
Game_Player.prototype.processLootMagnetism = function(lootDrops)
{
  // resolve the radius once for the whole sweep. it is derived from every note source on the
  // leader- actor, class, equips, states - which is far too much work to repeat per drop.
  const radius = this.getLootMagnetRadius();

  // a radius of zero draws nothing inward; walking onto a drop still collects it.
  if (radius <= 0) return;

  // pull each drop that is close enough to be claimed.
  lootDrops.forEach(lootDrop => this.magnetizeLoot(lootDrop, radius), this);
};

/**
 * Gets the distance in tiles from which the player draws loot toward themselves.
 * @returns {number}
 */
Game_Player.prototype.getLootMagnetRadius = function()
{
  // only the leader ever collects loot, so only the leader's gear and states widen the reach.
  return $jabsEngine.getPlayer1()
    .getBattler()
    .getLootMagnetRadius();
};

/**
 * Draws a single loot drop one frame's worth of distance toward the player.
 * @param {Game_Event} lootDrop The event representing the loot drop.
 * @param {number} radius The player's current loot magnet radius, in tiles.
 */
Game_Player.prototype.magnetizeLoot = function(lootDrop, radius)
{
  // loot already on its way off the map is not worth chasing.
  if (lootDrop.isErased()) return;

  // grab the underlying loot drop for its lifecycle state.
  const jabsLootDrop = lootDrop.getJabsLoot();

  // a drop that already arrived stays put while it finishes being removed.
  if (jabsLootDrop.isCollected()) return;

  // measure the gap through the map's own deltas so a looping map does not read the short way
  // around as an entire map's worth of distance.
  const dx = $gameMap.deltaX(this.realX(), lootDrop.realX());
  const dy = $gameMap.deltaY(this.realY(), lootDrop.realY());
  const distance = Math.hypot(dx, dy);

  // out of reach, so leave it bobbing where it landed.
  if (distance > radius) return;

  // claim it the instant it comes into range- that is what stops its expiration timer, and it
  // has to happen even for a drop already close enough to skip the movement below.
  jabsLootDrop.beginWhizzing();

  // already on top of the player; collection takes it from here, and dividing by this distance
  // to build a direction would not survive the arithmetic anyway.
  if (distance <= JABS_LootDrop.arrivalDistance()) return;

  // move it, then let the next frame re-measure.
  const [ nextX, nextY ] = this.resolveMagnetizedLootPosition(lootDrop, dx, dy, distance, radius);
  lootDrop.setLootPosition(nextX, nextY);
};

/**
 * Resolves where a loot drop being drawn inward sits after one frame of travel.
 *
 * Speed rises as the gap closes rather than staying flat, so a drop visibly snaps home at the end
 * instead of drifting the last half tile. The curve is derived from the current distance rather
 * than accumulated onto the drop, which keeps the drop free of per-frame velocity state.
 * @param {Game_Event} lootDrop The event representing the loot drop.
 * @param {number} dx The x distance from the drop to the player, in tiles.
 * @param {number} dy The y distance from the drop to the player, in tiles.
 * @param {number} distance The straight-line gap between the two, in tiles.
 * @param {number} radius The player's current loot magnet radius, in tiles.
 * @returns {[number, number]} The `[x, y]` the drop should occupy next frame.
 */
Game_Player.prototype.resolveMagnetizedLootPosition = function(lootDrop, dx, dy, distance, radius)
{
  // 0 at the very edge of the radius, approaching 1 as the drop arrives.
  const closeness = 1 - (distance / radius);

  // the configured rim speed, scaled up by however close the drop already is.
  const { magnetSpeed, magnetAcceleration } = J.ABS.Metadata.Loot;
  const speed = magnetSpeed * (1 + (magnetAcceleration * closeness));

  // never travel further than the gap itself, so a fast drop lands on the player instead of
  // sailing past and being dragged back next frame.
  const step = Math.min(speed, distance);

  // convert the gap into a unit direction, then walk that far along it.
  const nextX = lootDrop.realX() + ((dx / distance) * step);
  const nextY = lootDrop.realY() + ((dy / distance) * step);

  return [ nextX, nextY ];
};

/**
 * Processes a collection of loot to determine what to do with it.
 * @param {Game_Event[]} lootDrops The list of all loot drops.
 */
Game_Player.prototype.processLootCollection = function(lootDrops)
{
  // for events picked up and stored all at once.
  const lootCollected = [];

  // iterate over each of the loots to see what we can do with them.
  lootDrops.forEach(lootDrop =>
  {
    // don't pick it up if we cannot pick it up.
    if (!this.canCollectLoot(lootDrop)) return;

    // grab the underlying loot drop.
    const jabsLootDrop = lootDrop.getJabsLoot();

    // check if the loot is to be used immediately on-pickup.
    if (jabsLootDrop.isUseOnPickup())
    {
      // use and remove it from tracking if it is.
      this.useOnPickup(jabsLootDrop.lootData());

      // remove the loot drop from the map.
      this.removeLoot(lootDrop);

      // stop processing the loot.
      return;
    }

    // add it to our group pickup tracker for additional processing.
    lootCollected.push(lootDrop);
  });

  // don't try to pick up collections that don't exist.
  if (!lootCollected.length) return;

  // pick up all the remaining loot.
  this.pickupLootCollection(lootCollected);
};

/**
 * Determines whether or not the player can collect this event's loot.
 * @param {Game_Event} lootEvent The event potentially containing loot.
 * @returns {boolean} True if it can be collected, false otherwise.
 */
Game_Player.prototype.canCollectLoot = function(lootEvent)
{
  // we cannot collect loot events that have already been erased.
  if (lootEvent.isErased()) return false;

  // we cannot collect loot that isn't close enough.
  if (!this.isTouchingLoot(lootEvent)) return false;

  // we can pick it up!
  return true;
};

/**
 * Picks up all loot at the same time that is to be stored.
 * @param {Game_Event[]} lootCollected The list of loot that was collected.
 */
Game_Player.prototype.pickupLootCollection = function(lootCollected)
{
  const lootPickedUp = [];

  // iterate over and pickup all loot collected.
  lootCollected.forEach(loot =>
  {
    // get the underlying loot item.
    const lootData = loot.getJabsLoot()
      .lootData();

    // store the loot on-pickup.
    this.storeOnPickup(lootData);

    // note that the loot was picked up.
    lootPickedUp.push(lootData);

    // remove loot now that we're done with it.
    this.removeLoot(loot);
  });

  // generate all popups for the loot collected.
  $jabsEngine.onItemPickedUp(lootPickedUp, this);

  // oh yeah, and play a sound because you picked things up.
  SoundManager.playUseItem();
};

/**
 * Whether or not the player is "touching" the this loot drop.
 * @param {Game_Event} lootDrop The event representing the loot drop.
 * @returns {boolean}
 */
Game_Player.prototype.isTouchingLoot = function(lootDrop)
{
  // measured euclidean rather than through the engine's own `distance`, which is manhattan- a
  // diamond-shaped absorption zone around a round icon is exactly the mismatch the magnet exists
  // to remove, and at this scale it would refuse anything sitting diagonally underfoot.
  const dx = $gameMap.deltaX(this.realX(), lootDrop.realX());
  const dy = $gameMap.deltaY(this.realY(), lootDrop.realY());
  const distance = Math.hypot(dx, dy);

  // this asks "has it arrived", not "is it in reach"- reach is the magnet radius' job.
  return distance <= JABS_LootDrop.arrivalDistance();
};

/**
 * Collects the loot drop off the ground.
 * @param {Game_Event} lootEvent The event representing this loot.
 */
Game_Player.prototype.pickupLoot = function(lootEvent)
{
  // extract the loot data.
  const lootMetadata = lootEvent.getJabsLoot();
  const lootData = lootMetadata.lootData();
  lootMetadata.isUseOnPickup()
    ? this.useOnPickup(lootData)
    : this.storeOnPickup(lootData);
};

/**
 * Uses the loot as soon as it is collected.
 * @param {RPG_BaseItem} lootData An object representing the loot.
 */
Game_Player.prototype.useOnPickup = function(lootData)
{
  const player = $jabsEngine.getPlayer1();
  player.applyToolItemEffects(lootData.id, JABS_Button.Tool, true);
};

/**
 * Picks up the loot and stores it in the player's inventory.
 * @param {RPG_BaseItem} lootData The loot database data itself.
 */
Game_Player.prototype.storeOnPickup = function(lootData)
{
  // add the loot to your inventory.
  $gameParty.gainItem(lootData, 1, true);

  // generate a log for the loot collected.
  $jabsEngine.createLootLog(lootData);
};

/**
 * Removes the loot drop event from the map.
 * @param {Game_Event} lootEvent The loot to remove from the map.
 */
Game_Player.prototype.removeLoot = function(lootEvent)
{
  // the drop has been granted, so retire it from the lifecycle before flagging its removal.
  lootEvent.getJabsLoot()
    .markCollected();

  lootEvent.setLootNeedsRemoving(true);
  $jabsEngine.requestClearLoot = true;
};
//endregion loot
//endregion Game_Player