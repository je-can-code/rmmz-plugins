//region JABS_Engine
import ResourceHitManager from './ResourceHitManager.js';

/**
 * Extends {@link #postPrimaryBattleEffects}.<br/>
 * Also applies on-attack resource gains to the caster and when-hit resource
 * gains to the target, provided the action landed a damaging hit.
 */
J.RESOURCES.EXT.ABS.Aliased.JABS_Engine.set('postPrimaryBattleEffects', JABS_Engine.prototype.postPrimaryBattleEffects);
JABS_Engine.prototype.postPrimaryBattleEffects = function(action, target)
{
  // perform original logic.
  J.RESOURCES.EXT.ABS.Aliased.JABS_Engine.get('postPrimaryBattleEffects')
    .call(this, action, target);

  // capture result for downstream policy in this routine.
  const result = target.getBattler()
    .result();

  // only resource effects that require landing a hit should proceed.
  if (result.isHit() === false) return;

  // apply resource gains to the caster from on-attack skill tags.
  ResourceHitManager.applyOnAttackEffects(action, target);

  // when-hit effects are only meaningful when real damage was dealt.
  if (result.hpDamage <= 0) return;

  // apply resource gains to the target from when-hit source tags.
  ResourceHitManager.applyWhenHitEffects(action, target);
};
//endregion JABS_Engine