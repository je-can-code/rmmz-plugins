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
   * @param {rm.types.Effect} effect The effect to parse.
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
      case 11: return "Recover Life";
      case 12: return "Recover Magi";
      case 13: return "Recover Tech";
      case 21: return "Add State";
      case 22: return "Remove State";
      case 31: return "Add Buff";
      case 32: return "Add Debuff";
      case 33: return "Remove Buff";
      case 34: return "Remove Debuff";
      case 41: return "Special";
      case 42: return "Core Stat Growth";
      case 43: return "Learn Skill";
      case 44: return "Execute Common Event";
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
        const percHp = this.value1 * 100;
        let msg = '';
        if (flatHp) msg += flatHp;
        if (percHp) msg += ` ${percHp}%`;
        if (flatHp === 0 && percHp === 0) msg = '0';
        return msg.trim();
      case 12: return "Recover Magi";
      case 13: return "Recover Tech";
      case 21: return "Add State";
      case 22: return "Remove State";
      case 31: return "Add Buff";
      case 32: return "Add Debuff";
      case 33: return "Remove Buff";
      case 34: return "Remove Debuff";
      case 41: return "Special";
      case 42: return "Core Stat Growth";
      case 43: return "Learn Skill";
      case 44: return "Execute Common Event";
      default:
        console.warn(`Unsupported code of [${this.code}] was provided.`);
        return "UNKNOWN";
    }
  }
}
//endregion RPG_UsableEffect