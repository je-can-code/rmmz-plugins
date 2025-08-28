//region plugin commands
/**
 * Plugin command for toggling visibility of the minimap.
 */
PluginManager.registerCommand(
  J.MAP.Metadata.name,
  "toggle-minimap",
  args =>
  {
    const { action } = args;
    const shouldShow = action === "true";

    // TODO: implement show/hide logic and update this.
  });
//endregion plugin commands