//region JABS_Engine
import JABS_PopupManager from './JABS_PopupManager.js';

/**
 * Extends {@link #postPrimaryBattleEffects}.<br/>
 * Also shows attack damage and skill-used popups on the affected battlers.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('postPrimaryBattleEffects', JABS_Engine.prototype.postPrimaryBattleEffects);
JABS_Engine.prototype.postPrimaryBattleEffects = function(action, target)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('postPrimaryBattleEffects')
    .call(this, action, target);

  // policy step inside post primary battle effects.
  JABS_PopupManager.showAttackPop(action, target, this);
  JABS_PopupManager.showSkillUsedPop(action);
};

/**
 * Extends {@link #gainExperienceReward}.<br/>
 * Also shows an experience popup on the caster's character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('gainExperienceReward', JABS_Engine.prototype.gainExperienceReward);
JABS_Engine.prototype.gainExperienceReward = function(experience, casterCharacter)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('gainExperienceReward')
    .call(this, experience, casterCharacter);

  // when not experience, take this branch.
  if (!experience) return;

  // policy step inside gain experience reward.
  JABS_PopupManager.showExperiencePop(experience, casterCharacter);
};

/**
 * Extends {@link #gainGoldReward}.<br/>
 * Also shows a gold popup on the character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('gainGoldReward', JABS_Engine.prototype.gainGoldReward);
JABS_Engine.prototype.gainGoldReward = function(gold, character)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('gainGoldReward')
    .call(this, gold, character);

  // when not gold, take this branch.
  if (!gold) return;

  // policy step inside gain gold reward.
  JABS_PopupManager.showGoldPop(gold, character);
};

/**
 * Extends {@link #onItemPickedUp}.<br/>
 * Also shows item-loot popups on the character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('onItemPickedUp', JABS_Engine.prototype.onItemPickedUp);
JABS_Engine.prototype.onItemPickedUp = function(itemDataList, character)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('onItemPickedUp')
    .call(this, itemDataList, character);

  // policy step inside on item picked up.
  JABS_PopupManager.showItemPickedUpPops(itemDataList, character);
};

/**
 * Extends {@link #battlerLevelup}.<br/>
 * Also shows a level-up popup on the battler's character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('battlerLevelup', JABS_Engine.prototype.battlerLevelup);
JABS_Engine.prototype.battlerLevelup = function(uuid)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('battlerLevelup')
    .call(this, uuid);

  // capture battler for downstream policy in this routine.
  const battler = JABS_AiManager.getBattlerByUuid(uuid);
  if (battler)
  {
    JABS_PopupManager.showLevelUpPop(battler.getCharacter());
  }
};

/**
 * Extends {@link #battlerSkillLearn}.<br/>
 * Also shows a skill-learn popup on the battler's character.
 */
J.POPUPS.EXT.ABS.Aliased.JABS_Engine.set('battlerSkillLearn', JABS_Engine.prototype.battlerSkillLearn);
JABS_Engine.prototype.battlerSkillLearn = function(skill, uuid)
{
  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_Engine.get('battlerSkillLearn')
    .call(this, skill, uuid);

  // capture battler for downstream policy in this routine.
  const battler = JABS_AiManager.getBattlerByUuid(uuid);
  if (battler)
  {
    JABS_PopupManager.showSkillLearnPop(skill, battler.getCharacter());
  }
};
//endregion JABS_Engine