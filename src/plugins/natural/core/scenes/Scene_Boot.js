//region Scene_Boot
import NaturalNotetagDescriptions from './../core/describeNaturalNotetags.js';
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

/**
 * Extends {@link #start}.<br/>
 * Describes the natural tags of every bound parameter. Every plugin binds its parameters while the database
 * loads, which is always over by the time the boot scene starts.
 */
J.NATURAL.Aliased.Scene_Boot.set('start', Scene_Boot.prototype.start);
Scene_Boot.prototype.start = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Scene_Boot.get('start')
    .call(this);

  // describe the natural tags of every parameter any plugin bound.
  NaturalNotetagDescriptions.registerAll();
};
//endregion Scene_Boot