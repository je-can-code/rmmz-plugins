//region Game_Actor
import PlayerLightCoordinator from '../managers/PlayerLightCoordinator.js';

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Re-reads the light this actor is carrying, when this actor is the one leading the party.
 *
 * That hook already fires whenever equipment, states or skills change, and it is what invalidates
 * the note cache this reads through - so equipping a lantern or gaining a glowing state updates the
 * screen with nothing polling for it.
 */
J.LIGHTING.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.LIGHTING.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  // re-read the party's light, in case this change is the one that carried it.
  this.refreshCarriedLight();
};

/**
 * Re-reads whatever light the party leader is carrying.
 *
 * Every actor's data change routes through here rather than only the leader's, because an actor in
 * the back of the party can become the leader later and the reverse is just as true - deciding
 * whether this particular change matters costs more than simply re-reading, which is two cache hits.
 */
Game_Actor.prototype.refreshCarriedLight = function()
{
  PlayerLightCoordinator.refresh();
};
//endregion Game_Actor