//region initialization
import JPassiveAffix_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE.EXT.AFFIX = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.AFFIX.Metadata = new JPassiveAffix_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.AFFIX.Aliased = {};
J.PASSIVE.EXT.AFFIX.Aliased.Game_Enemy = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.JABS_AiManager = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.JABS_Battler = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.JABS_Engine = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.Scene_Boot = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.Sprite_Character = new Map();
J.PASSIVE.EXT.AFFIX.Aliased.Window_PassiveDetail = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.AFFIX.RegExp = {};

// on states.
J.PASSIVE.EXT.AFFIX.RegExp.Prefix = /<enemy-prefix>/i;
J.PASSIVE.EXT.AFFIX.RegExp.Suffix = /<enemy-suffix>/i;
J.PASSIVE.EXT.AFFIX.RegExp.Weight = /<affix-weight:([1-9]\d*)>/i;
J.PASSIVE.EXT.AFFIX.RegExp.TierColorHex = /<tier-color-hex:(#[0-9A-F]{6})>/i;

// on enemies (and event comments for the same tags).
J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassives = /<no-rng-passives>/i;
J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassivePrefixes = /<no-rng-passive-prefixes>/i;
J.PASSIVE.EXT.AFFIX.RegExp.NoRngPassiveSuffixes = /<no-rng-passive-suffixes>/i;

// on enemies and event comments — last tag wins when multiple appear on the event page.
J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixPrefixChance = /<passive-affix-prefix-chance:[ ]?([+-]?\d+(?:\.\d+)?)>/i;
J.PASSIVE.EXT.AFFIX.RegExp.PassiveAffixSuffixChance = /<passive-affix-suffix-chance:[ ]?([+-]?\d+(?:\.\d+)?)>/i;

// on states and enemies — multiplicative reward scaling when this enemy is defeated.
J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier = /<rewardMultiplier:\[[ ]?(exp|gold|sdp|ap|drops),[ ]?(\d+(?:\.\d+)?)[ ]?]>/gi;

//region helpers
/**
 * A collection of helper methods for this plugin.
 */
J.PASSIVE.EXT.AFFIX.Helpers = {};

/**
 * Parses all {@link J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier} tags from a database object's note.
 * Returns a map of reward type key to multiplier value. Each type appears at most once; if
 * duplicated, the last tag on the note wins.
 * @param {RPG_BaseItem} databaseData The database object whose note to scan.
 * @returns {Map<string, number>} Reward type → multiplier pairs found.
 */
J.PASSIVE.EXT.AFFIX.Helpers.parseRewardMultipliers = function(databaseData)
{
  const results = new Map();

  // bail out when there is nothing to parse.
  if (!databaseData || !databaseData.note) return results;

  // capture regex for downstream policy in this routine.
  const regex = J.PASSIVE.EXT.AFFIX.RegExp.RewardMultiplier;
  const lines = databaseData.note.split(/[\r\n]+/);

  // build a non-global scanner so we do not carry lastIndex between lines.
  const scan = new RegExp(regex.source, regex.flags.replace('g', '').replace('y', ''));

  // policy step inside parse reward multipliers.
  lines.forEach(line =>
  {
    const match = scan.exec(line);

    // when match  equals  null, take this branch.
    if (match === null) return;

    // capture reward type for downstream policy in this routine.
    const rewardType = match[1].toLowerCase();
    const multiplier = parseFloat(match[2]);

    // Register the value on the alias map for runtime lookup.
    results.set(rewardType, multiplier);
  });

  // hand back results to the caller.
  return results;
};

/**
 * Resolves map/HUD tier stripe tint from the first enemy-prefix passive state on the battler.
 * Callers assign the result to {@link JABS_BattlerName#colorHex} (or HUD fields) when non-empty.
 * @param {Game_Battler} battler Source battler; only enemies participate.
 * @returns {string} Stripe hex, or {@link String.empty} when none applies.
 */
J.PASSIVE.EXT.AFFIX.Helpers.resolvePassiveTierStripeColorHex = function(battler)
{
  // only enemies carry the passive tier bands we use for the stripe; everyone else is a no-op.
  if (!battler || battler.isEnemy() === false) return String.empty;

  // same passive list the rest of the passive stack uses — if it is empty, there is no tier color to resolve.
  const passiveStatesIds = battler.getPassiveStateIds();
  if (passiveStatesIds.length === 0) return String.empty;

  // walk in passive order; the first enemy-prefix state decides the stripe (matches map nameplate + HUD policy).
  for (const passiveStateId of passiveStatesIds)
  {
    const state = battler.state(passiveStateId);
    if (!state) continue;

    // non-prefix passives do not participate in the tier stripe.
    if (state.isEnemyPrefix !== true) continue;

    // only states with an explicit `<tier-color-hex:...>` note participate; no invented defaults.
    if (state.tierColorHex && state.tierColorHex !== String.empty)
    {
      return state.tierColorHex;
    }

    // first prefix state wins even when it has no hex — do not keep scanning for a later prefix.
    break;
  }

  // hand back String.empty to the caller.
  return String.empty;
};
//endregion helpers
//endregion initialization