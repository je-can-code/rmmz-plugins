/* eslint-disable max-len */
//region Metadata
import J_AbsPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

//region plugin setup and configuration
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS = {};

/**
 * The parent namespace for all JABS extensions.
 */
J.ABS.EXT = {};

//region helpers
/**
 * A collection of helpful functions for use within this plugin.
 */
J.ABS.Helpers = {};

/**
 * A collection of helper functions for the use with the plugin manager.
 */
J.ABS.Helpers.PluginManager = {};

/**
 * A helpful function for translating a plugin command's slot to a valid slot.
 * @param {string} slot The slot from the plugin command to translate.
 * @returns {string} The translated slot.
 */
J.ABS.Helpers.PluginManager.TranslateOptionToSlot = slot =>
{
  switch (slot)
  {
    case 'Tool':
      return JABS_Button.Tool;
    case 'UsableItem':
      return JABS_Button.UsableItem;
    case 'Dodge':
      return JABS_Button.Dodge;
    case 'Offhand':
      return JABS_Button.Offhand;
    case 'L1A':
      return JABS_Button.CombatSkill1;
    case 'L1B':
      return JABS_Button.CombatSkill2;
    case 'L1X':
      return JABS_Button.CombatSkill3;
    case 'L1Y':
      return JABS_Button.CombatSkill4;
  }
};

/**
 * A helpful function for translating raw JSON from the plugin settings into elemental icon objects.
 * @param {string} obj The raw JSON.
 * @returns {{element: number, icon: number}[]} The translated elemental icon objects.
 */
J.ABS.Helpers.PluginManager.TranslateElementalIcons = obj =>
{
  // no element icons identified.
  if (!obj) return [];

  const arr = JSON.parse(obj);
  if (!arr.length) return [];
  return arr.map(el =>
  {
    const kvp = JSON.parse(el);
    const {
      elementId,
      iconIndex
    } = kvp;
    return {
      element: parseInt(elementId),
      icon: parseInt(iconIndex)
    };
  });
};
/**
 * Loads external JABS configuration from the project filesystem.
 *
 * This is the entry point for JABS moving configuration out of notes and into a centralized JSON blob.
 * The root blob must be an object; team configuration is extracted from the {@code teams} property.
 *
 * External configuration is required for team rules; missing or invalid configuration will throw.
 * @param {string=} configPath The project-relative path to the external config.
 * @returns {object} The parsed root blob.
 */
J.ABS.Helpers.loadExternalConfig = (configPath = 'data/config.jabs.json') =>
{
  // validate that the parsed blob matches our expected root shape.
  const validate = parsedConfig =>
  {
    // the root must be an object.
    if (parsedConfig === null || typeof parsedConfig !== 'object')
    {
      throw new Error('config root must be an object.');
    }

    // teams must exist and be an array.
    const { teams } = parsedConfig;
    if (Array.isArray(teams) === false)
    {
      throw new Error('config root must contain a "teams" array.');
    }
  };

  // load and validate the external config.
  const parsedConfig = ExternalJsonConfigLoader.load(
    configPath,
    ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-ABS')
      .configName('external configuration')
      .validator(validate)
      .build()
  );

  // assign the external config and extracted teams into metadata.
  const metadata = J.ABS.Metadata;
  if (metadata === undefined)
  {
    throw new Error('J.ABS.Metadata must be assigned before J.ABS.Helpers.loadExternalConfig().');
  }

  metadata.ExternalConfig = parsedConfig;
  metadata.Teams = parsedConfig.teams;

  // return the parsed root blob.
  return parsedConfig;
};
//endregion helpers

//region metadata

/**
 * The metadata associated with this plugin.
 */
J.ABS.Metadata = new J_AbsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

// load external config after metadata is published (constructor must not call this — Metadata is not assigned yet).
J.ABS.Helpers.loadExternalConfig();
//endregion metadata

/**
 * The various default values across the engine. Often configurable.
 */
