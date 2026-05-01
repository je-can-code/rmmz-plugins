//region RPG_Item
//region otib state ids
/**
 * The state ids to be permanently granted as passives when this item is consumed.
 * Reads the <otib:[N, ...]> notetag from the item's notebox.
 * An empty array means this item has no OTIB unlock associated with it.
 * @type {number[]}
 */
Object.defineProperty(RPG_Item.prototype, "otibStateIds", {
  get: function()
  {
    return RPGManager.getNumbersFromNoteByRegex(this, J.PASSIVE.EXT.OTIB.RegExp.OtibStateIds);
  },
});
//endregion otib state ids
//endregion RPG_Item