//region Window_JabsRemapActions
/**
 * Extends/Overrides {@link #buildPostExtensionGroups}.<br/>
 * Also appends a "Map Actions" section for external (J.MAP) actions.
 * @param {BuiltWindowCommand[]} rows The rows being built.
 * @param {Set<string>} can The set of assignable logical action keys.
 */
J.MAP.Aliased.Window_JabsRemapActions.set(
  'buildPostExtensionGroups',
  Window_JabsRemapActions.prototype.buildPostExtensionGroups
);
Window_JabsRemapActions.prototype.buildPostExtensionGroups = function(rows, can)
{
  // perform original logic (default: no-op).
  J.MAP.Aliased.Window_JabsRemapActions
    .get("buildPostExtensionGroups")
    .call(this, rows, can);

  // append a header for the minimap actions.
  rows.push(this.buildHeaderCommand("Map Actions"));

  // add external actions for the minimap with fixed per-action icons (feature glyphs).
  rows.push(this.buildExternalActionCommand("J.MAP", "minimap-toggle", "Toggle Minimap", 190));
  rows.push(this.buildExternalActionCommand("J.MAP", "expand-minimap", "Expand Minimap (Hold)", 2480));
};
//endregion Window_JabsRemapActions