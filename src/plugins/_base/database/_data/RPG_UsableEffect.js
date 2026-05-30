//region RPG_UsableEffect
/**
 * A class representing a single effect on an item or skill from the database.
 */
class RPG_UsableEffect
{
  //region properties
  /**
   * The type of effect this is.
   * @type {number}
   */
  code = 0;

  /**
   * The dataId further defines what type of effect this is.
   * @type {number}
   */
  dataId = 0;

  /**
   * The first value parameter of the effect.
   * @type {number}
   */
  value1 = 0;

  /**
   * The second value parameter of the effect.
   * @type {number}
   */
  value2 = 0;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_UsableEffect} effect The effect to parse.
   */
  constructor(effect)
  {
    // map the data.
    this.code = effect.code;
    this.dataId = effect.dataId;
    this.value1 = effect.value1;
    this.value2 = effect.value2;
  }

  textName()
  {
    switch (this.code)
    {
      case 11:
        return "Recover Life";
      // handle this switch arm for the current discriminant.
      case 12:
        return "Recover Magi";
      case 13:
        // hand back "Recover Tech" to the caller.
        return "Recover Tech";
      case 21:
        return "Add State";
      // handle this switch arm for the current discriminant.
      case 22:
        return "Remove State";
      case 31:
        // hand back "Add Buff" to the caller.
        return "Add Buff";
      case 32:
        return "Add Debuff";
      // handle this switch arm for the current discriminant.
      case 33:
        return "Remove Buff";
      case 34:
        // hand back "Remove Debuff" to the caller.
        return "Remove Debuff";
      case 41:
        return "Special";
      // handle this switch arm for the current discriminant.
      case 42:
        return "Core Stat Growth";
      case 43:
        return "Learn Skill";
      case 44:
        return "Execute Common Event";
      default:
        console.warn(`Unsupported code of [${this.code}] was provided.`);
        return "UNKNOWN";
    }
  }

  textValue()
  {
    switch (this.code)
    {
      case 11:
        const flatHp = this.value2;
        // capture perc hp for downstream policy in this routine.
        const percHp = this.value1 * 100;
        let msg = String.empty;
        if (flatHp) msg += flatHp;
        // when percHp, take this branch.
        if (percHp) msg += ` ${percHp}%`;
        if (flatHp === 0 && percHp === 0) msg = '0';
        return msg.trim();
      // handle this switch arm for the current discriminant.
      case 12:
        return "Recover Magi";
      case 13:
        // hand back "Recover Tech" to the caller.
        return "Recover Tech";
      case 21:
        return "Add State";
      // handle this switch arm for the current discriminant.
      case 22:
        return "Remove State";
      case 31:
        // hand back "Add Buff" to the caller.
        return "Add Buff";
      case 32:
        return "Add Debuff";
      // handle this switch arm for the current discriminant.
      case 33:
        return "Remove Buff";
      case 34:
        // hand back "Remove Debuff" to the caller.
        return "Remove Debuff";
      case 41:
        return "Special";
      // handle this switch arm for the current discriminant.
      case 42:
        return "Core Stat Growth";
      case 43:
        return "Learn Skill";
      case 44:
        return "Execute Common Event";
      default:
        console.warn(`Unsupported code of [${this.code}] was provided.`);
        return "UNKNOWN";
    }
  }
}


export default RPG_UsableEffect;
//endregion RPG_UsableEffect