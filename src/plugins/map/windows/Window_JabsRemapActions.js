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
    .get('buildPostExtensionGroups')
    .call(this, rows, can);

  // append a header for the minimap actions.
  rows.push(this.buildHeaderCommand('Map Actions'));

  // add two registry-backed external actions for the minimap.
  rows.push(this.buildExternalActionCommand('J.MAP', 'minimap-toggle', 'Toggle Minimap'));
  rows.push(this.buildExternalActionCommand('J.MAP', 'expand-minimap', 'Expand Minimap (Hold)'));
};
//endregion Window_JabsRemapActions