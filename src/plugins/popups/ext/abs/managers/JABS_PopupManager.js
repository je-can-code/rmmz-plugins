//region JABS_PopupManager
/**
 * A static utility for building and dispatching JABS-related map popups.
 * All methods delegate final dispatch to {@link TextPopManager}.
 */
class JABS_PopupManager
{
  /**
   * Builds and dispatches a combat-result popup on the target's character.
   * @param {JABS_Action} action The action affecting the target.
   * @param {JABS_Battler} target The target battler.
   * @param {JABS_Engine} engine The live engine instance (for elemental icon resolution).
   */
  static showAttackPop(action, target, engine)
  {
    const character = target.getCharacter();
    const pop = JABS_PopupManager.buildDamagePop(action, target, engine);
    TextPopManager.show(pop, character);
  }

  /**
   * Builds the combat-result {@link Map_TextPop} for an action on a target.
   * @param {JABS_Action} action The action affecting the target.
   * @param {JABS_Battler} target The target battler.
   * @param {JABS_Engine} engine The live engine instance.
   * @returns {Map_TextPop}
   */
  static buildDamagePop(action, target, engine)
  {
    const skill = action.getBaseSkill();
    const caster = action.getCaster();
    const gameAction = action.getAction();
    const targetBattler = target.getBattler();
    const actionResult = targetBattler.result();

    let elementalRate;
    if (J.ELEM)
    {
      elementalRate = gameAction.calculateRawElementRate(targetBattler);
    }
    else
    {
      elementalRate = gameAction.calcElementRate(targetBattler);
    }

    const elementalIcon = engine.determineElementalIcon(skill, caster);
    const iconIndex = actionResult.parried
      ? 128
      : elementalIcon;

    const textPopBuilder = new TextPopBuilder(0);

    switch (true)
    {
      case actionResult.parried:
        textPopBuilder
          .setValue(`PARRY!`)
          .setPopupType(Map_TextPop.Types.Parry)
          .forCenterFocusRing()
          .setTextAccent(`parry`);
        break;
      case actionResult.evaded:
        textPopBuilder
          .setValue(`DODGE`)
          .setPopupType(Map_TextPop.Types.Evade)
          .forCenterFocusRing()
          .setTextAccent(`evade`);
        break;
      case actionResult.hpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          .isHpDamage();
        if (actionResult.hpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      case actionResult.mpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.mpDamage)
          .isMpDamage();
        if (actionResult.mpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      case actionResult.tpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.tpDamage)
          .isTpDamage();
        if (actionResult.tpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      default:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          .isHpDamage()
          .forEnemyDamageRing();
        break;
    }

    return textPopBuilder
      .setIconIndex(iconIndex)
      .isElemental(elementalRate)
      .setCritical(actionResult.critical)
      .build();
  }

  /**
   * Dispatches a skill-used popup on the caster's character.
   * @param {JABS_Action} action The action whose caster should show the popup.
   */
  static showSkillUsedPop(action)
  {
    if (J.POPUPS.EXT.ABS.DisableSkillUsedPopups === true)
    {
      return;
    }

    const caster = action.getCaster();
    if (caster.isInanimate())
    {
      return;
    }

    const skill = action.getBaseSkill();
    const character = caster.getCharacter();
    const pop = new TextPopBuilder(skill.name)
      .isSkillUsed(skill.iconIndex)
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches an experience popup on the given character.
   * @param {number} experience The experience amount.
   * @param {Game_Character} character The character who earned the experience.
   */
  static showExperiencePop(experience, character)
  {
    const pop = new TextPopBuilder(Math.round(experience))
      .isExperience()
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches a gold popup on the given character.
   * @param {number} gold The gold amount.
   * @param {Game_Character} character The character who earned the gold.
   */
  static showGoldPop(gold, character)
  {
    const pop = new TextPopBuilder(Math.round(gold))
      .isGold()
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches a loot popup for each item in the list on the given character.
   * @param {RPG_BaseItem[]} itemDataList All items picked up.
   * @param {Game_Character} character The character who picked them up.
   */
  static showItemPickedUpPops(itemDataList, character)
  {
    const pops = itemDataList.map(itemData =>
      new TextPopBuilder(itemData.name)
        .isLoot()
        .setIconIndex(itemData.iconIndex)
        .build()
    );

    TextPopManager.showBatch(pops, character);
  }

  /**
   * Dispatches a level-up popup on the given character.
   * @param {Game_Character} character The character who leveled up.
   */
  static showLevelUpPop(character)
  {
    const pop = new TextPopBuilder(`LEVEL UP`)
      .isLevelUp()
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches a skill-learned popup on the given character.
   * @param {RPG_Skill} skill The skill that was learned.
   * @param {Game_Character} character The character who learned it.
   */
  static showSkillLearnPop(skill, character)
  {
    const pop = new TextPopBuilder(skill.name)
      .isSkillLearned(skill.iconIndex)
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches a tool-use result popup on the caster's character.
   * @param {Game_Action} gameAction The action describing the tool effect.
   * @param {RPG_Item} itemData The item database entry.
   * @param {JABS_Battler} caster The battler who used the item.
   * @param {JABS_Battler} target The battler receiving the effect.
   */
  static showItemAppliedPop(gameAction, itemData, caster, target)
  {
    const character = caster.getCharacter();
    const targetBattler = target.getBattler();
    const actionResult = targetBattler.result();

    const elementalIcon = $jabsEngine.determineElementalIcon(itemData, caster);
    const iconIndex = actionResult.parried
      ? 128
      : elementalIcon;

    const textPopBuilder = new TextPopBuilder(0);

    switch (true)
    {
      case actionResult.parried:
        textPopBuilder
          .setValue(`PARRY!`)
          .setPopupType(Map_TextPop.Types.Parry)
          .forCenterFocusRing()
          .setTextAccent(`parry`);
        break;
      case actionResult.evaded:
        textPopBuilder
          .setValue(`DODGE`)
          .setPopupType(Map_TextPop.Types.Evade)
          .forCenterFocusRing()
          .setTextAccent(`evade`);
        break;
      case actionResult.hpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          .isHpDamage();
        if (actionResult.hpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      case actionResult.mpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.mpDamage)
          .isMpDamage();
        if (actionResult.mpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      case actionResult.tpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.tpDamage)
          .isTpDamage();
        if (actionResult.tpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        break;
      default:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          .isHpDamage()
          .forEnemyDamageRing();
        break;
    }

    const pop = textPopBuilder
      .setIconIndex(iconIndex)
      .setCritical(actionResult.critical)
      .build();

    TextPopManager.show(pop, character);
  }

  /**
   * Dispatches a slip or regen popup on the battler's character.
   * @param {number} displayAmount The signed amount (negative = regen).
   * @param {0|1|2} type HP / MP / TP resource index.
   * @param {JABS_Battler} battler The battler showing the pop.
   */
  static showSlipPop(displayAmount, type, battler)
  {
    const character = battler.getCharacter();
    const textPopBuilder = new TextPopBuilder(displayAmount);

    switch (type)
    {
      case 0:
        textPopBuilder.isHpDamage();
        break;
      case 1:
        textPopBuilder.isMpDamage();
        break;
      case 2:
        textPopBuilder.isTpDamage();
        break;
    }

    if (displayAmount < 0)
    {
      textPopBuilder.forRegenRing();
    }
    else
    {
      textPopBuilder.forSlipDamageRing();
    }

    TextPopManager.show(textPopBuilder.build(), character);
  }
}

//endregion JABS_PopupManager