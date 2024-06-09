//region plugin commands
//region action log
/**
 * Plugin command for enabling the text log and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "showActionLog", () =>
{
  $actionLogManager.showLog();
});

/**
 * Plugin command for disabling the text log and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "hideActionLog", () =>
{
  $actionLogManager.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the action log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "addActionLog", args =>
{
  const { text } = args;
  const customActionLog = new ActionLogBuilder()
    .setMessage(text)
    .build();
  $actionLogManager.addLog(customActionLog);
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "clearActionLog", () =>
{
  $actionLogManager.clearLogs();
});

//endregion action log

//region dia log
/**
 * Plugin command for enabling the dialog and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "showDiaLog", () =>
{
  $diaLogManager.showLog();
});

/**
 * Plugin command for disabling the dialog and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "hideDiaLog", () =>
{
  $diaLogManager.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "addDiaLog", args =>
{
  const {
    lines,
    faceName,
    faceIndex
  } = args;
  const actualLines = lines.split(/[\r\n]+/);
  const log = new DiaLogBuilder()
    .setLines(actualLines)
    .setFaceName(faceName)
    .setFaceIndex(faceIndex)
    .build();
  $diaLogManager.addLog(log);
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "clearDiaLog", () =>
{
  $diaLogManager.clearLogs();
});
//endregion dia log

//region loot log
/**
 * Plugin command for enabling the loot log and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "showLootLog", () =>
{
  $lootLogManager.showLog();
});

/**
 * Plugin command for disabling the loot log and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "hideLootLog", () =>
{
  $lootLogManager.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the loot log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "addLootLog", args =>
{
  const {
    lootId,
    lootType
  } = args;
  const log = new LootLogBuilder()
    .setupLootObtained(lootType, lootId)
    .build();
  $lootLogManager.addLog(log);
});

/**
 * Plugin command for clearing the loot log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "clearLootLog", () =>
{
  $lootLogManager.clearLogs();
});
//endregion loot log

//endregion plugin commands