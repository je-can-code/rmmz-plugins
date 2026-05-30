//region JABS_PopupManager
import JABS_PopupMergeController from './JABS_PopupMergeController.js';

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
    const pop = this.buildDamagePop(action, target, engine);
    const caster = action.getCaster();
    // capture attacker uuid for downstream policy in this routine.
    const attackerUuid = caster.getUuid();
    const targetUuid = character.getJabsBattlerUuid();
    const actionResult = target.getBattler()
      .result();

    // when actionResult.parried, take this branch.
    if (actionResult.parried)
    {
      JABS_PopupMergeController.routeMitigationPop(pop, character, {
        mitigationType: Map_TextPop.Types.Parry,
        labelPrefix: 'PARRY',
      });

      // exit early without a payload.
      return;
    }

    // when actionResult.evaded, take this branch.
    if (actionResult.evaded)
    {
      JABS_PopupMergeController.routeMitigationPop(pop, character, {
        mitigationType: Map_TextPop.Types.Evade,
        labelPrefix: 'DODGE',
      });

      // exit early without a payload.
      return;
    }

    // policy step inside show attack pop.
    let amount;

    // when actionResult.hpDamage  differs from  0, take this branch.
    if (actionResult.hpDamage !== 0)
    {
      amount = actionResult.hpDamage;
    }
    else if (actionResult.mpDamage !== 0)
    {
      amount = actionResult.mpDamage;
    }
    else if (actionResult.tpDamage !== 0)
    {
      amount = actionResult.tpDamage;
    }
    else
    {
      amount = actionResult.hpDamage;
    }

    // policy step inside show attack pop.
    JABS_PopupMergeController.routeStrikePop(pop, character, {
      attackerUuid,
      targetUuid,
      amount,
    });
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
    // capture target battler for downstream policy in this routine.
    const targetBattler = target.getBattler();
    const actionResult = targetBattler.result();

    // policy step inside build damage pop.
    let elementalRate;
    if (J.ELEM)
    {
      elementalRate = gameAction.calculateRawElementRate(targetBattler);
    }
    // otherwise fall back to the alternate path.
    else
    {
      elementalRate = gameAction.calcElementRate(targetBattler);
    }

    // capture elemental icon for downstream policy in this routine.
    const elementalIcon = engine.determineElementalIcon(skill, caster);
    const iconIndex = actionResult.parried
      ? 128
      // policy step inside build damage pop.
      : elementalIcon;

    // construct text pop builder for the next step in this routine.
    const textPopBuilder = new TextPopBuilder(0);

    // dispatch on the discriminant for the next policy branch.
    switch (true)
    {
      case actionResult.parried:
        textPopBuilder
          // policy step inside build damage pop.
          .setValue(`PARRY!`)
          .setPopupType(Map_TextPop.Types.Parry)
          .forCenterFocusRing()
          // policy step inside build damage pop.
          .setTextAccent(`parry`);
        break;
      case actionResult.evaded:
        // policy step inside build damage pop.
        textPopBuilder
          .setValue(`DODGE`)
          .setPopupType(Map_TextPop.Types.Evade)
          // policy step inside build damage pop.
          .forCenterFocusRing()
          .setTextAccent(`evade`);
        break;
      // handle this switch arm for the current discriminant.
      case actionResult.hpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          // policy step inside build damage pop.
          .isHpDamage();
        if (actionResult.hpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        // otherwise fall back to the alternate path.
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        // glancing blows render italic in grey to distinguish them from clean hits.
        if (actionResult.glancing)
        {
          textPopBuilder.setTextAccent(`glance`).setTextColorIndex(7);
        }
        break;
      // handle this switch arm for the current discriminant.
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

    // hand back text pop builder to the caller.
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
    if (J.POPUPS.EXT.ABS.Metadata.disableSkillUsedPopups === true)
    {
      return;
    }

    // capture caster for downstream policy in this routine.
    const caster = action.getCaster();
    if (caster.isInanimate())
    {
      return;
    }

    // capture skill for downstream policy in this routine.
    const skill = action.getBaseSkill();
    const character = caster.getCharacter();
    const pop = new TextPopBuilder(skill.name)
      .isSkillUsed(skill.iconIndex)
      .build();

    // policy step inside show skill used pop.
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

    // policy step inside show experience pop.
    JABS_PopupMergeController.routeRewardPop(pop, character, {
      rewardType: Map_TextPop.Types.Experience,
      amount: Math.round(experience),
    });
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

    // policy step inside show gold pop.
    JABS_PopupMergeController.routeRewardPop(pop, character, {
      rewardType: Map_TextPop.Types.Gold,
      amount: Math.round(gold),
    });
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

    // policy step inside show item picked up pops.
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

    // policy step inside show level up pop.
    J.POPUPS.notifyMergeFlushAll('level-up');
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

    // policy step inside show skill learn pop.
    J.POPUPS.notifyMergeFlushAll('skill-learn');
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

    // capture elemental icon for downstream policy in this routine.
    const elementalIcon = $jabsEngine.determineElementalIcon(itemData, caster);
    const iconIndex = actionResult.parried
      ? 128
      // policy step inside show item applied pop.
      : elementalIcon;

    // construct text pop builder for the next step in this routine.
    const textPopBuilder = new TextPopBuilder(0);

    // dispatch on the discriminant for the next policy branch.
    switch (true)
    {
      case actionResult.parried:
        textPopBuilder
          // policy step inside show item applied pop.
          .setValue(`PARRY!`)
          .setPopupType(Map_TextPop.Types.Parry)
          .forCenterFocusRing()
          // policy step inside show item applied pop.
          .setTextAccent(`parry`);
        break;
      case actionResult.evaded:
        // policy step inside show item applied pop.
        textPopBuilder
          .setValue(`DODGE`)
          .setPopupType(Map_TextPop.Types.Evade)
          // policy step inside show item applied pop.
          .forCenterFocusRing()
          .setTextAccent(`evade`);
        break;
      // handle this switch arm for the current discriminant.
      case actionResult.hpDamage !== 0:
        textPopBuilder
          .setValue(actionResult.hpDamage)
          // policy step inside show item applied pop.
          .isHpDamage();
        if (actionResult.hpDamage < 0)
        {
          textPopBuilder.forIncomingHealRing();
        }
        // otherwise fall back to the alternate path.
        else
        {
          textPopBuilder.forEnemyDamageRing();
        }
        // glancing blows render italic in grey to distinguish them from clean hits.
        if (actionResult.glancing)
        {
          textPopBuilder.setTextAccent(`glance`).setTextColorIndex(7);
        }
        break;
      // handle this switch arm for the current discriminant.
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

    // capture pop for downstream policy in this routine.
    const pop = textPopBuilder
      .setIconIndex(iconIndex)
      .setCritical(actionResult.critical)
      .build();

    // capture attacker uuid for downstream policy in this routine.
    const attackerUuid = caster.getUuid();
    const targetUuid = target.getCharacter()
      .getJabsBattlerUuid();

    // when actionResult.parried, take this branch.
    if (actionResult.parried)
    {
      JABS_PopupMergeController.routeMitigationPop(pop, character, {
        mitigationType: Map_TextPop.Types.Parry,
        labelPrefix: 'PARRY',
      });

      // exit early without a payload.
      return;
    }

    // when actionResult.evaded, take this branch.
    if (actionResult.evaded)
    {
      JABS_PopupMergeController.routeMitigationPop(pop, character, {
        mitigationType: Map_TextPop.Types.Evade,
        labelPrefix: 'DODGE',
      });

      // exit early without a payload.
      return;
    }

    // policy step inside show item applied pop.
    let amount;

    // when actionResult.hpDamage  differs from  0, take this branch.
    if (actionResult.hpDamage !== 0)
    {
      amount = actionResult.hpDamage;
    }
    else if (actionResult.mpDamage !== 0)
    {
      amount = actionResult.mpDamage;
    }
    else if (actionResult.tpDamage !== 0)
    {
      amount = actionResult.tpDamage;
    }
    else
    {
      amount = actionResult.hpDamage;
    }

    // policy step inside show item applied pop.
    JABS_PopupMergeController.routeStrikePop(pop, character, {
      attackerUuid,
      targetUuid,
      amount,
    });
  }

  /**
   * Dispatches a slip or regen popup on the battler's character.
   * @param {number} displayAmount The signed amount (negative = regen).
   * @param {0|1|2} type HP / MP / TP resource index.
   * @param {JABS_Battler} battler The battler showing the pop.
   * @param {number} [stateId] Contributing state id when slip comes from {@link JABS_Battler#processStateRegens}.
   */
  static showSlipPop(displayAmount, type, battler, stateId)
  {
    const character = battler.getCharacter();
    const textPopBuilder = new TextPopBuilder(displayAmount);

    // dispatch on the discriminant for the next policy branch.
    switch (type)
    {
      case 0:
        textPopBuilder.isHpDamage();
        // policy step inside show slip pop.
        break;
      case 1:
        textPopBuilder.isMpDamage();
        break;
      case 2:
        textPopBuilder.isTpDamage();
        break;
    }

    // when displayAmount < 0, take this branch.
    if (displayAmount < 0)
    {
      textPopBuilder.forRegenRing();
    }
    else
    {
      textPopBuilder.forSlipDamageRing();
    }

    // capture pop for downstream policy in this routine.
    const pop = textPopBuilder.build();

    // policy step inside show slip pop.
    JABS_PopupMergeController.routeSlipPop(pop, character, {
      type,
      stateId,
      amount: displayAmount,
    });
  }
}

export default JABS_PopupManager;
//endregion JABS_PopupManager