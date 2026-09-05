//region JABS_AiManager
/**
 * True when the game has reached the point where random affixes are allowed to roll.
 *
 * The switch is read at spawn time rather than cached, because the whole purpose of the gate is that
 * a story event flips it partway through a playthrough. A spawn that already happened keeps whatever
 * it rolled- affixes are decided once, when a battler is built from its event.
 *
 * A configured switch of zero means the project never opted into gating, so the answer is always yes.
 * @returns {boolean}
 */
JABS_AiManager.isPassiveAffixRngUnlocked = function()
{
  const gateSwitchId = J.PASSIVE.EXT.AFFIX.Metadata.rngEnabledSwitch;

  // no switch chosen means no gate, which is what every project had before the gate existed.
  if (gateSwitchId === 0) return true;

  return $gameSwitches.value(gateSwitchId);
};

/**
 * True when prefix affix RNG is blocked for this spawn (enemy note or event comments).
 * @param {Game_Event} character Spawning map event.
 * @param {RPG_Enemy} enemyData Database enemy row.
 * @returns {boolean}
 */
JABS_AiManager.shouldBlockPassivePrefixRng = function(character, enemyData)
{
  // the story gate outranks everything below it: until it opens, no spawn rolls anything.
  if (JABS_AiManager.isPassiveAffixRngUnlocked() === false) return true;

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
  // the same story gate the prefix slot answers to; both pools open at the same moment.
  if (JABS_AiManager.isPassiveAffixRngUnlocked() === false) return true;

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

  // check if the enemy has any explicit affixes. an empty list needs no length check of its own-
  // some() over nothing is already false, so a guard in front of it could only ever agree with it.
  const hasExplicitAffixes = passiveStateIds
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
    RPGManager.chanceIn100(prefixChance);
  const canApplySuffix = JABS_AiManager.shouldBlockPassiveSuffixRng(character, enemyData) === false &&
    RPGManager.chanceIn100(suffixChance);

  // validate we can apply a prefix.
  if (canApplyPrefix)
  {
    // the pool is resolved per spawn rather than read off the metadata, so an extension can bias it.
    const {
      map: prefixPool,
      totalWeight: prefixPoolWeight
    } = J.PASSIVE.EXT.AFFIX.Metadata.effectivePrefixPool();

    // pick a prefix at random.
    const prefixStateId = RPGManager.weightedMapChoice(prefixPool, prefixPoolWeight);

    // add the prefix to the list of passive state ids when the pool produced a choice.
    if (prefixStateId !== null)
    {
      passiveStateIds.push(prefixStateId);
    }
  }

  // validate we can apply a suffix.
  if (canApplySuffix)
  {
    // same seam as the prefix slot; both pools are equally open to being biased.
    const {
      map: suffixPool,
      totalWeight: suffixPoolWeight
    } = J.PASSIVE.EXT.AFFIX.Metadata.effectiveSuffixPool();

    // pick a suffix at random.
    const suffixStateId = RPGManager.weightedMapChoice(suffixPool, suffixPoolWeight);

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