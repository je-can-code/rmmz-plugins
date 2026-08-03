//region plugin metadata
class J_AbsPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps plugin parameters and external config into metadata fields.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    this.initializeCoreRangeMetadata();
    this.initializeDefaultMapAndSkillMetadata();
    this.initializeAiTuningMetadata();
    this.initializeEnemyDefaultMetadata();
    this.initializeElementalIconMetadata();
    this.initializeActionDecidedMetadata();
    this.initializeAggroMetadata();
    this.initializeChannelMetadata();
    this.initializeStateMetadata();
    this.initializeMiscMovementMetadata();
    this.initializeHitboxMeleeOriginMetadata();
    this.initializeDisengageMetadata();
    this.initializeParryMetadata();
    this.initializeQuickMenuTextMetadata();
    this.initializeGlobalCooldownMetadata();
    this.initializeSkillExecutionMetadata();
    this.initializeHitboxOverlayStyleMetadata();
    this.initializeMapAfflictionMetadata();
  }

  /**
   * Maps the AI update range cap from plugin parameters.
   */
  initializeCoreRangeMetadata()
  {
    // the most important configuration!
    this.MaxAiUpdateRange = Number(this.parsedPluginParameters['maxAiUpdateRange']) || 20;
  }

  /**
   * Maps default map ids, skill type ids, and shared combat defaults from plugin parameters.
   */
  initializeDefaultMapAndSkillMetadata()
  {
    this.DefaultActionMapId = Number(this.parsedPluginParameters['actionMapId']);
    this.DefaultEnemyMapId = Number(this.parsedPluginParameters['enemyMapId']);
    this.DefaultDodgeSkillTypeId = Number(this.parsedPluginParameters['dodgeSkillTypeId']);
    // assign default guard skill type id on this instance for callers.
    this.DefaultGuardSkillTypeId = Number(this.parsedPluginParameters['guardSkillTypeId']);
    this.DefaultWeaponSkillTypeId = Number(this.parsedPluginParameters['weaponSkillTypeId']);
    this.DefaultToolCooldownTime = Number(this.parsedPluginParameters['defaultToolCooldownTime']);
    // assign default attack animation id on this instance for callers.
    this.DefaultAttackAnimationId = Number(this.parsedPluginParameters['defaultAttackAnimationId']);
    this.DefaultLootExpiration = Number(this.parsedPluginParameters['defaultLootExpiration']);
  }

  /**
   * Maps AI combo pacing and defensive behavior tuning defaults.
   */
  initializeAiTuningMetadata()
  {
    // AI combo follow-up pacing: random percentile within the link window (combo delay .. cooldown tag).
    this.AiComboHumanizeWindowMinPercent = 0.1;
    this.AiComboHumanizeWindowMaxPercent = 0.3;

    // AI defensive dodge interrupt (MVP): threat radius in tile-ish units (see distanceToPoint), roll vs chance, cooldown frames.
    this.AiDefensiveDodgeChancePercent = 75;
    this.AiDefensiveDodgeCooldownFrames = 45;
    this.AiDefensiveThreatRadiusTiles = 3;

    // Ally AI defensive guard (offhand guard skill): raise uses defensive threat radius; hold uses tighter distance + max hold.
    // Below this hp fraction (0–1) ally ai may roll a raise; use 1 to ignore hp (always eligible when threatened).
    this.AiAllyDefensiveGuardHpThresholdPercent = 0.55;
    this.AiAllyDefensiveGuardChancePercent = 40;
    // After a forced or natural guard drop, earliest frame ally AI may roll another raise (not a hold timer — guard is a toggle).
    this.AiAllyDefensiveGuardCooldownFrames = 30;
    // Drop held guard after this many frames so allies peek out of block in crowded melee (guard has no resource cooldown).
    this.AiAllyDefensiveGuardMaxHoldFrames = 120;
    // Hold guard only while the closest hostile is within this tile-ish distance; wider clusters no longer justify turtling.
    this.AiAllyDefensiveGuardMaintainMaxTiles = 2.35;
  }

  /**
   * Maps default enemy battler setup fields from plugin parameters.
   */
  initializeEnemyDefaultMetadata()
  {
    this.DefaultEnemyPrepareTime = Number(this.parsedPluginParameters['defaultEnemyPrepareTime']);
    this.DefaultEnemyAttackSkillId = Number(this.parsedPluginParameters['defaultEnemyAttackSkillId']);
    this.DefaultEnemySightRange = Number(this.parsedPluginParameters['defaultEnemySightRange']);
    // assign default enemy pursuit range on this instance for callers.
    this.DefaultEnemyPursuitRange = Number(this.parsedPluginParameters['defaultEnemyPursuitRange']);
    this.DefaultEnemyAlertedSightBoost = Number(this.parsedPluginParameters['defaultEnemyAlertedSightBoost']);
    this.DefaultEnemyAlertedPursuitBoost = Number(this.parsedPluginParameters['defaultEnemyAlertedPursuitBoost']);
    // assign default enemy alert duration on this instance for callers.
    this.DefaultEnemyAlertDuration = Number(this.parsedPluginParameters['defaultEnemyAlertDuration']);
    this.DefaultEnemyCanIdle = Boolean(this.parsedPluginParameters['defaultEnemyCanIdle'] === 'true');
    this.DefaultEnemyShowHpBar = Boolean(this.parsedPluginParameters['defaultEnemyShowHpBar'] === 'true');
    // assign default enemy show battler name on this instance for callers.
    this.DefaultEnemyShowBattlerName = Boolean(this.parsedPluginParameters['defaultEnemyShowBattlerName'] === 'true');
    this.DefaultEnemyIsInvincible = Boolean(this.parsedPluginParameters['defaultEnemyIsInvincible'] === 'true');
    this.DefaultEnemyIsInanimate = Boolean(this.parsedPluginParameters['defaultEnemyIsInanimate'] === 'true');
  }

  /**
   * Maps elemental icon usage from plugin parameters.
   */
  initializeElementalIconMetadata()
  {
    this.UseElementalIcons = this.parsedPluginParameters['useElementalIcons'] === 'true';
    this.ElementalIcons = J.ABS.Helpers.PluginManager.TranslateElementalIcons(this.parsedPluginParameters['elementalIconData']);
  }

  /**
   * Maps decided-action animation ids from plugin parameters.
   */
  initializeActionDecidedMetadata()
  {
    this.AttackDecidedAnimationId = Number(this.parsedPluginParameters['attackDecidedAnimationId']);
    this.SupportDecidedAnimationId = Number(this.parsedPluginParameters['supportDecidedAnimationId']);
  }

  /**
   * Maps aggro formula coefficients from plugin parameters.
   */
  initializeAggroMetadata()
  {
    this.BaseAggro = Number(this.parsedPluginParameters['baseAggro']);
    this.AggroPerHp = Number(this.parsedPluginParameters['aggroPerHp']);
    this.AggroPerMp = Number(this.parsedPluginParameters['aggroPerMp']);
    // assign aggro per tp on this instance for callers.
    this.AggroPerTp = Number(this.parsedPluginParameters['aggroPerTp']);
    this.AggroDrain = Number(this.parsedPluginParameters['aggroDrainMultiplier']);
    this.AggroParryFlatAmount = Number(this.parsedPluginParameters['aggroParryFlatAmount']);
    // assign aggro parry user gain on this instance for callers.
    this.AggroParryUserGain = Number(this.parsedPluginParameters['aggroParryUserGain']);
    this.AggroPlayerReduction = Number(this.parsedPluginParameters['aggroPlayerReduction']);
  }

  /**
   * Maps channeling defaults from plugin parameters.
   */
  initializeChannelMetadata()
  {
    // fallback tick speed for a `<channel:[SKILL_ID, DURATION]>` skill that omits its own
    // `<channelTickSpeed:N>` override.
    this.DefaultChannelTickSpeed = Number(this.parsedPluginParameters['defaultChannelTickSpeed']) || 30;
  }

  /**
   * Maps default state reapplication and stacking rules from plugin parameters.
   */
  initializeStateMetadata()
  {
    this.DefaultStateReapplyType = this.parsedPluginParameters['defaultStateReapplyType'] || 'refresh';

    // assign default state refresh diminish on this instance for callers.
    this.DefaultStateRefreshDiminish = Number(this.parsedPluginParameters['defaultStateRefreshDiminish']) || 120;
    this.DefaultStateRefreshReset = Number(this.parsedPluginParameters['defaultStateRefreshReset']) || 900;
    this.DefaultStateSpreadTickInterval = Number(this.parsedPluginParameters['defaultStateSpreadTickInterval']) || 30;

    // assign the default/minimum state tick interval and natural regen type on this instance for callers.
    this.DefaultStateTickInterval = Number(this.parsedPluginParameters['defaultStateTickInterval']) || 60;
    this.MinimumStateTickInterval = Number(this.parsedPluginParameters['minimumStateTickInterval']) || 4;
    this.NaturalRegenTickType = this.parsedPluginParameters['naturalRegenTickType'] || 'regen';

    // assign default state extend amount on this instance for callers.
    this.DefaultStateExtendAmount = Number(this.parsedPluginParameters['defaultStateExtendAmount']) || 180;
    this.DefaultStateExtendMax = Number(this.parsedPluginParameters['defaultStateExtendMax']) || 216000;

    // assign default state stack max on this instance for callers.
    this.DefaultStateStackMax = Number(this.parsedPluginParameters['defaultStateStackMax']) || 5;
    this.DefaultStateApplicationCount = Number(this.parsedPluginParameters['defaultStateApplicationCount']) || 1;
    this.DefaultStateLoseAllStacksAtOnce = (this.parsedPluginParameters['defaultStateLoseAllStacksAtOnce'] === 'true') || false;
  }

  /**
   * Maps loot pickup, ally rubberband, dash boost, and overlay visibility from plugin parameters.
   */
  initializeMiscMovementMetadata()
  {
    this.LootPickupRange = Number(this.parsedPluginParameters['lootPickupDistance']);
    this.AllyRubberbandAdjustment = Number(this.parsedPluginParameters['allyRubberbandAdjustment']);
    this.DashSpeedBoost = Number(this.parsedPluginParameters['dashSpeedBoost']);
    // assign hitbox overlays initially visible on this instance for callers.
    this.HitboxOverlaysInitiallyVisible = (this.parsedPluginParameters['hitboxOverlaysInitiallyVisible'] === 'true');
  }

  /**
   * Maps melee hitbox origin offsets and facing adjustments from plugin parameters.
   */
  initializeHitboxMeleeOriginMetadata()
  {
    const hitboxMeleeOxRaw = this.parsedPluginParameters['hitboxMeleeOriginOffsetPxX'];
    const hitboxMeleeOyRaw = this.parsedPluginParameters['hitboxMeleeOriginOffsetPxY'];
    this.HitboxMeleeOriginOffsetPxX = Number(hitboxMeleeOxRaw);
    if (Number.isFinite(this.HitboxMeleeOriginOffsetPxX) === false)
    {
      this.HitboxMeleeOriginOffsetPxX = 0;
    }
    this.HitboxMeleeOriginOffsetPxY = Number(hitboxMeleeOyRaw);
    if (Number.isFinite(this.HitboxMeleeOriginOffsetPxY) === false)
    {
      this.HitboxMeleeOriginOffsetPxY = -10;
    }

    const hitboxMeleeExtraDownRaw = this.parsedPluginParameters['hitboxMeleeOriginExtraPxYFacingDown'];
    const hitboxMeleeExtraUpRaw = this.parsedPluginParameters['hitboxMeleeOriginExtraPxYFacingUp'];
    this.HitboxMeleeOriginExtraPxYFacingDown = Number(hitboxMeleeExtraDownRaw);
    if (Number.isFinite(this.HitboxMeleeOriginExtraPxYFacingDown) === false)
    {
      this.HitboxMeleeOriginExtraPxYFacingDown = 0;
    }
    this.HitboxMeleeOriginExtraPxYFacingUp = Number(hitboxMeleeExtraUpRaw);
    if (Number.isFinite(this.HitboxMeleeOriginExtraPxYFacingUp) === false)
    {
      this.HitboxMeleeOriginExtraPxYFacingUp = 0;
    }

    const hitboxMeleeLiftRedDownRaw = this.parsedPluginParameters['hitboxMeleeOriginLiftReductionPxFacingDown'];
    this.HitboxMeleeOriginLiftReductionPxFacingDown = Number(hitboxMeleeLiftRedDownRaw);
    if (Number.isFinite(this.HitboxMeleeOriginLiftReductionPxFacingDown) === false)
    {
      this.HitboxMeleeOriginLiftReductionPxFacingDown = 28;
    }
  }

  /**
   * Maps disengage balloon visibility from plugin parameters.
   */
  initializeDisengageMetadata()
  {
    this.ShowDisengageBalloon = (this.parsedPluginParameters['showDisengageBalloon'] === 'true');
    this.DisengageBalloonId = Number(this.parsedPluginParameters['disengageBalloonId']) || 7;
  }

  /**
   * Maps parry animation and implicit parry dominance tuning from plugin parameters.
   */
  initializeParryMetadata()
  {
    const parryCharacterAnimationRaw = this.parsedPluginParameters['parryCharacterAnimationId'];
    const parryCharacterAnimationParsed = Number(parryCharacterAnimationRaw);
    this.ParryCharacterAnimationId = 122;
    if (Number.isFinite(parryCharacterAnimationParsed) === true && parryCharacterAnimationParsed >= 0)
    {
      this.ParryCharacterAnimationId = Math.floor(parryCharacterAnimationParsed);
    }

    const implicitParryDomRaw = this.parsedPluginParameters['implicitParryDominanceMultiplier'];
    const implicitParryDomParsed = Number(implicitParryDomRaw);
    this.ImplicitParryDominanceMultiplier = 2;
    if (Number.isFinite(implicitParryDomParsed) === true && implicitParryDomParsed > 1)
    {
      this.ImplicitParryDominanceMultiplier = implicitParryDomParsed;
    }

    const implicitParryBaselineFloorRaw = this.parsedPluginParameters['implicitParryBaselineFloor'];
    const implicitParryBaselineFloorParsed = Number(implicitParryBaselineFloorRaw);
    this.ImplicitParryBaselineFloor = 50;
    if (Number.isFinite(implicitParryBaselineFloorParsed) === true && implicitParryBaselineFloorParsed >= 0)
    {
      this.ImplicitParryBaselineFloor = implicitParryBaselineFloorParsed;
    }

    const implicitParryBaselinePerLevelRaw = this.parsedPluginParameters['implicitParryBaselinePerLevel'];
    const implicitParryBaselinePerLevelParsed = Number(implicitParryBaselinePerLevelRaw);
    this.ImplicitParryBaselinePerLevel = 0.25;
    if (Number.isFinite(implicitParryBaselinePerLevelParsed) === true && implicitParryBaselinePerLevelParsed >= 0)
    {
      this.ImplicitParryBaselinePerLevel = implicitParryBaselinePerLevelParsed;
    }

    // the scale factor multiplies the raw parry formula output, keeping full negation rare.
    const implicitParryScaleFactorRaw = this.parsedPluginParameters['implicitParryScaleFactor'];
    const implicitParryScaleFactorParsed = Number(implicitParryScaleFactorRaw);
    this.ImplicitParryScaleFactor = 0.2;
    if (Number.isFinite(implicitParryScaleFactorParsed) === true
      && implicitParryScaleFactorParsed >= 0
      && implicitParryScaleFactorParsed <= 1)
    {
      this.ImplicitParryScaleFactor = implicitParryScaleFactorParsed;
    }

    // glancing blow dominance multiplier: the band width for the glancing check (independent of parry M).
    const glancingBlowDomRaw = this.parsedPluginParameters['glancingBlowDominanceMultiplier'];
    const glancingBlowDomParsed = Number(glancingBlowDomRaw);
    this.GlancingBlowDominanceMultiplier = 2;
    if (Number.isFinite(glancingBlowDomParsed) === true && glancingBlowDomParsed > 1)
    {
      this.GlancingBlowDominanceMultiplier = glancingBlowDomParsed;
    }

    // the fraction of normal damage a glancing blow deals (0.0–1.0).
    const glancingBlowDamageFactorRaw = this.parsedPluginParameters['glancingBlowDamageFactor'];
    const glancingBlowDamageFactorParsed = Number(glancingBlowDamageFactorRaw);
    this.GlancingBlowDamageFactor = 0.3;
    if (Number.isFinite(glancingBlowDamageFactorParsed) === true
      && glancingBlowDamageFactorParsed >= 0
      && glancingBlowDamageFactorParsed <= 1)
    {
      this.GlancingBlowDamageFactor = glancingBlowDamageFactorParsed;
    }
  }

  /**
   * Maps JABS quick menu command labels from plugin parameters.
   */
  initializeQuickMenuTextMetadata()
  {
    this.EquipCombatSkillsText = this.parsedPluginParameters['equipCombatSkillsText'];
    this.EquipDodgeSkillsText = this.parsedPluginParameters['equipDodgeSkillsText'];
    this.EquipOffhandText = this.parsedPluginParameters['equipOffhandText'];
    // assign equip tools text on this instance for callers.
    this.EquipToolsText = this.parsedPluginParameters['equipToolsText'];
    this.EquipUsableItemText = this.parsedPluginParameters['equipUsableItemText'];
    this.MainMenuText = this.parsedPluginParameters['mainMenuText'];
    this.CancelText = this.parsedPluginParameters['cancelText'];
    // assign clear slot text on this instance for callers.
    this.ClearSlotText = this.parsedPluginParameters['clearSlotText'];
    this.UnassignedText = this.parsedPluginParameters['unassignedText'];
  }

  /**
   * Builds global cooldown (GCD) state from plugin parameters.
   */
  initializeGlobalCooldownMetadata()
  {
    /**
     * Global cooldown (GCD) plugin state: master switch, default duration in frames, and whitelist of skill {@code stypeId} values.
     * {@link this.GlobalCooldownSkillTypeSet} is built from {@code globalCooldownSkillTypes} as JSON array or comma-separated legacy text.
     */
    this.EnableGlobalCooldown = this.parsedPluginParameters['enableGlobalCooldown'] === 'true';
    this.GlobalCooldownFrames = Number(this.parsedPluginParameters['globalCooldownFrames']) || 30;

    const raw = this.parsedPluginParameters['globalCooldownSkillTypes'] ?? '';
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
    this.GlobalCooldownSkillTypeSet = set;
  }

  /**
   * Maps skill execution history tracking configuration from plugin parameters.
   * The max window is the global prune threshold; individual tag windows must be <= this value.
   * The excluded skill type set contains stypeIds never recorded in the skill history log.
   */
  initializeSkillExecutionMetadata()
  {
    // the maximum number of seconds a skill execution entry is kept before pruning.
    this.SkillExecutionMaxWindowSeconds = Number(
      this.parsedPluginParameters['skillExecutionMaxWindowSeconds']) || 15;

    // build the set of excluded skill type ids from the raw JSON array parameter.
    const rawExcluded = this.parsedPluginParameters['skillExecutionExcludedSkillTypes'] ?? '[]';
    const excludedSet = new Set();
    try
    {
      const arr = JSON.parse(rawExcluded);
      if (Array.isArray(arr))
      {
        arr.forEach(v =>
        {
          // coerce each element to a finite integer before adding to the set.
          const n = parseInt(String(v), 10);
          if (Number.isFinite(n))
          {
            excludedSet.add(n);
          }
        });
      }
    }
    catch (e)
    {
      console.warn('J-ABS: skillExecutionExcludedSkillTypes JSON parse failed.', e);
    }
    this.SkillExecutionExcludedSkillTypeSet = excludedSet;
  }

  /**
   * Maps hitbox overlay style and pulse defaults used by debug overlays.
   */
  initializeHitboxOverlayStyleMetadata()
  {
    this.HitboxStyles = {
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
            fillAlpha: 0.25,
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

    // assign hitbox pulse on this instance for callers.
    this.HitboxPulse = {
      enabled: this.parsedPluginParameters['hitboxPulseEnabled'] !== 'false',
      highlightColliderBattlers: this.parsedPluginParameters['hitboxPulseHighlightColliders'] !== 'false',
      useFadeAnimation: this.parsedPluginParameters['hitboxPulseUseFadeAnimation'] === 'true',
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
  }

  /**
   * Parses the map affliction max slot parameter, ignoring corrupted export noise.
   * @param {string|number|undefined} rawValue The plugin parameter value.
   * @returns {number}
   */
  static parseMapAfflictionMaxSlots(rawValue)
  {
    const trimmedValue = String(rawValue)
      .trim();

    const parsedValue = Number.parseInt(trimmedValue, 10);

    if (Number.isFinite(parsedValue) === false || parsedValue < 1)
    {
      return 8;
    }

    return Math.min(parsedValue, 16);
  }

  /**
   * Maps map affliction strip layout parameters from plugin parameters.
   */
  initializeMapAfflictionMetadata()
  {
    this.mapAfflictionIconScale = Number(this.parsedPluginParameters['mapAfflictionIconScale'] ?? 0.5);
    this.mapAfflictionGaugeHeight = Number(this.parsedPluginParameters['mapAfflictionGaugeHeight'] ?? 3);
    this.mapAfflictionGapBelowHpBar = Number(this.parsedPluginParameters['mapAfflictionGapBelowHpBar'] ?? 2);
    this.mapAfflictionMaxSlots = J_AbsPluginMetadata.parseMapAfflictionMaxSlots(
      this.parsedPluginParameters['mapAfflictionMaxSlots'],
    );
  }
}

export default J_AbsPluginMetadata;
//endregion plugin metadata