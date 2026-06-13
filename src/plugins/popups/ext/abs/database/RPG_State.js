//region RPG_State
//region noHpPopup
/**
 * Whether or not this state suppresses HP slip/regen popups.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'popupsNoHpSlip', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.POPUPS.EXT.ABS.RegExp.NoHpSlipPopup);
  },
});
//endregion noHpPopup

//region noMpPopup
/**
 * Whether or not this state suppresses MP slip/regen popups.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'popupsNoMpSlip', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.POPUPS.EXT.ABS.RegExp.NoMpSlipPopup);
  },
});
//endregion noMpPopup

//region noTpPopup
/**
 * Whether or not this state suppresses TP slip/regen popups.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'popupsNoTpSlip', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.POPUPS.EXT.ABS.RegExp.NoTpSlipPopup);
  },
});
//endregion noTpPopup

//region noSlipPopup
/**
 * Whether or not this state suppresses all slip/regen popups.
 * @type {boolean}
 */
Object.defineProperty(RPG_State.prototype, 'popupsNoAnySlip', {
  get: function()
  {
    return RPGManager.checkForBooleanFromNoteByRegex(this, J.POPUPS.EXT.ABS.RegExp.NoAnySlipPopup);
  },
});
//endregion noSlipPopup
//endregion RPG_State
