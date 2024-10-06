//region Plugin Command Registration
/**
 * Plugin command for enabling JABS.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Enable JABS", () =>
{
  $jabsEngine.absEnabled = true;
});

/**
 * Plugin command for disabling JABS.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Disable JABS", () =>
{
  $jabsEngine.absEnabled = false;
});

/**
 * Plugin command for assigning and locking a skill to a designated slot.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Set JABS Skill", args =>
{
  // extract the values out of the various args.
  const { actorId, skillId, itemId, slot, locked } = args;

  // convert the text option to one of the available slots.
  const skillSlotKey = J.ABS.Helpers.PluginManager.TranslateOptionToSlot(slot);

  // determine the actor.
  const actor = $gameActors.actor(parseInt(actorId));

  // designate the default assigned id to be the skill id.
  let assignedId = parseInt(skillId);

  // check if we are assigning to the tool slot and have an item id available.
  if (itemId !== 0 && skillSlotKey === JABS_Button.Tool)
  {
    // overwrite any possible skill id with the item id instead.
    assignedId = parseInt(itemId);
  }

  // don't try to assign anything if we don't have an id to assign.
  if (assignedId === 0) return;

  // determine the locked state of the skill being assigned.
  const isLocked = locked === 'true';

  // assign the id to the slot.
  actor.setEquippedSkill(skillSlotKey, assignedId, isLocked);
});

/**
 * Plugin command for unlocking a specific JABS skill slot.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Unlock JABS Skill Slot", args =>
{
  const leader = $gameParty.leader();
  if (!leader)
  {
    console.warn("There is no leader to manage skills for.");
    return;
  }

  const { Slot } = args;
  const translation = J.ABS.Helpers.PluginManager.TranslateOptionToSlot(Slot);
  leader.unlockSlot(translation);
});

/**
 * Plugin command for unlocking all JABS skill slots.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Unlock All JABS Skill Slots", () =>
{
  const leader = $gameParty.leader();
  if (!leader)
  {
    console.warn("There is no leader to manage skills for.");
    return;
  }

  leader.unlockAllSlots();
});

/**
 * Plugin command for cycling through party members forcefully.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Rotate Party Members", () =>
{
  JABS_InputAdapter.performPartyCycling(true);
});

/**
 * Plugin command for disabling the ability to rotate party members.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Disable Party Rotation", () =>
{
  $gameParty.disablePartyCycling();
});

/**
 * Plugin command for enabling the ability to rotate party members.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Enable Party Rotation", () =>
{
  $gameParty.enablePartyCycling();
});

/**
 * Plugin command for updating the JABS menu.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Refresh JABS Menu", () =>
{
  $jabsEngine.requestJabsMenuRefresh = true;
});

/**
 * Registers a plugin command for dynamically spawning an enemy onto the map.
 * The enemy spawned will be a clone from the enemy clone map.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Spawn Enemy", args =>
{
  // extract the eventId and coordinates from the plugin args.
  const { x, y, enemyEventId, spawnAnimationId } = args;

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
      console.error('enemy failed to be dynamically generated.');
      console.warn(addedEnemy);

      return;
    }

    // execute the animation on the newly spawned enemy.
    setTimeout(() => addedEnemy.requestAnimation(parsedAnimationId), 50);
  }
});

/**
 * Registers a plugin command for dynamically spawning loot onto the map.
 */
PluginManager.registerCommand(J.ABS.Metadata.Name, "Spawn Loot", args =>
{
  // extract the eventId and coordinates from the plugin args.
  const { x, y, lootItemIds, lootWeaponIds, lootArmorIds, spawnAnimationId } = args;

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
  /** @type {Game_Event} */
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