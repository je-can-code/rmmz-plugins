//region plugin metadata
/**
 * Plugin metadata for the core JAFTING plugin.
 * Because this plugin offers little actual functionality, there is little that
 * can be configured.
 */
class J_CraftingPluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Reads salvage/refine stack policy ids from plugin parameters.
   */
  postInitialize()
  {
    super.postInitialize();

    this.materialArmorTypeId = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['material-armor-type-id'],
      5,
    );

    this.materialWeaponTypeId = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['material-weapon-type-id'],
      -1,
    );

    // hub Salvage row: switch id 0 skips gating; non-zero ids require `$gameSwitches` ON to enable the command.
    this.salvageMenuSwitchId = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['salvage-menu-switch'],
      0,
    );

    // label + icon on the root hub list; plugin command `call-salvage` ignores the switch gate entirely.
    this.salvageCommandName = this.parsedPluginParameters['salvage-menu-name'] ?? 'Salvage';

    this.salvageMenuIconIndex = J.BASE.Helpers.parsePluginInt(
      this.parsedPluginParameters['salvage-menu-icon'],
      192,
    );
  }
}

//endregion plugin metadata