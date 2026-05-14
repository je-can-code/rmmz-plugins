/* eslint-disable max-len */
//region Metadata
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

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
  J.ABS.Metadata.ExternalConfig = parsedConfig;
  J.ABS.Metadata.Teams = parsedConfig.teams;

  // return the parsed root blob.
  return parsedConfig;
};
//endregion helpers

//region metadata
/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.Metadata = {};
J.ABS.Metadata.Name = 'J-ABS';
J.ABS.Metadata.Version = '4.11.0';

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.PluginParameters = PluginManager.parameters(J.ABS.Metadata.Name);

// the most important configuration!
J.ABS.Metadata.MaxAiUpdateRange = Number(J.ABS.PluginParameters['maxAiUpdateRange']) || 20;

// defaults configurations.
J.ABS.Metadata.DefaultActionMapId = Number(J.ABS.PluginParameters['actionMapId']);
J.ABS.Metadata.DefaultEnemyMapId = Number(J.ABS.PluginParameters['enemyMapId']);
J.ABS.Metadata.DefaultDodgeSkillTypeId = Number(J.ABS.PluginParameters['dodgeSkillTypeId']);
J.ABS.Metadata.DefaultGuardSkillTypeId = Number(J.ABS.PluginParameters['guardSkillTypeId']);
J.ABS.Metadata.DefaultWeaponSkillTypeId = Number(J.ABS.PluginParameters['weaponSkillTypeId']);
J.ABS.Metadata.DefaultToolCooldownTime = Number(J.ABS.PluginParameters['defaultToolCooldownTime']);
J.ABS.Metadata.DefaultAttackAnimationId = Number(J.ABS.PluginParameters['defaultAttackAnimationId']);
J.ABS.Metadata.DefaultLootExpiration = Number(J.ABS.PluginParameters['defaultLootExpiration']);

// AI combo follow-up pacing: random percentile within the link window (combo delay .. cooldown tag).
J.ABS.Metadata.AiComboHumanizeWindowMinPercent = 0.1;
J.ABS.Metadata.AiComboHumanizeWindowMaxPercent = 0.3;

// AI defensive dodge interrupt (MVP): threat radius in tile-ish units (see distanceToPoint), roll vs chance, cooldown frames.
J.ABS.Metadata.AiDefensiveDodgeChancePercent = 75;
J.ABS.Metadata.AiDefensiveDodgeCooldownFrames = 45;
J.ABS.Metadata.AiDefensiveThreatRadiusTiles = 3;

// Ally AI defensive guard (offhand guard skill): raise uses defensive threat radius; hold uses tighter distance + max hold.
// Below this hp fraction (0–1) ally ai may roll a raise; use 1 to ignore hp (always eligible when threatened).
J.ABS.Metadata.AiAllyDefensiveGuardHpThresholdPercent = 0.55;
J.ABS.Metadata.AiAllyDefensiveGuardChancePercent = 40;
// After a forced or natural guard drop, earliest frame ally AI may roll another raise (not a hold timer — guard is a toggle).
J.ABS.Metadata.AiAllyDefensiveGuardCooldownFrames = 30;
// Drop held guard after this many frames so allies peek out of block in crowded melee (guard has no resource cooldown).
J.ABS.Metadata.AiAllyDefensiveGuardMaxHoldFrames = 120;
// Hold guard only while the closest hostile is within this tile-ish distance; wider clusters no longer justify turtling.
J.ABS.Metadata.AiAllyDefensiveGuardMaintainMaxTiles = 2.35;

// enemy battler default enemy setup configurations.
J.ABS.Metadata.DefaultEnemyPrepareTime = Number(J.ABS.PluginParameters['defaultEnemyPrepareTime']);
J.ABS.Metadata.DefaultEnemyAttackSkillId = Number(J.ABS.PluginParameters['defaultEnemyAttackSkillId']);
J.ABS.Metadata.DefaultEnemySightRange = Number(J.ABS.PluginParameters['defaultEnemySightRange']);
J.ABS.Metadata.DefaultEnemyPursuitRange = Number(J.ABS.PluginParameters['defaultEnemyPursuitRange']);
J.ABS.Metadata.DefaultEnemyAlertedSightBoost = Number(J.ABS.PluginParameters['defaultEnemyAlertedSightBoost']);
J.ABS.Metadata.DefaultEnemyAlertedPursuitBoost = Number(J.ABS.PluginParameters['defaultEnemyAlertedPursuitBoost']);
J.ABS.Metadata.DefaultEnemyAlertDuration = Number(J.ABS.PluginParameters['defaultEnemyAlertDuration']);
J.ABS.Metadata.DefaultEnemyCanIdle = Boolean(J.ABS.PluginParameters['defaultEnemyCanIdle'] === 'true');
J.ABS.Metadata.DefaultEnemyShowHpBar = Boolean(J.ABS.PluginParameters['defaultEnemyShowHpBar'] === 'true');
J.ABS.Metadata.DefaultEnemyShowBattlerName = Boolean(J.ABS.PluginParameters['defaultEnemyShowBattlerName'] === 'true');
J.ABS.Metadata.DefaultEnemyIsInvincible = Boolean(J.ABS.PluginParameters['defaultEnemyIsInvincible'] === 'true');
J.ABS.Metadata.DefaultEnemyIsInanimate = Boolean(J.ABS.PluginParameters['defaultEnemyIsInanimate'] === 'true');

