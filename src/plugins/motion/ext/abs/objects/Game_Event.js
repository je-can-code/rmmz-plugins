//region Game_Event
import PresenceMotionCoordinator from '../managers/PresenceMotionCoordinator.js';

/**
 * Extends {@link #deferPageChange}.<br/>
 * Also holds a live battler's page back long enough for it to fold out of view.
 *
 * Without this a battler whose page stops applying - a time window closing, a switch turning off -
 * vanishes on the frame the page changes, because that change is what blanks its graphic. Holding
 * the change back is the only way to give it anything to animate on the way out.
 */
J.MOTION.EXT.ABS.Aliased.Game_Event.set('deferPageChange', Game_Event.prototype.deferPageChange);
Game_Event.prototype.deferPageChange = function(newPageIndex)
{
  // perform original logic.
  const deferred = J.MOTION.EXT.ABS.Aliased.Game_Event.get('deferPageChange')
    .call(this, newPageIndex);

  // something before us is already holding this change back, and will see it through itself.
  if (deferred === true) return true;

  // hold it back ourselves if a battler is about to leave the map through it.
  return PresenceMotionCoordinator.holdPageChange(this);
};

/**
 * Extends {@link #onPageChanged}.<br/>
 * Also unfolds whatever battler the new page brought onto the map.
 */
J.MOTION.EXT.ABS.Aliased.Game_Event.set('onPageChanged', Game_Event.prototype.onPageChanged);
Game_Event.prototype.onPageChanged = function(previousPageIndex)
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Game_Event.get('onPageChanged')
    .call(this, previousPageIndex);

  // give an arriving battler an entrance rather than a sudden appearance.
  PresenceMotionCoordinator.welcomeArrival(this, previousPageIndex);
};

/**
 * Extends {@link #update}.<br/>
 * Also counts down a departure, and lets its held page change through once the fold is done.
 */
J.MOTION.EXT.ABS.Aliased.Game_Event.set('update', Game_Event.prototype.update);
Game_Event.prototype.update = function()
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Game_Event.get('update')
    .call(this);

  // see a departure through, once its fold has had the time it needs.
  PresenceMotionCoordinator.updateDeparture(this);
};
//endregion Game_Event