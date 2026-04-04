/**
 * The core where all my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.POPUPS = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.POPUPS.Metadata = {};
J.POPUPS.Metadata.Name = `J-Popups`;
J.POPUPS.Metadata.Version = '2.0.0';

J.POPUPS.PluginParameters = PluginManager.parameters('J-Popups');

/**
 * When true, queued map popups are suppressed.
 * @type {boolean}
 */
J.POPUPS.Metadata.DisablePopups = Boolean(J.POPUPS.PluginParameters['disablePopups'] === 'true');

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
};

/**
 * Default layout offsets for anchoring popup sprites to {@link Sprite_Character}.
 */
J.POPUPS.Layout = {
  AnchorOffsetX: 150,
  ValueBitmapWidth: 400,
  IconScale: 0.75,
  MotionBounceMaxExtra: 260,
};

J.POPUPS.Helpers = {};
J.POPUPS.Helpers.PopupEmitter = new J_EventEmitter();

J.POPUPS.Aliased = {};
J.POPUPS.Aliased.Game_Character = new Map();
J.POPUPS.Aliased.Spriteset_Map = new Map();
J.POPUPS.Aliased.Sprite_Character = new Map();
J.POPUPS.Aliased.Sprite_Damage = new Map();

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
//endregion J_PopupsEvents
//endregion Introduction