J.ABS.DefaultValues = {
  /**
   * When an enemy JABS battler has no "prepare" defined.
   * @type {number}
   */
  EnemyNoPrepare: J.ABS.Metadata.DefaultEnemyPrepareTime,

  /**
   * The ID of the map that will contain the actions for replication.
   * @type {number}
   */
  ActionMap: J.ABS.Metadata.DefaultActionMapId,

  /**
   * The ID of the map that will contain the enemies for replication.
   * @type {number}
   */
  EnemyMap: J.ABS.Metadata.DefaultEnemyMapId,

  /**
   * The default animation id for skills when it is set to "normal attack".
   * Typically used for enemies or weaponless battlers.
   * @type {number}
   */
  AttackAnimationId: J.ABS.Metadata.DefaultAttackAnimationId,

  /**
   * The skill category that governs skills that are identified as "dodge" skills.
   * @type {number}
   */
  DodgeSkillTypeId: J.ABS.Metadata.DefaultDodgeSkillTypeId,

  /**
   * The skill category that governs skills that are identified as "guard" skills.
   * @type {number}
   */
  GuardSkillTypeId: J.ABS.Metadata.DefaultGuardSkillTypeId,

  /**
   * The skill category that governs skills that are identified as "weapon" skills.
   * @type {number}
   */
  WeaponSkillTypeId: J.ABS.Metadata.DefaultWeaponSkillTypeId,

  /**
   * When an item has no cooldown defined.
   * @type {number}
   */
  CooldownlessItems: J.ABS.Metadata.DefaultToolCooldownTime,

  /**
   * Whether hitbox overlays are visible when a game boots.
   * @type {boolean}
   */
  HitboxOverlaysInitiallyVisible: J.ABS.Metadata.HitboxOverlaysInitiallyVisible,
};

/**
 * A collection of non-user-modifiable global values that are used throughout the JABS system.
 * Each variable should be documented for absolute clarity.
 */
J.ABS.Globals = {};

/**
 * Cooldown key for the battler-wide global cooldown (GCD).<br/>
 * When {@link J.ABS.Metadata.EnableGlobalCooldown} is on, executing a whitelisted skill stamps this timer;
 * other GCD-subject skills cannot be used until it elapses. Dodge and tool inputs ignore GCD.
 * @type {'global'}
 */
J.ABS.Globals.GlobalCooldownKey = 'global';

/**
 * A collection of helpful mappings for emoji balloons
 * to their numeric ID.
 */
J.ABS.Balloons = {
  /**
   * An exclamation point balloon.
   */
  Exclamation: 1,

  /**
   * A question mark balloon.
   */
  Question: 2,

  /**
   * A music note balloon.
   */
  MusicNote: 3,

  /**
   * A heart balloon.
   */
  Heart: 4,

  /**
   * An anger balloon.
   */
  Anger: 5,

  /**
   * A sweat drop balloon.
   */
  Sweat: 6,

  /**
   * A frustrated balloon.
   */
  Frustration: 7,

  /**
   * A elipses (...) or triple-dot balloon.
   */
  Silence: 8,

  /**
   * A light bulb or realization balloon.
   */
  LightBulb: 9,

  /**
   * A double-Z (zz) balloon.
   */
  Asleep: 10,

  /**
   * A green checkmark.
   */
  Check: 11,
};

/**
 * A collection of helpful mappings for `Game_Character` directions
 * to their numeric ID.
 */
J.ABS.Directions = {

  /**
   * Represents the UP direction, or 8.
   * @type {8}
   */
  UP: 8,

  /**
   * Represents the RIGHT direction, or 6.
   * @type {6}
   */
  RIGHT: 6,

  /**
   * Represents the LEFT direction, or 4.
   * @type {4}
   */
  LEFT: 4,

  /**
   * Represents the DOWN direction, or 2.
   * @type {2}
   */
  DOWN: 2,

  /**
   * Represents the diagonal LOWER LEFT direction, or 1.
   * @type {1}
   */
  LOWERLEFT: 1,

  /**
   * Represents the diagonal LOWER RIGHT direction, or 3.
   * @type {3}
   */
  LOWERRIGHT: 3,

  /**
   * Represents the diagonal UPPER LEFT direction, or 7.
   * @type {7}
   */
  UPPERLEFT: 7,

  /**
   * Represents the diagonal UPPER RIGHT direction, or 9.
   * @type {9}
   */
  UPPERRIGHT: 9,
};

