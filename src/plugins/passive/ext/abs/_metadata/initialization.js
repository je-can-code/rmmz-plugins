//region initialization
import JPassiveAbs_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.ABS.Metadata = new JPassiveAbs_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.ABS.Aliased = {};
J.PASSIVE.EXT.ABS.Aliased.Game_Enemy = new Map();
J.PASSIVE.EXT.ABS.Aliased.JABS_AiManager = new Map();
J.PASSIVE.EXT.ABS.Aliased.JABS_Battler = new Map();
J.PASSIVE.EXT.ABS.Aliased.JABS_Engine = new Map();
J.PASSIVE.EXT.ABS.Aliased.Scene_Boot = new Map();
J.PASSIVE.EXT.ABS.Aliased.Sprite_Character = new Map();
J.PASSIVE.EXT.ABS.Aliased.Window_PassiveDetail = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.ABS.RegExp = {};

// on states.
J.PASSIVE.EXT.ABS.RegExp.Prefix = /<enemy-prefix>/i;
J.PASSIVE.EXT.ABS.RegExp.Suffix = /<enemy-suffix>/i;
J.PASSIVE.EXT.ABS.RegExp.Weight = /<affix-weight:([1-9]\d*)>/i;
J.PASSIVE.EXT.ABS.RegExp.TierColorHex = /<tier-color-hex:(#[0-9A-F]{6})>/i;

// on enemies (and event comments for the same tags).
J.PASSIVE.EXT.ABS.RegExp.NoRngPassives = /<no-rng-passives>/i;
J.PASSIVE.EXT.ABS.RegExp.NoRngPassivePrefixes = /<no-rng-passive-prefixes>/i;
J.PASSIVE.EXT.ABS.RegExp.NoRngPassiveSuffixes = /<no-rng-passive-suffixes>/i;

// on enemies and event comments — last tag wins when multiple appear on the event page.
J.PASSIVE.EXT.ABS.RegExp.PassiveAffixPrefixChance = /<passive-affix-prefix-chance:[ ]?([+-]?\d+(?:\.\d+)?)>/i;
J.PASSIVE.EXT.ABS.RegExp.PassiveAffixSuffixChance = /<passive-affix-suffix-chance:[ ]?([+-]?\d+(?:\.\d+)?)>/i;

// on states and enemies — multiplicative reward scaling when this enemy is defeated.
J.PASSIVE.EXT.ABS.RegExp.RewardMultiplier = /<rewardMultiplier:\[[ ]?(exp|gold|sdp|ap|drops),[ ]?(\d+(?:\.\d+)?)[ ]?]>/gi;

//region helpers
/**
 * A collection of helper methods for this plugin.
 */
J.PASSIVE.EXT.ABS.Helpers = {};

/**
 * Parses all {@link J.PASSIVE.EXT.ABS.RegExp.RewardMultiplier} tags from a database object's note.
 * Returns a map of reward type key to multiplier value. Each type appears at most once; if
 * duplicated, the last tag on the note wins.
 * @param {RPG_BaseItem} databaseData The database object whose note to scan.
 * @returns {Map<string, number>} Reward type → multiplier pairs found.
 */
J.PASSIVE.EXT.ABS.Helpers.parseRewardMultipliers = function(databaseData)
{
  const results = new Map();

  // bail out when there is nothing to parse.
  if (!databaseData || !databaseData.note) return results;

  const regex = J.PASSIVE.EXT.ABS.RegExp.RewardMultiplier;
  const lines = databaseData.note.split(/[\r\n]+/);

  // build a non-global scanner so we do not carry lastIndex between lines.
  const scan = new RegExp(regex.source, regex.flags.replace('g', '').replace('y', ''));

  lines.forEach(line =>
  {
    const match = scan.exec(line);

    if (match === null) return;

    const rewardType = match[1].toLowerCase();
    const multiplier = parseFloat(match[2]);

    results.set(rewardType, multiplier);
  });

  return results;
};

/**
 * Resolves map/HUD tier stripe tint from the first enemy-prefix passive state on the battler.
 * Callers assign the result to {@link JABS_BattlerName#colorHex} (or HUD fields) when non-empty.
 * @param {Game_Battler} battler Source battler; only enemies participate.
 * @returns {string} Stripe hex, or {@link String.empty} when none applies.
 */
J.PASSIVE.EXT.ABS.Helpers.resolvePassiveTierStripeColorHex = function(battler)
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

  return String.empty;
};
//endregion helpers
//endregion initialization