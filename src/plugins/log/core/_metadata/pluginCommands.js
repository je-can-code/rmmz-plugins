//region plugin commands
import ActionLogBuilder from '../_models/ActionLogBuilder.js';
import DiaLogBuilder from '../_models/DiaLogBuilder.js';
import LootLogBuilder from '../_models/LootLogBuilder.js';

//region action log
/**
 * Plugin command for enabling the text log and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "showActionLog", () =>
{
  $mapLogs.action.showLog();
});

/**
 * Plugin command for disabling the text log and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "hideActionLog", () =>
{
  $mapLogs.action.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the action log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "addActionLog", args =>
{
  const { text } = args;
  const customActionLog = new ActionLogBuilder()
    .setMessage(text)
    .build();
  $mapLogs.action.addLog(customActionLog);
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "clearActionLog", () =>
{
  $mapLogs.action.clearLogs();
});

//endregion action log

//region dia log
/**
 * Plugin command for enabling the dialog and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "showDiaLog", () =>
{
  $mapLogs.dialog.showLog();
});

/**
 * Plugin command for disabling the dialog and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "hideDiaLog", () =>
{
  $mapLogs.dialog.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "addDiaLog", args =>
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
  $mapLogs.dialog.addLog(log);
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "clearDiaLog", () =>
{
  $mapLogs.dialog.clearLogs();
});
//endregion dia log

//region loot log
/**
 * Plugin command for enabling the loot log and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "showLootLog", () =>
{
  $mapLogs.loot.showLog();
});

/**
 * Plugin command for disabling the loot log and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "hideLootLog", () =>
{
  $mapLogs.loot.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the loot log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "addLootLog", args =>
{
  const {
    lootId,
    lootType
  } = args;
  const log = new LootLogBuilder()
    .setupLootObtained(lootType, lootId)
    .build();
  $mapLogs.loot.addLog(log);
});

/**
 * Plugin command for clearing the loot log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.name, "clearLootLog", () =>
{
  $mapLogs.loot.clearLogs();
});
//endregion loot log

//endregion plugin commands