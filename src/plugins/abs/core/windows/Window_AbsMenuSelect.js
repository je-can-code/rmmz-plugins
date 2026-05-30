//region Window_AbsMenuSelect
import JABS_SkillSlot from './../__models/JABS_SkillSlot.js';
import JABS_Battler from './../__models/JABS_Battler.js';
/**
 * A window that is reused to draw all the subwindows of the JABS menu.
 */
class Window_AbsMenuSelect
  extends Window_Command
{
  /* eslint-disable prefer-destructuring */
  static SelectionTypes = {
    SkillList: 'skill',
    SkillEquip: 'equip-skill',
    ToolList: 'tool',
    ToolEquip: 'equip-tool',
    DodgeList: 'dodge',
    DodgeEquip: 'equip-dodge',
    OffhandList: 'offhand',
    OffhandEquip: 'equip-offhand',
  };

  /**
   * @constructor
   * @param {Rectangle} rect The shape of the window.
   * @param {string} type The type of window this is, such as "dodge" or "skill".
   */
  constructor(rect, type)
  {
    super(rect);
    this.initialize(rect, type);
  }

  /**
   * Initializes this window.
   * @param {Rectangle} rect The window dimensions.
   * @param {string} type The type of abs menu selection this is.
   */
  initialize(rect, type)
  {
    this._j ||= {};
    this._j._menuType = type;
    super.initialize(rect);
    // policy step inside initialize.
    this.refresh();
    this.select(0);
    this.activate();
  }

  /**
   * Draws all commands of this select window.
   */
  makeCommandList()
  {
    switch (this._j._menuType)
    {
      case Window_AbsMenuSelect.SelectionTypes.SkillList:
        // the list of all equippable combat skills this actor knows.
        this.makeCombatSkillList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.ToolList:
        // the list of all items/tools in the party's possession.
        this.makeToolList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.DodgeList:
        // the list of all equippable dodge skills this actor knows.
        this.makeDodgeSkillList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.SkillEquip:
        // the combat skill equip menu, where all the combat skills can be equipped.
        this.makeEquippedCombatSkillList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.ToolEquip:
        // the tool equip menu, where the items/tools can be equipped.
        this.makeEquippedToolList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.DodgeEquip:
        // the dodge skill equip menu, where all the dodge skills can be equipped.
        this.makeEquippedDodgeSkillList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.OffhandList:
        // the list of all offhand-eligible skills the leader knows.
        this.makeOffhandSkillList();
        break;
      case Window_AbsMenuSelect.SelectionTypes.OffhandEquip:
        // the offhand equip menu, where the offhand pin slot is shown for assignment.
        this.makeEquippedOffhandList();
        break;
    }
  }

  /**
   * Fills the list with learned skills to assign.
   */
  makeCombatSkillList()
  {
    // grab the leader for reference data.
    const actor = $gameParty.leader();

    // grab all of the leader's skills that are visible in this menu.
    const skills = actor.skills()
      .filter(JABS_Battler.isSkillVisibleInCombatMenu);

    // initialize our blank list of skills to view.
    const commands = Array.empty;

    // build the clear slot command.
    const clearSlotCommand = new WindowCommandBuilder(J.ABS.Metadata.ClearSlotText)
      .setSymbol('skill')
      .setColorIndex(16)
      .setTextLines([ 'Remove the existing combat skill from the slot.' ])
      .build();

    // add the clear slot command to the list.
    commands.push(clearSlotCommand);

    // an iterator function for building skill commands.
    const forEacher = skill =>
    {
      // destruct the data out of the database data.
      const {
        name,
        id,
        iconIndex,
        description
      } = skill;

      // build the command.
      const skillCommand = new WindowCommandBuilder(name)
        .setSymbol('skill')
        .setExtensionData(id)
        .setIconIndex(iconIndex)
        .setHelpText(description)
        .setTextLines(description.split(/[\r\n]+/))
        .build();

      // add the built command to the list.
      commands.push(skillCommand);
    };

    // iterate over each of the skills and add them to the list.
    skills.forEach(forEacher, this);

    // iterate over all of the commands found and render them.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Fills the list with items in the player's possession to assign.
   */
  makeToolList()
  {
    // initialize our blank list of skills to view.
    const commands = Array.empty;

    // build the clear slot command.
    const clearSlotCommand = new WindowCommandBuilder(J.ABS.Metadata.ClearSlotText)
      .setSymbol('tool')
      .setTextLines([ 'Remove the existing tool from the slot.' ])
      .setColorIndex(16)
      .build();

    // add the clear slot command to the list.
    commands.push(clearSlotCommand);

    // an iterator function for building tool commands.
    const forEacher = tool =>
    {
      // destruct the data out of the database data.
      const {
        name,
        id,
        iconIndex,
        description
      } = tool;

      // tools only get an amount if they are consumable.
      const amount = tool.consumable
        ? $gameParty.numItems(tool)
          .padZero(3)
        : '♾';

      // build the command.
      const toolCommand = new WindowCommandBuilder(name)
        .setSymbol('tool')
        .setExtensionData(id)
        .setIconIndex(iconIndex)
        .setHelpText(description)
        .setRightText(`x${amount}`)
        .setTextLines(description.split(/[\r\n]+/))
        .build();

      // add the built command to the list.
      commands.push(toolCommand);
    };

    // grab all the tools that are visiblie in this menu.
    const tools = $gameParty.allItems()
      .filter(JABS_Battler.isItemVisibleInToolMenu);

    // iterate over each of the tools and add them to the list.
    tools.forEach(forEacher, this);

    // iterate over all of the commands found and render them.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Fills the list with the currently assigned dodge.
   */
  makeDodgeSkillList()
  {
    // initialize our blank list of skills to view.
    const commands = Array.empty;

    // build the clear slot command.
    const clearSlotCommand = new WindowCommandBuilder(J.ABS.Metadata.ClearSlotText)
      .setSymbol('dodge')
      .setColorIndex(16)
      .setTextLines([ 'Remove the existing dodge skill from the slot.' ])
      .build();

    // add the clear slot command to the list.
    commands.push(clearSlotCommand);

    // filter out all non-dodge-skills.
    const dodgeSkills = $gameParty.leader()
      .skills()
      .filter(JABS_Battler.isSkillVisibleInDodgeMenu);

    // an iterator function for building dodge skill commands.
    const forEacher = dodgeSkill =>
    {
      // destruct the data out of the database data.
      const {
        name,
        id,
        iconIndex,
        description
      } = dodgeSkill;

      // build the command.
      const dodgeCommand = new WindowCommandBuilder(name)
        .setSymbol('dodge')
        .setExtensionData(id)
        .setIconIndex(iconIndex)
        .setHelpText(description)
        .setTextLines(description.split(/[\r\n]+/))
        .build();

      // add the built command to the list.
      commands.push(dodgeCommand);
    };

    // iterate over each of the dodge skills and add them to the list.
    dodgeSkills.forEach(forEacher, this);

    // iterate over all of the commands found and render them.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Fills the list with the currently assigned items.
   */
  makeEquippedCombatSkillList()
  {
    // grab the leader for reference data.
    const leader = $gameParty.leader();

    // an iterator function for iterating over skill slots and rendering their data.
    /**
     * @param {JABS_SkillSlot} skillSlot The skill slot driving this step.
     */
    const forEacher = skillSlot =>
    {
      // initialize the command variables.
      let name = `${skillSlot.key}: ${J.ABS.Metadata.UnassignedText}`;
      let iconIndex = 0;
      let description = 'An empty combat skill slot eagerly awaiting to be filled.';

      // check if the skillslot has something in it.
      if (skillSlot.isUsable())
      {
        // resolve through the transform layer so the menu shows the effective skill.
        const equippedSkill = leader.skill(leader.getResolvedSkillId(skillSlot.key));

        // update the command variables with the equipped skill data.
        name = equippedSkill.name;
        iconIndex = equippedSkill.iconIndex;
        description = equippedSkill.description;
      }

      // build the command.
      const command = new WindowCommandBuilder(name)
        .setSymbol('slot')
        .setExtensionData(skillSlot.key)
        .setIconIndex(iconIndex)
        .build();

      // add the built command.
      this.addBuiltCommand(command);
    };

    // grab all the combat skill slots.
    const combatSkillSlots = leader.getAllCombatSkillSlots();

    // iterate over each of the combat skill slots.
    combatSkillSlots.forEach(forEacher, this);
  }

  /**
   * Fills the list with the currently assigned items.
   */
  makeEquippedToolList()
  {
    // grab the tool skillslot.
    const toolSkillSlot = $gameParty.leader()
      .getToolSkillSlot();

    // initialize the command variables.
    let name = `${toolSkillSlot.key}: ${J.ABS.Metadata.UnassignedText}`;
    let iconIndex = 0;
    let description = String.empty;
    let amount = String.empty;

    // check if the tool skillslot has anything in it.
    if (toolSkillSlot.isUsable())
    {
      // determine the currently equipped tool.
      const equippedTool = $dataItems.at(toolSkillSlot.id);

      // tools only get an amount if they are consumable.
      amount = equippedTool.consumable
        ? $gameParty.numItems(equippedTool)
          .padZero(3)
        : '♾';

      // update the command variables with the equipped tool data.
      name = equippedTool.name;
      iconIndex = equippedTool.iconIndex;
      description = equippedTool.description;
    }

    // build the command.
    const command = new WindowCommandBuilder(name)
      .setSymbol('slot')
      .setExtensionData(toolSkillSlot.key)
      .setIconIndex(iconIndex)
      .setRightText(`x${amount}`)
      .build();

    // add the built command.
    this.addBuiltCommand(command);
  }

  /**
   * Fills the list with the currently assigned items.
   */
  makeEquippedDodgeSkillList()
  {
    // grab the leader for reference data.
    const leader = $gameParty.leader();

    // grab the leader's dodge skill.
    const dodgeSkillSlot = leader.getDodgeSkillSlot();

    // initialize the command variables.
    let name = `${dodgeSkillSlot.key}: ${J.ABS.Metadata.UnassignedText}`;
    let iconIndex = 0;
    let description = String.empty;

    // check if the dodge skillslot has anything in it.
    if (dodgeSkillSlot.isUsable())
    {
      // resolve through the transform layer so the menu shows the effective dodge skill.
      const equippedDodgeSkill = leader.skill(leader.getResolvedSkillId(dodgeSkillSlot.key));

      // update the command variables with the equipped dodge skill data.
      name = equippedDodgeSkill.name;
      iconIndex = equippedDodgeSkill.iconIndex;
      description = equippedDodgeSkill.description;
    }

    // build the command.
    const command = new WindowCommandBuilder(name)
      .setSymbol('slot')
      .setExtensionData(dodgeSkillSlot.key)
      .setIconIndex(iconIndex)
      .build();

    // add the built command.
    this.addBuiltCommand(command);
  }

  /**
   * Fills the list with skills eligible for pinning into the offhand slot.
   *
   * Includes a leading "clear slot" entry so the player can drop the pin and fall back
   * to the default equipment-driven offhand behavior. The remainder of the list is built
   * from the leader's offhand-assignable skill pool, which surfaces explicitly eligible
   * learned skills plus the current offhand/mainhand-provided offhand skills.
   */
  makeOffhandSkillList()
  {
    // initialize our blank list of skills to view.
    const commands = Array.empty;

    // build the clear slot command for clearing the offhand pin.
    const clearSlotCommand = new WindowCommandBuilder('Use Equipment Default.')
      .setSymbol('offhand')
      .setColorIndex(16)
      .setTextLines([ 'Remove the offhand pin and let the equipped offhand grant the skill again.' ])
      .build();

    // add the clear slot command to the list.
    commands.push(clearSlotCommand);

    // build the eligible skill pool for the leader (learned + equipped-granted).
    const offhandSkills = $gameParty.leader()
      .buildOffhandAssignableSkillPool();

    // an iterator function for building offhand skill commands.
    const forEacher = offhandSkill =>
    {
      // destruct the data out of the database data.
      const {
        name,
        id,
        iconIndex,
        description
      } = offhandSkill;

      // build the command.
      const offhandCommand = new WindowCommandBuilder(name)
        .setSymbol('offhand')
        .setExtensionData(id)
        .setIconIndex(iconIndex)
        .setTextLines(description.split(/[\r\n]+/))
        .build();

      // add the built command to the list.
      commands.push(offhandCommand);
    };

    // iterate over each of the offhand skills and add them to the list.
    offhandSkills.forEach(forEacher, this);

    // iterate over all of the commands found and render them.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Fills the list with the currently equipped offhand skill row, used as the
   * single-slot landing window when assigning offhand pins.
   */
  makeEquippedOffhandList()
  {
    // grab the leader for reference data.
    const leader = $gameParty.leader();

    // grab the leader's offhand skill slot directly.
    const offhandSkillSlot = leader.getSkillSlot(JABS_Button.Offhand);

    // initialize the command variables.
    let name = `${offhandSkillSlot.key}: ${J.ABS.Metadata.UnassignedText}`;
    let iconIndex = 0;
    let description = String.empty;

    // check if the offhand slot has anything assigned right now.
    if (offhandSkillSlot.isUsable())
    {
      // resolve through the transform layer so the menu shows the effective offhand skill.
      const equippedOffhandSkill = leader.skill(leader.getResolvedSkillId(offhandSkillSlot.key));

      // update the command variables with the equipped offhand skill data.
      name = equippedOffhandSkill.name;
      iconIndex = equippedOffhandSkill.iconIndex;
      description = equippedOffhandSkill.description;
    }

    // build the command.
    const command = new WindowCommandBuilder(name)
      .setSymbol('slot')
      .setExtensionData(offhandSkillSlot.key)
      .setIconIndex(iconIndex)
      .build();

    // add the built command.
    this.addBuiltCommand(command);
  }

  /* eslint-enable prefer-destructuring */
}

export default Window_AbsMenuSelect;
//endregion Window_AbsMenuSelect