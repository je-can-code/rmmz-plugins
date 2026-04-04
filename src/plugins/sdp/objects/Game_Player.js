//region Game_Player
/**
 * Extends {@link #useOnPickup}.<br/>
 * If the loot being picked up is actually an SDP, then support the possibility of there not being a backing item from
 * the database to execute effects on.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} lootData An object representing the loot.
 */
J.SDP.Aliased.Game_Player.set("useOnPickup", Game_Player.prototype.useOnPickup);
Game_Player.prototype.useOnPickup = function(lootData)
{
  // check if the loot has an SDP key.
  if (lootData.sdpKey)
  {
    // unlock the SDP for the party.
    $gameParty.unlockSdp(lootData.sdpKey);

    // notify that an SDP panel was unlocked.
    $jabsEngine.onSdpPanelUnlocked(lootData.sdpKey, this);

    // generate a log entry for unlocking it.
    $jabsEngine.createSdpUnlockLog(lootData.sdpKey);

    // play an SE for the pickup.
    this.requestAnimation(lootData.animationId ?? 119);

    // do not process any further.
    return;
  }

  // perform original logic.
  J.SDP.Aliased.Game_Player.get("useOnPickup").call(this, lootData);
};
//endregion Game_Player