// custom data configurations.
J.ABS.Metadata.UseElementalIcons = J.ABS.PluginParameters['useElementalIcons'] === 'true';
J.ABS.Metadata.ElementalIcons = J.ABS.Helpers.PluginManager.TranslateElementalIcons(J.ABS.PluginParameters['elementalIconData']);

// external data configurations.
J.ABS.Helpers.loadExternalConfig();

// action decided configurations.
J.ABS.Metadata.AttackDecidedAnimationId = Number(J.ABS.PluginParameters['attackDecidedAnimationId']);
J.ABS.Metadata.SupportDecidedAnimationId = Number(J.ABS.PluginParameters['supportDecidedAnimationId']);

// aggro configurations.
J.ABS.Metadata.BaseAggro = Number(J.ABS.PluginParameters['baseAggro']);
J.ABS.Metadata.AggroPerHp = Number(J.ABS.PluginParameters['aggroPerHp']);
J.ABS.Metadata.AggroPerMp = Number(J.ABS.PluginParameters['aggroPerMp']);
J.ABS.Metadata.AggroPerTp = Number(J.ABS.PluginParameters['aggroPerTp']);
J.ABS.Metadata.AggroDrain = Number(J.ABS.PluginParameters['aggroDrainMultiplier']);
J.ABS.Metadata.AggroParryFlatAmount = Number(J.ABS.PluginParameters['aggroParryFlatAmount']);
J.ABS.Metadata.AggroParryUserGain = Number(J.ABS.PluginParameters['aggroParryUserGain']);
J.ABS.Metadata.AggroPlayerReduction = Number(J.ABS.PluginParameters['aggroPlayerReduction']);

// state configurations.
J.ABS.Metadata.DefaultStateReapplyType = J.ABS.PluginParameters['defaultStateReapplyType'] || JABS_State.reapplicationType.Refresh;

J.ABS.Metadata.DefaultStateRefreshDiminish = Number(J.ABS.PluginParameters['defaultStateRefreshDiminish']) || 120;
J.ABS.Metadata.DefaultStateRefreshReset = Number(J.ABS.PluginParameters['defaultStateRefreshReset']) || 900;

J.ABS.Metadata.DefaultStateExtendAmount = Number(J.ABS.PluginParameters['defaultStateExtendAmount']) || 180;
J.ABS.Metadata.DefaultStateExtendMax = Number(J.ABS.PluginParameters['defaultStateExtendMax']) || 216000;

J.ABS.Metadata.DefaultStateStackMax = Number(J.ABS.PluginParameters['defaultStateStackMax']) || 5;
J.ABS.Metadata.DefaultStateApplicationCount = Number(J.ABS.PluginParameters['defaultStateApplicationCount']) || 1;
J.ABS.Metadata.DefaultStateLoseAllStacksAtOnce = (J.ABS.PluginParameters['defaultStateLoseAllStacksAtOnce'] === 'true') || false;

// miscellaneous configurations.
J.ABS.Metadata.LootPickupRange = Number(J.ABS.PluginParameters['lootPickupDistance']);
J.ABS.Metadata.AllyRubberbandAdjustment = Number(J.ABS.PluginParameters['allyRubberbandAdjustment']);
J.ABS.Metadata.DashSpeedBoost = Number(J.ABS.PluginParameters['dashSpeedBoost']);
J.ABS.Metadata.HitboxOverlaysInitiallyVisible = (J.ABS.PluginParameters['hitboxOverlaysInitiallyVisible'] === 'true');

