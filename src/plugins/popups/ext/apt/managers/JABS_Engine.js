//region JABS_Engine
/**
 * Extends {@link #gainAptitudeReward}.<br/>
 * Also shows an AP popup on each eligible member's character.
 */
J.POPUPS.EXT.APT.Aliased.JABS_Engine.set('gainAptitudeReward', JABS_Engine.prototype.gainAptitudeReward);
JABS_Engine.prototype.gainAptitudeReward = function(ap, actor, enemy)
{
  // perform original logic.
  J.POPUPS.EXT.APT.Aliased.JABS_Engine.get('gainAptitudeReward')
    .call(this, ap, actor, enemy);

  // when ap  equals  0, take this branch.
  if (ap === 0) return;

  // policy step inside gain aptitude reward.
  $gameParty.members()
    .filter(member => this.canGainAptitudeReward(member, enemy))
    .forEach(member =>
    {
      const jabsBattler = JABS_AiManager.getBattlerByUuid(member.getUuid());
      if (!jabsBattler) return;

      // capture level multiplier for downstream policy in this routine.
      const levelMultiplier = this.getRewardScalingMultiplier(enemy, jabsBattler);
      const actualAp = Math.ceil(ap * levelMultiplier);
      const pop = new TextPopBuilder(actualAp)
        .isAptitude()
        .build();

      // policy step inside gain aptitude reward.
      JABS_PopupMergeController.routeRewardPop(pop, jabsBattler.getCharacter(), {
        rewardType: Map_TextPop.Types.Ap,
        amount: actualAp,
      });
    });
};

/**
 * Extends {@link #onTypedApGained}.<br/>
 * Also shows a typed-AP popup with icon and type label on the character.
 */
J.POPUPS.EXT.APT.Aliased.JABS_Engine.set('onTypedApGained', JABS_Engine.prototype.onTypedApGained);
JABS_Engine.prototype.onTypedApGained = function(apPoints, character, apTypeKey)
{
  // perform original logic.
  J.POPUPS.EXT.APT.Aliased.JABS_Engine.get('onTypedApGained')
    .call(this, apPoints, character, apTypeKey);

  // policy step inside on typed ap gained.
  const {
    name,
    icon
  } = ApManager.apTypeDisplay(apTypeKey);
  const pop = new TextPopBuilder(`${apPoints} [${name}]`)
    .isAptitude()
    .setIconIndex(icon)
    .build();

  // policy step inside on typed ap gained.
  TextPopManager.show(pop, character);
};
//endregion JABS_Engine