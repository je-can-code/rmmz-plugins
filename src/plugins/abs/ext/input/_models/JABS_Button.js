//region JABS_Button
/**
 * A static class containing all input keys available for JABS.
 */
class JABS_Button
{
  //region functionality
  /**
   * The "start" key.
   * Used for bringing up the JABS menu on the map.
   * @type {string}
   */
  static Menu = 'Menu';

  /**
   * The "select" key.
   * Used for party-cycling.
   * @type {string}
   */
  static Select = 'Select';
  //endregion functionality

  //region primary
  /**
   * The "main", "A" button, or "Z" key.
   * Used for executing the mainhand action.
   * @type {string}
   */
  static Mainhand = 'Main';

  /**
   * The "offhand", "B" button, or "X" key.
   * Used for executing the offhand action.
   * @type {string}
   */
  static Offhand = 'Offhand';

  /**
   * The "tool", Triangle button, or Tab key (native symbol: tab).
   * Used for executing the currently selected tool skill.
   * @type {string}
   */
  static Tool = 'Tool';

  /**
   * Optional dodge / mobility skill input (R2 by default when remapped).
   * In combat, {@link JABS_Button.Sprint} (Square) handles mobility contextually.
   * @type {string}
   */
  static Dodge = 'Dodge';

  /**
   * The usable-item slot input (R2 by default).
   * Executes whatever consumable item is currently equipped in the usable-item slot.
   * This slot is agnostic to item type — tools are excluded, everything else is fair game.
   * @type {string}
   */
  static UsableItem = 'UsableItem';
  //endregion primary

  //region mobility & modifiers
  /**
   * The sprint/dash input (engine-native dash replacement).
   * While held, the player sprints if allowed.
   * @type {string}
   */
  static Sprint = "Sprint";

  /**
   * The "strafe", "L2" button, or "Left Ctrl" key.
   * Used for locking the direction faced while the input is held.
   * @type {string}
   */
  static Strafe = 'Strafe';

  /**
   * The "rotate", "R1" button, or "W" and "E" key(s).
   * Used for locking in-place while the input is held.
   * @type {string}
   */
  static Rotate = 'Rotate';

  /**
   * The "guard", "R1" button, or "W", and "E" key(s).
   * Used for activating the guard function while the input is held.
   * @type {string}
   */
  static Guard = 'Guard';

  /**
   * The combat "enabler" (commonly L1 hold on gamepads).
   * Used as a modifier to enable Combat Skill 1–4 actions while held.
   * @type {string}
   */
  static SkillTrigger = 'SkillTrigger';
  //endregion mobility & modifiers

  //region L1 + buttons
  /**
   * The `L1 + A` or 1 key.
   * Executes combat skill 1.
   * @type {string}
   */
  static CombatSkill1 = 'CombatSkill1';

  /**
   * The `L1 + B` or 2 key.
   * Executes combat skill 2.
   * @type {string}
   */
  static CombatSkill2 = 'CombatSkill2';

  /**
   * The `L1 + X` or 3 key.
   * Executes combat skill 3.
   * @type {string}
   */
  static CombatSkill3 = 'CombatSkill3';

  /**
   * The `L1 + Y` or 4 key.
   * Executes combat skill 4.
   * @type {string}
   */
  static CombatSkill4 = 'CombatSkill4';

  //endregion  L1 + buttons

  /**
   * Gets the logical buttons that combine to produce each combat skill input.
   *
   * Combat skills are not independently bindable- each one is the {@link JABS_Button.SkillTrigger}
   * modifier held alongside one of the four primary buttons. That relationship used to exist only
   * inside display strings such as "Skill Trigger + Mainhand", which meant a retired button could
   * (and did) leave those strings quietly lying about what actually fires the skill.
   *
   * Expressing it as data instead lets every consumer- remap labels, HUD hints, loadout screens-
   * resolve the current binding of each half through the live input mapping, so remapping either
   * component immediately and correctly updates everywhere it is displayed.
   * @returns {Object<string, string[]>} A map of combat skill key to its component button keys.
   */
  static combatSkillCompositions()
  {
    // each combat skill is the skill trigger modifier plus one primary button, in slot order.
    const compositions = {};
    compositions[this.CombatSkill1] = [ this.SkillTrigger, this.Mainhand ];
    compositions[this.CombatSkill2] = [ this.SkillTrigger, this.Offhand ];
    compositions[this.CombatSkill3] = [ this.SkillTrigger, this.Sprint ];
    compositions[this.CombatSkill4] = [ this.SkillTrigger, this.Tool ];

    // return the mapping of combat skills to the buttons that produce them.
    return compositions;
  }

  /**
   * Gets the logical buttons that combine to produce the given combat skill input.
   * @param {string} combatSkillButton The combat skill key to decompose.
   * @returns {string[]} The component button keys, or an empty array if it is not a combat skill.
   */
  static combatSkillComposition(combatSkillButton)
  {
    // look up the composition for this button.
    const composition = this.combatSkillCompositions()[combatSkillButton];

    // buttons that are not combat skills have no components to report.
    return composition ?? Array.empty;
  }

  /**
   * Gets all assignable buttons used for JABS.
   * @returns {string[]} A collection of JABS-input keys' identifiers.
   */
  static assignableInputs()
  {
    // the valid set of assignable inputs.
    const okInputs = [
      // primary
      this.Mainhand, this.Offhand, this.Tool, this.UsableItem,

      // modifiers & mobility
      this.SkillTrigger, this.Sprint, this.Strafe, this.Rotate,

      // functionality
      this.Menu, this.Select,
    ];

    // a filter function for ensuring only the correct inputs are accepted.
    const filtering = buttonInput => okInputs.includes(buttonInput);

    // return the filtered buttons.
    return this.allButtons()
      .filter(filtering);
  }

  /**
   * Gets all currently available buttons used for JABS.
   * @returns {string[]} A collection of JABS-input key's identifiers.
   */
  static allButtons()
  {
    return [
      // primary
      this.Mainhand, this.Offhand, this.Tool, this.UsableItem, this.Sprint,


      // mobility & modifiers
      this.SkillTrigger,  this.Strafe, this.Rotate, this.Guard, this.Dodge,

      // L1 + buttons
      this.CombatSkill1, this.CombatSkill2, this.CombatSkill3, this.CombatSkill4,

      // functionality
      this.Menu, this.Select,
    ];
  }
}

export default JABS_Button;
//endregion JABS_Button