const hitboxMeleeOxRaw = J.ABS.PluginParameters['hitboxMeleeOriginOffsetPxX'];
const hitboxMeleeOyRaw = J.ABS.PluginParameters['hitboxMeleeOriginOffsetPxY'];
J.ABS.Metadata.HitboxMeleeOriginOffsetPxX = Number(hitboxMeleeOxRaw);
if (!Number.isFinite(J.ABS.Metadata.HitboxMeleeOriginOffsetPxX))
{
  J.ABS.Metadata.HitboxMeleeOriginOffsetPxX = 0;
}
J.ABS.Metadata.HitboxMeleeOriginOffsetPxY = Number(hitboxMeleeOyRaw);
if (!Number.isFinite(J.ABS.Metadata.HitboxMeleeOriginOffsetPxY))
{
  J.ABS.Metadata.HitboxMeleeOriginOffsetPxY = -10;
}

const hitboxMeleeExtraDownRaw = J.ABS.PluginParameters['hitboxMeleeOriginExtraPxYFacingDown'];
const hitboxMeleeExtraUpRaw = J.ABS.PluginParameters['hitboxMeleeOriginExtraPxYFacingUp'];
J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingDown = Number(hitboxMeleeExtraDownRaw);
if (!Number.isFinite(J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingDown))
{
  J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingDown = 0;
}
J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingUp = Number(hitboxMeleeExtraUpRaw);
if (!Number.isFinite(J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingUp))
{
  J.ABS.Metadata.HitboxMeleeOriginExtraPxYFacingUp = 0;
}

const hitboxMeleeLiftRedDownRaw = J.ABS.PluginParameters['hitboxMeleeOriginLiftReductionPxFacingDown'];
J.ABS.Metadata.HitboxMeleeOriginLiftReductionPxFacingDown = Number(hitboxMeleeLiftRedDownRaw);
if (!Number.isFinite(J.ABS.Metadata.HitboxMeleeOriginLiftReductionPxFacingDown))
{
  J.ABS.Metadata.HitboxMeleeOriginLiftReductionPxFacingDown = 28;
}

// disengage configurations.
J.ABS.Metadata.ShowDisengageBalloon = (J.ABS.PluginParameters['showDisengageBalloon'] === 'true');
J.ABS.Metadata.DisengageBalloonId = Number(J.ABS.PluginParameters['disengageBalloonId']) || 7;

// guard / parry visuals.
const parryCharacterAnimationRaw = J.ABS.PluginParameters['parryCharacterAnimationId'];
const parryCharacterAnimationParsed = Number(parryCharacterAnimationRaw);
J.ABS.Metadata.ParryCharacterAnimationId = (Number.isFinite(parryCharacterAnimationParsed)
  && parryCharacterAnimationParsed >= 0)
  ? Math.floor(parryCharacterAnimationParsed)
  : 122;

const implicitParryDomRaw = J.ABS.PluginParameters['implicitParryDominanceMultiplier'];
const implicitParryDomParsed = Number(implicitParryDomRaw);
J.ABS.Metadata.ImplicitParryDominanceMultiplier = (Number.isFinite(implicitParryDomParsed) && implicitParryDomParsed > 1)
  ? implicitParryDomParsed
  : 2;

const implicitParryBaselineFloorRaw = J.ABS.PluginParameters['implicitParryBaselineFloor'];
const implicitParryBaselineFloorParsed = Number(implicitParryBaselineFloorRaw);
J.ABS.Metadata.ImplicitParryBaselineFloor = (Number.isFinite(implicitParryBaselineFloorParsed) && implicitParryBaselineFloorParsed >= 0)
  ? implicitParryBaselineFloorParsed
  : 50;

const implicitParryBaselinePerLevelRaw = J.ABS.PluginParameters['implicitParryBaselinePerLevel'];
const implicitParryBaselinePerLevelParsed = Number(implicitParryBaselinePerLevelRaw);
J.ABS.Metadata.ImplicitParryBaselinePerLevel = (Number.isFinite(implicitParryBaselinePerLevelParsed) && implicitParryBaselinePerLevelParsed >= 0)
  ? implicitParryBaselinePerLevelParsed
  : 0.25;

// quick menu commands configurations.
J.ABS.Metadata.EquipCombatSkillsText = J.ABS.PluginParameters['equipCombatSkillsText'];
J.ABS.Metadata.EquipDodgeSkillsText = J.ABS.PluginParameters['equipDodgeSkillsText'];
J.ABS.Metadata.EquipOffhandText = J.ABS.PluginParameters['equipOffhandText'];
J.ABS.Metadata.EquipToolsText = J.ABS.PluginParameters['equipToolsText'];
J.ABS.Metadata.MainMenuText = J.ABS.PluginParameters['mainMenuText'];
J.ABS.Metadata.CancelText = J.ABS.PluginParameters['cancelText'];
J.ABS.Metadata.ClearSlotText = J.ABS.PluginParameters['clearSlotText'];
J.ABS.Metadata.UnassignedText = J.ABS.PluginParameters['unassignedText'];

