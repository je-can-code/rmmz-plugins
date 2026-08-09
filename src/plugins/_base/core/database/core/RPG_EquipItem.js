import RPGManager from '../../managers/RPGManager.js';
import RPG_Traited from '../base/RPG_Traited.js';

//region RPG_EquipItem
/**
 * A base class representing containing common properties found in both
 * weapons and armors.
 */
class RPG_EquipItem
  extends RPG_Traited
{
  //region properties
  /**
   * The type of equip this is.
   * This number is the index that maps to your equip types.
   * @type {number}
   */
  etypeId = 1;

  /**
   * The core parameters that all battlers have:
   * MHP, MMP, ATK, DEF, MAT, MDF, SPD, LUK,
   * in that order.
   * @type {[number, number, number, number, number, number, number, number]}
   */
  params = [ 1, 0, 0, 0, 0, 0, 0, 0 ];

  /**
   * The price of this equip.
   * @type {number}
   */
  price = 0;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_EquipItem} equip The equip to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(equip, index)
  {
    // supply the base class params.
    super(equip, index);

    // map the data.
    this.etypeId = equip.etypeId;
    this.params = equip.params;
    this.price = equip.price;
  }

  /**
   * Determines whether or not this equip is a weapon.
   * @returns {boolean}
   */
  isWeapon()
  {
    return this.etypeId === 1;
  }

  /**
   * Determines whether or not this equip is an armor.
   * Armor is defined as an equip type that is greater than 1.
   * @returns {boolean}
   */
  isArmor()
  {
    return this.etypeId > 1;
  }

  /**
   * Whether or not this database entry is an equip item.
   * @returns {boolean}
   */
  isEquipItem()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:equip`;
  }

  //region this-parameter bases
  /**
   * How much of a base parameter this equip is worth of its own.
   *
   * **Both sources are summed.** The editor's `params` array and a `<this{PARAM}:N>` tag are two ways of
   * saying the same thing, and an equip may end up carrying both - a refinement merge can put a tag onto a
   * row that already had a number in the field. Neither wins; they add.
   * @param {number} paramId The base parameter id, 0 through 7.
   * @returns {number}
   */
  thisBParam(paramId)
  {
    return this.params.at(paramId) + this.thisBParamBonus(paramId);
  }

  /**
   * The tagged half of a base parameter this equip carries, without its `params` field.
   *
   * Separate from {@link thisBParam} because the two halves are authored in different places, and a reader
   * comparing an equip against what the editor shows needs to be able to see them apart.
   * @param {number} paramId The base parameter id, 0 through 7.
   * @returns {number}
   */
  thisBParamBonus(paramId)
  {
    switch (paramId)
    {
      case 0:
        return this.thisMhp();
      case 1:
        return this.thisMmp();
      case 2:
        return this.thisAtk();
      case 3:
        return this.thisDef();
      case 4:
        return this.thisMat();
      case 5:
        return this.thisMdf();
      case 6:
        return this.thisAgi();
      case 7:
        return this.thisLuk();
      default:
        return 0;
    }
  }

  /**
   * How much of an ex-parameter this equip is worth of its own.
   *
   * No `params` counterpart exists for these - RMMZ models them only as traits - so the tag is the whole
   * of it. That absence is the reason these tags exist at all.
   * @param {number} xparamId The ex-parameter id, 0 through 9.
   * @returns {number}
   */
  thisXParam(xparamId)
  {
    switch (xparamId)
    {
      case 0:
        return this.thisHit();
      case 1:
        return this.thisEva();
      case 2:
        return this.thisCri();
      case 3:
        return this.thisCev();
      case 4:
        return this.thisMev();
      case 5:
        return this.thisMrf();
      case 6:
        return this.thisCnt();
      case 7:
        return this.thisHrg();
      case 8:
        return this.thisMrg();
      case 9:
        return this.thisTrg();
      default:
        return 0;
    }
  }

  /**
   * How much of an sp-parameter this equip is worth of its own.
   * @param {number} sparamId The sp-parameter id, 0 through 9.
   * @returns {number}
   */
  thisSParam(sparamId)
  {
    switch (sparamId)
    {
      case 0:
        return this.thisTgr();
      case 1:
        return this.thisGrd();
      case 2:
        return this.thisRec();
      case 3:
        return this.thisPha();
      case 4:
        return this.thisMcr();
      case 5:
        return this.thisTcr();
      case 6:
        return this.thisPdr();
      case 7:
        return this.thisMdr();
      case 8:
        return this.thisFdr();
      case 9:
        return this.thisExr();
      default:
        return 0;
    }
  }

  //region base parameters
  /**
   * Flat max hit points this equip carries, from its tag alone.
   * @returns {number}
   */
  thisMhp()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMhp);
  }

  /**
   * Flat max magi this equip carries, from its tag alone.
   * @returns {number}
   */
  thisMmp()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMmp);
  }

  /**
   * Flat max tech this equip carries.
   *
   * The only one of the nine with no editor field to sum against, because RMMZ fixed tech at a flat
   * hundred rather than modelling it, so the tag is the whole of it.
   * @returns {number}
   */
  thisMtp()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMtp);
  }

  /**
   * Flat attack this equip carries, from its tag alone.
   * @returns {number}
   */
  thisAtk()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisAtk);
  }

  /**
   * Flat defense this equip carries, from its tag alone.
   * @returns {number}
   */
  thisDef()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisDef);
  }

  /**
   * Flat magic attack this equip carries, from its tag alone.
   * @returns {number}
   */
  thisMat()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMat);
  }

  /**
   * Flat magic defense this equip carries, from its tag alone.
   * @returns {number}
   */
  thisMdf()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMdf);
  }

  /**
   * Flat agility this equip carries, from its tag alone.
   * @returns {number}
   */
  thisAgi()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisAgi);
  }

  /**
   * Flat luck this equip carries, from its tag alone.
   * @returns {number}
   */
  thisLuk()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisLuk);
  }
  //endregion base parameters

  //region ex-parameters
  /**
   * Flat accuracy this equip carries.
   * @returns {number}
   */
  thisHit()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisHit);
  }

  /**
   * Flat evasion this equip carries.
   * @returns {number}
   */
  thisEva()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisEva);
  }

  /**
   * Flat critical hit chance this equip carries.
   * @returns {number}
   */
  thisCri()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisCri);
  }

  /**
   * Flat critical evasion this equip carries.
   * @returns {number}
   */
  thisCev()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisCev);
  }

  /**
   * Flat magic evasion this equip carries.
   * @returns {number}
   */
  thisMev()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMev);
  }

  /**
   * Flat magic reflection this equip carries.
   * @returns {number}
   */
  thisMrf()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMrf);
  }

  /**
   * Flat counter attack chance this equip carries.
   * @returns {number}
   */
  thisCnt()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisCnt);
  }

  /**
   * Flat hp regeneration this equip carries.
   * @returns {number}
   */
  thisHrg()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisHrg);
  }

  /**
   * Flat magi regeneration this equip carries.
   * @returns {number}
   */
  thisMrg()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMrg);
  }

  /**
   * Flat tech regeneration this equip carries.
   *
   * Regeneration, not target rate - see {@link thisTgr}, whose abbreviation is a transposition away.
   * @returns {number}
   */
  thisTrg()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisTrg);
  }
  //endregion ex-parameters

  //region sp-parameters
  /**
   * Flat target rate this equip carries - how much aggro it draws.
   *
   * Target rate, not tech regeneration - see {@link thisTrg}.
   * @returns {number}
   */
  thisTgr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisTgr);
  }

  /**
   * Flat guard rate this equip carries - parry.
   * @returns {number}
   */
  thisGrd()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisGrd);
  }

  /**
   * Flat recovery rate this equip carries.
   * @returns {number}
   */
  thisRec()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisRec);
  }

  /**
   * Flat pharmacology this equip carries.
   * @returns {number}
   */
  thisPha()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisPha);
  }

  /**
   * Flat magi cost reduction this equip carries.
   * @returns {number}
   */
  thisMcr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMcr);
  }

  /**
   * Flat tech charge rate this equip carries.
   * @returns {number}
   */
  thisTcr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisTcr);
  }

  /**
   * Flat physical damage rate this equip carries.
   * @returns {number}
   */
  thisPdr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisPdr);
  }

  /**
   * Flat magical damage rate this equip carries.
   * @returns {number}
   */
  thisMdr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisMdr);
  }

  /**
   * Flat floor damage rate this equip carries.
   * @returns {number}
   */
  thisFdr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisFdr);
  }

  /**
   * Flat experience rate this equip carries.
   * @returns {number}
   */
  thisExr()
  {
    return RPGManager.getSumFromNoteByRegex(this, J.BASE.RegExp.ThisExr);
  }
  //endregion sp-parameters
  //endregion this-parameter bases
}


export default RPG_EquipItem;
//endregion RPG_EquipItem