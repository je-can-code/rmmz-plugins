//region RPG_Skill food extensions
//region jabsEndsFoodChain
/**
 * Whether or not executing this skill ends the caster's active food chain.<br/>
 * Sourced from the {@code <endFoodChain>} boolean notetag.
 *
 * A metabolize skill carries this because burning the meal is what it costs. A skill that
 * deliberately omits it burns fuel without spending the arc: an endurance move bounded by the
 * chain's own duration rather than by a single use. Absence is therefore an authoring decision,
 * not an omission, and nothing warns about it.
 * @type {boolean}
 */
Object.defineProperty(RPG_Skill.prototype, 'jabsEndsFoodChain', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.FOOD.RegExp.EndFoodChain);
  },
});
//endregion jabsEndsFoodChain
//endregion RPG_Skill food extensions