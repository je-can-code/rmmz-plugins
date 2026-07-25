//region Window_JabsRemapActions food extensions

//region buildPostExtensionGroups
/**
 * Extends {@link Window_JabsRemapActions.prototype.buildPostExtensionGroups}.<br>
 * Appends a dedicated "Usable Item" section to the remap list so that the R2 usable-item
 * binding is visible and reassignable in the JABS remap UI.
 * @param {BuiltWindowCommand[]} rows Rows being built.
 * @param {Set<string>} can Assignable logical keys.
 */
J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.set(
  'buildPostExtensionGroups', Window_JabsRemapActions.prototype.buildPostExtensionGroups);
Window_JabsRemapActions.prototype.buildPostExtensionGroups = function(rows, can)
{
  // perform original logic (typically a no-op unless another extension added something).
  J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.get('buildPostExtensionGroups').call(this, rows, can);

  // add a "Usable Item" section header and the UsableItem logical action row.
  rows.push(this.buildHeaderCommand('Usable Item Actions'));
  this._addIf(rows, can, JABS_Button.UsableItem);
};
//endregion buildPostExtensionGroups

//region humanizeButton
/**
 * Extends {@link Window_JabsRemapActions.prototype.humanizeButton}.<br>
 * Returns a friendly label for the UsableItem logical button.
 * @param {string} button Logical key.
 * @returns {string} The human-readable label.
 */
J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.set(
  'humanizeButton', Window_JabsRemapActions.prototype.humanizeButton);
Window_JabsRemapActions.prototype.humanizeButton = function(button)
{
  // provide a label for the UsableItem button before delegating to the cached lookup.
  if (button === JABS_Button.UsableItem) return 'Usable Item';

  // perform original logic for all other buttons.
  return J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.get('humanizeButton').call(this, button);
};
//endregion humanizeButton

//region describeButton
/**
 * Extends {@link Window_JabsRemapActions.prototype.describeButton}.<br>
 * Provides help text for the UsableItem logical button.
 * @param {string} button Logical key.
 * @returns {string} The help text string.
 */
J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.set(
  'describeButton', Window_JabsRemapActions.prototype.describeButton);
Window_JabsRemapActions.prototype.describeButton = function(button)
{
  // provide dedicated help text for the UsableItem button.
  if (button === JABS_Button.UsableItem)
  {
    return 'Use the equipped item.\nApplies the item\'s effects and starts any associated chain.';
  }

  // perform original logic for all other buttons.
  return J.ABS.EXT.FOOD.Aliased.Window_JabsRemapActions.get('describeButton').call(this, button);
};
//endregion describeButton
//endregion Window_JabsRemapActions food extensions