//region JABS_Battler food extensions
import JABS_FoodChainResolver from './JABS_FoodChainResolver.js';

//region applyUsableItemEffects
/**
 * Extends {@link JABS_Battler.prototype.applyUsableItemEffects}.<br>
 * When the item in the usable-item slot carries a {@code <food:TYPE>} tag, the standard
 * Game_Action scope path is bypassed in favor of {@link JABS_FoodChainResolver.resolveEat},
 * which applies buffet-style heals to the full party and manages the food chain arc on
 * the leader. All other items (no food tag) fall through to core behavior unchanged.
 * @param {number} itemId The id of the item being consumed.
 * @param {boolean} isLoot Whether this is a loot pickup (skip consume + cooldown).
 */
J.ABS.EXT.FOOD.Aliased.JABS_Battler.set('applyUsableItemEffects', JABS_Battler.prototype.applyUsableItemEffects);
JABS_Battler.prototype.applyUsableItemEffects = function(itemId, isLoot = false)
{
  // grab the item data.
  const item = $dataItems[itemId];

  // if the item is not food, let core handle it without modification.
  if (!item || item.jabsFoodType === null)
  {
    // perform original logic.
    J.ABS.EXT.FOOD.Aliased.JABS_Battler.get('applyUsableItemEffects').call(this, itemId, isLoot);
    return;
  }

  // grab the underlying battler.
  const battler = this.getBattler();

  // consume one instance of the item from the party's inventory.
  battler.consumeItem(item);

  // flag the slot for a quantity refresh.
  battler.getSkillSlotManager()
    .getUsableItemSlot()
    .flagSkillSlotForRefresh();

  // delegate all chain and buffet resolution to the resolver.
  JABS_FoodChainResolver.resolveEat(itemId, this);

  // build a log entry so the player knows what was consumed.
  this.createToolLog(item);

  // if the party ran out of this food item, unequip the slot automatically.
  if (!$gameParty.items().includes(item))
  {
    battler.getSkillSlotManager().clearSlot(JABS_Button.UsableItem);

    const lastUsedLog = new LootLogBuilder()
      .setupUsedLastItem(item.id)
      .build();
    $mapLogs.loot.addLog(lastUsedLog);
  }
  else
  {
    // apply the standard cooldown for item consumption.
    this.modCooldownCounter(JABS_Button.UsableItem, J.ABS.DefaultValues.CooldownlessItems);
  }
};
//endregion applyUsableItemEffects
//endregion JABS_Battler food extensions