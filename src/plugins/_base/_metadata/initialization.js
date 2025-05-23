/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.BASE = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.BASE.Metadata = {};
J.BASE.Metadata.Name = `J-Base`;
J.BASE.Metadata.Version = '2.2.0';

/**
 * A collection of helpful mappings for `notes` that are placed in
 * various locations, like events on the map, or in a database enemy.
 */
J.BASE.Notetags = {
  // on actors in database.
  KnockbackResist: "knockbackResist",
  NoSwitch: "noSwitch",

  MaxRefineCount: "maxRefine",
  MaxRefineTraits: "maxRefinedTraits",
  NotRefinementBase: "notRefinementBase",
  NotRefinementMaterial: "notRefinementMaterial",
  NoRefinement: "noRefine",

  // on events on map.
  Sight: "s",
  Pursuit: "p",
  MoveSpeed: "ms",
  NoIdle: "noIdle",
  NoHpBar: "noHpBar",
  NoDangerIndicator: "noDangerIndicator",
  NoBattlerName: "noName",
  Inanimate: "inanimate",
  AlertDuration: "ad",
  AlertSightBoost: "as",
  AlertPursuitBoost: "ap",
};

/**
 * The various traits captured here by id with a more meaningful descriptor.
 */
J.BASE.Traits = {
  /**
   * Defines a modification to one of the base parameters.
   * `.dataId` represents the parameter id, while `.value` represents the % modifier.
   */
  B_PARAMETER: 21,

  /**
   * Defines a modification to one of the ex parameters.
   * `.dataId` represents the parameter id, while `.value` represents the % modifier.
   */
  X_PARAMETER: 22,

  /**
   * Defines a modification to one of the sp parameters.
   * `.dataId` represents the parameter id, while `.value` represents the % modifier.
   */
  S_PARAMETER: 23,

  /**
   * Defines the element associated with a skill/equipment/enemy.
   * `.dataId` represents the id of the element.
   */
  ATTACK_ELEMENT: 31,

  /**
   * Defines the speed of deciding what action to take.
   * Caps at 1000 in the editor.
   */
  ATTACK_SPEED: 33,

  /**
   * Defines the number of times an action will repeat.
   * Caps at +/- 9 in the editor.
   *
   * In the context of JABS, this adds onto the number of bonus hits an
   * actor will have globally.
   */
  ATTACK_REPEATS: 34,

  /**
   * Defines the basic attack skill id.
   * For weapons and enemies, this represents the skill used for attacking.
   * For armor, this does nothing directly- but when used in the context of
   * JAFTING's refinement, it can redefine the skill used when a weapon attacks.
   */
  ATTACK_SKILLID: 35,

  /**
   * Defines the addition/learning of a new skill category/type by means of trait.
   * The `dataId` for this trait represents the skill type id being learned.
   */
  ADD_SKILLTYPE: 41,

  /**
   * Defines the removal/forgetting of a previous skill category/type by means of trait.
   * The `dataId` for this trait represents the skill type id being forgotten.
   */
  SEAL_SKILLTYPE: 42,

  /**
   * Defines the addition/learning of a new skill by means of trait.
   * The `dataId` for this trait represents the skill id being learned.
   */
  ADD_SKILL: 43,

  /**
   * Defines the removal/forgetting of a previous skill by means of trait.
   * The `dataId` for this trait represents the skill id being forgotten.
   */
  SEAL_SKILL: 44,

  /**
   * The `DIVIDER` trait, specifically for JAFTING's refinement functionality.
   */
  NO_DISAPPEAR: 63,
};

/**
 * All regular expressions used by this plugin.
 */
J.BASE.RegExp = {};
J.BASE.RegExp.MaxItems = /<max:(d+)>/gi;

