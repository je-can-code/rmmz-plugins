//region Window_SdpParameterList
import PanelParameter from '../models/PanelParameter.js';
class Window_SdpParameterList
  extends Window_Command
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
   * Implements {@link #makeCommandList}.<br/>
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
    const {
      parameterKey,
      isCore
    // continue the routine with the next policy step.
    } = panelParameter;

    const definition = ParameterRegistry.get(parameterKey);

    // determine the item color.
    const colorIndex = isCore
      ? 14
      : 0;

    // resolve display metadata from the catalog when available.
    const paramName = definition
      ? definition.label()
      : parameterKey;
    const paramIcon = definition
      ? definition.iconIndex()
      : 0;
    const paramValue = this.currentActor.parameter(parameterKey);
    const paramDescription = definition
      ? definition.description()
      : [ String.empty ];
    const prettyValue = definition
      ? definition.prettyValue(paramValue, false)
      : Math.trunc(paramValue).toString();

    // determine the modifier data to display.
    const {
      modifierColorIndex,
      modifierText
    } = this.#determineModifierData(panelParameter);

    // build the command name.
    const commandName = `${paramName} ( ${prettyValue} )`;

    // construct the command.
    const command = new WindowCommandBuilder(commandName)
      .setSymbol(parameterKey)
      .addTextLines(paramDescription)
      .setIconIndex(paramIcon)
      .setColorIndex(colorIndex)
      .setRightText(modifierText)
      .setRightColorIndex(modifierColorIndex)
      .setExtensionData(panelParameter)
      .build();

    // return the built command.
    return command;
  }

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
    const determineModifierColorIndex = (parameterKey, isCore, paramValue, afterRankupValue) =>
    {
      // define some colors.
      const upColor = 24; // ColorManager.textColor(24);
      const upCoreColor = 28; // ColorManager.textColor(28);
      const downColor = 20; // ColorManager.textColor(20);
      const downCoreColor = 18; // ColorManager.textColor(18);

      // determine if smaller is better.
      const smallerIsBetter = this.isNegativeGood(parameterKey);

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
      const isPercent = isFlat
        ? ``
        : `%`;
      const isPositive = modifier >= 0
        ? '+'
        : String.empty;
      return `(${isPositive}${modifier}${isPercent})`;
    };

    // deconstruct the info we need from the panel parameter.
    const {
      parameterKey,
      perRank: modifier,
      isFlat,
      isCore
    } = panelParameter;

    // determine the current value of the parameter.
    const paramValue = this.currentActor.parameter(parameterKey);

    // calculate the post-rankup amount.
    const afterRankupValue = calculateAfterRankUpValue(paramValue, modifier, isFlat);

    // calculate the color index.
    const modifierColorIndex = determineModifierColorIndex(parameterKey, isCore, paramValue, afterRankupValue);

    // build the modifier's text.
    const modifierText = buildModifierText(modifier, isFlat);

    // return our values.
    return {
      modifierColorIndex,
      modifierText
    };
  }

  /**
   * Determines whether or not the parameter should be marked as "improved" if it is negative.
   * @param {string} parameterKey The registry key to check if smaller is better for.
   * @returns {boolean} True if the smaller is better for this key, false otherwise.
   */
  isNegativeGood(parameterKey)
  {
    return ParameterKeys.SDP_SMALLER_IS_BETTER.includes(parameterKey);
  }

  /**
   * Overwrites {@link #itemHeight}.<br/>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}

export default Window_SdpParameterList;
//endregion Window_SdpParameterList