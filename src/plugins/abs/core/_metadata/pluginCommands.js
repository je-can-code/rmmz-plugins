//region Plugin Command Registration
import JABS_GlobalCooldown from '../models/JABS_GlobalCooldown.js';
import JABS_InputAdapter from '../models/JABS_InputAdapter.js';

/**
 * Plugin command for enabling JABS.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Enable JABS", () =>
{
  $jabsEngine.absEnabled = true;
});

/**
 * Plugin command for disabling JABS.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Disable JABS", () =>
{
  $jabsEngine.absEnabled = false;
});

/**
 * Plugin command for requesting a toggling of the hitbox overlay visibility.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "toggleHitboxOverlays", () =>
{
  $jabsEngine.requestToggleHitboxOverlays = true;
});

/**
 * Plugin command for assigning and locking a skill to a designated slot.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Set JABS Skill", args =>
{
  // extract the values out of the various args.
  const {
    actorId,
    skillId,
    itemId,
    slot,
    locked
  } = args;

  // convert the text option to one of the available slots.
  const skillSlotKey = J.ABS.Helpers.PluginManager.TranslateOptionToSlot(slot);

  // determine the actor.
  const actor = $gameActors.actor(parseInt(actorId));

  // designate the default assigned id to be the skill id.
  let assignedId = parseInt(skillId);

  // check if we are assigning to an item-based slot and have an item id available.
  if (itemId !== 0 && (skillSlotKey === JABS_Button.Tool || skillSlotKey === JABS_Button.UsableItem))
  {
    // overwrite any possible skill id with the item id instead.
    assignedId = parseInt(itemId);
  }

  // don't try to assign anything if we don't have an id to assign.
  if (assignedId === 0) return;

  // determine the locked state of the skill being assigned.
  const isLocked = locked === 'true';

  // offhand assignments route through the pin path so equipment refreshes do not stomp
  // the choice; the slot's id is then locked separately if requested.
  if (skillSlotKey === JABS_Button.Offhand)
  {
    // pin the skill so the offhand resolve chain returns it on the next refresh.
    actor.pinOffhandSkill(assignedId);

    // honor the lock flag using the slot's existing lock plumbing.
    if (isLocked)
    {
      actor.getSkillSlotManager()
        .getSkillSlotByKey(JABS_Button.Offhand)
        .lock();
    }

    return;
  }

  // assign the id to the slot.
  actor.setEquippedSkill(skillSlotKey, assignedId, isLocked);
});

/**
 * Plugin command for unlocking a specific JABS skill slot.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Unlock JABS Skill Slot", args =>
{
  const leader = $gameParty.leader();
  if (!leader)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'there is no party leader to manage skill slots for.');
    return;
  }

  const { Slot } = args;
  const translation = J.ABS.Helpers.PluginManager.TranslateOptionToSlot(Slot);
  leader.unlockSlot(translation);
});

/**
 * Plugin command for unlocking all JABS skill slots.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Unlock All JABS Skill Slots", () =>
{
  const leader = $gameParty.leader();
  if (!leader)
  {
    Diagnostics.warn(__PLUGIN_NAME__, 'there is no party leader to manage skill slots for.');
    return;
  }

  leader.unlockAllSlots();
});

/**
 * Plugin command for cycling through party members forcefully.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Rotate Party Members", () =>
{
  JABS_InputAdapter.performPartyCycling(true);
});

/**
 * Plugin command for disabling the ability to rotate party members.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Disable Party Rotation", () =>
{
  $gameParty.disablePartyCycling();
});

/**
 * Plugin command for enabling the ability to rotate party members.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Enable Party Rotation", () =>
{
  $gameParty.enablePartyCycling();
});

/**
 * Plugin command: forces the global cooldown counter on a party actor who is currently on the map as
 * the player or a visible follower.
 * Positive {@code frames} starts or refreshes GCD for that battler; zero or invalid clears it. Actors
 * not represented on the map are skipped with a console warning.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Apply Global Cooldown", args =>
{
  const { actorId, frames } = args;
  const actor = $gameActors.actor(parseInt(actorId, 10));
  const jabsBattler = JABS_GlobalCooldown.jabsBattlerForActor(actor);
  if (!jabsBattler)
  {
    Diagnostics.warn(
      'J-ABS',
      'Apply Global Cooldown: actor is not the leader or a visible follower on the map.',
      { actorId });
    return;
  }
  const n = parseInt(frames, 10);
  jabsBattler.setCooldownCounter(J.ABS.Globals.GlobalCooldownKey, Number.isFinite(n) && n > 0 ? n : 0);
});

/**
 * Registers a plugin command for dynamically spawning an enemy onto the map.
 * The enemy spawned will be a clone from the enemy clone map.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Spawn Enemy", args =>
{
  // extract the eventId and coordinates from the plugin args.
  const {
    x,
    y,
    enemyEventId,
    spawnAnimationId
  } = args;

  // translate the args.
  const parsedX = parseInt(x);
  const parsedY = parseInt(y);
  const parsedEnemyEventId = parseInt(enemyEventId);
  const parsedAnimationId = parseInt(spawnAnimationId);

  // spawn the enemy on the map.
  const addedEnemy = $jabsEngine.addEnemyToMap(parsedX, parsedY, parsedEnemyEventId);

  // check if there is a spawn animation.
  if (parsedAnimationId)
  {
    if (!addedEnemy)
    {
      Diagnostics.error(__PLUGIN_NAME__, 'an enemy failed to be dynamically generated.', addedEnemy);

      return;
    }

    // execute the animation on the newly spawned enemy.
    setTimeout(() => addedEnemy.requestAnimation(parsedAnimationId), 50);
  }
});

/**
 * Registers a plugin command for dynamically spawning loot onto the map.
 */
PluginManager.registerCommand(J.ABS.Metadata.name, "Spawn Loot", args =>
{
  // extract the eventId and coordinates from the plugin args.
  const {
    x,
    y,
    lootItemIds,
    lootWeaponIds,
    lootArmorIds,
    spawnAnimationId
  } = args;

  // translate the args.
  const parsedX = parseInt(x);
  const parsedY = parseInt(y);
  const parsedItems = JSON.parse(lootItemIds)
    .map(id => $dataItems.at(parseInt(id)));
  const parsedWeapons = JSON.parse(lootWeaponIds)
    .map(id => $dataWeapons.at(parseInt(id)));
  const parsedArmors = JSON.parse(lootArmorIds)
    .map(id => $dataArmors.at(parseInt(id)));
  const parsedAnimationId = parseInt(spawnAnimationId);
  /**
   * @type {Game_Event}
   */
  let lastDropped = null;

  // iterate and drop all the item loot.
  parsedItems.forEach(parsedItem =>
  {
    lastDropped = $jabsEngine.addLootDropToMap(parsedX, parsedY, parsedItem);
  });

  // iterate and drop all the weapon loot.
  parsedWeapons.forEach(parsedWeapon =>
  {
    lastDropped = $jabsEngine.addLootDropToMap(parsedX, parsedY, parsedWeapon);
  });

  // iterate and drop all the armor loot.
  parsedArmors.forEach(parsedArmor =>
  {
    lastDropped = $jabsEngine.addLootDropToMap(parsedX, parsedY, parsedArmor);
  });

  // check if there is a spawn animation.
  if (parsedAnimationId)
  {
    // execute the animation on the newly spawned enemy.
    setTimeout(() => lastDropped.requestAnimation(parsedAnimationId), 50);
  }
});
//endregion Plugin Command Registration