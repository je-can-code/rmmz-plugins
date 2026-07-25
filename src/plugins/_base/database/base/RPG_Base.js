//region RPG_Base
import RPGManager from "../../managers/RPGManager.js";

/**
 * A class representing the foundation of all database objects.
 * In addition to doing all the things that a database object normally does,
 * there are now some useful helper functions available for meta and note access,
 * and additionally a means to access the original database object directly in case
 * there are other things that aren't supported by this class that need accessing.
 */
class RPG_Base
{
  //region properties
  /**
   * Stores the original underlying data per-instance, keyed by the instance.
   * Using a static WeakMap instead of a private instance field makes _original()
   * safe to call on objects created via Object.create(RPG_Base.prototype) (which
   * never run the constructor and therefore cannot initialize private fields).
   * @type {WeakMap<RPG_Base, any>}
   */
  static #originals = new WeakMap();

  /**
   * The index of this entry in the database.
   * @type {number}
   */
  index = 0;

  /**
   * The entry's id in the database.
   */
  id = 0;

  /**
   * The `meta` object of this skill, containing a dictionary of
   * key value pairs translated from this skill's `note` object.
   * @type {{ [k: string]: any }}
   */
  meta = {};

  /**
   * The entry's name.
   * @type {string}
   */
  name = String.empty;

  /**
   * The note field of this entry in the database.
   * @type {string}
   */
  note = String.empty;

  //endregion properties

  //region init
  /**
   * Constructor.
   * Maps the base item's properties into this object.
   * @param {any} baseItem The underlying database object.
   * @param {number} index The index of the entry in the database.
   */
  constructor(baseItem, index)
  {
    RPG_Base.#originals.set(this, baseItem);
    this.index = index;

    // map the core data that all database objects have.
    this.id = baseItem.id;
    this.meta = baseItem.meta;
    this.name = baseItem.name;
    this.note = baseItem.note;

    // allow plugins to copy extra properties from the source object without modifying this constructor.
    this.initMembers(baseItem);
  }

  /**
   * Extension seam: called at the end of construction with the raw source object so plugins can copy extra
   * properties that are not part of the base schema.
   * @param {any} _baseItem The underlying database object.
   */
  initMembers(_baseItem) {}

  //endregion init

  //region accessors
  /**
   * Retrieves the index of this entry in the database.
   * @returns {number}
   */
  _index()
  {
    return this.index;
  }

  /**
   * Updates the index of this entry in the database.
   * @param {number} newIndex The new index to set.
   */
  _updateIndex(newIndex)
  {
    this.index = newIndex;
  }

  /**
   * The unique key that is used to register this object against
   * its corresponding container when the party has one or more of these
   * in their possession. By default, this is just the index of the item's entry
   * from the database, but you can change it if you need a more unique means
   * of identifying things.
   * @returns {any}
   */
  _key()
  {
    return this._index();
  }

  /**
   * Retrieves the original underlying data that was passed to this
   * wrapper from the database.
   * @returns {any}
   */
  _original()
  {
    return RPG_Base.#originals.get(this) ?? this;
  }

  //endregion accessors

  //region cloning
  /**
   * Creates a new instance of this wrapper class with all the same
   * database data that this one contains.
   * @returns {this}
   */
  _clone()
  {
    // generate a new instance with the same data as the original.
    const clone = new this.constructor(this, this._index());

    // return the newly created copy.
    return clone;
  }

  /**
   * Generates an instance of this object off of the values of another.
   *
   * This is mostly used for "cloning" based on some other values.
   * @param {RPG_Base} overrides The overriding object.
   * @param {number} index The new index.
   * @returns {this}
   */
  _generate(overrides, index)
  {
    return new this.constructor(overrides, index);
  }

  //endregion aloning

  //region typing
  /**
   * Whether or not this database entry is an actor.
   * @returns {boolean}
   */
  isActor()
  {
    return false;
  }

  /**
   * Whether or not this database entry is a class.
   * @returns {boolean}
   */
  isClass()
  {
    return false;
  }

  /**
   * Whether or not this database entry is an enemy.
   * @returns {boolean}
   */
  isEnemy()
  {
    return false;
  }

  /**
   * Whether or not this database entry is an item.
   * @returns {boolean}
   */
  isItem()
  {
    return false;
  }

  /**
   * Whether or not this database entry is a weapon.
   * @returns {boolean}
   */
  isWeapon()
  {
    return false;
  }

  /**
   * Whether or not this database entry is an armor.
   * @returns {boolean}
   */
  isArmor()
  {
    return false;
  }

  /**
   * Whether or not this database entry is an equip item (weapon or armor).
   * {@link RPG_EquipItem} overrides this to return true.
   * @returns {boolean}
   */
  isEquipItem()
  {
    return false;
  }

  /**
   * Whether or not this database entry is a skill.
   * @returns {boolean}
   */
  isSkill()
  {
    return false;
  }

  /**
   * Whether or not this database entry is a state.
   * @returns {boolean}
   */
  isState()
  {
    return false;
  }

  /**
   * Gets the type of implementation this database entry is.
   * @returns {string}
   */
  implementationType()
  {
    return '@base';
  }

  /**
   * Gets all type classifiers assigned to this state via notetag.
   * Returns every value matched by a {@code <type:CLASSIFIER>} tag in the notebox.
   * Multiple tags on the same state are all collected and returned together.
   * @returns {string[]} The array of classifier strings, or an empty array if none are defined.
   */
  types()
  {
    return RPGManager.getStringsFromNoteByRegex(this, J.BASE.RegExp.ClassifierType);
  }
  //endregion typing
}


export default RPG_Base;
//endregion RPG_Base