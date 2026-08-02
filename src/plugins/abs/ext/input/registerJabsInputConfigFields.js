//region registerJabsInputConfigFields
/**
 * Keybinds are installation scope, not slot scope.
 *
 * They lived at `$gameSystem._j._abs._input` because vanilla `ConfigManager` had seven fields and no
 * way for a plugin to add an eighth - not because a control scheme belongs to a playthrough. The
 * consequence was real and player-visible: rebinding a key applied to one savefile, a second
 * playthrough started on the defaults again, and deleting saves deleted the bindings with them.
 *
 * Registering them here puts both stores in `config.json` beside volume and touch UI, which is a
 * deliberate behavior change: bindings are now global.
 *
 * The defaults are empty rather than the built-in mapping, because the controllers are the authority
 * on what their defaults are and they are not constructed yet at this point. `initializeJabsInputIfMissing`
 * is what fills an empty store from them.
 */
ConfigManager.registerField('jabsInputMappings', () => ({}));

ConfigManager.registerField('jabsInputBindings', () => ({}));
//endregion registerJabsInputConfigFields