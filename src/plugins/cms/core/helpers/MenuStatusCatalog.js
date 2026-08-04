//region MenuStatusCatalog
/**
 * The contents of a single actor's cell in the main menu's party display, decided but not drawn.
 *
 * What belongs in a cell is a policy question that keeps changing as the game grows; how a line of
 * text lands on a bitmap is not. Separating the two means the policy can be exercised directly-
 * asking what an actor with an empty weapon slot reads as should not require standing up a window,
 * a bitmap, and a font metric to find out.
 *
 * Every method here is static and takes the actor rather than the window, because nothing in this
 * class measures or draws. These are answers about a battler, not about a rectangle.
 */
class MenuStatusCatalog
{
  /**
   * Stands in for the item name of a slot holding nothing.
   * @type {string}
   */
  static EMPTY_SLOT_TEXT = 'nothing equipped';

  /**
   * Stands in for the experience readout of an actor with no further levels to earn.
   * @type {string}
   */
  static MAX_LEVEL_TEXT = 'MAX';

  /**
   * Separates the level from the distance to the next one.
   * @type {string}
   */
  static LEVEL_DIVIDER = '-';

  /**
   * Stands in for the state icons of an actor suffering nothing at all.
   *
   * An empty row would read as "this section has not loaded" rather than as good news. Saying it
   * outright costs one line and removes the ambiguity.
   * @type {string}
   */
  static UNAFFLICTED_TEXT = 'Unafflicted';

  /**
   * The level readout for an actor.
   *
   * The bare number, with no word naming it. The icon drawn beside it says what it is, and it says
   * so in the same visual language every other measure in this menu uses- a player who has learned
   * one of these icons has learned all of them, which is worth more than a word repeated on every
   * row.
   * @param {Game_Actor} actor The actor whose level is being described.
   * @returns {string}
   */
  static levelValue(actor)
  {
    return `${actor.level}`;
  }

  /**
   * The resources worth showing for an actor, in the order they are drawn.
   *
   * Each row carries the numbers and the fill rate, but names its resource with a key rather than a
   * color- what blue means is a question for whatever draws the row, and answering it here would
   * drag ColorManager into a class that otherwise never touches the screen.
   *
   * Tech is included only when the database says to display it, which is the same condition the
   * engine's own gauge placement honors.
   * @param {Game_Actor} actor The actor whose resources are being catalogued.
   * @returns {{key: string, label: string, current: number, max: number, rate: number}[]}
   */
  static resourceRows(actor)
  {
    // life and magic are always worth a row.
    const rows = [
      MenuStatusCatalog.buildResourceRow('hp', TextManager.hpA, actor.hp, actor.mhp),
      MenuStatusCatalog.buildResourceRow('mp', TextManager.mpA, actor.mp, actor.mmp),
    ];

    // tech is optional, and the database decides.
    if ($dataSystem.optDisplayTp)
    {
      rows.push(MenuStatusCatalog.buildResourceRow('tp', TextManager.tpA, actor.tp, actor.maxTp()));
    }

    return rows;
  }

  /**
   * Builds a single resource row, including the fill rate its gauge needs.
   *
   * A resource with no capacity reads as empty rather than as a division by zero. That is a real
   * state rather than a defensive one- an actor with no magic at all has an mmp of zero, and the row
   * still has to render something.
   * @param {string} key Which resource this is, being one of 'hp', 'mp', or 'tp'.
   * @param {string} label The abbreviation the database names this resource with.
   * @param {number} current How much of the resource the actor currently holds.
   * @param {number} max How much of the resource the actor can hold.
   * @returns {{key: string, label: string, current: number, max: number, rate: number}}
   */
  static buildResourceRow(key, label, current, max)
  {
    return {
      key,
      label,
      current,
      max,
      rate: max === 0 ? 0 : current / max,
    };
  }

  /**
   * The icons of every state currently afflicting an actor.
   *
   * States without an icon are dropped rather than drawn as a gap. A state that chose not to show
   * itself in the status bar has no business claiming space in the menu either.
   * @param {Game_Actor} actor The actor whose afflictions are being catalogued.
   * @returns {number[]}
   */
  static stateIcons(actor)
  {
    return actor.states()
      .map(state => state.iconIndex)
      .filter(iconIndex => iconIndex > 0);
  }

  /**
   * Builds one row per equipment slot the actor wears, in the order they are worn.
   *
   * Empty slots are kept rather than dropped. A missing weapon is itself information, and dropping
   * the row would leave the player counting slots to work out which one they forgot to fill- while
   * also making the block shift height every time a piece of gear comes or goes.
   * @param {Game_Actor} actor The actor whose loadout is being catalogued.
   * @returns {{item: RPG_EquipItem, slotName: string, isEquipped: boolean}[]}
   */
  static equipmentRows(actor)
  {
    // the equip types this actor wears, in the order they are worn.
    const slotTypeIds = actor.equipSlots();

    // whatever occupies each of those slots, index-aligned with the slots themselves.
    const equips = actor.equips();

    // pair every slot with its occupant, empty or not.
    return slotTypeIds.map((slotTypeId, index) =>
    {
      // the occupant of this particular slot, which is null for as long as the slot sits empty.
      const item = equips.at(index);

      return MenuStatusCatalog.buildEquipmentRow(slotTypeId, item);
    });
  }

  /**
   * Builds a single equipment row from a slot type and whatever currently occupies it.
   *
   * The slot name is resolved here rather than at draw time so that an empty row still knows what
   * it stands for. A filled row identifies itself by the item's own icon and name, but an empty one
   * has neither and would otherwise be an anonymous blank line.
   * @param {number} slotTypeId The 1-based equip type this slot accepts.
   * @param {RPG_EquipItem} item The equipment in the slot, or null while the slot is empty.
   * @returns {{item: RPG_EquipItem, slotName: string, isEquipped: boolean}}
   */
  static buildEquipmentRow(slotTypeId, item)
  {
    return {
      item,
      slotName: TextManager.equipType(slotTypeId),
      isEquipped: item !== null,
    };
  }

  /**
   * The experience readout for an actor, phrased as the distance still to travel.
   *
   * Deliberately derived from the actor rather than stated as a constant. The size of a level is a
   * plugin parameter of J-Level-Flat, so a readout naming today's interval would quietly begin
   * lying the moment that parameter changed- and nothing would report the discrepancy.
   * @param {Game_Actor} actor The actor whose progress is being described.
   * @returns {string}
   */
  static experienceLabel(actor)
  {
    // an actor sitting at the ceiling has no next level to count toward.
    if (actor.isMaxLevel()) return MenuStatusCatalog.MAX_LEVEL_TEXT;

    // how much further this actor must earn before the next level arrives.
    const remaining = actor.nextLevelExp() - actor.currentExp();

    // return the distance rather than the position; "how much more" is the question being asked.
    return `${remaining} to next level`;
  }
}

export default MenuStatusCatalog;
//endregion MenuStatusCatalog