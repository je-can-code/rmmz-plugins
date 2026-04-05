//region Game_Battler
/**
 * Extends {@link #paySkillHpCost}.<br/>
 * Also generates a pop for the damage dealt.
 */
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.set('paySkillHpCost', Game_Battler.prototype.paySkillHpCost);
Game_Battler.prototype.paySkillHpCost = function(amount)
{
  // perform original logic.
  J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('paySkillHpCost')
    .call(this, amount);

  // don't pop 0 costs.
  if (amount === 0) return;

  // do nothing if we're not using JABS.
  if (!J.ABS) return;

  // validate we have a battler.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());
  if (!jabsBattler) return;

  // validate we have a character to display the popup on.
  const character = jabsBattler.getCharacter();
  if (!character) return;

  // build the popup.
  const pop = new TextPopBuilder(amount)
    .isHpDamage()
    .forEnemyDamageRing()
    .build();

  // show the damage popup.
  TextPopManager.show(pop, character);
};

/**
 * Extends {@link #gainHpFromResource}.<br/>
 * Also generates a pop for the healing received.
 */
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.set('gainHpFromResource', Game_Battler.prototype.gainHpFromResource);
Game_Battler.prototype.gainHpFromResource = function(amount)
{
  // perform original logic.
  J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('gainHpFromResource')
    .call(this, amount);

  // don't pop 0 gains.
  if (amount === 0) return;

  // do nothing if we're not using JABS.
  if (!J.ABS) return;

  // validate we have a battler.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());
  if (!jabsBattler) return;

  // validate we have a character to display the popup on.
  const character = jabsBattler.getCharacter();
  if (!character) return;

  // build the popup.
  const pop = new TextPopBuilder(-amount)
    .isHpDamage()
    .forIncomingHealRing()
    .build();

  // show the damage popup.
  TextPopManager.show(pop, character);
};

/**
 * Extends {@link #gainMpFromResource}.<br/>
 * Also generates a pop for the healing received.
 */
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.set('gainMpFromResource', Game_Battler.prototype.gainMpFromResource);
Game_Battler.prototype.gainMpFromResource = function(amount)
{
  // perform original logic.
  J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('gainMpFromResource')
    .call(this, amount);

  // don't pop 0 gains.
  if (amount === 0) return;

  // do nothing if we're not using JABS.
  if (!J.ABS) return;

  // validate we have a battler.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());
  if (!jabsBattler) return;

  // validate we have a character to display the popup on.
  const character = jabsBattler.getCharacter();
  if (!character) return;

  // build the popup.
  const pop = new TextPopBuilder(-amount)
    .isMpDamage()
    .forIncomingHealRing()
    .build();

  // show the damage popup.
  TextPopManager.show(pop, character);
};

/**
 * Extends {@link #gainTpFromResource}.<br/>
 * Also generates a pop for the healing received.
 */
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.set('gainTpFromResource', Game_Battler.prototype.gainTpFromResource);
Game_Battler.prototype.gainTpFromResource = function(amount)
{
  // perform original logic.
  J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler.get('gainTpFromResource')
    .call(this, amount);

  // don't pop 0 gains.
  if (amount === 0) return;

  // validate we have a battler.
  const jabsBattler = JABS_AiManager.getBattlerByUuid(this.getUuid());
  if (!jabsBattler) return;

  // validate we have a character to display the popup on.
  const character = jabsBattler.getCharacter();
  if (!character) return;

  // build the popup.
  const pop = new TextPopBuilder(-amount)
    .isTpDamage()
    .forIncomingHealRing()
    .build();

  // show the damage popup.
  TextPopManager.show(pop, character);
};
//endregion Game_Battler