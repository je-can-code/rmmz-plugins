//region JABS_Formation
/**
 * The structure of a party formation in JABS.
 */
class JABS_Formation
{
  /**
   * The name of the formation.
   * @type {string}
   */
  name = String.empty;

  /**
   * The description of the formation for use when reviewing formations.
   * @type {string}
   */
  description = String.empty;

  /**
   * A collection of the x,y coordinates of each ally relative to the leader and their facing.
   * @type {[number[]]}
   */
  formation = [];


  /**
   * A collection of the effects applied to the party while this formation is active.
   * @type {any[]}
   */
  effects = [];

  /**
   * Constructor.
   * @param {string} name The name of this formation.
   * @param {string} description The description of this formation to display to the player.
   * @param {[number[]]} formation The array of positions for allies representing the formation.
   * @param {any[]=} effects The additional effects applied when this formation is active.
   */
  constructor(name, description, formation, effects = [])
  {
    this.name = name;
    this.description = description;
    this.formation = formation;
    this.effects = effects;
  }
}

//endregion JABS_Formation