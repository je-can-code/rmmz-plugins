//region Game_Action
/**
 * Extends {@link #onFormulaResourceDelta}.<br/>
 * Also shows a resource-delta popup on the recipient's JABS character.
 */
J.POPUPS.EXT.ABS.Aliased.Game_Action.set('onFormulaResourceDelta', Game_Action.prototype.onFormulaResourceDelta);
Game_Action.prototype.onFormulaResourceDelta = function(recipient, amount, resource)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onFormulaResourceDelta')
    .call(this, recipient, amount, resource);

  // capture jabs for downstream policy in this routine.
  const jabs = JABS_AiManager.getBattlerByUuid(recipient.getUuid());
  if (!jabs) return;

  // capture signed for downstream policy in this routine.
  const signed = Math.round(amount);
  const magnitude = Math.abs(signed);
  if (magnitude === 0) return;

  // capture popup value for downstream policy in this routine.
  const popupValue = signed < 0
    ? -magnitude
    : magnitude;
  const textPopBuilder = new TextPopBuilder(popupValue);

  // dispatch on the discriminant for the next policy branch.
  switch (resource)
  {
    case FormulaEffect.Resource.HP:
      textPopBuilder.isHpDamage();
      break;
    case FormulaEffect.Resource.MP:
      textPopBuilder.isMpDamage();
      break;
    case FormulaEffect.Resource.TP:
      textPopBuilder.isTpDamage();
      break;
  }

  // when signed < 0, take this branch.
  if (signed < 0)
  {
    textPopBuilder.forIncomingHealRing();
  }
  else
  {
    textPopBuilder.forEnemyDamageRing();
  }

  // policy step inside on formula resource delta.
  TextPopManager.show(textPopBuilder.build(), jabs.getCharacter());
};

/**
 * Extends {@link #onShieldDamageAbsorbed}.<br/>
 * Also shows a shield-damage popup on the target's JABS character.
 */
J.POPUPS.EXT.ABS.Aliased.Game_Action.set('onShieldDamageAbsorbed', Game_Action.prototype.onShieldDamageAbsorbed);
Game_Action.prototype.onShieldDamageAbsorbed = function(target, value)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onShieldDamageAbsorbed')
    .call(this, target, value);

  // capture jabs battler for downstream policy in this routine.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(target.getUuid());
  if (!jabsBattler) return;

  // construct pop for the next step in this routine.
  const pop = new TextPopBuilder(`  -${Math.round(value)}`)
    .isShieldDamage()
    .build();

  // policy step inside on shield damage absorbed.
  TextPopManager.show(pop, jabsBattler.getCharacter());
};

/**
 * Extends {@link #onShieldBroken}.<br/>
 * Also shows a shield-break popup on the target's JABS character.
 */
J.POPUPS.EXT.ABS.Aliased.Game_Action.set('onShieldBroken', Game_Action.prototype.onShieldBroken);
Game_Action.prototype.onShieldBroken = function(target)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.Game_Action.get('onShieldBroken')
    .call(this, target);

  // capture jabs battler for downstream policy in this routine.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(target.getUuid());
  if (!jabsBattler) return;

  // construct pop for the next step in this routine.
  const pop = new TextPopBuilder(`B R E A K`)
    .isShieldBreak()
    .build();

  // policy step inside on shield broken.
  TextPopManager.show(pop, jabsBattler.getCharacter());
};
//endregion Game_Action