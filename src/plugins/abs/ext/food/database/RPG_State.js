//region RPG_State food extensions
//region jabsFoodChainType
/**
 * The food group chain type this state belongs to, if any.<br/>
 * Returns the lower-cased type string (e.g. 'protein', 'overstuffed') or null
 * when the state is not part of any food chain arc.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsFoodChainType', {
  get: function()
  {
    const raw = RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.FOOD.RegExp.FoodChain, true);

    // no tag present — the third param guarantees null on a miss.
    if (raw === null) return null;

    // normalize to lowercase so comparisons don't depend on authoring case.
    return raw.toLowerCase();
  },
});
//endregion jabsFoodChainType

//region jabsFoodGroupColor
/**
 * The hex color string for this state's segment in the food chain bar.<br/>
 * Sourced from the {@code <foodGroupColor:#RRGGBB>} notetag. Returns null when
 * no tag is present; the bar renderer will fall back to a neutral grey.
 * @type {string|null}
 */
Object.defineProperty(RPG_State.prototype, 'jabsFoodGroupColor', {
  get: function()
  {
    const raw = RPGManager.getStringFromNoteByRegex(this, J.ABS.EXT.FOOD.RegExp.FoodGroupColor, true);

    // no tag present — the third param guarantees null on a miss.
    if (raw === null) return null;

    return raw;
  },
});
//endregion jabsFoodGroupColor
//endregion RPG_State food extensions