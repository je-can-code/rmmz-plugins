//region RPG_Item
/**
 * The SDP key that this item unlocks upon use.
 * @type {string}
 */
Object.defineProperty(RPG_Item.prototype, 'sdpKey', {
  get: function()
  {
    return RPGManager.getStringFromNoteByRegex(this, J.SDP.RegExp.SdpUnlockKey);
  },
});
//endregion RPG_Item