//region Window_ClassDescription
/**
 * The strip across the top of the class scene: what the highlighted class says about itself.
 *
 * RPG Maker's editor has no field for a class's description, so it comes from the JMZ data editor. A class
 * that editor has never described reads as empty, which leaves this strip blank.
 */
class Window_ClassDescription
  extends Window_Help
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle to draw the window in.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Shows the description of one of an actor's classes.
   *
   * Every window beside the class list is shown a class the same way, but a description belongs to the class
   * rather than to whoever is wearing it, so the actor goes unread.
   * @param {Game_Actor} _actor The actor whose classes are shown.
   * @param {number} classId The id of the class whose description is shown.
   */
  showClass(_actor, classId)
  {
    this.setText($dataClasses[classId].description);
  }
}

export default Window_ClassDescription;
//endregion Window_ClassDescription