/**
 * The definition of what a parsable comment in an event looks like.
 * This enforces a structure that enables the following tags to be valid:
 *  <pre>
 *    <someBooleanKey>
 *    <someKeyWithNumberValue:123>
 *    <someKeyWithArrayAndSingleNumberValue:[123]>
 *    <someKeyWithArrayAndManyNumberValues:[123,456]>
 *    <someKeyWithStringValue:someValue>
 *    <someKeyWithRangeValue:startRange-endRange>
 *  </pre>
 * @type {RegExp}
 */
J.BASE.RegExp.ParsableComment = /^<[[\]\w :"',.!+\-*/\\]+>$/i;

/**
 * A collection of all aliased methods for this plugin.
 */
J.BASE.Aliased = {
  AudioManager: new Map(),
  DataManager: new Map(),
  Game_Character: {},
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  Game_Party: new Map(),
  Game_Temp: new Map(),
  Game_Timer: new Map(),
  Game_System: new Map(),
  Scene_Base: new Map(),
  SoundManager: new Map(),
  Window_Base: new Map(),
  Window_Command: {},
  Window_Selectable: {},
};

//region Helpers
/**
 * The helper functions used commonly throughout my plugins.
 */
J.BASE.Helpers = {};

/**
 * Quick and dirty semver without having access to the full nodejs ecosystem.
 * Checks to ensure the version meets the required version- same as `semver.satisfies()`.
 * Double tilda is shorthand for `parseInt()`.
 * @param {string} currentVersion String representation of the version being checked.
 * @param {string} minimumVersion String representation of the minimum required version.
 * @returns {boolean}
 */
J.BASE.Helpers.satisfies = function(currentVersion, minimumVersion)
{
  const currentVersionParts = currentVersion.split('.');
  const minimumVersionParts = minimumVersion.split('.');
  for (const i in currentVersionParts)
  {
    const a = ~~currentVersionParts[i];
    const b = ~~minimumVersionParts[i];
    if (a > b) return true;
    if (a < b) return false;
  }

  return true; // must be the same
};

/**
 * Generates a `uuid`- a universally unique identifier- for this battler.
 * @returns {string} The `uuid`.
 */
J.BASE.Helpers.generateUuid = function()
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, c =>
    {
      const r = Math.random() * 16 | 0, v = c === 'x'
        ? r
        : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

/**
 * Generates a vastly shorter version of the `uuid`.
 * @returns {string} The `uuid`.
 */
J.BASE.Helpers.shortUuid = function()
{
  return 'xxx-xxx'
    .replace(/[xy]/g, c =>
    {
      const r = Math.random() * 16 | 0, v = c === 'x'
        ? r
        : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

/**
 * Updates the value of a numeric variable by a given amount.
 *
 * NOTE: This assumes the variable contains only a number.
 * @param {number} variableId The id of the variable to modify.
 * @param {number} amount The amount to modify the variable by.
 */
J.BASE.Helpers.modVariable = function(variableId, amount)
{
  const oldValue = $gameVariables.value(variableId);
  const newValue = oldValue + amount;
  $gameVariables.setValue(variableId, newValue);
};

/**
 * Provides a random integer within the range.
 * @param {number} min The lower bound for random numbers (inclusive).
 * @param {number} max The upper bound for random numbers (exclusive).
 */
J.BASE.Helpers.getRandomNumber = function(min, max)
{
  return Math.floor(min + Math.random() * (max + 1 - min))
};

/**
 * Translates the id and type into a proper `RPG::Item`.
 * @param {number} id The id of the item in the database.
 * @param {string} type An abbreviation for the type of item this is.
 * @returns {RPG_BaseItem} The `RPG::Item` of the correct id and type.
 */
J.BASE.Helpers.translateItem = function(id, type)
{
  switch (type)
  {
    case "i":
      return $dataItems[id];
    case "w":
      return $dataWeapons[id];
    case "a":
      return $dataArmors[id];
  }
};

/**
 * Extracts the key portion from a tag.
 * Captures everything between the `<` and `:`.
 *
 * If the optional `asBoolean` is provided as true, then it will instead
 * capture everything between the `<` and `>`.
 *
 * This assumes it is one of the following formats:<br/>
 *  `<someKey:someValue>`<br/>
 *  `<someBooleanKey>`
 * @param {RegExp} structure The structure of the regular expression.
 * @param {boolean} asBoolean True if we want everything between `<` and `>`, false if only `<` and `:`.
 * @returns {string}
 */
J.BASE.Helpers.getKeyFromRegexp = function(structure, asBoolean = false)
{
  const stringifiedStructure = structure.toString();
  const openChar = '<';
  const closeChar = asBoolean
    ? '>'
    : ':';
  return stringifiedStructure
    .substring(stringifiedStructure.indexOf(openChar) + 1, stringifiedStructure.indexOf(closeChar));
};

/**
 * Extends the global javascript {@link String} object.
 * Adds a new property: {@link String.empty}, which is just an empty string.
 *
 * This is used to more clearly show developer intent rather than just arbitrarily
 * adding empty double quotes all over the place.
 * @type {string}
 */
Object.defineProperty(
  String,
  "empty",
  {
    value: "",
    writable: false
  });

/**
 * Extends the global javascript {@link Array} object.
 * Adds a new property: {@link Array.empty}, which is just an empty array.
 *
 * This is used to more clearly show developer intent rather than just arbitrarily
 * adding empty hard brackets all over the place.
 * @type {[]}
 */
Object.defineProperty(Array, "empty", {
  enumerable: true,
  configurable: false,
  get: function()
  {
    return Array.of();
  },
});

/**
 * Executes a given function a given number of `times`.
 * This uses `.forEach()` under the covers, so build your functions accordingly.
 * @param {number} times
 * @param {Function} func The function
 * @param {undefined|any=} thisArg What represents "this" in the `.forEach()`; defaults to undefined.
 */
Array.iterate = function(times, func, thisArg = undefined)
{
  [ ...Array(times) ].forEach(func, thisArg);
};

/**
 * Adds a given number of days based on this date.
 * @param {number} days The number of days to add to a date.
 * @returns {Date} The updated date with the designated days.
 */
Date.prototype.addDays = function(days)
{
  var result = new Date(this.valueOf());
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds a given number of hours based on this date.
 * @param {number} hours The number of hours to add to a date.
 * @returns {Date} The updated date with the designated hours.
 */
Date.prototype.addHours = function(hours)
{
  this.setTime(this.getTime() + (hours * 60 * 60 * 1000));
  return this;
};

/**
 * Adds a given number of minutes based on this date.
 * @param {number} minutes The number of minutes to add to a date.
 * @returns {Date} The updated date with the designated minutes.
 */
Date.prototype.addMinutes = function(minutes)
{
  this.setTime(this.getTime() + (minutes * 60 * 1000));
  return this;
};

/**
 * Masks all characters of a given string with the given masking character.
 * @param {string} stringToMask The string to mask behind the maskingCharacter.
 * @param {string=} maskingCharacter The character to mask with; defaults to "?".
 * @returns {string} The masked string.
 */
J.BASE.Helpers.maskString = function(stringToMask, maskingCharacter = "?")
{
  // the regexp for what to mask.
  const structure = /[0-9A-Za-z\-()[\]*!?'"=@,.]/ig;

  // return the masked string content.
  return stringToMask.toString()
    .replace(structure, maskingCharacter);
};
//endregion Helpers

/**
 * A polyfill for {@link Array.prototype.at}.<br>
 * If this is not present in the available runtime, then this implementation
 * will be used instead.
 */
if (![].at)
{
  /* eslint-disable */
  Array.prototype.at = function(index)
  {
    index = Math.trunc(index) || 0;

    if (index < 0)
    {
      index += this.length;
    }

    if (index < 0 || index >= this.length)
    {
      return undefined;
    }

    return this[index];
  };
  /* eslint-enable */
}