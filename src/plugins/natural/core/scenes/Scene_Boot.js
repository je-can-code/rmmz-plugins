//region Scene_Boot
import NaturalParameterRegistration from './../core/registerNaturalParameters.js';

/**
 * Extends {@link #onDatabaseLoaded}.<br/>
 * Binds natural growth to the parameters this plugin owns the tags for, once J-Base has registered the
 * definitions those bindings attach to.
 */
J.NATURAL.Aliased.Scene_Boot.set('onDatabaseLoaded', Scene_Boot.prototype.onDatabaseLoaded);
Scene_Boot.prototype.onDatabaseLoaded = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Scene_Boot.get('onDatabaseLoaded')
    .call(this);

  // bind natural growth to the parameters this plugin owns the tags for.
  NaturalParameterRegistration.registerAll();
};
//endregion Scene_Boot