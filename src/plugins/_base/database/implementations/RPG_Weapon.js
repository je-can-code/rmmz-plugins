import RPG_EquipItem from '../core/RPG_EquipItem.js';

//region RPG_Weapon
/**
 * A class representing a single weapon from the database.
 */
class RPG_Weapon
  extends RPG_EquipItem
{
  //region properties
  /**
   * The animation id for this weapon.
   * @type {number}
   */
  animationId = -1;

  /**
   * The type of weapon this is.
   * This number is the index that maps to your weapon types.
   * @type {number}
   */
  wtypeId = 1;

  /**
   * The type of item this is. Weapons are always type 2.
   * @type {2}
   */
  kind = 2;

  //endregion properties

  /**
   * Constructor.
   * @param {RPG_Weapon} weapon The weapon to parse.
   * @param {number} index The index of the entry in the database.
   */
  constructor(weapon, index)
  {
    // supply the base class params.
    super(weapon, index);

    // map the data.
    this.animationId = weapon.animationId;
    this.wtypeId = weapon.wtypeId;
  }

  /**
   * Whether or not this database entry is a weapon.
   * @returns {boolean}
   */
  isWeapon()
  {
    return true;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return `${super.implementationType()}:weapon`;
  }

  /**
   * Hydrated blank weapon row for reclaiming dynamic refinement slots (matches unused DB slot shape, not `null`).
   *
   * @param {number} index database id and `$dataWeapons` index for this row
   * @returns {RPG_Weapon}
   */
  static createEmpty(index)
  {
    const raw = {
      id: index,
      animationId: 0,
      wtypeId: 0,
      etypeId: 1,
      params: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
      price: 0,
      traits: [],
      description: String.empty,
      iconIndex: 0,
      name: String.empty,
      note: String.empty,
      meta: {},
    };

    return new RPG_Weapon(raw, index);
  }
}

export default RPG_Weapon;
//endregion RPG_Weapon