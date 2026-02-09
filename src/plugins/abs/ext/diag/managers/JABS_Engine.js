//region JABS_Engine
/**
 * Extends {@link #applyActionToActionEventSprite}<br/>
 * Also applies the custom direction initialization for the action event.
 */
J.ABS.EXT.DIAG.Aliased.JABS_Engine.set(
  'applyActionToActionEventSprite',
  JABS_Engine.prototype.applyActionToActionEventSprite);
JABS_Engine.prototype.applyActionToActionEventSprite = function(actionEventSprite, action)
{
  // perform original logic.
  J.ABS.EXT.DIAG.Aliased.JABS_Engine.get('applyActionToActionEventSprite').call(this, actionEventSprite, action);

  // also set the custom and potentially diagonal direction.
  actionEventSprite.setCustomDirection(action.direction());
};
//endregion JABS_Engine