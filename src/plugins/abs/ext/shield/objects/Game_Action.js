//region Game_Action
/**
 * Extends {@link #executeDamage}.<br/>
 * Considers shields when executing damage.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Action.set('executeDamage', Game_Action.prototype.executeDamage);
Game_Action.prototype.executeDamage = function(target, value)
{
  // reduce damage by shields where applicable.
  const updatedValue = this.applyShields(target, value);

  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Game_Action.get('executeDamage')
    .call(this, target, updatedValue);
};

/**
 * Potentially applies shields to the damage value.
 * @param {Game_Actor|Game_Enemy} target The target of the action.
 * @param {number} value The damage value to be applied.
 * @returns {number} The updated damage value after applying shields.
 */
Game_Action.prototype.applyShields = function(target, value)
{
  // don't bother with shield processing if there is no damage.
  if (value === 0) return value;

  // grab the actionable data.
  const skillOrItem = this.item();

  // valid damage types are HP Damage and HP Drain.
  const validDamageTypes = [ 1, 5 ];

  // if the damage type is not valid, then we can skip shield processing.
  if (validDamageTypes.includes(skillOrItem.damage.type) === false) return value;

  // grab the currently active shields.
  const shieldStates = target.getShieldStates();

  // if there are no shields, then we can skip shield processing.
  if (shieldStates.length === 0) return value;

  // declare a modifiable damage value for shield processing.
  let updatedValue = value;

  // iterate over the shields and apply them to the damage value.
  for (const shieldState of shieldStates)
  {
    // update the value and mitigate damage.
    updatedValue = this.applyShield(shieldState, target, updatedValue);

    // if we have no damage left, then we can stop processing shields.
    if (updatedValue === 0) break;
  }

  // return the updated value after processing shields.
  return updatedValue;
};

/**
 * Applies the shield to the damage value against the target.
 * @param {JABS_State} shieldState The state bearing the shield.
 * @param {Game_Actor|Game_Enemy} target The target of the action.
 * @param {number} value The damage value to be applied.
 * @returns {number} The leftover damage value after applying the shield.
 */
Game_Action.prototype.applyShield = function(shieldState, target, value)
{
  // check if we should bypass shields for this hit (typed or universal).
  if (this.shouldBypassShield(shieldState.shield))
  {
    return value;
  }

  // track the remaining damage for this hit as we consume shields.
  let remaining = value;

  // continue absorbing while there is damage remaining and this state still has a shield pool.
  // this enables rolling overflow into the next stack (same state) within the same hit.
  while (remaining > 0)
  {
    // re-resolve the shield reference in case the state refilled/removed it on a previous break.
    const { shield } = shieldState;

    // if there is no capacity remaining on this pool (defensive), stop.
    const before = shield.getCurrent();
    if (before <= 0)
    {
      break;
    }

    // absorb as much as possible from this pool.
    const absorbed = Math.min(remaining, before);

    // apply the absorption.
    shield.setCurrent(before - absorbed);

    // reduce the remaining incoming damage by what was absorbed.
    remaining -= absorbed;

    // show a shield damage popup for the absorbed amount.
    if (absorbed > 0)
    {
      this.generateShieldDamagePop(target, absorbed);
    }

    // determine whether this shield broke on this partial application.
    const brokeThisHit = (before > 0 && shield.getCurrent() === 0);

    // if the shield broke on this hit, handle the break lifecycle.
    if (brokeThisHit)
    {
      // consume a stack, refill if stacks remain, or remove the state if none remain.
      shieldState.onShieldBreak();

      // show a popup indicating the shield broke.
      this.generateShieldBreakPop(target);

      // if this shield is protected, the remainder of this hit is nullified.
      if (shield.isProtected())
      {
        // stop processing entirely for this hit.
        return 0;
      }

      // if not protected: if stacks remain, the state refilled and we loop to keep absorbing.
      // if no stacks remain, shieldState.shield will be null and the loop will exit.
      continue;
    }

    // if this pool did not break and we still have remainder, the next shield state will handle it.
    // break out of the loop to allow the outer iteration over other states to proceed.
    break;
  }

  // return whatever damage remains after rolling through this state's stacks.
  return remaining;
};

/**
 * Determines whether or not a shield should be bypassed by this action.
 * @param {JABS_Shield} shield The shield to check.
 * @returns {boolean} True if the shield should be bypassed, false otherwise.
 */
Game_Action.prototype.shouldBypassShield = function(shield)
{
  // grab the actionable data.
  const skillOrItem = this.item();

  // you cannot bypass shields without any bypass tag.
  if (skillOrItem.hasShieldBypass === false)
  {
    return false;
  }

  // parameterless form bypasses ALL shields regardless of typing.
  if (skillOrItem.isShieldBypassUniversal === true)
  {
    return true;
  }

  // gather this action's applicable elements.
  // default to the skill/item's own element id.
  let actionElements = [ skillOrItem.damage.elementId ];

  // check if using the elementalistics plugin.
  if (J.ELEM)
  {
    // gather all elements applicable for this action from the subject.
    actionElements = [ ...this.getApplicableElements(this.subject()) ];
  }

  // read the shield's typed elements and the typed bypass elements from the action.
  const shieldElements = shield.getShieldTypes();
  const bypassElements = skillOrItem.shieldBypassElements;

  // typing needs to be present on both sides of the bypass, or it won't bypass.
  if (bypassElements.length === 0 || shieldElements.length === 0)
  {
    return false;
  }

  // we have a typed shield and typed bypass list; verify both intersections include this action's elements.
  const actionEnablesBypass = ArrayHelper.hasAnyIntersection(actionElements, bypassElements);
  if (actionEnablesBypass === false)
  {
    return false;
  }

  // ensure the shield's types are actually relevant to this action's elements.
  const shieldMatchesAction = ArrayHelper.hasAnyIntersection(actionElements, shieldElements);
  if (shieldMatchesAction === false)
  {
    return false;
  }

  // both conditions satisfied: bypass this shield for this hit.
  return true;
};

/**
 * Generates a damage pop showing how much damage was mitigated by shields.
 * @param {Game_Actor|Game_Enemy} target The battler doing the mitigating.
 * @param {number} value The amount of damage mitigated.
 */
Game_Action.prototype.generateShieldDamagePop = function(target, value)
{
  // if we are not using popups, then don't do this.
  if (!J.POPUPS) return;

  // grab the character on the field.
  const character = JABS_AiManager.getBattlerByUuid(target.getUuid())
    .getCharacter();

  // build the popup.
  const textPop = new TextPopBuilder(`  -${Math.round(value)}`)
    .isShieldDamage()
    .build();

  // add the popup to the character.
  character.addTextPop(textPop);
  character.requestTextPop();
};

/**
 * Generates a damage pop indicating a shield broke.
 * @param {Game_Actor|Game_Enemy} target The battler with the shield breaking.
 */
Game_Action.prototype.generateShieldBreakPop = function(target)
{
  // if we are not using popups, then don't do this.
  if (!J.POPUPS) return;

  // grab the character on the field.
  const character = JABS_AiManager.getBattlerByUuid(target.getUuid())
    .getCharacter();

  // build the popup.
  const textPop = new TextPopBuilder(`B R E A K`)
    .isShieldBreak()
    .build();

  // add the popup to the character.
  character.addTextPop(textPop);
  character.requestTextPop();
};
//endregion Game_Action