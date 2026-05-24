//region initialization
import J_PopupsPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.POPUPS = {};

/**
 * The metadata associated with this plugin.
 */
J.POPUPS.Metadata = new J_PopupsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * Namespace for optional first-party extensions (J-Popups-ABS, J-Popups-APT, …).
 */
J.POPUPS.EXT = {};

/**
 * Stable event names for {@link J.POPUPS.Helpers.PopupEmitter}.
 */
J.POPUPS.EventNames = {
  Queued: 'popups/queued',
  SpriteSpawned: 'popups/sprite-spawned',
  SpriteFinished: 'popups/sprite-finished',
  FlushRequested: 'popups/flush-requested',
  ComboChainCleared: 'popups/combo-chain-cleared',
  MergeFlushAll: 'popups/merge-flush-all',
};

/**
 * A collection of all motion styles available for popups.
 */
J.POPUPS.MotionStyles = {
  /**
   * The default bounce motion.
   */
  Bounce: 'bounce',

  /**
   * A flyaway motion that floats up and fades out.
   */
  Flyaway: 'flyaway',
};

/**
 * Default layout offsets for anchoring popup sprites to {@link Sprite_Character}.
 */
J.POPUPS.Layout = {
  /**
   * The horizontal offset from the character's center.
   * @type {number}
   */
  AnchorOffsetX: 0,

  /**
   * The width of the bitmap used for damage values.
   * @type {number}
   */
  ValueBitmapWidth: 400,

  /**
   * The scale of the icons in the popups.
   * @type {number}
   */
  IconScale: 0.75,

  /**
   * The horizontal distance between slots in a layout ring.
   * @type {number}
   */
  RingStepX: 12,

  /**
   * The vertical distance between slots in a layout ring.
   * @type {number}
   */
  RingStepY: 16,

  /**
   * The vertical baseline offset for all popups.
   * @type {number}
   */
  VerticalOffset: -20,

  /**
   * The horizontal baseline offset for all popups.
   * @type {number}
   */
  HorizontalOffset: -20,

  /**
   * The horizontal padding from the character's center for motion popups.
   * @type {number}
   */
  PaddingX: 24,

  /**
   * The vertical padding from the character's center for motion popups.
   * @type {number}
   */
  PaddingY: 0,

  /**
   * The number of frames of inactivity before a layout ring resets to its first slot.
   * @type {number}
   */
  ResetDuration: 30,

  /**
   * The base duration in frames that a popup sprite remains visible.
   * @type {number}
   */
  BaseDuration: 60,

  /**
   * Encapsulated motion-related settings.
   */
  Motion: {
    /**
     * Whether or not to enable motion for popups.
     * If this is false, none of the other motion-related settings matter.
     * @type {boolean}
     */
    Enabled: true,

    /**
     * The style of motion to use for popups.
     * @type {string}
     */
    Style: J.POPUPS.MotionStyles.Bounce,

    /**
     * The initial vertical jump velocity for the bounce motion.
     * Negative values go up.
     * @type {number}
     */
    InitialJump: -2,

    /**
     * The gravity applied to the popup during motion.
     * Higher values make it fall faster.
     * @type {number}
     */
    Gravity: 0.10,

    /**
     * The horizontal drift speed during motion.
     * @type {number}
     */
    DriftSpeed: 1.1,

    /**
     * The maximum horizontal distance a popup can drift during motion.
     * @type {number}
     */
    MaxDrift: 200,
  },
};

/**
 * Per-character slot offsets for {@link Map_TextPop.LayoutRings}. Ephemeral (WeakMap; not saved).
 */
J.POPUPS._layoutRingState = new WeakMap();

J.POPUPS.Helpers = {};
J.POPUPS.Helpers.PopupEmitter = new J_EventEmitter();

J.POPUPS.Aliased = {};
J.POPUPS.Aliased.Game_Character = new Map();
J.POPUPS.Aliased.Spriteset_Map = new Map();
J.POPUPS.Aliased.Sprite_Character = new Map();
J.POPUPS.Aliased.Sprite_Damage = new Map();
J.POPUPS.Aliased.Scene_Map = new Map();

//region J_PopupsEvents
/**
 * Emits {@link J.POPUPS.EventNames.Queued} after a popup is queued on a character.
 * @param {Game_Character} character The anchor character.
 * @param {Map_TextPop} popup The queued popup model.
 */
J.POPUPS.notifyPopupQueued = function(character, popup)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.Queued, {
    character,
    popup,
  });
};

/**
 * Emits {@link J.POPUPS.EventNames.FlushRequested} after requestTextPop.
 * @param {Game_Character} character The anchor character.
 */
J.POPUPS.notifyPopupFlushRequested = function(character)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.FlushRequested, {
    character,
  });
};

/**
 * Emits {@link J.POPUPS.EventNames.SpriteSpawned} after a {@link Sprite_Damage} is built and parented.
 * @param {Game_Character} character The anchor character.
 * @param {Map_TextPop} popup The source popup model.
 * @param {Sprite_Damage} sprite The live popup sprite.
 */
J.POPUPS.notifyPopupSpriteSpawned = function(character, popup, sprite)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.SpriteSpawned, {
    character,
    popup,
    sprite,
  });
};

/**
 * Emits {@link J.POPUPS.EventNames.SpriteFinished} when a popup sprite finishes and is about to be destroyed.
 * @param {Game_Character} character The anchor character.
 * @param {Map_TextPop|null} popup The model captured at spawn (same reference as queue time).
 * @param {Sprite_Damage} sprite The sprite being torn down.
 */
J.POPUPS.notifyPopupSpriteFinished = function(character, popup, sprite)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.SpriteFinished, {
    character,
    popup,
    sprite,
  });
};

/**
 * Emits {@link J.POPUPS.EventNames.ComboChainCleared} after JABS clears a combo id from a skill slot.
 * Extensions may subscribe; strike merge release uses `mergeIdleFlushFrames` idle flush, not this event.
 *
 * @param {JABS_Battler} jabsBattler The battler who owned the chain.
 * @param {string} cooldownKey The skill-slot cooldown key (mainhand/offhand/etc.).
 */
J.POPUPS.notifyComboChainCleared = function(jabsBattler, cooldownKey)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.ComboChainCleared, {
    jabsBattler,
    cooldownKey,
  });
};

/**
 * Requests merge accumulators to flush (listeners interpret scope).
 *
 * @param {string} reason Diagnostic tag for subscribers.
 */
J.POPUPS.notifyMergeFlushAll = function(reason)
{
  J.POPUPS.Helpers.PopupEmitter.emit(J.POPUPS.EventNames.MergeFlushAll, {
    reason,
  });
};
//endregion initialization