/**
 * The various collision shapes an attack can be.
 */
J.ABS.Shapes = {
  /**
   * A circle shaped hitbox.
   */
  Circle: 'circle',

  /**
   * A rhombus (aka diamond) shaped hitbox.
   */
  Rhombus: 'rhombus',

  /**
   * A square around the target hitbox.
   */
  Square: 'square',

  /**
   * A line from the target hitbox.
   */
  Line: 'line',

  /**
   * An arc shape hitbox in front of the action.
   */
  Arc: 'arc',

  /**
   * A wall in front of the target hitbox.
   */
  Wall: 'wall',

  /**
   * A cross from the target hitbox.
   */
  Cross: 'cross'
};

/**
 * Strongly-typed projectile formation names used across JABS.
 */
J.ABS.ProjectileFormations = {
  /**
   * A single spoke in the forward direction.
   */
  Line: 'line',

  /**
   * Three spokes: forward, forward-left, forward-right.
   */
  Spray: 'spray',

  /**
   * Four cardinals: up, right, down, left.
   */
  Cross: 'cross',

  /**
   * Four diagonals: up-right, down-right, down-left, up-left.
   */
  Xburst: 'xburst',

  /**
   * All eight directions: cardinals + diagonals.
   */
  Nova: 'nova',
};

/**
 * A collection of helpful mappings for `notes` that are placed in
 * various locations, like events on the map, or in a database enemy.
 */
