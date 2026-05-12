//region Game_Party
/**
 * Extends {@link Game_Party.prototype.gainItem}.<br>
 * Keeps per-slot salvage ledgers aligned when static-template stacks grow outside crafting stamps.
 */
J.JAFTING.Aliased.Game_Party.set('gainItem', Game_Party.prototype.gainItem);
Game_Party.prototype.gainItem = function(item, amount, includeEquip)
{
  J.JAFTING.Aliased.Game_Party.get('gainItem')
    .call(this, item, amount, includeEquip);

  JaftingSalvageManager.afterPartyGainedItem(item, amount);
};

/**
 * Extends {@link Game_Party.prototype.loseItem}.<br>
 * Reclaims refinement datastore slots once dynamic equipment leaves inventory entirely.
 */
J.JAFTING.Aliased.Game_Party.set('loseItem', Game_Party.prototype.loseItem);
Game_Party.prototype.loseItem = function(item, amount, includeEquip)
{
  J.JAFTING.Aliased.Game_Party.get('loseItem')
    .call(this, item, amount, includeEquip);

  // delegate post-loss hygiene—dynamic refinement rows need datastore cleanup when the final copy disappears.
  JaftingSalvageManager.afterPartyLostItem(item, amount);
};
//endregion Game_Party