/**
 * Global cooldown (GCD) plugin state: master switch, default duration in frames, and whitelist of skill {@code stypeId} values.
 * {@link J.ABS.Metadata.GlobalCooldownSkillTypeSet} is built from {@code globalCooldownSkillTypes} as JSON array or comma-separated legacy text.
 */
// global cooldown (GCD) configurations.
J.ABS.Metadata.EnableGlobalCooldown = J.ABS.PluginParameters['enableGlobalCooldown'] === 'true';
J.ABS.Metadata.GlobalCooldownFrames = Number(J.ABS.PluginParameters['globalCooldownFrames']) || 30;
(() =>
{
  const raw = J.ABS.PluginParameters['globalCooldownSkillTypes'] ?? '';
  const set = new Set();
  const ingest = v =>
  {
    const n = parseInt(String(v), 10);
    if (Number.isFinite(n))
    {
      set.add(n);
    }
  };
  const str = String(raw)
    .trim();
  if (str.startsWith('['))
  {
    try
    {
      const arr = JSON.parse(str);
      if (Array.isArray(arr))
      {
        arr.forEach(ingest);
      }
    }
    catch (e)
    {
      console.warn('J-ABS: globalCooldownSkillTypes JSON parse failed.', e);
    }
  }
  else if (str.length)
  {
    str.split(',')
      .forEach(part => ingest(part.trim()));
  }
  J.ABS.Metadata.GlobalCooldownSkillTypeSet = set;
})();

J.ABS.Metadata.HitboxStyles = {
  // Base defaults used for all shapes unless overridden below.
  base: {
    // orange.
    fillColor: 0xFFA500,
    fillAlpha: 0.35,
    lineColor: 0xE08000,
    lineAlpha: 0.9,
    lineWidth: 2,
  },

  // Optional per-shape overrides.
  byShape: {
    circle: {
      // coral.
      fillColor: 0xFF7F50,
    },
    rhombus: {
      // light orange.
      fillColor: 0xFFD580,
    },
    square: {
      // darker orange.
      fillColor: 0xFFA64D,
    },
    line: {
      lineWidth: 3,
    },
    wall: {
      lineColor: 0xCC6600,
    },
    cross: {
      fillAlpha: 0.25,
    },
    arc: {
      fillColor: 0xFFB84D,
    },
  },


  // Battler overrides by kind (player/follower/battler)
  byKind:
    {
      player: {
        fillColor: 0x4DA3FF,
        lineColor: 0x2368CC,
        fillAlpha: 0.25
      },
      follower: { fillColor: 0x9B59B6 },
      battler: { fillColor: 0x2ECC71 },
    },

  // New: state-based overrides layered last (e.g., for collision highlighting)
  byState:
    {
      colliding:
        {
          // bright red while overlapping an action.
          fillColor: 0xFF3B30,
          fillAlpha: 0.35,
          lineColor: 0xC12722,
          lineWidth: 3,
        },
    },
};

J.ABS.Metadata.HitboxPulse = {
  enabled: J.ABS.PluginParameters['hitboxPulseEnabled'] !== 'false',
  highlightColliderBattlers: J.ABS.PluginParameters['hitboxPulseHighlightColliders'] !== 'false',
  useFadeAnimation: J.ABS.PluginParameters['hitboxPulseUseFadeAnimation'] === 'true',
  maxConcurrentPulses: 8,
  duration: 18,
  startAlpha: 0.22,
  endAlpha: 0.00,
  scaleStart: 1.00,
  scaleEnd: 1.08,
  lineColor: 0xFFFFFF,
  lineAlpha: 0.85,
  lineWidth: 2,
  fillColor: 0xFFFFFF,
  fillAlpha: 0.18,
  // PIXI.BLEND_MODES.NORMAL or ADD
  blendMode: PIXI.BLEND_MODES.ADD,
};
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
  SizeInPixels: /<size:[ ]?(\d+)>/gi,
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
  //endregion ON BATTLERS

  //region ON BATTLERS OR STATES
  Retaliate: /<retaliate:[ ]?(\[\d+,?[ ]?\d+?])>/gi,
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
  Game_Interpreter: {},
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