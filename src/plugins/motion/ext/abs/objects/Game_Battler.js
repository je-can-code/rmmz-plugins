//region Game_Battler
import BattlerMotionCoordinator from '../managers/BattlerMotionCoordinator.js';

/**
 * Extends {@link #addState}.<br/>
 * Declares whatever motions the newly-applied state asks for.
 */
J.MOTION.EXT.ABS.Aliased.Game_Battler.set('addState', Game_Battler.prototype.addState);
Game_Battler.prototype.addState = function(stateId, attacker, sourceSkill = null)
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Game_Battler.get('addState')
    .call(this, stateId, attacker, sourceSkill);

  // let whatever just landed have its say about how this battler should look.
  BattlerMotionCoordinator.applyStateMotions(this, stateId);
};

/**
 * Extends {@link #removeState}.<br/>
 * Withdraws whatever motions the departing state had asked for.
 */
J.MOTION.EXT.ABS.Aliased.Game_Battler.set('removeState', Game_Battler.prototype.removeState);
Game_Battler.prototype.removeState = function(stateId)
{
  // perform original logic.
  J.MOTION.EXT.ABS.Aliased.Game_Battler.get('removeState')
    .call(this, stateId);

  // the affliction is over, so whatever it was doing to the sprite is over with it.
  BattlerMotionCoordinator.removeStateMotions(this, stateId);
};
//endregion Game_Battler