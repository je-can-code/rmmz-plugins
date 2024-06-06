//region plugin commands
/**
 * Plugin command for enabling the text log and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "showActionLog", () =>
{
  $mapLogManager.showLog();
});

/**
 * Plugin command for disabling the text log and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "hideActionLog", () =>
{
  $mapLogManager.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the action log window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "addActionLog", args =>
{
  const { text } = args;
  const log = new ActionLogBuilder()
    .setMessage(text)
    .build();
  $mapLogManager.addLog(log);
});

/**
 * Plugin command for enabling the dialog and showing it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "showDiaLog", () =>
{
  $mapLogManager.showLog();
});

/**
 * Plugin command for disabling the dialog and hiding it.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "hideDiaLog", () =>
{
  $mapLogManager.hideLog();
});

/**
 * Plugin command for adding an arbitrary log to the dialog window.
 */
PluginManager.registerCommand(J.LOG.Metadata.Name, "addDiaLog", args =>
{
  const { lines, faceName, faceIndex } = args;
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
//endregion plugin commands