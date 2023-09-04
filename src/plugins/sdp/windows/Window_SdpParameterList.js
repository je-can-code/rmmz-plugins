//region Window_SdpParameterList
class Window_SdpParameterList extends Window_Command
{
  /**
   * The current parameters on the panel being hovered over.
   * @type {PanelParameter[]}
   */
  panelParameters = [];

  /**
   * The current actor to compare parameters against the panel parameters for.
   * @type {Game_Actor}
   */
  currentActor = null;

  /**
   * Constructor.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Sets the current actor to compare parameters for.
   * @param {Game_Actor} actor The actor to set.
   */
  setActor(actor)
  {
    this.currentActor = actor;
  }

  /**
   * Sets the parameters that are defined in this list.
   * @param {PanelParameter[]} parameters The collection of parameters for this panel.
   */
  setParameters(parameters)
  {
    this.panelParameters = parameters;
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of parameters affected by this SDP.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // add all the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all omnipedia commands to the list that are available.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    if (!this.panelParameters) return [];

    const commands = this.panelParameters.map(this.#buildPanelParameterCommand, this);

    return commands;
  }

  #buildPanelParameterCommand(panelParameter)
  {
    // extract a couple parameter data points for building the display information.
    const { parameterId, isCore } = panelParameter;

    // determine the item color.
    const colorIndex = isCore ? 14 : 0;

    // determine the parameter data to display.
    const paramName = TextManager.longParam(parameterId);
    const paramIcon = IconManager.longParam(parameterId);
    let paramValue = this.currentActor.longParam(parameterId);
    const isPercentParamValue = this.isPercentParameter(parameterId);
    const percentValue = isPercentParamValue ? '%' : String.empty;
    if (!Game_BattlerBase.isBaseParam(parameterId))
    {
      paramValue *= 100;
    }

    const paramDescription = TextManager.longParamDescription(parameterId);

    // determine the modifier data to display.
    const { modifierColorIndex, modifierText } = this.#determineModifierData(panelParameter);

    // build the command name.
    const commandName = `${paramName} ( ${Math.trunc(paramValue)}${percentValue} )`;

    // construct the command.
    const command = new WindowCommandBuilder(commandName)
      .setSymbol(parameterId)
      .addSubTextLines(paramDescription)
      .setIconIndex(paramIcon)
      .setColorIndex(colorIndex)
      .setRightText(modifierText)
      .setRightColorIndex(modifierColorIndex)
      .setExtensionData(panelParameter)
      .build();

    // return the built command.
    return command;
  }

  /**
   * Translates a parameter id into an object with its name, value, iconIndex, and whether or not
   * a parameter being smaller is an improvement..
   * @param {PanelParameter} panelParameter The id to translate.
   */
  // eslint-disable-next-line complexity
  #determineModifierData(panelParameter)
  {
    // a small helper function for calculating the next rank's value.
    const calculateAfterRankUpValue = (paramValue, modifier, isFlat) =>
    {
      return isFlat
        ? Number((paramValue + modifier).toFixed(2))
        : (paramValue + (paramValue * (modifier / 100)));
    };

    // a messy helper function for determining the modifier's color index.
    const determineModifierColorIndex = (paramId, isCore, paramValue, afterRankupValue) =>
    {
      // define some colors.
      const upColor = 24; // ColorManager.textColor(24);
      const upCoreColor = 28; // ColorManager.textColor(28);
      const downColor = 20; // ColorManager.textColor(20);
      const downCoreColor = 18; // ColorManager.textColor(18);

      // determine if smaller is better.
      const smallerIsBetter = this.isNegativeGood(paramId);

      let colorIndex = 0;

      // check if the parameter is going down when we want it to go up.
      if (paramValue > afterRankupValue && !smallerIsBetter)
      {
        // mark it as "a bad thing" color.
        colorIndex = isCore
          ? downCoreColor
          : downColor;
      }
      // check if the parameter is going up when we want it to go up.
      else if (paramValue < afterRankupValue && !smallerIsBetter)
      {
        // mark it as "a good thing" color.
        colorIndex = isCore
          ? upCoreColor
          : upColor;
      }
      // check if the parameter is going doing when smaller is indeed better.
      else if (paramValue > afterRankupValue && smallerIsBetter)
      {
        // mark it as "a good thing" color.
        colorIndex = isCore
          ? upCoreColor
          : upColor;
      }
      // check if the parameter is going up when we want it to go down.
      else if (paramValue < afterRankupValue && smallerIsBetter)
      {
        // mark it as "a bad thing" color.
        colorIndex = isCore
          ? downCoreColor
          : downColor;
      }

      // NOTE:
      // if none of the above chained if-conditions triggered, it could be a non-change.

      // return the calculated color index.
      return colorIndex;
    };

    // a small helper function for building the modifier's text.
    const buildModifierText = (modifier, isFlat) =>
    {
      const isPercent = isFlat ? `` : `%`;
      const isPositive = modifier >= 0 ? '+' : String.empty;
      return `(${isPositive}${modifier}${isPercent})`;
    };

    // deconstruct the info we need from the panel parameter.
    const { parameterId: paramId, perRank: modifier, isFlat, isCore } = panelParameter;

    // determine the current value of the parameter.
    const paramValue = this.currentActor.longParam(paramId);

    // calculate the post-rankup amount.
    const afterRankupValue = calculateAfterRankUpValue(paramValue, modifier, isFlat);

    // calculate the color index.
    const modifierColorIndex = determineModifierColorIndex(paramId, isCore, paramValue, afterRankupValue);

    // build the modifier's text.
    const modifierText = buildModifierText(modifier, isFlat);

    // return our values.
    return { modifierColorIndex, modifierText };
  }

  /**
   * Determines whether or not the parameter should be marked as "improved" if it is negative.
   * @param {number} parameterId The paramId to check if smaller is better for.
   * @returns {boolean} True if the smaller is better for this paramId, false otherwise.
   */
  isNegativeGood(parameterId)
  {
    // grab the list of ids that qualify as "smaller is better".
    const smallerIsBetterParameterIds = this.getSmallerIsBetterParameterIds();

    // check to see if our id is in that special list.
    const smallerIsBetter = smallerIsBetterParameterIds.includes(parameterId);

    // return the check.
    return smallerIsBetter;
  }

  /**
   * The collection of long-form parameter ids that should have a positive color indicator
   * when there is a decrease of value in that parameter from the panel.
   * @returns {number[]}
   */
  getSmallerIsBetterParameterIds()
  {
    return [
      18,   // trg
      22,   // mcr
      23,   // tcr
      24,   // pdr
      25,   // mdr
      26    // fdr
    ];
  }

  /**
   * Determines whether or not the parameter should be suffixed with a % character.
   * This is specifically for parameters that truly are ranged between 0-100 and RNG.
   * @param {number} parameterId The paramId to check if is a percent.
   * @returns {boolean}
   */
  isPercentParameter(parameterId)
  {
    // grab the list of ids that qualify as "needs a % symbol".
    const isPercentParameterIds = this.getIsPercentParameterIds();

    // check to see if our id is in that special list.
    const isPercent = isPercentParameterIds.includes(parameterId);

    // return the check.
    return isPercent;
  }

  /**
   * The collection of long-form parameter ids that should be decorated with a `%` symbol.
   * @returns {number[]}
   */
  getIsPercentParameterIds()
  {
    return [
      9,    // eva
      14,   // cnt
      20,   // rec
      21,   // pha
      22,   // mcr
      23,   // tcr
      24,   // pdr
      25,   // mdr
      26,   // fdr
      27    // exr
    ];
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}
//endregion Window_SdpParameterList