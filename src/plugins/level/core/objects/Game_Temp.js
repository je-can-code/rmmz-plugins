//region Game_Temp
/**
 * Intializes all additional members of this class.
 */
J.LEVEL.Aliased.Game_Temp.set('initMembers', Game_Temp.prototype.initMembers);
Game_Temp.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Temp.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._level ||= {};

  /**
   * Whether or not the beyond max data has been cached.
   * @type {boolean}
   */
  this._j._level._hasCachedBeyondMaxData = false;

  /**
   * All the level data for beyond the max level.
   */
  this._j._level._beyondMaxData ||= {};
};

/**
 * Iterate over all actors and build the parameter data for all classes.
 */
Game_Temp.prototype.buildBeyondMaxData = function()
{
  // iterate over each class to build the extended parameter data.
  $dataClasses.forEach(dataClass =>
  {
    // the first class is always null.
    if (!dataClass) return;

    // build the data for this actor and this class.
    this.buildBeyondMaxDataForClass(dataClass.id);
  }, this);

  this.flagBeyondMaxDataAsCached();
};

/**
 * Builds the beyond max parameter data for a given class.
 * @param {number} classId The classId to build the beyond max data for.
 */
Game_Temp.prototype.buildBeyondMaxDataForClass = function(classId)
{
  // grab the parameter collections for the class.
  const classParams = $dataClasses.at(classId).params;

  // start a new array for the updated class parameters.
  const newClassParams = Array.empty;

  // iterate over each of the known base parameters to boost beyond max.
  Game_BattlerBase.knownBaseParameterIds()
    .forEach(paramId =>
    {
      // clone the class parameters.
      const parameterValues = classParams.at(paramId)
        .toSpliced(0, 0);

      // grab the final five levels to determine the average growth to continue with.
      const lastFive = parameterValues.slice(parameterValues.length - 6);
      const growth = Array.empty;
      lastFive.forEach((value, index) =>
      {
        if (index === 0) return;

        const previousValue = lastFive[index - 1];
        const difference = value - previousValue;
        growth.push(difference);
      });

      // determine the average growth rate to continue beyond level 99 with.
      const averageGrowth = growth.reduce((sum, value) => sum + value, 0) / growth.length;

      // arbitrarily evaluate ten thousand levels worth of parameters upfront.
      for (let i = 100; i < 1000; i++)
      {
        const nextParameterValue = parameterValues.at(i - 1) + averageGrowth;
        parameterValues[i] = Math.ceil(nextParameterValue);
      }

      // add the data to the running collection.
      newClassParams.push(parameterValues);
    });

  // set the data.
  this.setBeyondMaxData(classId, newClassParams);
};

/**
 * Gets the parameter collection for the class
 * @param {number} classId The classId to build the beyond max data for.
 * @returns {number[][]} The parameter collection for a given class and its parameters.
 */
Game_Temp.prototype.getBeyondMaxData = function(classId)
{
  return this._j._level._beyondMaxData[classId];
};

/**
 * Sets the parameter data for the given class.
 * @param {number} classId The classId to set the parameter data for.
 * @param {number[][]} parameterData The array of arrays of parameter values- one for each base paramId.
 */
Game_Temp.prototype.setBeyondMaxData = function(classId, parameterData)
{
  this._j._level._beyondMaxData[classId] = parameterData;
};

/**
 * Determines whether or not the beyond max data has been cached yet.
 * @returns {boolean} True if it has been cached already, false otherwise.
 */
Game_Temp.prototype.hasCachedBeyondMaxData = function()
{
  return this._j._level._hasCachedBeyondMaxData;
};

/**
 * Flags the beyond max data as having been cached.
 */
Game_Temp.prototype.flagBeyondMaxDataAsCached = function()
{
  this._j._level._hasCachedBeyondMaxData = true;
};