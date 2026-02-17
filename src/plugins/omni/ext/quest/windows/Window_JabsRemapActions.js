//region Window_JabsRemapActions
/**
 * Extends {@link #buildPostExtensionGroups}.<br/>
 * Also appends a "Quest Actions" section for external (J.OMNI.QUEST) actions.
 * @param {BuiltWindowCommand[]} rows The rows being built.
 * @param {Set<string>} can The set of assignable logical action keys.
 */
J.OMNI.EXT.QUEST.Aliased.Window_JabsRemapActions.set(
  'buildPostExtensionGroups',
  Window_JabsRemapActions.prototype.buildPostExtensionGroups
);
Window_JabsRemapActions.prototype.buildPostExtensionGroups = function(rows, can)
{
  // perform original logic (defaults to other extensions or no-op).
  J.OMNI.EXT.QUEST.Aliased.Window_JabsRemapActions
    .get('buildPostExtensionGroups')
    .call(this, rows, can);

  // append a header for the quest actions.
  rows.push(this.buildHeaderCommand('Quest Actions'));

  // add external action row for opening the quest log with fixed per-action icon.
  rows.push(this.buildExternalActionCommand(
    'J.OMNI.QUEST',
    'open-quest-log',
    'Open Quest Log',
    186
  ));
};
//endregion Window_JabsRemapActions