//region JABS_AiManager
/**
 * True when prefix affix RNG is blocked for this spawn (enemy note or event comments).
 * @param {Game_Event} character Spawning map event.
 * @param {RPG_Enemy} enemyData Database enemy row.
 * @returns {boolean}
 */
JABS_AiManager.shouldBlockPassivePrefixRng = function(character, enemyData)
{
  // database-level master switch: both affix slots refuse RNG when this tag is present.
  if (enemyData.noRngPassives) return true;

  // if the enemy says no prefixes, then we should block.
  if (enemyData.noRngPrefixes) return true;

  // if the event disables prefixes, then we should block.
  if (character.eventCommentsDisablePassiveAffixPrefixRng()) return true;

  // no blocking!
  return false;
};

/**
 * True when suffix affix RNG is blocked for this spawn (enemy note or event comments).
 * @param {Game_Event} character Spawning map event.
 * @param {RPG_Enemy} enemyData Database enemy row.
 * @returns {boolean}
 */
JABS_AiManager.shouldBlockPassiveSuffixRng = function(character, enemyData)
{
  // same master switch as prefix — one tag on the enemy row turns off both random affix pools.
  if (enemyData.noRngPassives) return true;

  // if the enemy says no suffixes, then we should block.
  if (enemyData.noRngSuffixes) return true;

  // if the event disables suffixes, then we should block.
  if (character.eventCommentsDisablePassiveAffixSuffixRng()) return true;

  // no blocking!
  return false;
};

/**
 * Extends {@link #postConvertMutate}.<br/>
 * Also adds the event source to the battler.
 * @param {Game_Enemy} battler The enemy battler that was converted from the event.
 * @param {JABS_Battler} jabsBattler The created JABS battler from the event.
 */
J.PASSIVE.EXT.AFFIX.Aliased.JABS_AiManager.set('postConvertMutate', JABS_AiManager.postConvertMutate);
JABS_AiManager.postConvertMutate = function(battler, jabsBattler)
{
  // perform original logic.
  J.PASSIVE.EXT.AFFIX.Aliased.JABS_AiManager.get('postConvertMutate')
    .call(this, battler, jabsBattler);

  // grab the spawning map event and passive state ids from its comments.
  const character = jabsBattler.getCharacter();
  const passiveStateIds = character.getPassiveStateIds();

  // check if the enemy has any explicit affixes.
  const hasExplicitPassives = passiveStateIds.length > 0;
  const hasExplicitAffixes = hasExplicitPassives && passiveStateIds
    .some(id => J.PASSIVE.EXT.AFFIX.Metadata.isAffixStateId(id));

  // check if the event had any explicit state ids.
  if (hasExplicitAffixes)
  {
    // add the passives to the battler.
    battler.addPassiveStateExternalSourceByStateIds(passiveStateIds);

    // stop processing because explicit affixes take precedence over random.
    return;
  }

  // capture the enemy data.
  const enemyData = battler.enemy();

  // resolve gating from event comments, enemy note, then plugin defaults.
  const prefixChance = character.getResolvedPassiveAffixPrefixChance(enemyData);
  const suffixChance = character.getResolvedPassiveAffixSuffixChance(enemyData);

  const canApplyPrefix = JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData) === false &&
    Math.random() * 100 < prefixChance;
  const canApplySuffix = JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData) === false &&
    Math.random() * 100 < suffixChance;

  // validate we can apply a prefix.
  if (canApplyPrefix)
  {
    // pick a prefix at random.
    const prefixStateId = RPGManager.weightedMapChoice(
      J.PASSIVE.EXT.AFFIX.Metadata.prefixMap,
      J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight
    );

    // add the prefix to the list of passive state ids when the pool produced a choice.
    if (prefixStateId !== null)
    {
      passiveStateIds.push(prefixStateId);
    }
  }

  // validate we can apply a suffix.
  if (canApplySuffix)
  {
    // pick a suffix at random.
    const suffixStateId = RPGManager.weightedMapChoice(
      J.PASSIVE.EXT.AFFIX.Metadata.suffixMap,
      J.PASSIVE.EXT.AFFIX.Metadata.totalSuffixWeight
    );

    // add the suffix to the list of passive state ids when the pool produced a choice.
    if (suffixStateId !== null)
    {
      passiveStateIds.push(suffixStateId);
    }
  }

  // add the passives to the battler.
  battler.addPassiveStateExternalSourceByStateIds(passiveStateIds);
};
//endregion JABS_AiManager