J.ABS.Notetags = {
  MoveType: {
    Forward: 'forward',
    Backward: 'backward',
    Directional: 'directional',
  }
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.RegExp = {
  //region ON SKILLS
  ActionId: /<actionId:[ ]?(\d+)>/gi,
  HideFromJabsMenu: /<hideFromJabsMenu>/gi,

  // pre-execution-related.
  CastTime: /<castTime:[ ]?(\d+)>/gi,
  CastAnimation: /<castAnimation:[ ]?(\d+)>/gi,

  // post-execution-related.
  Cooldown: /<cooldown:[ ]?(\d+)>/gi,
  UniqueCooldown: /<uniqueCooldown>/gi,
  // exempt from GCD stamp and block.
  Ogcd: /<ogcd>/gi,
  // optional per-skill GCD duration override in frames.
  GlobalCooldownFrames: /<gcd:[ ]?(\d+)>/gi,

  // action size/shape/count related.
  Degrees: /<degrees:[ ]?(\d+)>/gi,
  Range: /<radius:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,
  Shape: /<hitbox:[ ]?(circle|rhombus|square|line|arc|wall|cross)>/gi,
  Projectile: /<projectile:[ ]?(\d+)>/gi,
  ProjectileFormation: /<formation:[ ]?(line|spray|cross|xburst|nova)>/gi,
  Thickness: /<thickness:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,

  // action-execution-related.
  Direct: /<direct>/i,
  DirectLock: /<directLock>/i,
  DirectStateTarget: /<directStateTarget:[ ]?(\d+)>/gi,
  Proximity: /<proximity:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,
  Duration: /<duration:[ ]?(\d+)>/gi,
  Knockback: /<knockback:[ ]?(\d+)>/gi,
  DelayData: /<delay:[ ]?(\[-?\d+,[ ]?(true|false)(?:,[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?))?])>/gi,
  Linger: /<linger:[ ]?(\d+)>/gi,
  OnDefeatedTarget: /<onDefeatedTarget>/gi,

  // animation-related.
  SelfAnimationId: /<selfAnimationId:[ ]?(\d+)>/gi,
  OnCastAnimationId: /<onCastAnimationId:[ ]?(\d+)>/gi,

  // combo-related.
  ComboAction: /<combo:[ ]?(\[\d+,[ ]?\d+])>/gi,
  ComboStarter: /<comboStarter>/gi,
  AiSkillExclusion: /<aiSkillExclusion>/gi,
  FreeCombo: /<freeCombo>/gi,

  // learning-related
  NoAutoAssign: /<noAutoAssign>/gi,
  UpgradeOverSkill: /<upgradeOverSkill:[ ]?(\d+)>/i,
  NoSkillUpgrading: /<noUpgrade>/i,
  UpgradeOnlySkill: /<onlyUpgrade>/i,

  // a boolean tag that flags a skill as eligible to be assigned into the offhand slot
  // by the player from the in-game JABS quick menu.
  OffhandEligible: /<offhandEligible>/i,

  // aggro-related.
  BonusAggro: /<aggro:[ ]?(-?\d+)>/gi,
  AggroMultiplier: /<aggroMultiplier:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,

  // hits-related.
  Unparryable: /<unparryable>/gi,

  /**
   * Extra battle-effect applications per target per pierce tick, from the executing skill note only.
   *
   * <pre>
   * Structure:
   *  <bonus-hits:AMOUNT>
   *
   * Example:
   *  <bonus-hits:2>
   *
   * Translation:
   *  Adds 2 to per-connection bonus hits (3 total applies per target per tick with base 1).
   * </pre>
   * @type {RegExp}
   */
  BonusHitsSkillNote: /<bonus-hits:[ ]?(\d+)>/gi,

  /**
   * Bonus hits per connection from battler-side notes, applied to basic attacks only.
   *
   * <pre>
   * Structure:
   *  <bonus-hits-basic:AMOUNT>
   *
   * Example:
   *  <bonus-hits-basic:1>
   * </pre>
   * @type {RegExp}
   */
  BonusHitsScopeBasic: /<bonus-hits-basic:[ ]?(\d+)>/gi,

  /**
   * Bonus hits per connection from battler-side notes, applied to non-basic skills only.
   *
   * <pre>
   * Structure:
   *  <bonus-hits-skill:AMOUNT>
   *
   * Example:
   *  <bonus-hits-skill:1>
   * </pre>
   * @type {RegExp}
   */
  BonusHitsScopeSkill: /<bonus-hits-skill:[ ]?(\d+)>/gi,

  /**
   * Bonus hits per connection from battler-side notes, applied to all JABS actions.
   *
   * <pre>
   * Structure:
   *  <bonus-hits-global:AMOUNT>
   *
   * Example:
   *  <bonus-hits-global:1>
   * </pre>
   * @type {RegExp}
   */
  BonusHitsScopeGlobal: /<bonus-hits-global:[ ]?(\d+)>/gi,

  PiercingData: /<pierce:[ ]?(\[\d+,[ ]?\d+])>/gi,

  // guarding-related.
  Guard: /<guard:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  Parry: /<parry:[ ]?(\d+)>/gi,
  CounterParry: /<counterParry:[ ]?(\[\d+(?:\.\d+)?(?:,\s*\d+(?:\.\d+)?)*])>/gi,
  CounterGuard: /<counterGuard:[ ]?(\[\d+(?:\.\d+)?(?:,\s*\d+(?:\.\d+)?)*])>/gi,

  // dodge-related.
  DodgeSteps: /<dodge:[ ]?(\d+)>/gi,
  DodgeSpeed: /<dodgeSpeed:[ ]?(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)>/gi,
  MoveType: /<moveType:[ ]?(forward|backward|directional)>/gi,
  InvincibleDodge: /<invincibleDodge>/gi,
  IFrames: /<iframes:[ ]?(\[\d+,[ ]?\d+])>/gi,

  // visual metadata (per-skill; optional; sprites only; hitboxes unchanged).
  VisOffset: /<visOffset:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisAnchor: /<visAnchor:[ ]?(\[(?:0|1|0?\.\d+),[ ]?(?:0|1|0?\.\d+)])>/gi,
  VisRotate: /<visRotate>/gi,
  VisScale: /<visScale:[ ]?(\[-?\d+(?:\.\d+)?,[ ]?-?\d+(?:\.\d+)?])>/gi,
  VisZ: /<visZ:[ ]?(-?\d+)>/gi,
  VisDebug: /<visDebug>/gi,

  // visual directional metadata (cardinals U/D/L/R; diagonals UR/UL/DR/DL).
  VisOffsetU: /<visOffsetU:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetD: /<visOffsetD:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetL: /<visOffsetL:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetR: /<visOffsetR:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetUR: /<visOffsetUR:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetUL: /<visOffsetUL:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetDR: /<visOffsetDR:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,
  VisOffsetDL: /<visOffsetDL:[ ]?(\[-?\d+,[ ]?-?\d+])>/gi,

  // cast preview (skill-level).
  NoCastPreviewSkill: /<noCastPreview>/gi,
  CastPreviewWarnAt: /<castPreviewWarnAt:[ ]?(\d+)>/gi,
  //endregion ON SKILLS

  //region ON EQUIPS
  // skill-related.
  SkillId: /<skillId:[ ]?(\d+)>/gi,
  OffhandSkillId: /<offhandSkillId:[ ]?(\d+)>/gi,

  // knockback-related.
  KnockbackResist: /<knockbackResist:[ ]?(\d+)>/gi,

  // parry-related.
  IgnoreParry: /<ignoreParry:[ ]?(\d+)>/gi,
  //endregion ON EQUIPS

  //region ON ITEMS
  UseOnPickup: /<useOnPickup>/gi,
  Expires: /<expires:[ ]?(\d+)>/gi,
  // marks an item as a tool (hookshot, bomb, etc.) for the tool slot; without
  // this tag, regular consumables land in the usable-item slot instead.
  JabsTool: /<jabsTool>/i,
  //endregion ON ITEMS

  //region ON STATES
  // definition-related.
  Negative: /<negative>/gi,

  // function-related.
  ReapplyType: /<stackType:[ ]?(refresh|extend|stack)>/gi,

  ReapplyRefreshDiminish: /<stateRefreshDiminish:[ ]?(-?\d+)>/gi,
  ReapplyRefreshReset: /<stateRefreshReset:[ ]?(\d+)>/gi,

  ReapplyExtendAmount: /<stackExtendAmount:[ ]?(\d+)>/gi,
  ReapplyExtendMax: /<stackExtendMax:[ ]?(\d+)>/gi,

  ReapplyStackMax: /<stackMax:[ ]?(\d+)>/gi,
  StateApplicationAmount: /<applyStacks:[ ]?(\d+)>/gi,
  LoseAllStacksAtOnce: /<loseAllStacksAtOnce>/gi,
  SkillTransform: /<skillTransform:[ ]?(\[\d+,[ ]?\d+])>/gi,

  // jabs core ailment functionalities.
  Paralyzed: /<paralyzed>/gi,
  Rooted: /<rooted>/gi,
  Disabled: /<disabled>/gi,
  Muted: /<muted>/gi,

  // aggro-related.
  AggroLock: /<aggroLock>/gi,
  AggroOutAmp: /<aggroOutAmp:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,
  AggroInAmp: /<aggroInAmp:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,

  // slip hp/mp/tp effects.
  SlipHpFlat: /<hpFlat:[ ]?(-?\d+)>/gi,
  SlipMpFlat: /<mpFlat:[ ]?(-?\d+)>/gi,
  SlipTpFlat: /<tpFlat:[ ]?(-?\d+)>/gi,
  SlipHpPercent: /<hpPercent:[ ]?(-?\d+)%?>/gi,
  SlipMpPercent: /<mpPercent:[ ]?(-?\d+)%?>/gi,
  SlipTpPercent: /<tpPercent:[ ]?(-?\d+)%?>/gi,
  SlipHpFormula: /<hpFormula:\[([+\-*/ ().\w]+)]>/gi,
  SlipMpFormula: /<mpFormula:\[([+\-*/ ().\w]+)]>/gi,
  SlipTpFormula: /<tpFormula:\[([+\-*/ ().\w]+)]>/gi,

  // state duration-related.
  StateDuration: /<stateDuration:[ ]?(\d+)>/i,
  StateDurationSec: /<stateDurationSec:[ ]?(\d+)>/i,
  IndefiniteState: /<indefiniteState>/i,
  StateDurationFlatPlus: /<stateDurationFlat:[ ]?([-+]?\d+)>/gi,
  StateDurationPercentPlus: /<stateDurationPerc:[ ]?([-+]?\d+)>/gi,
  StateDurationFormulaPlus: /<stateDurationFormula:\[([+\-*/ ().\w]+)]>/gi,
  //endregion ON STATES

  //region ON BATTLERS
  // core concepts.
  EnemyId: /<enemyId:[ ]?(\d+)>/i,
  TeamId: /<teamId:[ ]?(\d+)>/g,
  Sight: /<sight:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,
  Pursuit: /<pursuit:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,
  GuardRange: /<guardRange:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,
  MoveSpeed: /<moveSpeed:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,
  PrepareTime: /<prepare:[ ]?(\d+)>/i,

  // bonus concepts.
  VisionMultiplier: /<visionMultiplier:[ ]?(-?\d+)>/i,

  // alert-related.
  AlertDuration: /<alertDuration:[ ]?(\d+)>/i,
  AlertedSightBoost: /<alertedSightBoost:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,
  AlertedPursuitBoost: /<alertedPursuitBoost:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/i,

  // ai traits.
  AiTraitCareful: /<aiTrait:[ ]?careful>/i,
  AiTraitExecutor: /<aiTrait:[ ]?executor>/i,
  AiTraitReckless: /<aiTrait:[ ]?reckless>/i,
  AiTraitHealer: /<aiTrait:[ ]?healer>/i,
  AiTraitCleanser: /<aiTrait:[ ]?cleanser>/i,
  AiTraitBuffer: /<aiTrait:[ ]?buffer>/i,
  AiTraitTactical: /<aiTrait:[ ]?tactical>/i,
  AiTraitBerserker: /<aiTrait:[ ]?berserker>/i,

  // legacy coordination traits (backward compat aliases for jabsRole).
  AiTraitFollower: /<aiTrait:[ ]?follower>/i,
  AiTraitLeader: /<aiTrait:[ ]?leader>/i,

  // battler roles — structural position in group coordination.
  AiRoleLeader: /<aiRole:[ ]?leader>/i,
  AiRoleFollower: /<aiRole:[ ]?follower>/i,
  AiRoleGuardian: /<aiRole:[ ]?guardian>/i,
  AiRoleWard: /<aiRole:[ ]?ward>/i,
  AiRoleSolo: /<aiRole:[ ]?solo>/i,
  AiRoleSentinel: /<aiRole:[ ]?sentinel>/i,

  // miscellaneous combat configurables.
  ConfigNoIdle: /<jabsConfig:[ ]?noIdle>/i,
  ConfigCanIdle: /<jabsConfig:[ ]?canIdle>/i,
  ConfigNoHpBar: /<jabsConfig:[ ]?noHpBar>/i,
  ConfigShowHpBar: /<jabsConfig:[ ]?showHpBar>/i,
  ConfigShowStates: /<jabsConfig:[ ]?showStates>/i,
  ConfigHideStates: /<jabsConfig:[ ]?hideStates>/i,
  ConfigInanimate: /<jabsConfig:[ ]?inanimate>/i,
  ConfigNotInanimate: /<jabsConfig[ ]?:notInanimate>/i,
  ConfigInvincible: /<jabsConfig:[ ]?invincible>/i,
  ConfigNotInvincible: /<jabsConfig:[ ]?notInvincible>/i,
  ConfigNoName: /<jabsConfig:[ ]?noName>/i,
  ConfigShowName: /<jabsConfig:[ ]?showName>/i,

  // cast preview (battler-level: all skills from this battler).
  NoCastPreviewsBattler: /<noCastPreviews>/gi,

  // counter-related (on-chance-effect)
  OnOwnDefeat: /<onOwnDefeat:[ ]?(\[\d+,?[ ]?\d+?])>/gi,
  OnTargetDefeat: /<onTargetDefeat:[ ]?(\[\d+,?[ ]?\d+?])>/gi,

  /**
   * Percent damage bonus per negative state (jabsNegative) currently active on the target.
   * All PerDebuffBuff values from getAllNotes() are summed, then multiplied by the debuff count.
   * Applied before guard reduction in the damage pipeline.
   *
   * <pre>
   * Structure:
   *  <perDebuffBuff:N>
   *
   * Example:
   *  <perDebuffBuff:5>
   *
   * Translation:
   *  +5% damage for every negative state active on the target.
   * </pre>
   * @type {RegExp}
   */
  PerDebuffBuff: /<perDebuffBuff:[ ]?(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)>/gi,

  /**
   * Flat percent damage bonus applied when the target has a specific state active.
   * Reads from getAllNotes(). Multiple tags for different state ids each fire independently.
   * Applied before guard reduction in the damage pipeline.
   *
   * <pre>
   * Structure:
   *  <bonusDamageIfState:[STATE_ID, PCT]>
   *
   * Example:
   *  <bonusDamageIfState:[14, 25]>
   *
   * Translation:
   *  +25% damage if the target currently has state 14 active.
   * </pre>
   * @type {RegExp}
   */
  BonusDamageIfState: /<bonusDamageIfState:[ ]?(\[\d+,[ ]?\d+])>/gi,

  /**
   * Flat tile addition applied to radius, proximity, and thickness before the rate multiplier.
   * Signed decimal; negative values shrink reach. Reads from getAllNotes().
   *
   * <pre>
   * Structure:
   *  <rangeBuff:N>
   *
   * Example:
   *  <rangeBuff:2>
   *
   * Translation:
   *  Adds 2 tiles flat to every outgoing action's radius, proximity, and thickness.
   * </pre>
   * @type {RegExp}
   */
  RangeBuff: /<rangeBuff:[ ]?(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)>/gi,

  /**
   * Multiplicative rate applied to radius, proximity, and thickness after the buff step.
   * Base-1.0 delta model: each tag contributes (N - 1.0) to the accumulator.
   * Reads from getAllNotes().
   *
   * <pre>
   * Structure:
   *  <rangeRate:N>
   *
   * Example:
   *  <rangeRate:1.5>
   *
   * Translation:
   *  All outgoing actions have 1.5x radius, proximity, and thickness.
   *  A second <rangeRate:1.5> stacks to 2.0x (each contributes +0.5 to the accumulator).
   * </pre>
   * @type {RegExp}
   */
  RangeRate: /<rangeRate:[ ]?((0|([1-9][0-9]*))(\.[0-9]+)?)>/gi,

  /**
   * Passive/state/equip skill history damage bonus.
   * Reads from getAllNotes(); applies to every attack by the bearer.
   * TYPE_ID = 0 is the sentinel for "any skill type".
   *
   * <pre>
   * Structure:
   *  <skillHistoryBonus:[TYPE_ID, WINDOW, PCT, COUNT_MODE]>
   *
   * Example:
   *  <skillHistoryBonus:[0, 10, 5, unique]>
   *
   * Translation:
   *  +5% damage per unique skill used in the last 10 seconds (any type).
   *  COUNT_MODE values: all | unique | streak | distinct_types
   * </pre>
   * @type {RegExp}
   */
  SkillHistoryBonus: /<skillHistoryBonus:[ ]?(\[\d+,[ ]?\d+,[ ]?\d+,[ ]?[a-z_]+])>/gi,

  /**
   * Per-skill history damage bonus; only fires when this specific skill is the action.
   * Reads from this.item(). History scope is limited to this skill's own id.
   *
   * <pre>
   * Structure:
   *  <thisSkillHistoryBonus:[WINDOW, PCT, COUNT_MODE]>
   *
   * Example:
   *  <thisSkillHistoryBonus:[3, 8, streak]>
   *
   * Translation:
   *  +8% damage per consecutive cast of this skill in the last 3 seconds.
   *  COUNT_MODE values: all | unique | streak | distinct_types
   * </pre>
   * @type {RegExp}
   */
  ThisSkillHistoryBonus: /<thisSkillHistoryBonus:[ ]?(\[\d+,[ ]?\d+,[ ]?[a-z_]+])>/gi,

  /**
   * Percent direct damage bonus per second of resolved cast time on the action.
   * Reads from getAllNotes() on the caster. Stacks additively with thisCastTimeDamageBonus.
   *
   * <pre>
   * Structure:
   *  <castTimeDamageBonus:N>
   *
   * Example:
   *  <castTimeDamageBonus:12>
   *
   * Translation:
   *  +12% direct damage per second spent casting (e.g. 3s cast → +36%).
   * </pre>
   * @type {RegExp}
   */
  CastTimeDamageBonus: /<castTimeDamageBonus:[ ]?(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)>/gi,

  /**
   * Per-skill cast-time direct damage bonus; only fires when this specific skill resolves.
   * Reads from this.item() note. Stacks additively with castTimeDamageBonus sources.
   *
   * <pre>
   * Structure:
   *  <thisCastTimeDamageBonus:N>
   *
   * Example:
   *  <thisCastTimeDamageBonus:20>
   *
   * Translation:
   *  +20% direct damage per second of this skill's resolved cast time.
   * </pre>
   * @type {RegExp}
   */
  ThisCastTimeDamageBonus: /<thisCastTimeDamageBonus:[ ]?(-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?)>/gi,
  //endregion ON BATTLERS

  //region ON STATES (EXPIRY CHAIN)
  // when a state expires naturally, apply another state at a given percent chance.
  ApplyStateOnExpire: /<applyStateOnExpire:[ ]?(\[\d+,[ ]?\d+])>/gi,
  //endregion ON STATES (EXPIRY CHAIN)

  //region ON STATES (SPREAD)
  Spread: /<spread:[ ]?(\[\d+,[ ]?\d+])>/gi,
  Viral: /<viral>/gi,
  SpreadTick: /<spreadTick:(\d+)>/gi,
  SpreadPerTick: /<spreadPerTick:(\d+)>/gi,
  SpreadPreferUnafflicted: /<spreadPreferUnafflicted>/gi,
  SpreadSkipAfflicted: /<spreadSkipAfflicted>/gi,
  //endregion ON STATES (SPREAD)

  //region ON BATTLERS OR STATES
  Retaliate: /<retaliate:[ ]?(\[\d+,?[ ]?\d+?(?:,?[ ]?\w+)?])>/gi,
  //endregion ON BATTLERS OR STATES

  //region ON ACTORS/CLASSES
  ConfigNoSwitch: /<noSwitch>/i,
  ConfigAutoAssignSkills: /<autoAssignSkills>/gi,
  ConfigAutoUpgradeSkills: /<autoUpgradeSkills>/gi,
  BlacklistAutoAssignSkillType: /<noAutoAssignType:[ ]?(\[[\d, ]+])>/gi,
  //endregion ON ACTORS/CLASSES
};

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.Aliased = {
  DataManager: new Map(),

  Game_Actor: new Map(),
  Game_Action: new Map(),
  Game_ActionResult: new Map(),
  Game_Battler: new Map(),
  Game_Character: new Map(),
  Game_CharacterBase: new Map(),
  Game_Enemy: new Map(),
  Game_Event: new Map(),
  Game_Interpreter: new Map(),
  JABS_Battler: new Map(),
  Game_Map: new Map(),
  Game_Party: new Map(),
  Game_Player: new Map(),
  Game_Switches: new Map(),
  Game_Unit: new Map(),

  RPG_Actor: new Map(),
  RPG_Enemy: new Map(),
  RPG_Skill: new Map(),

  Scene_Load: new Map(),
  Scene_Map: new Map(),

  Sprite_Animation: new Map(),
  Sprite_AnimationMV: new Map(),
  Spriteset_Map: new Map(),
  Sprite_Character: new Map(),
  Sprite_Gauge: new Map(),
};
//endregion Plugin setup & configuration
//endregion Metadata