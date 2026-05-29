//region Game_Event
/**
 * Reads the last {@link J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixPrefixChance} tag from this page's comment commands.
 * @returns {number|null} Parsed chance, or null when no tag is present.
 */
Game_Event.prototype.getPassiveAffixPrefixChanceFromEventComments = function()
{
  // last matching tag on this page wins — designers author comments top-to-bottom and the final line is authoritative.
  let chance = null;
  const regex = J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixPrefixChance;

  this.getValidCommentCommands()
    .forEach(command =>
    {
      const [ comment, ] = command.parameters;

      // reset before each exec so we do not carry state across unrelated comment lines.
      regex.lastIndex = 0;
      const regexResult = regex.exec(comment);

      if (regexResult === null) return;

      chance = parseFloat(regexResult[1]);
    });

  return chance;
};

/**
 * Reads the last {@link J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixSuffixChance} tag from this page's comment commands.
 * @returns {number|null} Parsed chance, or null when no tag is present.
 */
Game_Event.prototype.getPassiveAffixSuffixChanceFromEventComments = function()
{
  // last matching tag on this page wins — designers author comments top-to-bottom and the final line is authoritative.
  let chance = null;
  const regex = J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixSuffixChance;

  this.getValidCommentCommands()
    .forEach(command =>
    {
      const [ comment, ] = command.parameters;

      // reset before each exec so we do not carry state across unrelated comment lines.
      regex.lastIndex = 0;
      const regexResult = regex.exec(comment);

      if (regexResult === null) return;

      chance = parseFloat(regexResult[1]);
    });

  return chance;
};

/**
 * True when any comment on this page contains {@link J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassivePrefixes}.
 * @returns {boolean}
 */
Game_Event.prototype.eventCommentsDisablePassiveAffixPrefixRng = function()
{
  // one blocking tag anywhere on the page is enough — the spawn should not roll prefix affixes at all.
  let blocks = false;

  this.getValidCommentCommands()
    .forEach(command =>
    {
      const [ comment, ] = command.parameters;

      // the combined master switch blocks both slots from a single tag.
      if (J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassives.test(comment))
      {
        blocks = true;
      }

      // the slot-specific tag blocks only prefixes.
      if (J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassivePrefixes.test(comment))
      {
        blocks = true;
      }
    });

  return blocks;
};

/**
 * True when any comment on this page contains {@link J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassiveSuffixes}.
 * @returns {boolean}
 */
Game_Event.prototype.eventCommentsDisablePassiveAffixSuffixRng = function()
{
  // parallel to prefix blocking — suffix pools can be turned off independently per spawn point.
  let blocks = false;

  this.getValidCommentCommands()
    .forEach(command =>
    {
      const [ comment, ] = command.parameters;

      // the combined master switch blocks both slots from a single tag.
      if (J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassives.test(comment))
      {
        blocks = true;
      }

      // the slot-specific tag blocks only suffixes.
      if (J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassiveSuffixes.test(comment))
      {
        blocks = true;
      }
    });

  return blocks;
};

/**
 * Effective prefix affix roll gate for this spawn: event comment overrides enemy note, then plugin default.
 * @param {RPG_Enemy} enemyData Database enemy row for the spawned troop member.
 * @returns {number} The percent chance of the roll.
 */
Game_Event.prototype.getResolvedPassiveAffixPrefixChance = function(enemyData)
{
  // map event layer: this page can override the database row for this specific spawn.
  const eventOverride = this.getPassiveAffixPrefixChanceFromEventComments();
  if (eventOverride !== null)
  {
    return parseFloat(eventOverride).clamp(0, 100);
  }

  // enemy note field from the hydrated RPG_Enemy when the event did not supply a usable override.
  const enemyOverride = enemyData.passiveAffixPrefixChance;
  if (enemyOverride !== null)
  {
    return parseFloat(enemyOverride)
      .clamp(0, 100);
  }

  // fall back to the affix extension default parameter.
  return J.PASSIVE.EXT.AFFIX.Metadata.defaultPrefixChance;
};

/**
 * Effective suffix affix roll gate for this spawn: event comment overrides enemy note, then plugin default.
 * @param {RPG_Enemy} enemyData Database enemy row for the spawned troop member.
 * @returns {number} The percent chance of the roll.
 */
Game_Event.prototype.getResolvedPassiveAffixSuffixChance = function(enemyData)
{
  // check if there is an event-level override for this enemy.
  const eventOverride = this.getPassiveAffixSuffixChanceFromEventComments();
  if (eventOverride !== null)
  {
    // clamp only after we coerce to a real finite number — never pass null/NaN into Number#clamp.
    return parseFloat(eventOverride)
      .clamp(0, 100);
  }

  // check if there was an enemy default to fallback to.
  const enemyOverride = enemyData.passiveAffixSuffixChance;
  if (enemyOverride !== null)
  {
    return parseFloat(enemyOverride)
      .clamp(0, 100);

  }

  // fall back to the affix extension default parameter for suffix chance.
  return J.PASSIVE.EXT.AFFIX.Metadata.defaultSuffixChance;
};
//endregion Game_Event