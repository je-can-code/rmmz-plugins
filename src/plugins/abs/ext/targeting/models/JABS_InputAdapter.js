//region JABS_InputAdapter (targeting interception)
import JABS_TargetingManager from './../managers/JABS_TargetingManager.js';

/**
 * Extends {@link JABS_InputAdapter.performMainhandAction}.<br/>
 * Diverts `<targeted>` skills into a targeting session instead of committing immediately.
 * Replicates the same non-`getAttackData` gates the original privately enforces, since those
 * private checks can't be called directly from here.
 */
J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.set('performMainhandAction', JABS_InputAdapter.performMainhandAction);
JABS_InputAdapter.performMainhandAction = function(jabsBattler)
{
  // if any of the same gates the original enforces fail, fall through to original logic,
  // which will independently re-check and no-op as appropriate.
  if ($gameMap.hasInteractableEventInFront(jabsBattler)
    || !jabsBattler.canBattlerUseAttacks()
    || !jabsBattler.isSkillTypeCooldownReady(JABS_Button.Mainhand)
    || jabsBattler.isCastingOrChanneling())
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction')
      .call(this, jabsBattler);
    return;
  }

  // peek at what this slot would fire; only a valid, targeted attempt is ours to intercept.
  const actions = JABS_TargetingManager.peekTargetedActions(jabsBattler, JABS_Button.Mainhand);
  if (actions.length === 0)
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performMainhandAction')
      .call(this, jabsBattler);
    return;
  }

  // targeted: divert into a targeting session instead of committing immediately.
  // the commit tail below mirrors what the original method does after `getAttackData`.
  JABS_TargetingManager.beginTargeting(jabsBattler, actions, committedActions =>
  {
    committedActions.forEach(action => action.setCooldownType(JABS_Button.Mainhand));
    jabsBattler.setDecidedAction(committedActions);
    jabsBattler.setCastCountdown(committedActions[0].getCastTime());
    jabsBattler.resetComboData(JABS_Button.Mainhand);
  });
};

/**
 * Extends {@link JABS_InputAdapter.performOffhandAction}.<br/>
 * Diverts `<targeted>` skills into a targeting session instead of committing immediately.
 */
J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.set('performOffhandAction', JABS_InputAdapter.performOffhandAction);
JABS_InputAdapter.performOffhandAction = function(jabsBattler)
{
  // if any of the same gates the original enforces fail, fall through to original logic.
  if ($gameMap.hasInteractableEventInFront(jabsBattler)
    || !jabsBattler.canBattlerUseAttacks()
    || !jabsBattler.isSkillTypeCooldownReady(JABS_Button.Offhand)
    || jabsBattler.isCastingOrChanneling())
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction')
      .call(this, jabsBattler);
    return;
  }

  // peek at what this slot would fire; only a valid, targeted attempt is ours to intercept.
  const actions = JABS_TargetingManager.peekTargetedActions(jabsBattler, JABS_Button.Offhand);
  if (actions.length === 0)
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performOffhandAction')
      .call(this, jabsBattler);
    return;
  }

  // targeted: divert into a targeting session instead of committing immediately.
  JABS_TargetingManager.beginTargeting(jabsBattler, actions, committedActions =>
  {
    committedActions.forEach(action => action.setCooldownType(JABS_Button.Offhand));
    jabsBattler.setDecidedAction(committedActions);
    jabsBattler.setCastCountdown(committedActions[0].getCastTime());
    jabsBattler.resetComboData(JABS_Button.Offhand);
  });
};

/**
 * Extends {@link JABS_InputAdapter.performCombatAction}.<br/>
 * Diverts `<targeted>` skills into a targeting session instead of committing immediately.
 */
J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.set('performCombatAction', JABS_InputAdapter.performCombatAction);
JABS_InputAdapter.performCombatAction = function(slot, jabsBattler)
{
  // if any of the same gates the original enforces fail, fall through to original logic.
  if (!jabsBattler.canBattlerUseSkills()
    || jabsBattler.getBattler().getSkillSlot(slot).isEmpty()
    || !jabsBattler.isSkillTypeCooldownReady(slot)
    || jabsBattler.isCastingOrChanneling())
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction')
      .call(this, slot, jabsBattler);
    return;
  }

  // peek at what this slot would fire; only a valid, targeted attempt is ours to intercept.
  const actions = JABS_TargetingManager.peekTargetedActions(jabsBattler, slot);
  if (actions.length === 0)
  {
    // perform original logic.
    J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter.get('performCombatAction')
      .call(this, slot, jabsBattler);
    return;
  }

  // targeted: divert into a targeting session instead of committing immediately.
  JABS_TargetingManager.beginTargeting(jabsBattler, actions, committedActions =>
  {
    jabsBattler.setDecidedAction(committedActions);
    jabsBattler.setCastCountdown(committedActions[0].getCastTime());
  });
};
//endregion JABS_InputAdapter (targeting interception)
