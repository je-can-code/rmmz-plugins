//region J_PopupsExtABS_init
J.POPUPS.EXT.ABS = J.POPUPS.EXT.ABS || {};

J.POPUPS.EXT.ABS.Aliased = J.POPUPS.EXT.ABS.Aliased || {};
J.POPUPS.EXT.ABS.Aliased.JABS_Engine = new Map();
J.POPUPS.EXT.ABS.Aliased.JABS_Battler = new Map();
J.POPUPS.EXT.ABS.Aliased.Game_Action = new Map();

if (J.ABS && J.ABS.Metadata && J.ABS.Metadata.DisableTextPops === true)
{
  J.POPUPS.Metadata.DisablePopups = true;
}
//endregion J_PopupsExtABS_init
