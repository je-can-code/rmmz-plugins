//region Input food extensions

//region ensureRemapBootstrapped
/**
 * Extends {@link Input.ensureRemapBootstrapped}.<br>
 * Injects the UsableItem→MobilitySkill default into the remap system immediately
 * after the base J-ABS-InputManager seeds its own defaults. The bootstrap guard
 * prevents double-seeding across multiple call sites (DataManager, Game_System).
 */
J.ABS.EXT.FOOD.Aliased.Input.set('ensureRemapBootstrapped', Input.ensureRemapBootstrapped);
Input.ensureRemapBootstrapped = function()
{
  // perform original logic — seeds J-ABS defaults and sets the bootstrap guard.
  J.ABS.EXT.FOOD.Aliased.Input.get('ensureRemapBootstrapped').call(this);

  // if the binding for Food is not yet in the live map, add it now.
  // using a direct assignment into the JABS binding namespace is safe here
  // because getAllBindings returns the live mutable map after seeding.
  const bindings = Input.getAllBindings('JABS');

  // only inject if the guard has not already included this key from a prior run.
  if (bindings && bindings[JABS_Button.UsableItem] === undefined)
  {
    bindings[JABS_Button.UsableItem] = [ J.ABS.EXT.INPUT.Symbols.MobilitySkill ];
  }
};
//endregion ensureRemapBootstrapped
//endregion Input food extensions