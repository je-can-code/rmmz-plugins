//region statics
/**
 * Generates a `JABS_Battler` based on the current leader of the party.
 * Also assigns the controller inputs for the player.
 */
JABS_Battler.createPlayer = function()
{
  // grab the leader of the party.
  const battler = $gameParty.leader();

  // if they are ready to be initialized, then do so.
  const actorId = battler
    ? battler.actorId()
    : 0;
  const coreData = JABS_BattlerCoreData.Builder()
    .setBattlerId(actorId)
    .isPlayer()
    .build();

  // return the created player.
  return new JABS_Battler($gamePlayer, battler, coreData);
};

// TODO: parameterize this on a per-enemy basis?
/**
 * If a battler is less than this distance from the target, they are considered "close".
 * @type {number}
 */
JABS_Battler.closeDistance = 3.0;

/**
 * If a battler is more than this distance from the target, they are considered "far".
 * @type {number}
 */
JABS_Battler.farDistance = 5.0;

/**
 * Determines if the battler is close to the target based on distance.
 * @param {number} distance The distance away from the target.
 */
JABS_Battler.isClose = function(distance)
{
  return distance <= JABS_Battler.closeDistance;
};

/**
 * Determines if the battler is at a safe range from the target based on distance.
 * @param {number} distance The distance away from the target.
 */
JABS_Battler.isSafe = function(distance)
{
  return (distance > JABS_Battler.closeDistance) && (distance <= JABS_Battler.farDistance);
};

/**
 * Determines if the battler is far away from the target based on distance.
 * @param {number} distance The distance away from the target.
 */
JABS_Battler.isFar = function(distance)
{
  return distance > JABS_Battler.farDistance;
};

/**
 * Determines whether or not the skill id is a guard-type skill or not.
 * @param id {number} The id of the skill to check.
 * @returns {boolean} True if it is a guard skill, false otherwise.
 */
JABS_Battler.isGuardSkillById = function(id)
{
  // if there is no id to check, then it is not a dodge skill.
  if (!id) return false;

  // if the skill type is not "guard skill", then this is not a guard skill.
  if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.GuardSkillTypeId) return false;

  // its a guard skill!
  return true;
};

/**
 * Determines whether or not the skill id is a dodge-type skill or not.
 * @param id {number} The id of the skill to check.
 * @returns {boolean} True if it is a dodge skill, false otherwise.
 */
JABS_Battler.isDodgeSkillById = function(id)
{
  // if there is no id to check, then it is not a dodge skill.
  if (!id) return false;

  // if the skill type is not "dodge skill", then this is not a dodge skill.
  if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.DodgeSkillTypeId) return false;

  // its a dodge skill!
  return true;
};

/**
 * Determines whether or not the skill id is a weapon-type skill or not.
 * @param id {number} The id of the skill to check.
 * @returns {boolean}
 */
JABS_Battler.isWeaponSkillById = function(id)
{
  // if there is no id to check, then it is not a weapon skill.
  if (!id) return false;

  // if the skill type is not "weapon skill", then this is not a weapon skill.
  if ($dataSkills[id].stypeId !== J.ABS.DefaultValues.WeaponSkillTypeId) return false;

  // its a weapon skill!
  return true;
};

/**
 * Determines whether or not a skill should be visible
 * in the jabs combat skill assignment menu.
 * @param skill {RPG_Skill} The skill to check.
 * @returns {boolean}
 */
JABS_Battler.isSkillVisibleInCombatMenu = function(skill)
{
  // invalid skills are not visible in the combat skill menu.
  if (!skill) return false;

  // explicitly hidden skills are not visible in the combat skill menu.
  if (skill.metaAsBoolean("hideFromJabsMenu")) return false;

  // dodge skills are not visible in the combat skill menu.
  if (JABS_Battler.isDodgeSkillById(skill.id)) return false;

  // guard skills are not visible in the combat skill menu.
  if (JABS_Battler.isGuardSkillById(skill.id)) return false;

  // weapon skills are not visible in the combat skill menu.
  if (JABS_Battler.isWeaponSkillById(skill.id)) return false;

  // show this skill!
  return true;
};

/**
 * Determines whether or not a skill should be visible
 * in the jabs dodge skill assignment menu.
 * @param skill {RPG_Skill} The skill to check.
 * @returns {boolean}
 */
JABS_Battler.isSkillVisibleInDodgeMenu = function(skill)
{
  // invalid skills are not visible in the dodge menu.
  if (!skill) return false;

  // explicitly hidden skills are not visible in the dodge menu.
  if (skill.metaAsBoolean("hideFromJabsMenu")) return false;

  // non-dodge skills are not visible in the dodge menu.
  if (!JABS_Battler.isDodgeSkillById(skill.id)) return false;

  // show this skill!
  return true;
};

/**
 * Determines whether or not an item should be visible
 * in the JABS tool assignment menu.
 * @param {RPG_Item} item The item to check if should be visible.
 * @returns {boolean}
 */
JABS_Battler.isItemVisibleInToolMenu = function(item)
{
  // invalid items are not visible in the item menu.
  if (!item) return false;

  // explicitly hidden items are not visible in the item menu.
  if (item.metaAsBoolean("hideFromJabsMenu")) return false;

  // non-items or non-always-occasion items are not visible in the item menu.
  const isItem = DataManager.isItem(item) && item.itypeId === 1;
  const isUsable = isItem && (item.occasion === 0);
  if (!isItem || !isUsable) return false;

  // show this item!
  return true;
};

/**
 * Gets the team id for allies, including the player.
 * @returns {0}
 */
JABS_Battler.allyTeamId = function()
{
  return 0;
};

/**
 * Gets the team id for enemies.
 * @returns {1}
 */
JABS_Battler.enemyTeamId = function()
{
  return 1;
};

/**
 * Gets the team id for neutral parties.
 * @returns {2}
 */
JABS_Battler.neutralTeamId = function()
{
  return 2;
};

/**
 * Gets the distance that allies are detected and can extend away from the player.
 * @returns {number}
 */
JABS_Battler.allyRubberbandRange = function()
{
  return parseFloat(10 + J.ABS.Metadata.AllyRubberbandAdjustment);
};
//endregion statics