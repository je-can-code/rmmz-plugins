//region RPG_Item food extensions
//region jabsFoodType
/**
 * The food group chain type declared on this item, or null when the item is not food.<br/>
 * Sourced from the {@code <food:TYPE>} notetag where TYPE is a lowercase key that maps
 * to an entry in the boot-time {@link JABS_FoodChainPlan} registry (e.g. 'protein',
 * 'vegetable', 'overstuffed'). Items without this tag are not routed to the R2 food
 * slot and are treated as tools instead.
 * @type {string|null}
 */
Object.defineProperty(RPG_Item.prototype, 'jabsFoodType', {
  get: function()
  {
    const raw = RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.FOOD.RegExp.Food, true);

    // no tag present — the third param guarantees null on a miss.
    if (raw === null) return null;

    // normalize to lowercase so registry lookups are case-insensitive.
    return raw.toLowerCase();
  },
});
//endregion jabsFoodType
//endregion RPG_Item food extensions