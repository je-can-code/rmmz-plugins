//region Scene_JabsAllyAi
import Window_AllyAiSelect from './../windows/Window_AllyAiSelect.js';
import Window_Formations from './../windows/Window_Formations.js';

/**
 * The scene for deciding how the party's allies behave in combat.
 *
 * This replaces a stack of windows that used to open on top of the map, one over the next: pick "manage
 * ally ai", get a window; pick an ally, get another window over that one; pick formations, get a third.
 * Each step hid the one before it, so the player could never see what they were changing relative to
 * anything else, and the whole arrangement lived on {@link Scene_Map} where it competed with the HUD.
 *
 * Here the party stays on screen the entire time, and whatever is being chosen sits beside it rather
 * than on top of it. Same three lists, same handlers, none of the stacking.
 */
class Scene_JabsAllyAi
  extends Scene_MenuFacetBase
{
  /**
   * Constructor.
   */
  constructor()
  {
    super();
  }

  /**
   * Pushes this scene onto the scene stack.
   */
  static callScene()
  {
    SceneManager.push(Scene_JabsAllyAi);
  }

  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the members particular to this scene.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The actor whose AI presets the detail column is currently showing.
     * @type {number}
     */
    this._chosenActorId = 0;
  }

  /**
   * Gets the actor whose AI presets the detail column is currently showing.
   * @returns {number}
   */
  chosenActorId()
  {
    return this._chosenActorId;
  }

  /**
   * Sets the actor whose AI presets the detail column should show.
   * @param {number} actorId The id of the actor.
   */
  setChosenActorId(actorId)
  {
    this._chosenActorId = actorId;
  }

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates this scene's own windows.
   */
  create()
  {
    // perform original logic, which builds the shared chrome.
    super.create();

    // build the help window describing whatever is highlighted.
    this.createHelpWindow();

    // build the party column, which stays visible for the whole visit.
    this.createPartyListWindow();

    // build the two things that can occupy the column beside it.
    this.createPresetListWindow();
    this.createFormationListWindow();

    // the party is where every path through this scene begins.
    this.focusPartyList();
  }

  /**
   * Creates the list of party members whose AI may be configured.
   */
  createPartyListWindow()
  {
    // build the window against its own share of the content area.
    const window = new Window_AllyAiSelect(this.partyListRect(), Window_AllyAiSelect.Types.PartyList);

    // leaving the scene from here means leaving the scene.
    window.setHandler('cancel', this.popScene.bind(this));

    // choosing an ally moves attention to that ally's presets.
    window.setHandler('party-member', this.commandSelectMemberAi.bind(this));

    // the party-wide stance is toggled in place rather than opening anything.
    window.setHandler('aggro-passive-toggle', this.commandAggroPassiveToggle.bind(this));

    // formations concern the whole party, so they occupy the detail column too.
    window.setHandler('ally-formations', this.commandAllyFormations.bind(this));

    // the help window explains whatever is highlighted.
    window.setHelpWindow(this.helpWindow());

    this.setPartyListWindow(window);
    this.addWindow(window);
  }

  /**
   * Creates the list of AI presets a single chosen ally may adopt.
   */
  createPresetListWindow()
  {
    // build the window against the detail column it shares with the formation list.
    const window = new Window_AllyAiSelect(this.detailRect(), Window_AllyAiSelect.Types.SelectAi);

    // backing out returns to the party rather than leaving the scene.
    window.setHandler('cancel', this.focusPartyList.bind(this));

    // choosing a preset applies it immediately; there is nothing to confirm.
    window.setHandler('select-ai', this.commandEquipMemberAi.bind(this));

    // the do-nothing flag is a toggle rather than a preset, but lives among them.
    window.setHandler('do-nothing-toggle', this.commandToggleDoNothing.bind(this));

    window.setHelpWindow(this.helpWindow());

    this.setPresetListWindow(window);
    this.addWindow(window);

    // hidden until an ally is chosen, since it has nobody to describe yet.
    window.hide();
    window.deactivate();
  }

  /**
   * Creates the list of party formations.
   */
  createFormationListWindow()
  {
    // build the window against the same detail column the preset list uses.
    const window = new Window_Formations(this.detailRect());

    // backing out returns to the party rather than leaving the scene.
    window.setHandler('cancel', this.focusPartyList.bind(this));

    // choosing a formation applies it immediately.
    window.setHandler('select-formation', this.commandSelectAllyFormation.bind(this));

    window.setHelpWindow(this.helpWindow());

    this.setFormationListWindow(window);
    this.addWindow(window);

    // hidden until formations are asked for.
    window.hide();
    window.deactivate();
  }
  //endregion create

  //region layout
  /**
   * The share of the content area given to the party column.
   *
   * The party gets the smaller half because its rows are names, while the column beside it carries
   * presets and formations that each explain themselves across a second line.
   * @returns {number}
   */
  partyColumnRatio()
  {
    return 0.4;
  }

  /**
   * The shape of the party column.
   * @returns {Rectangle}
   */
  partyListRect()
  {
    // start from whatever the base skeleton left for content.
    const area = this.facetAreaRect();

    // take this column's share of the width.
    const width = Math.round(area.width * this.partyColumnRatio());

    return new Rectangle(area.x, area.y, width, area.height);
  }

  /**
   * The shape of the column beside the party, shared by the presets and the formations.
   *
   * Defined as the remainder rather than its own fraction, so the two columns cannot drift apart or
   * leave a seam between them however the ratio is tuned.
   * @returns {Rectangle}
   */
  detailRect()
  {
    const area = this.facetAreaRect();
    const partyWidth = this.partyListRect().width;

    return new Rectangle(area.x + partyWidth, area.y, area.width - partyWidth, area.height);
  }

  /**
   * Implements {@link #controlLegendEntries}.<br/>
   * Describes the controls this scene responds to.
   * @returns {{semantic: (string|string[]), label: string}[]}
   */
  controlLegendEntries()
  {
    return [
      {
        semantic: 'ok',
        label: 'select',
      },
      {
        semantic: 'cancel',
        label: 'back',
      },
    ];
  }
  //endregion layout

  //region focus
  /**
   * Gives the party column the cursor, and takes the detail column away.
   *
   * The detail column is hidden rather than merely deactivated, because what it shows only makes sense
   * next to a specific choice- an ally's presets, with no ally chosen, would describe nobody.
   */
  focusPartyList()
  {
    // put away whichever detail list was showing.
    this.presetListWindow()
      .hide();
    this.presetListWindow()
      .deactivate();
    this.formationListWindow()
      .hide();
    this.formationListWindow()
      .deactivate();

    // hand the cursor back to the party.
    this.partyListWindow()
      .activate();
    this.partyListWindow()
      .show();
  }

  /**
   * Gives one of the detail lists the cursor.
   *
   * The party column stays visible and stays selected- only deactivated- so the player keeps seeing
   * which ally the list beside it belongs to.
   * @param {Window_Command} window The detail window to focus.
   */
  focusDetail(window)
  {
    // the party is still worth reading, so it only loses the cursor.
    this.partyListWindow()
      .deactivate();

    // bring the requested list forward.
    window.show();
    window.refresh();
    window.activate();
    window.select(0);
  }
  //endregion focus

  //region commands
  /**
   * Shows the chosen ally's AI presets.
   */
  commandSelectMemberAi()
  {
    // the party list hangs the actor id off the command it was built from.
    const actorId = this.partyListWindow()
      .currentExt();

    // remember whose presets are on display, since applying one needs to know.
    this.setChosenActorId(actorId);

    // tell the list who it is describing before it renders.
    this.presetListWindow()
      .setActorId(actorId);

    this.focusDetail(this.presetListWindow());
  }

  /**
   * Toggles the party-wide aggro/passive stance.
   *
   * Passive confines allies to the leader's current target; aggro gives them their full sight range and
   * lets them pick fights of their own.
   */
  commandAggroPassiveToggle()
  {
    // play a fun sound when changing party aggro mode.
    SoundManager.playRecovery();

    // toggle the party aggro mode.
    $gameParty.isAggro()
      ? $gameParty.becomePassive()
      : $gameParty.becomeAggro();

    // refresh the window to pick up the new state.
    this.partyListWindow()
      .refresh();
  }

  /**
   * Applies the chosen preset to the chosen ally.
   */
  commandEquipMemberAi()
  {
    // the preset list hangs the whole preset off the command.
    const newPreset = this.presetListWindow()
      .currentExt();

    // reach the ally's own AI to hand the preset to.
    const allyAi = $gameActors.actor(this.chosenActorId())
      .getAllyAI();

    allyAi.applyPreset(newPreset.key);

    // redraw so the newly-equipped preset shows as equipped.
    this.presetListWindow()
      .refresh();
  }

  /**
   * Toggles whether the chosen ally acts at all.
   */
  commandToggleDoNothing()
  {
    SoundManager.playRecovery();

    const allyAi = $gameActors.actor(this.chosenActorId())
      .getAllyAI();

    allyAi.setDoNothing(!allyAi.isDoNothing());

    this.presetListWindow()
      .refresh();
  }

  /**
   * Shows the party's available formations.
   */
  commandAllyFormations()
  {
    this.focusDetail(this.formationListWindow());
  }

  /**
   * Applies the chosen formation to the party.
   */
  commandSelectAllyFormation()
  {
    // the formation list hangs the whole formation off the command.
    /** @type {JABS_Formation} */
    const selectedFormation = this.formationListWindow()
      .currentExt();

    $gameParty.setPartyFormation(selectedFormation.key);

    // redraw so the newly-chosen formation shows as chosen.
    this.formationListWindow()
      .refresh();
  }
  //endregion commands

  //region properties
  /**
   * Gets the party column.
   * @returns {Window_AllyAiSelect}
   */
  partyListWindow()
  {
    return this._partyListWindow;
  }

  /**
   * Sets the party column.
   * @param {Window_AllyAiSelect} window The window to track.
   */
  setPartyListWindow(window)
  {
    this._partyListWindow = window;
  }

  /**
   * Gets the AI preset list.
   * @returns {Window_AllyAiSelect}
   */
  presetListWindow()
  {
    return this._presetListWindow;
  }

  /**
   * Sets the AI preset list.
   * @param {Window_AllyAiSelect} window The window to track.
   */
  setPresetListWindow(window)
  {
    this._presetListWindow = window;
  }

  /**
   * Gets the formation list.
   * @returns {Window_Formations}
   */
  formationListWindow()
  {
    return this._formationListWindow;
  }

  /**
   * Sets the formation list.
   * @param {Window_Formations} window The window to track.
   */
  setFormationListWindow(window)
  {
    this._formationListWindow = window;
  }
  //endregion properties
}

export default Scene_JabsAllyAi;
//endregion Scene_JabsAllyAi
