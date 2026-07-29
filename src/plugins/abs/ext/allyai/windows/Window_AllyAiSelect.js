//region Window_AllyAiSelect
import JABS_AllyAI from './../_models/JABS_AllyAI.js';

/**
 * The on-map windows for reviewing and changing how allies behave in combat.
 *
 * This previously rode on the JABS quick menu's shared selection window, extending it with two extra
 * modes. That window existed to serve ten loadout-assignment modes as well, all of which moved into
 * the loadout scene- leaving ally AI as its only remaining consumer. Inheriting from a class gutted
 * down to nothing but a mode switch would have been worse than owning the behavior outright, so this
 * is now a window in its own right.
 *
 * Ally AI stays on the map rather than following the assignment flows into a scene because it is a
 * tactical decision made between fights, where breaking to a full scene costs more than it gains.
 */
class Window_AllyAiSelect
  extends Window_Command
{
  /**
   * The modes this window can render.
   */
  static Types = {
    /**
     * The list of party members whose AI may be configured, plus the party-wide toggles.
     */
    PartyList: 'ai-party-list',

    /**
     * The list of AI presets a single chosen ally may adopt.
     */
    SelectAi: 'select-ai',
  };

  /**
   * @constructor
   * @param {Rectangle} rect The shape of the window.
   * @param {string} type Which of {@link Window_AllyAiSelect.Types} this window renders.
   */
  constructor(rect, type)
  {
    // perform original logic.
    super(rect);

    // initialize our custom members.
    this.initMembers(type);

    // render and take focus, since these windows are opened on demand rather than left standing.
    this.refresh();
    this.select(0);
    this.activate();
  }

  /**
   * Initializes all custom members of this window.
   * @param {string} type Which of {@link Window_AllyAiSelect.Types} this window renders.
   */
  initMembers(type)
  {
    /**
     * Which mode this window renders.
     * @type {string}
     */
    this._menuType = type;

    /**
     * The actor id of the ally currently being managed through this window.
     * @type {number}
     */
    this._chosenActorId = 0;
  }

  //region properties
  /**
   * Gets which mode this window renders.
   * @returns {string} The menuType.
   */
  menuType()
  {
    // hand back the menu type.
    return this._menuType;
  }

  /**
   * Sets which mode this window renders.
   * @param {string} newMenuType The new menuType.
   */
  setMenuType(newMenuType)
  {
    // assign the menu type.
    this._menuType = newMenuType;
  }

  /**
   * Gets the actor id of the ally being managed.
   * @returns {number} The chosenActorId.
   */
  getActorId()
  {
    // hand back the chosen actor id.
    return this._chosenActorId;
  }

  /**
   * Sets the actor id of the ally being managed.
   * @param {number} actorId The new chosenActorId.
   */
  setActorId(actorId)
  {
    // assign the chosen actor id.
    this._chosenActorId = actorId;
  }

  //endregion properties

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Builds whichever list this window's mode calls for.
   */
  makeCommandList()
  {
    // pivot on the menu type.
    switch (this.menuType())
    {
      case Window_AllyAiSelect.Types.PartyList:
        this.addAggroPassiveToggleCommand();
        this.makeAllyList();
        this.addAllyFormationCommand();
        break;
      case Window_AllyAiSelect.Types.SelectAi:
        this.makeAllyAiDoNothingToggle();
        this.makeAllyAiPresetList();
        break;
    }
  }

  /**
   * Draws the list of party members whose AI can be configured.
   */
  makeAllyList()
  {
    // an iterator function for building all the actor commands for changing ally AI.
    const forEacher = member =>
    {
      // build the command for this member of the party.
      const command = new WindowCommandBuilder(member.name()).setSymbol("party-member")
        .setExtensionData(member.actorId())
        .build();

      // add the built command to the list.
      this.addBuiltCommand(command);
    };

    // build all the commands.
    $gameParty.allMembers()
      .forEach(forEacher, this);
  }

  /**
   * Injects the aggro-passive toggle command into the menu.
   */
  addAggroPassiveToggleCommand()
  {
    // define the icons for passive/aggressive ally AI aggro settings.
    const aggroPassiveCommandName = $gameParty.isAggro()
      ? J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveText
      : J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveText;
    const aggroPassiveCommandIcon = $gameParty.isAggro()
      ? J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveIconIndex
      : J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveIconIndex;

    const description = $gameParty.isAggro()
      ? "The party is currently 'aggro'.\nAllies will engage in any enemy that comes within their range."
      : "The party is currently 'passive'.\nAllies will not engage until the leader strikes or is struck.";

    const textColor = $gameParty.isAggro()
      ? 2
      : 3;

    // build the command for toggling ally AI aggro.
    const command = new WindowCommandBuilder(aggroPassiveCommandName).setSymbol("aggro-passive-toggle")
      .setTextLines(description.split(/[\r\n]/i))
      .flagAsSubText()
      .setColorIndex(textColor)
      .setIconIndex(aggroPassiveCommandIcon)
      .build();

    // add the aggro toggle command.
    this.addBuiltCommand(command);
  }

  /**
   * Injects the party formations command into the menu.
   */
  addAllyFormationCommand()
  {
    const allyFormationsCommand = new WindowCommandBuilder(J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandName)
      .setSymbol('ally-formations')
      .setIconIndex(J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandIconIndex)
      .setColorIndex(23)
      .build();

    // add the formations command.
    this.addBuiltCommand(allyFormationsCommand);
  }

  /**
   * Adds a do-nothing toggle command at the top of the ally AI selection window.
   * Mirrors the aggro/passive toggle pattern from the party list window.
   */
  makeAllyAiDoNothingToggle()
  {
    const currentActor = $gameActors.actor(this.getActorId());
    if (!currentActor) return;

    const allyAI = currentActor.getAllyAI();
    const isDoNothing = allyAI.isDoNothing();

    const commandName = isDoNothing
      ? 'Do Nothing: ON'
      : 'Do Nothing: OFF';

    const description = isDoNothing
      ? 'This ally hangs back and takes no actions.\nToggle off to restore their preset behavior.'
      : 'This ally acts according to their preset.\nToggle on to make them stand down entirely.';

    const colorIndex = isDoNothing
      ? 3
      : 2;

    const iconIndex = isDoNothing
      ? J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveIconIndex
      : J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveIconIndex;

    // construct command for the next step in this routine.
    const command = new WindowCommandBuilder(commandName).setSymbol('do-nothing-toggle')
      .setTextLines(description.split(/[\r\n]/i))
      .flagAsSubText()
      .setColorIndex(colorIndex)
      .setIconIndex(iconIndex)
      .build();

    this.addBuiltCommand(command);
  }

  /**
   * Draws the list of available AI presets that an ally can use.
   */
  makeAllyAiPresetList()
  {
    const currentActor = $gameActors.actor(this.getActorId());
    if (!currentActor) return;

    const presets = JABS_AllyAI.getPresets();
    const currentAi = currentActor.getAllyAI();

    const forEacher = preset =>
    {
      const {
        key,
        name,
        description
      } = preset;

      const isEquipped = currentAi.getPresetKey() === key;

      const iconIndex = isEquipped
        ? J.ABS.EXT.ALLYAI.Metadata.AiModeEquippedIconIndex
        : J.ABS.EXT.ALLYAI.Metadata.AiModeNotEquippedIconIndex;

      // construct command for the next step in this routine.
      const command = new WindowCommandBuilder(name).setSymbol('select-ai')
        .setTextLines(description.split(/[\r\n]/i))
        .flagAsSubText()
        .setIconIndex(iconIndex)
        .setEnabled(true)
        .setExtensionData(preset)
        .build();

      this.addBuiltCommand(command);
    };

    presets.forEach(forEacher, this);
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Increases the height so subtext can be added.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}

export default Window_AllyAiSelect;
//endregion Window_AllyAiSelect
