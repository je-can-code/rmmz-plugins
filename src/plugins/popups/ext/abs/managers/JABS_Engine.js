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

  if (!experience) return;

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

  if (!gold) return;

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

  const battler = JABS_AiManager.getBattlerByUuid(uuid);
  if (battler)
  {
    JABS_PopupManager.showSkillLearnPop(skill, battler.getCharacter());
  }
};
//endregion JABS_Engine