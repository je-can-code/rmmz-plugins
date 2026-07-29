//region LoadoutSlotCatalog
/**
 * The assignable slots the loadout scene presents, and how to describe them.
 *
 * Three windows need to agree on this- each actor's slot column and the spine of labels between
 * them- and they must agree exactly, because a row means "this slot" only if every column counts
 * rows the same way. Keeping the ordering here rather than in any one of them means a slot cannot be
 * added to one column and forgotten in another.
 */
class LoadoutSlotCatalog
{
  /**
   * The slot keys this scene presents, in display order.
   *
   * Mainhand is deliberately absent. It is supplied by whichever weapon the actor has equipped
   * rather than chosen by the player, so offering it as a row would imply an assignment that cannot
   * be made.
   * @returns {string[]}
   */
  static slotKeys()
  {
    return [
      JABS_Button.Offhand,
      JABS_Button.CombatSkill1,
      JABS_Button.CombatSkill2,
      JABS_Button.CombatSkill3,
      JABS_Button.CombatSkill4,
      JABS_Button.Dodge,
      JABS_Button.Tool,
      JABS_Button.UsableItem,
    ];
  }

  /**
   * How many slots this scene presents.
   * @returns {number}
   */
  static slotCount()
  {
    return this.slotKeys().length;
  }

  /**
   * Gets the slot key occupying a given row.
   * @param {number} index The row being asked about.
   * @returns {string}
   */
  static slotKeyAt(index)
  {
    return this.slotKeys()[index];
  }

  /**
   * Describes which input fires a given slot, resolved against the player's live bindings.
   *
   * Combat skills are not bound directly- each is the skill trigger modifier held alongside one of
   * the primary buttons- so their description is assembled from the current binding of both halves.
   * Doing it this way rather than writing the buttons into a string means remapping either half is
   * reflected immediately, and a retired button cannot leave a stale label behind.
   * @param {string} slotKey The key of the slot being described.
   * @returns {string}
   */
  static describeInput(slotKey)
  {
    // combat skills are composed from two buttons rather than bound to one.
    const composition = JABS_Button.combatSkillComposition(slotKey);

    // a composed slot describes each of its halves, joined.
    if (composition.length > 0)
    {
      return composition.map(button => this.describeButton(button))
        .join(' + ');
    }

    // everything else is bound directly.
    return this.describeButton(slotKey);
  }

  /**
   * Describes a single logical button as the input currently bound to it.
   * @param {string} button The logical button to describe.
   * @returns {string}
   */
  static describeButton(button)
  {
    return InputLegendResolver.resolve(button, button);
  }
}

export default LoadoutSlotCatalog;
//endregion LoadoutSlotCatalog
