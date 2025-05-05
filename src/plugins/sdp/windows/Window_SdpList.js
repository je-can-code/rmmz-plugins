//region Window_SdpList
/**
 * The SDP window containing the list of all unlocked panels.
 */
class Window_SdpList
  extends Window_Command
{
  /**
   * The currently selected actor. Used for comparing points to cost to see if
   * the panel in the list window should be enabled or disabled.
   * @type {Game_Actor}
   */
  currentActor = null;

  filterNoMaxedPanels = false;

  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Sets the actor for this window to the provided actor. Implicit refresh.
   * @param {Game_Actor} actor The actor to assign to this window.
   */
  setActor(actor)
  {
    this.currentActor = actor;
    this.refresh();
  }

  /**
   * Gets whether or not the no-max-panels filter is enabled.
   * @returns {boolean}
   */
  usingNoMaxPanelsFilter()
  {
    return this.filterNoMaxedPanels;
  }

  /**
   * Toggles the "hide max panels" filter for this window.
   */
  toggleNoMaxPanelsFilter()
  {
    this.filterNoMaxedPanels = !this.filterNoMaxedPanels;
  }

  /**
   * OVERWRITE Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * OVERWRITE Creates the command list for this window.
   */
  makeCommandList()
  {
    // grab the actor.
    const actor = this.currentActor;

    // don't render the list of there is no actor.
    if (!actor) return;

    // grab all the panelRankings the actor has unlocked.
    const panelRankings = actor.getAllUnlockedSdps();

    // check if there even are any panels unlocked.
    if (panelRankings.length === 0) return;

    // iterate over each of the unlocked rankings to render the panel in the list.
    const commands = panelRankings
      .map(panelRanking =>
      {
        // grab the actual panel for its data.
        const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

        // construct the SDP command.
        const command = this.makeCommand(panel);

        // if the command is invalid, do not add it.
        if (!command) return null;

        // add the command.
        return command;
      }, this)
      .filter(command => command !== null)
      .sort((a, b) => a.ext.key.localeCompare(b.ext.key));

    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a single command for the SDP list based on a given panel.
   * @param {StatDistributionPanel} panel The panel to build a command for.
   * @returns {BuiltWindowCommand}
   */
  makeCommand(panel)
  {
    const actor = this.currentActor;
    const points = actor.getSdpPoints();
    const {
      name,
      key,
      iconIndex,
      rarity: colorIndex,
      maxRank
    } = panel;

    // get the ranking for a given panel by its key.
    const panelRanking = actor.getSdpByKey(key);

    // grab the current rank of the panel.
    const { currentRank } = panelRanking;

    // check if we're at max rank already.
    const isMaxRank = maxRank <= currentRank;

    // check if the panel is max rank AND we're using the no max panels filter.
    if (isMaxRank && this.usingNoMaxPanelsFilter())
    {
      // don't render this panel.
      return null;
    }

    // check if we have enough points to rank up this panel.
    const hasEnoughPoints = panel.rankUpCost(currentRank) <= points;

    // determine whether or not the command is enabled.
    const enabled = hasEnoughPoints && !isMaxRank;

    // build the right text out.
    const rightText = isMaxRank
      ? "DONE"
      : `${currentRank} / ${maxRank}`;

    // construct the SDP command.
    const command = new WindowCommandBuilder(name)
      .setSymbol(key)
      .setEnabled(enabled)
      .setExtensionData(panel)
      .setIconIndex(iconIndex)
      .setColorIndex(colorIndex)
      .setRightText(rightText)
      .build();

    return command;
  }
}

//endregion Window_SdpList