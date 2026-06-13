//region initialization
import JPassiveConditional_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs conditional passive states on the map.
 */
J.PASSIVE.EXT.CONDITIONAL = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Metadata = new JPassiveConditional_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.Aliased = {};
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Action = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.JABS_Battler = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_CharacterBase = new Map();
J.PASSIVE.EXT.CONDITIONAL.Aliased.Window_PassiveDetail = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp = {};

/**
 * Captures {@code passiveSourceRule} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match contributes one tuple that gates <strong>every</strong> passive state id declared on the same row.
 * <p>
 * Author shape: {@code <passiveSourceRule:[kind]>}, or {@code <passiveSourceRule:[kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code ['allOffCooldown']}</li>
 *   <li>{@code ['alliesNearby', 2]}</li>
 *   <li>{@code ['hpBelow', 25]}</li>
 * </ul>
 * <p>
 * Multiple source rules on one row are AND-ed: every tuple must pass for any passive from that source to count.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveSourceRule = /<passiveSourceRule:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code passiveStateRule} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match gates one passive state id declared on the same row; other passives on that row are unaffected.
 * <p>
 * Author shape: {@code <passiveStateRule:[stateId, kind]>}, or {@code <passiveStateRule:[stateId, kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [12, 'hpBelow', 25]}</li>
 *   <li>{@code [5, 'hasState', 14]}</li>
 *   <li>{@code [6, 'slotOffCooldown', 'mainhand']}</li>
 * </ul>
 * <p>
 * Source-wide rules still apply first; state rules AND with any {@link PassiveSourceRule} tuples on the row.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateRule = /<passiveStateRule:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code passiveStateCount} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match scales how many stacks one source contributes for one passive state id (0 stacks is valid).
 * <p>
 * Author shape: {@code <passiveStateCount:[stateId, kind, param]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [77, 'moreIsMoreHp', 25]} — floor(current hp% / 25) stacks</li>
 *   <li>{@code [12, 'per-cri', 3]} — floor(crit rate / 3) stacks (hundred-scale params use tag integers)</li>
 *   <li>{@code [8, 'alliesNearby', 2]} — floor(nearby allies excluding self / 2) stacks</li>
 * </ul>
 * <p>
 * When no count tuple targets a state, {@link Game_Battler#getPassiveStackContributionFromSource} falls back to 1.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.PassiveStateCount = /<passiveStateCount:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code autoApplyState} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match schedules a real JABS state application (not a passive grant).
 * <p>
 * Author shape: {@code <autoApplyState:[stateId, condition, param]>}.<br/>
 * The third value is condition-specific — see plugin help for the glossary.
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [12, 'time', 900]} — every 900 frames while on the ABS map</li>
 *   <li>{@code [14, 'hpDmg', 60]} — on HP damage, at most once per 60 frames</li>
 *   <li>{@code [15, 'whenCrit', 120]} — when this battler is critically hit (victim)</li>
 *   <li>{@code [16, 'anyDmg', 90]} — when HP, MP, or TP takes damage</li>
 *   <li>{@code [17, 'posiStateAdded', 180]} — when a non-negative state is added</li>
 *   <li>{@code [18, 'anyStateAdded', 60]} — when any combat state is added</li>
 *   <li>{@code [42, 'move', 2]} — one apply per 2 whole tiles traveled (Pixelistics updatePixelStepping)</li>
 *   <li>{@code [43, 'stand', 120]} — while idle on map, at most once per 120 frames</li>
 * </ul>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyState = /<autoApplyState:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code autoApplyStateOnNearby} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match schedules a real JABS state application onto nearby battlers (aura-style).
 * <p>
 * Unlike {@code autoApplyState} which applies to the rule bearer, this tag applies the state to
 * every enemy or ally within proximity on each pulse. Only {@code enemiesNearby} and
 * {@code alliesNearby} conditions are meaningful here.
 * </p>
 * <ul>
 *   <li>{@code [1061, 'enemiesNearby', 1, 60]} — apply to all nearby enemies every 60 frames</li>
 *   <li>{@code [1062, 'alliesNearby', 1, 120]} — apply to all nearby allies every 120 frames</li>
 *   <li>{@code [1063, 'enemiesNearby', 2, 60, 3]} — apply when 2+ enemies within 3 tiles, every 60 frames</li>
 * </ul>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoApplyStateOnNearby = /<autoApplyStateOnNearby:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code autoExecuteSkill} bracket tuples from database notes.<br/>
 * Parsed by {@link RPGManager.getArraysFromNotesByRegex} (Path 1: outer tag + inner bracket capture).<br/>
 * Each match schedules a map skill via {@link AutoExecuteSkillManager} and {@link JABS_Engine#forceMapAction}.
 * <p>
 * Author shape: {@code <autoExecuteSkill:[skillId, condition, param]>}, or a four- or five-value
 * {@code enemiesNearby} tuple. After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [1021, 'time', 60]} — every 60 frames while on the ABS map</li>
 *   <li>{@code [1022, 'enemiesNearby', 1, 60]} — every 60 frames when at least one enemy is in range</li>
 *   <li>{@code [1023, 'enemiesNearby', 1, 30, 2]} — same with a 2-tile trigger gate radius</li>
 *   <li>{@code [1024, 'move', 1]} — one execution per whole tile traveled</li>
 *   <li>{@code [1025, 'stand', 120]} — while idle, at most once per 120 frames</li>
 * </ul>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.AutoExecuteSkill = /<autoExecuteSkill:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code removeOnSkillExecution} bracket tuples from <strong>state</strong> notes only.<br/>
 * On skill execution, rolls chance and may peel stacks via {@link Game_Battler#decrementStateStacks}.
 * <p>
 * Author shape: {@code <removeOnSkillExecution:[stypeId, chance]>}.<br/>
 * {@code stypeId} 0 matches any skill type. {@code chance} is 1–100 for {@link RPGManager.chanceIn100}.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveOnSkillExecution = /<removeOnSkillExecution:[ ]?(\[[^\]]+])>/gi;

/**
 * Captures {@code removeStateOnMove} bracket tuples from <strong>state</strong> notes only.<br/>
 * When the owning battler moves, strips the target state via {@link Game_Battler#decrementStateStacks}.
 * Respects {@code jabsLoseAllStacksAtOnce} on the target state — one call collapses all stacks if set.
 * <p>
 * Author shape: {@code <removeStateOnMove:[stateId]>}.<br/>
 * After parsing, tuples look like:
 * </p>
 * <ul>
 *   <li>{@code [1031]} — strip state 1031 when this battler moves</li>
 * </ul>
 * <p>
 * Intended use: mastery states pair {@code autoApplyState:[PAYLOAD, stand, F]} with
 * {@code removeStateOnMove:[PAYLOAD]} to build a movement-reset stack counter.
 * </p>
 * @type {RegExp}
 */
J.PASSIVE.EXT.CONDITIONAL.RegExp.RemoveStateOnMove = /<removeStateOnMove:[ ]?(\[[^\]]+])>/gi;
//endregion initialization