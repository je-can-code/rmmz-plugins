//region JABS_Engine
/**
 * Processes the various on-hit effects against the target.
 * @param {JABS_Action} action The JABS action containing the action data.
 * @param {JABS_Battler} target The target having the action applied against.
 */
J.ABS.EXT.TOOLS.Aliased.JABS_Engine.set('processOnHitEffects', JABS_Engine.prototype.processOnHitEffects)
JABS_Engine.prototype.processOnHitEffects = function(action, target)
{
  // perform original logic.
  J.ABS.EXT.TOOLS.Aliased.JABS_Engine.get('processOnHitEffects')
    .call(this, action, target);

  // handle pull-forward logic first- if a skill carries both tags, the target gets dragged
  // toward the caster's original position before gap-close jumps the caster to wherever the
  // target ends up, so the two meet partway instead of gap-close eating the entire distance.
  this.handlePullForward(action, target);

  // handle gapclose logic.
  this.handleGapClose(action, target);
};

JABS_Engine.prototype.handleGapClose = function(action, target)
{
  // if we cannot gap close, then do not.
  if (!this.canGapClose(action, target)) return;

  // grab the caster.
  const caster = action.getCaster();

  // gap close to the target.
  caster.gapCloseToTarget(action, target)
};

/**
 * Handles pull-forward logic against the target- the inverse of gap close (the caster travels
 * to the target). Universal like knockback rather than key-gated like gap close: any target
 * without enough knockbackResist to fully negate it gets pulled.
 * @param {JABS_Action} action The JABS action containing the action data.
 * @param {JABS_Battler} target The target having the action applied against.
 */
JABS_Engine.prototype.handlePullForward = function(action, target)
{
  // if this target cannot be forcibly displaced right now, then do not.
  if (!this.canBeKnockedBack(action, target)) return;

  // if the skill doesn't carry a pull-forward tag, then do not.
  if (action.getBaseSkill().jabsPullForward === null) return;

  // grab the caster to serve as the pull's destination anchor.
  const caster = action.getCaster();

  // pull the target toward the caster.
  target.pullToCaster(action, caster);
};

/**
 * Determine whether or not the target can be gap closed to.
 * Both the skill and the target must carry matching gap close keys for this to succeed.
 * @param {JABS_Action} action The JABS action containing the action data.
 * @param {JABS_Battler} target The target having the action applied against.
 * @returns {boolean} True if the skill and target keys match, false otherwise.
 */
JABS_Engine.prototype.canGapClose = function(action, target)
{
  // a target carrying <blockGapClose> is immune outright, even to <gapCloseAny> skills.
  if (target.getBattler().isGapCloseBlocked()) return false;

  const skill = action.getBaseSkill();

  // <gapCloseAny> skips key-matching entirely: whatever single target this hits is the
  // destination, since the skill itself carries no key to check against.
  if (skill.jabsGapCloseAny) return true;

  // grab the skill's gap close key.
  const skillKey = skill.jabsGapClose;

  // if the skill has no key, it is not a gap close skill.
  if (skillKey === null) return false;

  // grab the target's gap close key.
  const targetKey = target.isGapClosable();

  // if the target has no key, it cannot be gap closed to.
  if (targetKey === null) return false;

  // keys must match — different gap close mechanics cannot cross-trigger.
  if (skillKey !== targetKey) return false;

  // both keys exist and match: gap close is permitted.
  return true;
};
//endregion JABS_Engine